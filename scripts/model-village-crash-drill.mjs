/* global Buffer, process */

/**
 * MV-B5 process-crash durability drill harness (Model Village experiment
 * backend, durability slice).
 *
 * Turns the spec's *claimed* file-state fault-boundary property
 * (docs/specs/HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md gate rows 578/581 —
 * "A fresh Node process rereads the validated state. Process-level exceptions
 * immediately before/after rename expose the old or complete file state.")
 * into an EXECUTED, RECEIPTED drill: it spawns a real child process that
 * performs a real sealed-store / persistent-state operation, kills that child
 * with SIGKILL at a chosen crash window, then opens/recovers the store in a
 * SEPARATE fresh process and asserts the durability invariant. Every run emits
 * a signed-by-hash receipt whose invariant outcome is recorded honestly — a
 * real durability gap is receipted with invariantHeld:false, never masked.
 *
 * CLAIM BOUNDARY (read before citing this harness):
 *   - Proves SINGLE-HOST process-crash durability and SAME-HOST multi-process
 *     contention behavior only.
 *   - Does NOT claim production/fleet deployment, distributed (multi-host)
 *     consensus, or durability against media failure / OS fsync lies.
 *   - No directory fsync exists in either production store, so a completed
 *     rename/unlink can still be lost across true power loss on some
 *     filesystems (consistency-safe, not power-loss-durable). This harness
 *     tests the fault BOUNDARY (old-or-new-never-torn), not power-loss.
 *
 * MECHANISM NOTE (honesty): production writeAtomicState performs
 * temp-write -> fsync -> rename SYNCHRONOUSLY with no yield, and the custody
 * store's key-zeroing / log-append windows are sub-syscall. Those exact
 * intra-syscall windows cannot be hit by an EXTERNAL SIGKILL, and the code
 * exposes no fault seam that a NEW-FILE consumer can drive (the injectable
 * before_rename/after_rename fault and the withStoreLock/commit functions are
 * module-private in model-village-phase0b-runtime.mjs — see gapsFound). For
 * those windows the worker deterministically establishes the exact on-disk
 * state a crash at that window produces (orphan temp / partial log line /
 * zeroed key / leaked lock) using real file ops and is THEN really SIGKILLed;
 * recovery runs against 100% production recovery code. Each receipt states its
 * mechanism in observedOutcome. The custody object-write and lock-held windows
 * are caught by a genuine mid-operation kill (large ciphertext write / live
 * lock holder).
 *
 * NEW FILE — reuses, never reimplements, MV-B1..B4 production scripts.
 */

import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  clearInterval,
  clearTimeout,
  setInterval,
  setTimeout,
} from 'node:timers';
import { fileURLToPath } from 'node:url';

import {
  canonicalDigest,
  createRuntimeInjectedValidatorFixture,
} from './model-village-phase0b-runtime.mjs';

export const CRASH_DRILL_SCHEMA = 'hololand.model-village-crash-drill.v1';
export const CRASH_DRILL_ENGINE = 'hololand-model-village-crash-drill-v1';

/** Typed error for all crash-drill harness failures (fail loud). */
export class ModelVillageCrashDrillError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ModelVillageCrashDrillError';
  }
}

const WORKER_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'model-village-crash-worker.mjs',
);

export const DRILL_OPERATOR = 'mv-b5-crash-drill-operator';
export const DRILL_RUN_LABEL = 'mv-b5-crash-drill';
/** Ciphertext large enough that a SIGKILL fired on `.enc` appearance lands
 *  mid-write, well before the (much later) seal-log commit. */
export const DRILL_LARGE_OBJECT_BYTES = 24 * 1024 * 1024;
const READY_TOKEN = 'MV_CRASH_READY';
const VERDICT_MARKER = 'MV_CRASH_VERDICT ';
const DEFAULT_KILL_TIMEOUT_MS = 20000;
const RECOVERY_TIMEOUT_MS = 20000;
const MAX_OBSERVED_OUTCOME_LENGTH = 600;

/**
 * Per-scenario static metadata. `killTrigger`:
 *   - 'ready-signal': the worker prints READY_TOKEN once the exact on-disk
 *     crash state is established, then blocks; parent kills on that line.
 *   - 'object-file':  the parent kills the instant the target `.enc` appears,
 *     landing the SIGKILL inside the large ciphertext write.
 * `gapReference` is set when the scenario reproduces a known durability gap
 * (invariant is EXPECTED to not hold — an honest gap receipt).
 */
const SCENARIO_CONFIG = Object.freeze({
  'custody-seal-killed-mid-write': {
    killTrigger: 'object-file',
    killWindow: 'custody-object-write',
    gapReference: null,
    expectedInvariantHeld: true,
    invariantDescription:
      'A half-written sealed object is never admitted as a valid recorded '
      + 'object: after a crash mid object-write the store still opens with an '
      + 'intact access-log chain, and the target object is absent, rejected on '
      + 'read, or flagged unrecorded by verifyIntegrity.',
  },
  'custody-lock-held-by-killed-pid': {
    killTrigger: 'ready-signal',
    killWindow: 'custody-store-lock-held',
    gapReference: null,
    expectedInvariantHeld: true,
    invariantDescription:
      'A custody store.lock held by a SIGKILLed writer is reclaimed by a fresh '
      + 'openSealedCustodyStore (stale-pid break) within a bounded time, never '
      + 'hanging forever.',
  },
  'persistent-state-killed-after-rename': {
    killTrigger: 'ready-signal',
    killWindow: 'persistent-state-after-atomic-rename',
    gapReference: null,
    expectedInvariantHeld: true,
    invariantDescription:
      'A persistent-state atomic write that completed its rename is fully '
      + 'durable: a fresh process reads the complete new state.json and '
      + 'validatePersistentState passes.',
  },
  'persistent-state-killed-before-rename': {
    killTrigger: 'ready-signal',
    killWindow: 'persistent-state-before-atomic-rename',
    gapReference: null,
    expectedInvariantHeld: true,
    invariantDescription:
      'A persistent-state write interrupted before its atomic rename leaves '
      + 'the complete prior state.json (never torn): a fresh process reads the '
      + 'prior state, validatePersistentState passes, and the orphan temp is '
      + 'ignored.',
  },
  'access-log-torn-append': {
    killTrigger: 'ready-signal',
    killWindow: 'custody-access-log-append',
    gapReference: null,
    expectedInvariantHeld: true,
    invariantDescription:
      'A torn trailing line in the hash-chained access log is detected on '
      + 'open: openSealedCustodyStore fails closed with a typed '
      + 'CustodyIntegrityError rather than silently accepting a truncated log.',
  },
  'persistent-state-lock-leak-after-kill': {
    killTrigger: 'ready-signal',
    killWindow: 'persistent-state-lock-leak',
    gapReference: 'G2',
    expectedInvariantHeld: false,
    invariantDescription:
      'GAP DRILL (G2): a persistence state.lock leaked by a SIGKILLed writer '
      + 'is auto-reclaimable. phase0b withStoreLock has NO stale reclamation, '
      + 'so this invariant is expected to NOT hold — a fresh writer is blocked '
      + 'permanently with "locked by another writer".',
  },
  'custody-destroy-key-killed-mid-destroy': {
    killTrigger: 'ready-signal',
    killWindow: 'custody-key-destruction',
    gapReference: 'G1',
    expectedInvariantHeld: false,
    invariantDescription:
      'GAP DRILL (G1): a store crashed between content-key zeroing and '
      + 'tombstone-append is still openable. There is no recovery path — '
      + 'openSealedCustodyStore throws CustodyIntegrityError (key present but '
      + 'zeroed) — so this invariant is expected to NOT hold; manual tombstone '
      + 'repair is required.',
  },
});

export const CRASH_DRILL_SCENARIOS = Object.freeze(Object.keys(SCENARIO_CONFIG));

/** Public map of scenario -> expected invariant outcome (for tests / docs). */
export const CRASH_DRILL_SCENARIO_EXPECTATIONS = Object.freeze(
  Object.fromEntries(
    CRASH_DRILL_SCENARIOS.map((name) => [
      name,
      SCENARIO_CONFIG[name].expectedInvariantHeld,
    ]),
  ),
);

// ---------------------------------------------------------------------------
// Shared helpers (also imported by model-village-crash-worker.mjs so parent and
// worker agree on paths, fixtures, and the drill plaintext).
// ---------------------------------------------------------------------------

export function custodyRootFor(caseDir) {
  return path.join(caseDir, 'custody');
}

export function phase0bStoreDirFor(caseDir) {
  return path.join(caseDir, 'phase0b');
}

export function retentionPolicyFixture() {
  return {
    description: 'MV-B5 crash-drill ephemeral sealed store',
    frozenAt: new Date().toISOString(),
    policyId: 'mv-b5-crash-drill-retention',
  };
}

/** Deterministic drill plaintext derived from `seed` (both parent and worker
 *  regenerate the identical buffer so they agree on the custodyId). */
export function buildDrillPlaintext(seed, size) {
  const buffer = Buffer.allocUnsafe(size);
  const seedHash = createHash('sha256').update(String(seed)).digest();
  let offset = 0;
  while (offset < size) {
    const chunk = Math.min(seedHash.length, size - offset);
    seedHash.copy(buffer, offset, 0, chunk);
    offset += chunk;
  }
  return buffer;
}

export function custodyIdForBytes(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Builds a fully valid runtime-injected validator config + receipt + initial
 * world for initializePersistentStore. The manifest is the minimal object that
 * passes assertRunManifest (identity 'mv-phase0b-tracer-001'); it drives the
 * real production genesis writeAtomicState.
 */
export function buildValidatorFixture() {
  const fixture = createRuntimeInjectedValidatorFixture();
  const validatorReceipt = fixture.issue(buildValidatorManifest());
  return {
    trustedValidatorConfig: fixture.config,
    validatorReceipt,
    initialWorld: {
      acceptedActionCount: 0,
      emergencyStopState: 'armed',
      phase: 'running',
      publicWaterUnits: 0,
    },
  };
}

function manifestHash(label) {
  return canonicalDigest(`mv-b5-crash-drill:${label}`);
}

function buildValidatorManifest() {
  const authorization = (index) => ({
    decisionReceiptId: `mv-b5-decision-${index}`,
    nonce: `mv-b5-nonce-${index}`,
    safetyReceiptId: `mv-b5-safety-${index}`,
    sequence: index,
    turnOpportunityId: `mv-b5-turn-${index}`,
  });
  const action = (index) => ({
    args: {
      capturedResponseHash: manifestHash(`captured-${index}`),
      challengeManifestHash: manifestHash('challenge'),
      metricSpecHash: manifestHash('metric'),
      parsedProposal: { proposalId: `mv-b5-proposal-${index}` },
      residentId: `mv-b5-resident-${index}`,
    },
    authorization: authorization(index),
    entrypoint: 'water.contribute',
    expectedAllowed: true,
    expectedOutcome: 'accepted',
    scheduleEntryId: `mv-b5-schedule-${index}`,
    targetIds: [`mv-b5-target-${index}`],
  });
  const capturedResponse = (index) => ({
    adapterAlias: `adapter_${index}`,
    parsedProposal: { proposalId: `mv-b5-proposal-${index}` },
    residentId: `mv-b5-resident-${index}`,
    responseHash: manifestHash(`response-${index}`),
    responseId: `mv-b5-response-${index}`,
  });
  return {
    actions: [action(0), action(1)],
    capturedResponses: [capturedResponse(0), capturedResponse(1)],
    challengeManifestHash: manifestHash('challenge'),
    emergencyStop: {
      args: { reason: 'mv-b5-emergency-stop' },
      authorization: authorization(2),
      entrypoint: 'emergency.stop',
      expectedAllowed: true,
      expectedFinalState: { emergencyStopState: 'triggered', phase: 'frozen' },
      expectedOutcome: 'stopped',
      scheduleEntryId: 'mv-b5-schedule-stop',
      targetIds: ['mv-b5-village'],
    },
    expectedFinalState: { emergencyStopState: 'armed', phase: 'running' },
    metricSpecHash: manifestHash('metric'),
    runId: 'mv-phase0b-tracer-001',
    schema: 'hololand.model-village-phase0b-run-manifest.v1',
    sources: {
      behaviorSourceHash: manifestHash('behavior'),
      manifestSourceHash: manifestHash('manifest'),
      planExecutionSourceHash: manifestHash('plan-execution'),
      planTemplateSourceHash: manifestHash('plan-template'),
      stopPlanSourceHash: manifestHash('stop-plan'),
      visibleWorldSourceHash: manifestHash('visible-world'),
      worldSourceHash: manifestHash('world'),
    },
    validatorPolicyVersion: 'runtime-injected-ed25519-v1',
  };
}

// ---------------------------------------------------------------------------
// Child-process orchestration
// ---------------------------------------------------------------------------

function boundString(value, max = MAX_OBSERVED_OUTCOME_LENGTH) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Spawns the crash worker, kills it with SIGKILL at the scenario's chosen
 * window, and resolves with the child's exit accounting. Kills ONLY the child
 * it spawned (tracked by the returned child handle); never touches a process it
 * did not create. A bounded fallback timeout guarantees the harness never hangs
 * even if the kill trigger never fires.
 */
function spawnAndKillCrashWorker({
  args,
  killSignal,
  killAfterMs,
  killTrigger,
  triggerFilePath,
  timeoutMs,
}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let killed = false;
    let timedOut = false;
    let filePoll = null;
    let fallbackTimer = null;

    const cleanup = () => {
      if (filePoll) clearInterval(filePoll);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      filePoll = null;
      fallbackTimer = null;
    };

    const fireKill = (viaTimeout) => {
      if (killed) return;
      killed = true;
      timedOut = viaTimeout;
      const deliver = () => {
        try {
          child.kill(killSignal);
        } catch {
          /* child already gone; exit handler resolves */
        }
      };
      if (typeof killAfterMs === 'number' && killAfterMs > 0) {
        setTimeout(deliver, killAfterMs);
      } else {
        deliver();
      }
    };

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (
        killTrigger === 'ready-signal'
        && !killed
        && stdout.includes(READY_TOKEN)
      ) {
        fireKill(false);
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    if (killTrigger === 'object-file' && triggerFilePath) {
      filePoll = setInterval(() => {
        if (!killed && existsSync(triggerFilePath)) fireKill(false);
      }, 2);
    }

    fallbackTimer = setTimeout(() => fireKill(true), timeoutMs);

    child.on('error', (error) => {
      cleanup();
      reject(
        new ModelVillageCrashDrillError(
          `crash worker failed to spawn: ${error.message}`,
        ),
      );
    });
    child.on('exit', (code, signal) => {
      cleanup();
      resolve({
        pid: child.pid,
        exitCode: code,
        exitSignal: signal,
        killed,
        timedOut,
        exitedBeforeKill: !killed,
        stdout,
        stderr,
      });
    });
  });
}

function parseVerdict(stdout) {
  const line = String(stdout)
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(VERDICT_MARKER));
  if (!line) return null;
  try {
    return JSON.parse(line.slice(VERDICT_MARKER.length));
  } catch {
    return null;
  }
}

function runRecoveryProcess({ scenario, caseDir, operator, seed, size }) {
  const result = spawnSync(
    process.execPath,
    [
      WORKER_PATH,
      '--role=recover',
      `--scenario=${scenario}`,
      `--case-dir=${caseDir}`,
      `--operator=${operator}`,
      `--seed=${seed}`,
      `--size=${size}`,
    ],
    {
      encoding: 'utf8',
      timeout: RECOVERY_TIMEOUT_MS,
      killSignal: 'SIGKILL',
      windowsHide: true,
    },
  );
  if (result.error && result.error.code === 'ETIMEDOUT') {
    return {
      pid: result.pid ?? null,
      verdict: {
        invariantHeld: false,
        observedOutcome:
          'recovery process exceeded the bounded timeout (possible hang)',
        storeStateHashAfterRecovery: null,
      },
      timedOut: true,
      raw: result,
    };
  }
  const verdict = parseVerdict(result.stdout);
  if (!verdict) {
    throw new ModelVillageCrashDrillError(
      `recovery process for ${scenario} produced no verdict `
      + `(status=${result.status}, signal=${result.signal}); `
      + `stderr: ${boundString(result.stderr, 400)}`,
    );
  }
  return { pid: result.pid ?? null, verdict, timedOut: false, raw: result };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs one crash-durability scenario end to end and returns { receipt }.
 * Throws ModelVillageCrashDrillError only on HARNESS failures (bad scenario,
 * worker died before its kill window, missing recovery verdict). A durability
 * gap is NOT a harness failure — it is receipted with invariantHeld:false.
 */
export async function runCrashDrill({
  scratchRoot,
  scenario,
  operator = DRILL_OPERATOR,
  killAfterMs,
  killSignal,
  killOnSignal,
} = {}) {
  if (!scratchRoot || typeof scratchRoot !== 'string') {
    throw new ModelVillageCrashDrillError('scratchRoot must be a non-empty string');
  }
  const config = SCENARIO_CONFIG[scenario];
  if (!config) {
    throw new ModelVillageCrashDrillError(
      `unknown scenario "${scenario}"; known: ${CRASH_DRILL_SCENARIOS.join(', ')}`,
    );
  }
  // `killOnSignal` is accepted as an alias for the OS signal to deliver; the
  // deterministic ready-signal / object-file trigger is always the timing.
  const signal = killSignal ?? killOnSignal ?? 'SIGKILL';

  mkdirSync(scratchRoot, { recursive: true });
  const caseDir = path.join(scratchRoot, `${scenario}-${randomUUID()}`);
  mkdirSync(caseDir, { recursive: true });

  const seed = randomUUID();
  const size = DRILL_LARGE_OBJECT_BYTES;

  try {
    // Compute the object-file kill trigger (custody-seal) up front so the
    // parent can watch for the `.enc` the worker is about to write.
    let triggerFilePath;
    if (config.killTrigger === 'object-file') {
      const custodyId = custodyIdForBytes(buildDrillPlaintext(seed, size));
      triggerFilePath = path.join(
        custodyRootFor(caseDir),
        'objects',
        `${custodyId}.enc`,
      );
    }

    const crash = await spawnAndKillCrashWorker({
      args: [
        WORKER_PATH,
        '--role=crash',
        `--scenario=${scenario}`,
        `--case-dir=${caseDir}`,
        `--operator=${operator}`,
        `--seed=${seed}`,
        `--size=${size}`,
      ],
      killSignal: signal,
      killAfterMs,
      killTrigger: config.killTrigger,
      triggerFilePath,
      timeoutMs: DEFAULT_KILL_TIMEOUT_MS,
    });

    if (crash.exitedBeforeKill) {
      throw new ModelVillageCrashDrillError(
        `crash worker for ${scenario} exited before its kill window `
        + `(code=${crash.exitCode}, signal=${crash.exitSignal}); `
        + `stderr: ${boundString(crash.stderr, 400)}`,
      );
    }
    const exitedCleanly = crash.exitCode === 0 && crash.exitSignal === null;
    if (exitedCleanly) {
      throw new ModelVillageCrashDrillError(
        `crash worker for ${scenario} exited cleanly (0) despite the kill; `
        + 'the SIGKILL did not take effect',
      );
    }

    const recovery = runRecoveryProcess({
      scenario,
      caseDir,
      operator,
      seed,
      size,
    });
    if (recovery.pid !== null && recovery.pid === crash.pid) {
      throw new ModelVillageCrashDrillError(
        'recovery did not run in a fresh process (pid collision)',
      );
    }

    const verdict = recovery.verdict;
    const receipt = finalizeReceipt({
      at: new Date().toISOString(),
      engine: CRASH_DRILL_ENGINE,
      gapReference: config.gapReference,
      invariantDescription: config.invariantDescription,
      invariantHeld: Boolean(verdict.invariantHeld),
      killSignal: signal,
      killWindow: config.killWindow,
      observedOutcome: boundString(verdict.observedOutcome),
      recoveredInFreshProcess: true,
      recoveryPid: recovery.pid ?? -1,
      scenario,
      schema: CRASH_DRILL_SCHEMA,
      storeStateHashAfterRecovery:
        normalizeHash(verdict.storeStateHashAfterRecovery),
      workerExitCode: crash.exitCode,
      workerExitSignal: crash.exitSignal,
      workerPid: crash.pid,
    });
    return { receipt };
  } finally {
    try {
      rmSync(caseDir, { recursive: true, force: true });
    } catch {
      /* best-effort scratch cleanup */
    }
  }
}

/**
 * Non-vacuity proof: deliberately corrupts a persistent store the way a BAD
 * recovery would leave it (a torn state.json), then runs the SAME recovery
 * worker used by the real drill and confirms it reports invariantHeld:false.
 * A drill whose checker accepted this corruption would be vacuous.
 */
export function runNegativeControl({ scratchRoot, operator = DRILL_OPERATOR } = {}) {
  if (!scratchRoot || typeof scratchRoot !== 'string') {
    throw new ModelVillageCrashDrillError('scratchRoot must be a non-empty string');
  }
  mkdirSync(scratchRoot, { recursive: true });
  const caseDir = path.join(scratchRoot, `negative-control-${randomUUID()}`);
  const storeDir = phase0bStoreDirFor(caseDir);
  mkdirSync(storeDir, { recursive: true });
  const seed = randomUUID();
  const size = 1024;
  try {
    // A torn state.json: valid JSON prefix, truncated mid-object — exactly what
    // a bad "half-written rename" recovery would expose. The direct torn file
    // IS the corruption under test.
    writeFileSync(
      path.join(storeDir, 'state.json'),
      '{"schema":"hololand.model-village-phase0b-persistent-state.v1",'
      + '"revision":0,"ledger":{"entries":[]',
      'utf8',
    );
    const recovery = runRecoveryProcess({
      scenario: 'persistent-state-killed-after-rename',
      caseDir,
      operator,
      seed,
      size,
    });
    const verdict = recovery.verdict;
    const caught = verdict.invariantHeld === false;
    return {
      caught,
      verdict: {
        invariantHeld: Boolean(verdict.invariantHeld),
        observedOutcome: boundString(verdict.observedOutcome),
      },
    };
  } finally {
    try {
      rmSync(caseDir, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }
}

// ---------------------------------------------------------------------------
// Receipt construction + verification
// ---------------------------------------------------------------------------

const RECEIPT_KEYS = Object.freeze([
  'at',
  'engine',
  'gapReference',
  'invariantDescription',
  'invariantHeld',
  'killSignal',
  'killWindow',
  'observedOutcome',
  'recoveredInFreshProcess',
  'recoveryPid',
  'scenario',
  'schema',
  'storeStateHashAfterRecovery',
  'workerExitCode',
  'workerExitSignal',
  'workerPid',
]);

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function normalizeHash(value) {
  if (typeof value === 'string' && SHA256_PATTERN.test(value)) return value;
  return null;
}

function finalizeReceipt(fields) {
  const receipt = {};
  for (const key of RECEIPT_KEYS) receipt[key] = fields[key];
  receipt.receiptHash = canonicalDigest(receipt);
  return Object.freeze(receipt);
}

/**
 * Validates a crash-drill receipt: exact key set, constant/type checks, bounded
 * outcome, sha256-or-null store hash, ISO timestamp, and the self-integrity
 * hash. Returns true when valid; throws ModelVillageCrashDrillError otherwise.
 */
export function verifyCrashDrillReceipt(receipt) {
  if (!receipt || typeof receipt !== 'object') {
    throw new ModelVillageCrashDrillError('receipt must be an object');
  }
  const keys = Object.keys(receipt).sort();
  const expected = [...RECEIPT_KEYS, 'receiptHash'].sort();
  if (keys.length !== expected.length || keys.some((k, i) => k !== expected[i])) {
    throw new ModelVillageCrashDrillError(
      `receipt key set mismatch (got ${keys.join(',')})`,
    );
  }
  if (receipt.schema !== CRASH_DRILL_SCHEMA) {
    throw new ModelVillageCrashDrillError('receipt schema mismatch');
  }
  if (receipt.engine !== CRASH_DRILL_ENGINE) {
    throw new ModelVillageCrashDrillError('receipt engine mismatch');
  }
  if (!SCENARIO_CONFIG[receipt.scenario]) {
    throw new ModelVillageCrashDrillError(`unknown receipt scenario ${receipt.scenario}`);
  }
  if (typeof receipt.invariantHeld !== 'boolean') {
    throw new ModelVillageCrashDrillError('invariantHeld must be boolean');
  }
  if (receipt.recoveredInFreshProcess !== true) {
    throw new ModelVillageCrashDrillError('recoveredInFreshProcess must be true');
  }
  if (typeof receipt.invariantDescription !== 'string' || !receipt.invariantDescription) {
    throw new ModelVillageCrashDrillError('invariantDescription must be a non-empty string');
  }
  if (
    typeof receipt.observedOutcome !== 'string'
    || receipt.observedOutcome.length === 0
    || receipt.observedOutcome.length > MAX_OBSERVED_OUTCOME_LENGTH
  ) {
    throw new ModelVillageCrashDrillError('observedOutcome must be a bounded non-empty string');
  }
  if (typeof receipt.killWindow !== 'string' || !receipt.killWindow) {
    throw new ModelVillageCrashDrillError('killWindow must be a non-empty string');
  }
  if (typeof receipt.killSignal !== 'string' || !receipt.killSignal) {
    throw new ModelVillageCrashDrillError('killSignal must be a non-empty string');
  }
  if (!Number.isInteger(receipt.workerPid)) {
    throw new ModelVillageCrashDrillError('workerPid must be an integer');
  }
  if (
    receipt.storeStateHashAfterRecovery !== null
    && !SHA256_PATTERN.test(receipt.storeStateHashAfterRecovery)
  ) {
    throw new ModelVillageCrashDrillError('storeStateHashAfterRecovery must be sha256 or null');
  }
  if (receipt.gapReference !== null && !/^G\d+$/.test(receipt.gapReference)) {
    throw new ModelVillageCrashDrillError('gapReference must be null or Gn');
  }
  if (!ISO_UTC_PATTERN.test(receipt.at)) {
    throw new ModelVillageCrashDrillError('at must be an ISO-8601 UTC timestamp');
  }
  const { receiptHash, ...rest } = receipt;
  let recomputed;
  try {
    recomputed = canonicalDigest(rest);
  } catch (error) {
    throw new ModelVillageCrashDrillError(`receipt is not canonicalizable: ${error.message}`);
  }
  if (recomputed !== receiptHash) {
    throw new ModelVillageCrashDrillError('receiptHash mismatch (receipt was altered)');
  }
  return true;
}
