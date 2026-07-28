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
 * store's key-scrub / log-append windows are sub-syscall. Those exact
 * intra-syscall windows cannot be hit by an EXTERNAL SIGKILL, and the code
 * exposes only a partial fault seam that a NEW-FILE consumer can drive (the
 * injectable before_rename/after_rename fault and the commit functions are
 * still module-private in model-village-phase0b-runtime.mjs — see gapsFound).
 * For those windows the worker deterministically establishes the exact on-disk
 * state a crash at that window produces (orphan temp / partial log line /
 * post-commit key residue) using production code plus real file ops and is
 * THEN really SIGKILLed; recovery runs against 100% production recovery code.
 * Each receipt states its mechanism in observedOutcome. FOUR windows are caught
 * with no state modeling at all: the custody object-write (large ciphertext
 * write), the custody lock-held window (live lock holder), the phase0b
 * persistence lock leak (the worker holds a REAL production lock via
 * acquirePersistentStoreLock and is killed holding it, so its release never
 * runs), and the custody key-destruction ORDERING window (production
 * destroyContentKey is interrupted at the key scrub by a real filesystem
 * fault, so the state under test is produced by production code failing at the
 * ordering boundary rather than by the worker writing it).
 *
 * NEW FILE — reuses, never reimplements, MV-B1..B4 production scripts.
 */

import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import path from 'node:path';
import {
  clearInterval,
  clearTimeout,
  setInterval,
  setTimeout,
} from 'node:timers';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  canonicalDigest,
  createRuntimeInjectedValidatorFixture,
  initializePersistentStore,
  readPersistentState,
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
      + 'validatePersistentState passes. NON-COVERAGE, stated because it was '
      + 'once implied and is false: this scenario CANNOT discriminate atomic '
      + 'replacement from a naive direct write — both leave the identical '
      + 'settled on-disk state once the write has finished, so a naive '
      + 'writeFileSync passes it. The write MECHANISM is measured only by the '
      + 'torn-read probe (runTornReadProbe).',
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
      + 'ignored. NON-COVERAGE, stated because it was once implied and is '
      + 'false: the orphan temp here is written BY THE WORKER, not by '
      + 'writeAtomicState, so this scenario cannot discriminate atomic '
      + 'replacement from a naive direct write either — under a naive write the '
      + 'prior state is equally intact at the moment the injected fault fires. '
      + 'The write MECHANISM is measured only by the torn-read probe '
      + '(runTornReadProbe).',
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
    gapReference: null,
    expectedInvariantHeld: true,
    invariantDescription:
      'A phase0b state.lock genuinely leaked by a SIGKILLed holder is '
      + 'auto-reclaimed: the pid it records is proven dead, the stale lock is '
      + 'broken exactly once, a fresh writer gets past the lock, and no lock '
      + 'file is left behind. Was gap G2 (fixed: withStoreLock now takes a '
      + 'pid-stamped lock mirroring the sealed custody store).',
  },
  'custody-destroy-key-killed-mid-destroy': {
    killTrigger: 'ready-signal',
    killWindow: 'custody-key-destruction',
    gapReference: null,
    expectedInvariantHeld: true,
    invariantDescription:
      'A key destruction that crashed after its commit point (the hash-chained '
      + "'destroy-key' access-log entry) is rolled FORWARD, never backward: "
      + 'openSealedCustodyStore accepts the committed store, completes the key '
      + 'scrub/unlink, refuses to resurrect the key (readObject throws '
      + 'CustodyKeyDestroyedError), and verifyIntegrity passes in '
      + 'ciphertext-checksum-only mode. Was gap G1 (RECOVERY half).',
  },
  'custody-destroy-key-killed-before-key-scrub': {
    killTrigger: 'ready-signal',
    killWindow: 'custody-key-destruction-before-key-scrub',
    gapReference: null,
    expectedInvariantHeld: true,
    invariantDescription:
      'ORDERING half of gap G1: the destroy COMMIT RECORD is durable before a '
      + 'single key byte is touched. The real production destroyContentKey is '
      + 'interrupted at the key scrub itself (the key file is made unwritable, '
      + 'so scrubAndUnlinkKeyFile throws from inside production code at exactly '
      + 'the ordering boundary), and recovery must still roll the destruction '
      + 'forward. If the commit ever moves back after the scrub, this window '
      + 'commits nothing, the store reopens with a LIVE key, and this scenario '
      + 'goes red — which the completion-then-restore case structurally cannot '
      + 'detect.',
  },
  'custody-tombstone-torn-append': {
    killTrigger: 'ready-signal',
    killWindow: 'custody-tombstone-append',
    gapReference: null,
    expectedInvariantHeld: true,
    invariantDescription:
      'A crash INSIDE the tombstone append (step 2 of destroyContentKey) does '
      + 'not wedge the store: an unterminated trailing line was never a durable '
      + 'record, so open drops it and re-emits the tombstone verbatim from the '
      + 'COMMITTED hash-chained destroy-key entry, leaving exactly one valid '
      + 'tombstone and the destruction rolled forward. The hash-chained access '
      + 'log keeps its opposite, fail-closed behaviour (access-log-torn-append) '
      + '— only the unauthenticated tombstone tail is repairable.',
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
// TORN-READ PROBE — the only thing here that measures the ATOMIC-REPLACEMENT
// mechanism itself.
//
// WHY IT EXISTS (audit finding, 2026-07-27, reproduced by execution before this
// was written): replacing writeAtomicState with a naive
// `writeFileSync(statePath, json)` — no temp file, no fsync, no rename — left
// EVERY existing gate green: the 9 crash drills all HELD (including the two
// literally named persistent-state-killed-before-rename and
// -after-rename), the durability checker exited 0 with allInvariantsHeld:true,
// and both node --test suites passed. The reason is structural, not a tuning
// problem: those two scenarios drive the faultInjection seam, and atomic
// replacement and a naive write leave the IDENTICAL observable state when that
// fault fires (prior state intact) and the IDENTICAL state once a write has
// settled. Nothing in the slice ever observed a state file WHILE it was being
// replaced, which is the only moment the two differ.
//
// WHAT IS ACTUALLY DIFFERENT: atomic replacement means a reader never observes a
// partial state file. The new bytes are assembled at a private temp path and
// published by a single rename, so an opener sees either the old complete file
// or the new complete file — never a prefix. A naive direct write publishes at
// the target path: between the truncating open and the completed write, the
// target EXISTS and is short. That is a torn read, and it is the observable.
//
// HOW THIS MEASURES IT: a real writer child loops the real production write path
// (initializePersistentStore -> writeAtomicState) while N real reader children
// hammer the real production readPersistentState in a tight loop. Every read is
// classified from what it actually observed. A read that finds state.json
// PRESENT but unparseable/invalid is a torn read: a HIT. Absent (ENOENT) and
// OS-transient (EPERM/EBUSY delete-pending) reads are NOT hits — they are the
// proof the reader was inside a replacement window at all, and they are what
// makes "no torn read" mean something instead of meaning "nobody looked".
// ---------------------------------------------------------------------------

export const TORN_READ_PROBE_SCHEMA = 'hololand.model-village-torn-read-probe.v1';
export const TORN_READ_PROBE_ENGINE = 'hololand-model-village-torn-read-probe-v1';

/** Verdicts. Never declared — always derived from the counters below. */
export const TORN_READ_VERDICTS = Object.freeze({
  HELD: 'HELD',
  UNMEASURED: 'UNMEASURED',
  VIOLATED: 'VIOLATED',
});

/**
 * MEASURED per-attempt hit rate. This number is not a guess and not a target: it
 * was measured against the DEFECT-A MUTANT (writeAtomicState replaced by a bare
 * `writeFileSync(statePath(storeDir), canonicalJson(state) + '\n', 'utf8')`,
 * keeping only the two faultInjection throws), which is the ONLY source of a
 * real p — the fixed implementation produces zero hits by construction.
 *
 *   host: win32 / NTFS, node v24.15.0, 3 reader children
 *   calibration run: mutant 606 torn / 208,499 in-window attempts = 2.906e-3
 *                    unmutated 0 torn / 190,441 in-window attempts
 *   confirmation, 6 runs each with the shipped probe at n = 72,000 attempts:
 *                    mutant   6/6 VIOLATED, 139-243 hits per run
 *                             (1.93e-3 .. 3.38e-3 per attempt)
 *                    unmutated 6/6 HELD, 0 hits in 432,000 attempts
 *
 * An "attempt" is a read that landed inside a replacement window (it observed
 * absent, OS-transient, or torn). Reads that saw a settled complete file were
 * never at risk and are not counted in the denominator.
 *
 * The pinned value is the calibration run's rate. The LOWEST rate observed
 * across the confirmation runs (1.93e-3) still gives 1-(1-p)^60000 = 1 - e^-116,
 * so the floor below is not sensitive to which of these numbers is used.
 */
export const TORN_READ_CALIBRATED_HIT_RATE = 2.906e-3;

/**
 * Attempts required before "no torn read" is allowed to mean anything.
 *
 *   n = 60,000
 *   detection at the measured rate: 1-(1-2.906e-3)^60000 = 1 - e^-174.4,
 *     i.e. 1 - 10^-75.7 — indistinguishable from certainty.
 *   collapse margin: the SMALLEST per-attempt rate this n still detects at 95%
 *     is p* = 1 - 0.05^(1/60000) = 4.993e-5, which is 58x BELOW the measured
 *     rate. So the guard survives a host on which the vulnerable window is ~58x
 *     narrower relative to the loop than it is here before it stops being a 95%
 *     guard — and it reports UNMEASURED rather than passing if it cannot even
 *     reach n.
 *
 * Measured cost of reaching n on this host: ~1.5s wall with 3 readers. The
 * ceiling below is ~13x that so a loaded box reports UNMEASURED honestly instead
 * of failing on the clock in a way that reads as a durability defect.
 */
export const TORN_READ_REQUIRED_ATTEMPTS = 60000;

/** Reader children. Three was the measured configuration; more only adds power. */
export const TORN_READ_READER_COUNT = 3;

/**
 * A run must witness this many COMPLETED replacements (absent -> complete
 * transitions seen by a reader) before its attempts count as a real race. This
 * is the second non-vacuity fence: attempts alone could in principle be racked
 * up against a store nobody is rewriting (e.g. a writer that took the lock and
 * then wedged), and 60,000 reads of a permanently-missing file must NEVER read
 * as 60,000 chances to catch a tear. Measured on this host: 300+ replacements
 * are witnessed in the time it takes to reach n.
 */
export const TORN_READ_MIN_PUBLICATIONS_WITNESSED = 25;

const TORN_READ_DEADLINE_MS = 20000;
const TORN_READ_READY_TIMEOUT_MS = 20000;
const TORN_READ_INSPECT_TIMEOUT_MS = 20000;
const TORN_READ_MAX_SAMPLES = 4;

/**
 * Error codes that mean "the OS refused this open because the file is being
 * replaced right now", NOT "the file was torn". On win32 an open racing an
 * unlink lands here. Counted as an in-window attempt, never as a hit.
 */
const TORN_READ_TRANSIENT_CODES = new Set([
  'EACCES',
  'EBUSY',
  'EPERM',
]);

const PROBE_READY_TOKEN = 'MV_TORN_READ_READY';
const PROBE_RESULT_MARKER = 'MV_TORN_READ_RESULT ';
const THIS_FILE = fileURLToPath(import.meta.url);

function probeStateFile(storeDir) {
  return path.join(storeDir, 'state.json');
}

/**
 * Classifies ONE production read. Returns { state, hit, detail }, where `state`
 * is what the reader observed on disk and `hit` is true only for a torn read.
 */
function classifyProbeRead(storeDir) {
  try {
    readPersistentState(storeDir);
    return { state: 'complete', hit: false, detail: '' };
  } catch (error) {
    const code = error?.code;
    if (code === 'ENOENT') return { state: 'absent', hit: false, detail: '' };
    if (TORN_READ_TRANSIENT_CODES.has(code)) {
      return { state: 'transient', hit: false, detail: `${error.name}:${code}` };
    }
    return {
      state: 'torn',
      hit: true,
      detail: boundString(`${error.name}: ${error.message}`, 160),
    };
  }
}

/**
 * IN-RUN POSITIVE CONTROL for the detector itself, run in the gate process on
 * every probe run.
 *
 * WHY IT EXISTS. Until this was added, the probe's only proof that
 * `classifyProbeRead` can SEE a tear was the A/B mutant tree in
 * model-village-crash-drill.test.mjs, which runs only under `node --test`. The
 * gate run itself shipped a detector whose liveness was assumed. A
 * readPersistentState that grew a try/catch, a JSON parser that started
 * tolerating truncation, or a classifier that mapped an unknown error onto
 * 'transient' would all turn the gate permanently and silently green — and the
 * receipt would still print detection=1, because n is measured but the
 * DETECTOR was not.
 *
 * WHAT IT MEASURES. All three classifier outcomes, against real files produced
 * by production code:
 *   absent   — an empty store directory
 *   complete — a store created by production initializePersistentStore
 *   torn     — a genuine byte PREFIX of the exact bytes production just
 *              published (not synthetic garbage): precisely the on-disk state a
 *              naive direct write is readable in, mid-write
 * Any of the three failing to be classified as expected is an UNMEASURED
 * precondition, so a blind detector fails the gate closed instead of reporting
 * a confident HELD. Deterministic: no race, no trial count, p = 1.
 */
function runTornReadDetectorControl(scratchRoot) {
  const controlDir = path.join(scratchRoot, `torn-read-control-${randomUUID()}`);
  const storeDir = path.join(controlDir, 'phase0b');
  mkdirSync(storeDir, { recursive: true });
  try {
    const absent = classifyProbeRead(storeDir);
    const fixture = buildValidatorFixture();
    initializePersistentStore({
      storeDir,
      trustedValidatorConfig: fixture.trustedValidatorConfig,
      validatorReceipt: fixture.validatorReceipt,
      initialWorld: fixture.initialWorld,
    });
    const complete = classifyProbeRead(storeDir);
    const target = probeStateFile(storeDir);
    const published = readFileSync(target, 'utf8');
    const prefixLength = Math.max(1, Math.floor(published.length / 2));
    writeFileSync(target, published.slice(0, prefixLength), 'utf8');
    const torn = classifyProbeRead(storeDir);
    return {
      absentClassified: absent.state === 'absent' && absent.hit === false,
      completeClassified: complete.state === 'complete' && complete.hit === false,
      tornClassified: torn.state === 'torn' && torn.hit === true,
    };
  } catch {
    return {
      absentClassified: false,
      completeClassified: false,
      tornClassified: false,
    };
  } finally {
    try {
      rmSync(controlDir, { recursive: true, force: true });
    } catch {
      /* best-effort scratch cleanup */
    }
  }
}

// --- probe child roles (this file, re-entered as a script) -----------------

function probeWriterChild({ storeDir, deadline }) {
  const fixture = buildValidatorFixture();
  const target = probeStateFile(storeDir);
  let signalled = false;
  while (Date.now() < deadline) {
    if (existsSync(target)) unlinkSync(target);
    initializePersistentStore({
      storeDir,
      trustedValidatorConfig: fixture.trustedValidatorConfig,
      validatorReceipt: fixture.validatorReceipt,
      initialWorld: fixture.initialWorld,
    });
    if (!signalled) {
      // Only after a REAL production write has completed once.
      writeSync(1, `${PROBE_READY_TOKEN}\n`);
      signalled = true;
    }
  }
}

function probeReaderChild({ storeDir, targetAttempts, deadline }) {
  const counters = {
    reads: 0,
    readsComplete: 0,
    readsAbsent: 0,
    readsTransient: 0,
    readsTorn: 0,
    publicationsWitnessed: 0,
  };
  const tornSamples = [];
  let previousMissing = false;
  let attempts = 0;
  while (attempts < targetAttempts && Date.now() < deadline) {
    const observation = classifyProbeRead(storeDir);
    counters.reads += 1;
    if (observation.state === 'complete') {
      counters.readsComplete += 1;
      // A file that was missing and is now complete is a replacement this
      // reader personally witnessed finish. This is the interleaving proof.
      if (previousMissing) counters.publicationsWitnessed += 1;
      previousMissing = false;
    } else {
      if (observation.state === 'absent') counters.readsAbsent += 1;
      else if (observation.state === 'transient') counters.readsTransient += 1;
      else {
        counters.readsTorn += 1;
        if (tornSamples.length < TORN_READ_MAX_SAMPLES) tornSamples.push(observation.detail);
      }
      previousMissing = true;
      attempts += 1;
    }
  }
  writeSync(1, `${PROBE_RESULT_MARKER}${JSON.stringify({ ...counters, tornSamples })}\n`);
}

function probeInspectChild({ storeDir }) {
  const observation = existsSync(probeStateFile(storeDir))
    ? classifyProbeRead(storeDir)
    : { state: 'absent', hit: false, detail: '' };
  writeSync(
    1,
    `${PROBE_RESULT_MARKER}${JSON.stringify({
      state: observation.state,
      detail: observation.detail,
    })}\n`,
  );
}

function runProbeChild(argv) {
  const args = {};
  for (const entry of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(entry);
    if (match) args[match[1]] = match[2];
  }
  const storeDir = args['store-dir'];
  const deadline = Number(args.deadline);
  if (args.role === 'torn-read-writer') return probeWriterChild({ storeDir, deadline });
  if (args.role === 'torn-read-reader') {
    return probeReaderChild({
      storeDir,
      targetAttempts: Number(args['target-attempts']),
      deadline,
    });
  }
  if (args.role === 'torn-read-inspect') return probeInspectChild({ storeDir });
  writeSync(2, `crash drill: unknown probe role ${args.role}\n`);
  process.exitCode = 2;
  return undefined;
}

// --- probe parent ----------------------------------------------------------

function parseProbeResult(stdout) {
  const line = String(stdout)
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(PROBE_RESULT_MARKER));
  if (!line) return null;
  try {
    return JSON.parse(line.slice(PROBE_RESULT_MARKER.length));
  } catch {
    return null;
  }
}

function spawnProbeChild(args) {
  return spawn(process.execPath, [THIS_FILE, ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

function collectProbeChild(child) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('exit', (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Detection probability 1-(1-p)^n at the CALIBRATED rate for the attempts this
 * run actually achieved, plus the smallest per-attempt rate this many attempts
 * would still catch at 95%. Both are computed here from the achieved n — they
 * are never copied from the constant, so an under-powered run cannot inherit the
 * full-power number.
 */
function derivePower(attemptsAchieved, requiredAttempts) {
  const n = Math.max(0, attemptsAchieved);
  const p = TORN_READ_CALIBRATED_HIT_RATE;
  return {
    attemptsAchieved: n,
    calibratedHitRatePerAttempt: p,
    detectionAtCalibratedRate: n === 0 ? 0 : round(1 - ((1 - p) ** n), 6),
    minimumHitRateStillDetectedAt95: n === 0 ? 1 : round(1 - (0.05 ** (1 / n)), 9),
    requiredAttempts,
  };
}

/**
 * Runs the torn-read probe and returns { receipt }.
 *
 * The verdict is DERIVED, in this order:
 *   VIOLATED  — at least one read observed a present-but-incomplete state file.
 *               A hit is decisive regardless of power: you cannot un-see a tear.
 *   UNMEASURED— no hit, but the run failed at least one measurement precondition
 *               (writer never wrote, writer died early, a reader never reported,
 *               too few witnessed replacements, or fewer attempts than n).
 *               UNMEASURED is a FAILURE for the caller: "we saw no tear" over a
 *               race that did not happen is not evidence of atomicity.
 *   HELD      — no hit across >= n real in-window attempts on a race that is
 *               proven to have happened.
 */
export async function runTornReadProbe({
  scratchRoot,
  readerCount = TORN_READ_READER_COUNT,
  requiredAttempts = TORN_READ_REQUIRED_ATTEMPTS,
  minPublicationsWitnessed = TORN_READ_MIN_PUBLICATIONS_WITNESSED,
  deadlineMs = TORN_READ_DEADLINE_MS,
} = {}) {
  if (!scratchRoot || typeof scratchRoot !== 'string') {
    throw new ModelVillageCrashDrillError('scratchRoot must be a non-empty string');
  }
  if (!Number.isInteger(readerCount) || readerCount < 1) {
    throw new ModelVillageCrashDrillError('readerCount must be a positive integer');
  }
  if (!Number.isInteger(requiredAttempts) || requiredAttempts < 1) {
    throw new ModelVillageCrashDrillError('requiredAttempts must be a positive integer');
  }

  mkdirSync(scratchRoot, { recursive: true });
  const caseDir = path.join(scratchRoot, `torn-read-${randomUUID()}`);
  const storeDir = path.join(caseDir, 'phase0b');
  mkdirSync(storeDir, { recursive: true });

  // 20% headroom so readers do not all stop one attempt short of the aggregate.
  const perReaderTarget = Math.ceil((requiredAttempts * 1.2) / readerCount);
  const deadline = Date.now() + deadlineMs;

  const unmeasuredReasons = [];
  let writerPid = -1;
  let writerExitedEarly = false;
  let writerExitSignal = null;
  let readyObserved = false;

  try {
    const writer = spawnProbeChild([
      '--role=torn-read-writer',
      `--store-dir=${storeDir}`,
      `--deadline=${deadline}`,
    ]);
    writerPid = writer.pid ?? -1;
    const writerDone = collectProbeChild(writer);
    let writerSettled = false;
    writerDone.then(() => { writerSettled = true; });

    readyObserved = await new Promise((resolve) => {
      let seen = '';
      const timer = setTimeout(() => resolve(false), TORN_READ_READY_TIMEOUT_MS);
      const onData = (chunk) => {
        seen += chunk.toString();
        if (seen.includes(PROBE_READY_TOKEN)) {
          clearTimeout(timer);
          writer.stdout.off('data', onData);
          resolve(true);
        }
      };
      writer.stdout.on('data', onData);
      writerDone.then(() => {
        clearTimeout(timer);
        resolve(seen.includes(PROBE_READY_TOKEN));
      });
    });

    let readerResults = [];
    if (readyObserved) {
      const readers = [];
      for (let index = 0; index < readerCount; index += 1) {
        readers.push(collectProbeChild(spawnProbeChild([
          '--role=torn-read-reader',
          `--store-dir=${storeDir}`,
          `--target-attempts=${perReaderTarget}`,
          `--deadline=${deadline}`,
        ])));
      }
      readerResults = await Promise.all(readers);
    } else {
      unmeasuredReasons.push(
        'the writer child never signalled a completed production write, so no '
        + 'reader ever raced a real state replacement',
      );
    }

    // The writer is killed HERE, mid-loop, with a real uncatchable SIGKILL — the
    // store is then inspected by a fresh process. If it exited on its own first,
    // the race was not sustained for the whole reader window and the run is
    // UNMEASURED rather than quietly short.
    if (writerSettled) {
      writerExitedEarly = true;
      unmeasuredReasons.push(
        'the writer child exited before the probe finished, so the reader window '
        + 'was not fully raced',
      );
    } else {
      try {
        writer.kill('SIGKILL');
      } catch {
        /* already gone; the exit handler still resolves */
      }
    }
    const writerExit = await writerDone;
    writerExitSignal = writerExit.signal ?? null;

    const detectorControl = runTornReadDetectorControl(caseDir);
    if (!detectorControl.tornClassified) {
      unmeasuredReasons.push(
        'the in-run detector positive control did NOT classify a genuine '
        + 'truncated prefix of production-published bytes as a torn read, so '
        + 'this run cannot show that its detector can see the defect it claims '
        + 'to rule out',
      );
    }
    if (!detectorControl.completeClassified) {
      unmeasuredReasons.push(
        'the in-run detector positive control did NOT classify a '
        + 'production-written state file as complete, so the classifier is not '
        + 'behaving on the negative case either',
      );
    }
    if (!detectorControl.absentClassified) {
      unmeasuredReasons.push(
        'the in-run detector positive control did NOT classify an empty store '
        + 'directory as absent',
      );
    }

    const observed = {
      detectorControl,
      readerCount,
      readersReporting: 0,
      readsTotal: 0,
      readsComplete: 0,
      readsAbsent: 0,
      readsTransient: 0,
      readsTorn: 0,
      publicationWindowAttempts: 0,
      publicationsWitnessed: 0,
      tornSamples: [],
      postKillStateFile: 'unknown',
      postKillDetail: '',
      writerPid,
      writerExitSignal,
      writerExitedEarly,
      writerSignalledFirstWrite: readyObserved,
    };

    for (const result of readerResults) {
      const parsed = parseProbeResult(result.stdout);
      if (!parsed) continue;
      observed.readersReporting += 1;
      observed.readsTotal += parsed.reads;
      observed.readsComplete += parsed.readsComplete;
      observed.readsAbsent += parsed.readsAbsent;
      observed.readsTransient += parsed.readsTransient;
      observed.readsTorn += parsed.readsTorn;
      observed.publicationsWitnessed += parsed.publicationsWitnessed;
      for (const sample of parsed.tornSamples ?? []) {
        if (observed.tornSamples.length < TORN_READ_MAX_SAMPLES) {
          observed.tornSamples.push(boundString(sample, 160));
        }
      }
    }
    observed.publicationWindowAttempts =
      observed.readsAbsent + observed.readsTransient + observed.readsTorn;

    // Fresh-process inspection of whatever the SIGKILL left behind. A state file
    // that exists and does not validate is a persisted tear — another hit.
    const inspect = spawnSync(
      process.execPath,
      [THIS_FILE, '--role=torn-read-inspect', `--store-dir=${storeDir}`],
      {
        encoding: 'utf8',
        killSignal: 'SIGKILL',
        timeout: TORN_READ_INSPECT_TIMEOUT_MS,
        windowsHide: true,
      },
    );
    const inspectResult = parseProbeResult(inspect.stdout);
    if (inspectResult) {
      observed.postKillStateFile = inspectResult.state;
      observed.postKillDetail = boundString(inspectResult.detail ?? '', 160);
    } else {
      unmeasuredReasons.push(
        'the post-kill fresh-process inspection produced no verdict line',
      );
    }

    if (observed.readersReporting !== readerCount) {
      unmeasuredReasons.push(
        `only ${observed.readersReporting}/${readerCount} reader children reported a result`,
      );
    }
    if (observed.publicationsWitnessed < minPublicationsWitnessed) {
      unmeasuredReasons.push(
        `only ${observed.publicationsWitnessed} completed state replacements were `
        + `witnessed (need >= ${minPublicationsWitnessed}); the readers were not `
        + 'demonstrably racing a live writer',
      );
    }
    if (observed.publicationWindowAttempts < requiredAttempts) {
      unmeasuredReasons.push(
        `only ${observed.publicationWindowAttempts} in-window read attempts were made `
        + `(need >= ${requiredAttempts} for >=95% detection at the calibrated rate)`,
      );
    }

    const hits = observed.readsTorn + (observed.postKillStateFile === 'torn' ? 1 : 0);
    let verdict;
    if (hits > 0) verdict = TORN_READ_VERDICTS.VIOLATED;
    else if (unmeasuredReasons.length > 0) verdict = TORN_READ_VERDICTS.UNMEASURED;
    else verdict = TORN_READ_VERDICTS.HELD;

    const receipt = finalizeTornReadReceipt({
      at: new Date().toISOString(),
      engine: TORN_READ_PROBE_ENGINE,
      hits,
      observed,
      power: derivePower(observed.publicationWindowAttempts, requiredAttempts),
      property:
        'atomic state PUBLICATION ON THE CREATE PATH: while production '
        + 'initializePersistentStore publishes state.json into a store '
        + 'directory, a concurrent reader running production readPersistentState '
        + 'NEVER observes state.json present-but-incomplete. A naive direct '
        + 'write publishes at the target path and is torn-readable between its '
        + 'truncating open and its completed write; an atomic temp+fsync+rename '
        + 'never is. SCOPE, stated because the receipt must not be read as more '
        + 'than it measures: the only production writer a consumer can drive is '
        + 'the CREATE path (writeAtomicState with the target ABSENT — '
        + 'initializePersistentStore refuses a live store, so the probe harness '
        + 'unlinks between cycles). The production COMMIT path calls the same '
        + 'function with the target PRESENT '
        + '(model-village-phase0b-runtime.mjs:2592) and is module-private, so it '
        + 'is NOT raced here — see gap G-REPLACE. Consequently an implementation '
        + 'that is atomic on create and naive on replace passes this probe, and '
        + 'so does one that unlinks the target before renaming (G-VANISH). '
        + 'DENOMINATOR: a publicationWindowAttempt is a read that landed inside '
        + "the harness's unlink->publish window (absent, OS-transient, or torn). "
        + 'Reads of a settled complete file were never at risk and are excluded. '
        + 'The bulk of that denominator is ENOENT reads of the window this '
        + 'harness manufactures; the calibrated hit rate n is sized from was '
        + 'measured in this same harness, so the power arithmetic is internally '
        + 'consistent, but the window is the create window and not a production '
        + 'replacement window.',
      schema: TORN_READ_PROBE_SCHEMA,
      unmeasuredReasons: unmeasuredReasons.map((reason) => boundString(reason, 300)),
      verdict,
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

const TORN_READ_RECEIPT_KEYS = Object.freeze([
  'at',
  'engine',
  'hits',
  'observed',
  'power',
  'property',
  'schema',
  'unmeasuredReasons',
  'verdict',
]);

const TORN_READ_DETECTOR_CONTROL_KEYS = Object.freeze([
  'absentClassified',
  'completeClassified',
  'tornClassified',
]);

const TORN_READ_OBSERVED_KEYS = Object.freeze([
  'detectorControl',
  'postKillDetail',
  'postKillStateFile',
  'readerCount',
  'readersReporting',
  'readsAbsent',
  'readsComplete',
  'readsTorn',
  'readsTotal',
  'readsTransient',
  'publicationWindowAttempts',
  'publicationsWitnessed',
  'tornSamples',
  'writerExitSignal',
  'writerExitedEarly',
  'writerPid',
  'writerSignalledFirstWrite',
]);

const TORN_READ_POWER_KEYS = Object.freeze([
  'attemptsAchieved',
  'calibratedHitRatePerAttempt',
  'detectionAtCalibratedRate',
  'minimumHitRateStillDetectedAt95',
  'requiredAttempts',
]);

function finalizeTornReadReceipt(fields) {
  const receipt = {};
  for (const key of TORN_READ_RECEIPT_KEYS) receipt[key] = fields[key];
  receipt.receiptHash = canonicalDigest(receipt);
  return Object.freeze(receipt);
}

function assertProbeKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ModelVillageCrashDrillError(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, i) => key !== wanted[i])) {
    throw new ModelVillageCrashDrillError(
      `${label} key set mismatch (got ${actual.join(',')})`,
    );
  }
}

/**
 * Validates a torn-read receipt AND re-derives its verdict from its own
 * counters. The verdict field is never trusted: if it disagrees with what the
 * observations imply, the receipt is rejected. This is what stops the probe from
 * becoming a claim key that is computed from the same input that sets it.
 */
export function verifyTornReadProbeReceipt(receipt) {
  assertProbeKeys(receipt, [...TORN_READ_RECEIPT_KEYS, 'receiptHash'], 'torn-read receipt');
  if (receipt.schema !== TORN_READ_PROBE_SCHEMA) {
    throw new ModelVillageCrashDrillError('torn-read receipt schema mismatch');
  }
  if (receipt.engine !== TORN_READ_PROBE_ENGINE) {
    throw new ModelVillageCrashDrillError('torn-read receipt engine mismatch');
  }
  if (!ISO_UTC_PATTERN.test(receipt.at)) {
    throw new ModelVillageCrashDrillError('torn-read receipt at must be ISO-8601 UTC');
  }
  if (typeof receipt.property !== 'string' || receipt.property.length === 0) {
    throw new ModelVillageCrashDrillError('torn-read receipt property must be a non-empty string');
  }
  if (!Object.values(TORN_READ_VERDICTS).includes(receipt.verdict)) {
    throw new ModelVillageCrashDrillError(`unknown torn-read verdict ${receipt.verdict}`);
  }
  assertProbeKeys(receipt.observed, TORN_READ_OBSERVED_KEYS, 'torn-read observed');
  assertProbeKeys(
    receipt.observed.detectorControl,
    TORN_READ_DETECTOR_CONTROL_KEYS,
    'torn-read observed.detectorControl',
  );
  for (const key of TORN_READ_DETECTOR_CONTROL_KEYS) {
    if (typeof receipt.observed.detectorControl[key] !== 'boolean') {
      throw new ModelVillageCrashDrillError(
        `observed.detectorControl.${key} must be boolean`,
      );
    }
  }
  assertProbeKeys(receipt.power, TORN_READ_POWER_KEYS, 'torn-read power');
  if (!Array.isArray(receipt.unmeasuredReasons)) {
    throw new ModelVillageCrashDrillError('unmeasuredReasons must be an array');
  }
  if (!Array.isArray(receipt.observed.tornSamples)) {
    throw new ModelVillageCrashDrillError('observed.tornSamples must be an array');
  }
  for (const key of [
    'readerCount',
    'readersReporting',
    'readsAbsent',
    'readsComplete',
    'readsTorn',
    'readsTotal',
    'readsTransient',
    'publicationWindowAttempts',
    'publicationsWitnessed',
  ]) {
    if (!Number.isInteger(receipt.observed[key]) || receipt.observed[key] < 0) {
      throw new ModelVillageCrashDrillError(`observed.${key} must be a non-negative integer`);
    }
  }
  if (
    receipt.observed.publicationWindowAttempts
    !== receipt.observed.readsAbsent
      + receipt.observed.readsTransient
      + receipt.observed.readsTorn
  ) {
    throw new ModelVillageCrashDrillError(
      'observed.publicationWindowAttempts must equal absent + transient + torn reads',
    );
  }
  if (
    receipt.observed.readsTotal
    < receipt.observed.publicationWindowAttempts + receipt.observed.readsComplete
  ) {
    throw new ModelVillageCrashDrillError('observed.readsTotal is smaller than its own parts');
  }
  const expectedHits =
    receipt.observed.readsTorn + (receipt.observed.postKillStateFile === 'torn' ? 1 : 0);
  if (receipt.hits !== expectedHits) {
    throw new ModelVillageCrashDrillError(
      `torn-read hits ${receipt.hits} does not equal the observed tear count ${expectedHits}`,
    );
  }
  // Power must be re-derivable from the attempts the run actually achieved.
  const power = derivePower(receipt.observed.publicationWindowAttempts, receipt.power.requiredAttempts);
  for (const key of TORN_READ_POWER_KEYS) {
    if (receipt.power[key] !== power[key]) {
      throw new ModelVillageCrashDrillError(
        `torn-read power.${key} does not recompute from the achieved attempts`,
      );
    }
  }
  // The verdict is re-derived, never trusted.
  let expectedVerdict;
  if (expectedHits > 0) expectedVerdict = TORN_READ_VERDICTS.VIOLATED;
  else if (receipt.unmeasuredReasons.length > 0) expectedVerdict = TORN_READ_VERDICTS.UNMEASURED;
  else expectedVerdict = TORN_READ_VERDICTS.HELD;
  if (receipt.verdict !== expectedVerdict) {
    throw new ModelVillageCrashDrillError(
      `torn-read verdict ${receipt.verdict} disagrees with its own observations `
      + `(${expectedVerdict})`,
    );
  }
  // A HELD verdict must additionally satisfy every measurement precondition —
  // an empty unmeasuredReasons list is not allowed to be the whole proof.
  if (receipt.verdict === TORN_READ_VERDICTS.HELD) {
    const o = receipt.observed;
    if (
      // A HELD verdict is a claim that the detector looked and saw nothing.
      // That is only meaningful if the detector demonstrably CAN see, so the
      // in-run positive control is a HELD precondition, not decoration.
      o.detectorControl?.tornClassified !== true
      || o.detectorControl?.completeClassified !== true
      || o.detectorControl?.absentClassified !== true
      || o.writerSignalledFirstWrite !== true
      || o.writerExitedEarly !== false
      || o.readersReporting !== o.readerCount
      || o.publicationsWitnessed < TORN_READ_MIN_PUBLICATIONS_WITNESSED
      // The floor is the MODULE's, not the caller's: a caller that asked for a
      // cheaper run cannot mint a HELD receipt that verifies.
      || receipt.power.requiredAttempts < TORN_READ_REQUIRED_ATTEMPTS
      || o.publicationWindowAttempts < receipt.power.requiredAttempts
      || power.detectionAtCalibratedRate < 0.95
    ) {
      throw new ModelVillageCrashDrillError(
        'torn-read receipt claims HELD without meeting every measurement '
        + 'precondition (in-run detector positive control classified all three '
        + 'outcomes, writer wrote, writer survived the window, all readers '
        + 'reported, publications witnessed, attempts >= the module floor, '
        + 'detection >= 95%)',
      );
    }
  }
  const { receiptHash, ...rest } = receipt;
  if (canonicalDigest(rest) !== receiptHash) {
    throw new ModelVillageCrashDrillError('torn-read receiptHash mismatch (receipt was altered)');
  }
  return true;
}

// ---------------------------------------------------------------------------
// ATOMIC REPLACEMENT PROBE (closes DEFECT A': the torn-read probe races the
// CREATE path only).
//
// WHY THIS EXISTS. The torn-read probe above can only drive the one production
// writer a consumer can reach: initializePersistentStore, which REFUSES a live
// store (model-village-phase0b-runtime.mjs:2280), so its writeAtomicState call
// always runs with the target ABSENT. The production COMMIT path calls the same
// function with the target PRESENT (model-village-phase0b-runtime.mjs:2592) and
// is module-private. That was measured, not assumed: an implementation that is
// atomic on create and naive on replace passed the torn-read probe, both node
// --test suites, and this checker at exit 0 (see the M3 test in
// model-village-crash-drill.test.mjs). The receipt's headline was therefore
// claiming REPLACEMENT while measuring CREATION.
//
// WHAT IS MEASURED HERE, AND HOW IT IS NOT A RACE. Atomic replacement's
// defining mechanism is that the published path acquires a DIFFERENT file
// object; an in-place rewrite keeps the same one and is torn-readable by
// construction between its truncating open and its completed write. That is
// observable directly from the OS: (dev, ino, birthtimeMs) is stable across an
// in-place write and changes across a rename. So the detector is DETERMINISTIC
// — per-replacement detection is 1 by construction, there is no trial count to
// size and no per-trial probability to derive. The only power question left is
// whether any replacement was executed at all, and that is COUNTED, with a
// floor, and reported UNMEASURED when it is not met.
//
// THE COMPARATOR ITSELF IS CONTROLLED. A host on which ino/birthtime cannot
// discriminate would otherwise turn this into a confident wrong answer, so
// every run first performs a known in-place rewrite and a known rename on a
// throwaway file and requires the comparator to call them same/different. If it
// cannot, the run is UNMEASURED, never HELD and never VIOLATED.
//
// THE SEAM. Production is NOT edited. The probe writes a byte-identical copy of
// the shipping runtime with exactly one line appended — `export {
// writeAtomicState };` — which cannot change the function's behaviour, and
// records the shipping file's sha256 plus the appended byte count in the
// receipt so a reader can check that claim. If the anchor is missing the run
// fails LOUD as UNMEASURED rather than silently skipping. This also finally
// drives the before_rename/after_rename fault seam ON THE REPLACEMENT PATH,
// which G-EXPORT recorded as undrivable.
//
// WHAT IT STILL DOES NOT COVER: an implementation that unlinks the target
// before renaming still changes the file identity, so it reads as atomic here
// while leaving a window in which state.json does not exist at all. That is
// G-VANISH, it is executed as a test rather than argued, and it is NOT closed.
// ---------------------------------------------------------------------------

export const ATOMIC_REPLACEMENT_PROBE_SCHEMA =
  'hololand.model-village-atomic-replacement-probe.v1';
export const ATOMIC_REPLACEMENT_PROBE_ENGINE =
  'hololand-model-village-atomic-replacement-probe-v1';

/** Verdicts. Same three-state shape as the torn-read probe; always derived. */
export const ATOMIC_REPLACEMENT_VERDICTS = Object.freeze({
  HELD: 'HELD',
  UNMEASURED: 'UNMEASURED',
  VIOLATED: 'VIOLATED',
});

/**
 * Replacements a run must execute against a PRESENT target before "no in-place
 * rewrite seen" is allowed to mean anything.
 *
 * The detector is deterministic — an in-place rewrite is caught on the FIRST
 * replacement with probability 1, because the identity either changed or it did
 * not — so this floor is NOT a statistical power constant and must not be read
 * as one. It exists only so a run that executed zero or one replacement (a
 * wedged seam, a store that never got created) cannot be reported as a pass:
 * 1-(1-1)^n is 0 for n=0 and 1 for every n>=1, so the whole question is whether
 * n >= 1, and 8 is a margin over that, not a sample size.
 */
export const ATOMIC_REPLACEMENT_MIN_REPLACEMENTS = 8;

const SEAM_EXPORT_LINE = 'export { writeAtomicState };';
const WRITE_ATOMIC_ANCHOR =
  "function writeAtomicState(storeDir, state, faultInjection = 'none') {";
const SEAM_TREE_FILES = Object.freeze([
  'model-village-canonical-lifecycle.mjs',
  'model-village-phase0b-runtime.mjs',
]);
const RUNTIME_FILE_NAME = 'model-village-phase0b-runtime.mjs';

/**
 * (dev, ino, birthtimeMs) — the OS's own answer to "is this the same file
 * object". Stable across an in-place write, different after a rename.
 */
function fileIdentity(target) {
  const stats = statSync(target);
  return `${stats.dev}:${stats.ino}:${stats.birthtimeMs}`;
}

/**
 * Positive/negative control for the comparator, on this host, this run. Without
 * it a filesystem that reports a constant ino would make every honest run look
 * VIOLATED and every naive one look the same — a confident wrong answer either
 * way.
 */
function runIdentityComparatorControl(controlDir) {
  try {
    mkdirSync(controlDir, { recursive: true });
    const target = path.join(controlDir, 'identity-control.bin');
    writeFileSync(target, 'one', 'utf8');
    const created = fileIdentity(target);
    writeFileSync(target, 'two-two', 'utf8');
    const afterInPlace = fileIdentity(target);
    const temporary = path.join(controlDir, 'identity-control.tmp');
    writeFileSync(temporary, 'three-three-three', 'utf8');
    renameSync(temporary, target);
    const afterRename = fileIdentity(target);
    return {
      atomicReplaceReadsAsNewFile: afterRename !== created && afterRename !== afterInPlace,
      inPlaceRewriteReadsAsSameFile: afterInPlace === created,
    };
  } catch {
    return {
      atomicReplaceReadsAsNewFile: false,
      inPlaceRewriteReadsAsSameFile: false,
    };
  }
}

/**
 * Byte-identical copy of the shipping runtime plus ONE appended export line.
 * Returns null (=> UNMEASURED) rather than throwing or silently degrading.
 */
function buildWriteAtomicSeamTree(seamDir) {
  const scriptsDir = path.dirname(THIS_FILE);
  mkdirSync(seamDir, { recursive: true });
  for (const file of SEAM_TREE_FILES) {
    const source = readFileSync(path.join(scriptsDir, file), 'utf8');
    writeFileSync(path.join(seamDir, file), source, 'utf8');
  }
  const runtimePath = path.join(scriptsDir, RUNTIME_FILE_NAME);
  const shipped = readFileSync(runtimePath, 'utf8');
  if (!shipped.includes(WRITE_ATOMIC_ANCHOR)) return null;
  const seamSource = `${shipped}\n${SEAM_EXPORT_LINE}\n`;
  if (!seamSource.startsWith(shipped)) return null;
  if (seamSource.slice(shipped.length).trim() !== SEAM_EXPORT_LINE) return null;
  writeFileSync(path.join(seamDir, RUNTIME_FILE_NAME), seamSource, 'utf8');
  return {
    appendedBytes: seamSource.length - shipped.length,
    moduleUrl: pathToFileURL(path.join(seamDir, RUNTIME_FILE_NAME)).href,
    shippedSha256: createHash('sha256').update(shipped, 'utf8').digest('hex'),
  };
}

/**
 * Runs the atomic-replacement probe and returns { receipt }.
 *
 *   VIOLATED  — at least one replacement of a PRESENT target rewrote the same
 *               file object in place, or published at a fault window it must
 *               not have, or left a state file that no longer validates.
 *   UNMEASURED— no hit, but a precondition failed: the comparator control did
 *               not discriminate, the seam could not be built from the shipping
 *               bytes, fewer than the floor of target-present replacements ran,
 *               or the fault seam did not actually throw.
 *   HELD      — every replacement of a present target published a NEW file
 *               object and left a valid state, and both fault windows behaved.
 */
export async function runAtomicReplacementProbe({
  scratchRoot,
  replacements = ATOMIC_REPLACEMENT_MIN_REPLACEMENTS,
} = {}) {
  if (!scratchRoot || typeof scratchRoot !== 'string') {
    throw new ModelVillageCrashDrillError('scratchRoot must be a non-empty string');
  }
  if (!Number.isInteger(replacements) || replacements < 1) {
    throw new ModelVillageCrashDrillError('replacements must be a positive integer');
  }

  mkdirSync(scratchRoot, { recursive: true });
  const caseDir = path.join(scratchRoot, `atomic-replacement-${randomUUID()}`);
  const storeDir = path.join(caseDir, 'phase0b');
  mkdirSync(storeDir, { recursive: true });

  const unmeasuredReasons = [];
  const comparatorControl = runIdentityComparatorControl(path.join(caseDir, 'control'));
  if (!comparatorControl.inPlaceRewriteReadsAsSameFile) {
    unmeasuredReasons.push(
      'the identity comparator did NOT read a known in-place rewrite as the '
      + 'same file object on this host, so it cannot detect the defect this '
      + 'probe exists to detect',
    );
  }
  if (!comparatorControl.atomicReplaceReadsAsNewFile) {
    unmeasuredReasons.push(
      'the identity comparator did NOT read a known atomic rename as a new file '
      + 'object on this host, so a HELD here would not mean anything',
    );
  }

  const observed = {
    comparatorControl,
    faultAfterRenamePublished: false,
    faultAfterRenameThrew: false,
    faultBeforeRenameLeftTargetIntact: false,
    faultBeforeRenameThrew: false,
    inPlaceRewritesObserved: 0,
    postReplacementValidationFailures: 0,
    replacementsExecuted: 0,
    replacementsWithTargetPresent: 0,
    seamAppendedBytes: 0,
    seamShippedRuntimeSha256: '',
    sampleDetail: '',
  };

  try {
    const seam = buildWriteAtomicSeamTree(path.join(caseDir, 'seam'));
    if (!seam) {
      unmeasuredReasons.push(
        'the writeAtomicState anchor was not found in the shipping runtime, so '
        + 'no byte-identical export seam could be built; this probe must be '
        + 'repaired rather than skipped',
      );
    } else {
      observed.seamAppendedBytes = seam.appendedBytes;
      observed.seamShippedRuntimeSha256 = seam.shippedSha256;
      const runtime = await import(seam.moduleUrl);
      const fixture = buildValidatorFixture();
      runtime.initializePersistentStore({
        storeDir,
        trustedValidatorConfig: fixture.trustedValidatorConfig,
        validatorReceipt: fixture.validatorReceipt,
        initialWorld: fixture.initialWorld,
      });
      const target = probeStateFile(storeDir);
      let previousIdentity = fileIdentity(target);

      for (let index = 0; index < replacements; index += 1) {
        // The whole point: the target is PRESENT, which is the branch the
        // production commit path takes and the create-path probe never reaches.
        if (existsSync(target)) observed.replacementsWithTargetPresent += 1;
        const state = runtime.readPersistentState(storeDir);
        runtime.writeAtomicState(storeDir, state);
        observed.replacementsExecuted += 1;
        const identity = fileIdentity(target);
        if (identity === previousIdentity) {
          observed.inPlaceRewritesObserved += 1;
          if (!observed.sampleDetail) {
            observed.sampleDetail = boundString(
              `replacement ${index} rewrote the SAME file object (${identity}) at `
              + 'the published path instead of replacing it',
              200,
            );
          }
        }
        previousIdentity = identity;
        try {
          runtime.readPersistentState(storeDir);
        } catch (error) {
          observed.postReplacementValidationFailures += 1;
          if (!observed.sampleDetail) {
            observed.sampleDetail = boundString(
              `after replacement ${index} the state no longer validates: `
              + `${error?.name}: ${error?.message}`,
              200,
            );
          }
        }
      }

      // Fault seam, ON THE REPLACEMENT PATH (G-EXPORT called this undrivable).
      const beforeIdentity = fileIdentity(target);
      const beforeBytes = readFileSync(target, 'utf8');
      try {
        runtime.writeAtomicState(storeDir, runtime.readPersistentState(storeDir), 'before_rename');
      } catch {
        observed.faultBeforeRenameThrew = true;
      }
      observed.faultBeforeRenameLeftTargetIntact =
        existsSync(target)
        && fileIdentity(target) === beforeIdentity
        && readFileSync(target, 'utf8') === beforeBytes;

      const preAfterIdentity = fileIdentity(target);
      try {
        runtime.writeAtomicState(storeDir, runtime.readPersistentState(storeDir), 'after_rename');
      } catch {
        observed.faultAfterRenameThrew = true;
      }
      observed.faultAfterRenamePublished =
        existsSync(target) && fileIdentity(target) !== preAfterIdentity;
    }
  } catch (error) {
    unmeasuredReasons.push(boundString(
      `the probe could not complete: ${error?.name}: ${error?.message}`,
      300,
    ));
  }

  if (observed.replacementsExecuted < replacements) {
    unmeasuredReasons.push(
      `only ${observed.replacementsExecuted}/${replacements} replacements were `
      + 'executed, so there is no established record of the target-present path '
      + 'running at all',
    );
  }
  if (observed.replacementsWithTargetPresent !== observed.replacementsExecuted) {
    unmeasuredReasons.push(
      `only ${observed.replacementsWithTargetPresent}/${observed.replacementsExecuted} `
      + 'replacements ran with the target actually present, so this run did not '
      + 'exercise the replacement branch it claims to measure',
    );
  }
  if (!observed.faultBeforeRenameThrew || !observed.faultAfterRenameThrew) {
    unmeasuredReasons.push(
      'the before_rename/after_rename fault seam did not throw on the '
      + 'replacement path, so the fault windows were not driven and cannot be '
      + 'reported either way',
    );
  }

  const hits =
    observed.inPlaceRewritesObserved
    + observed.postReplacementValidationFailures
    + (observed.faultBeforeRenameThrew && !observed.faultBeforeRenameLeftTargetIntact ? 1 : 0)
    + (observed.faultAfterRenameThrew && !observed.faultAfterRenamePublished ? 1 : 0);

  let verdict;
  if (hits > 0) verdict = ATOMIC_REPLACEMENT_VERDICTS.VIOLATED;
  else if (unmeasuredReasons.length > 0) verdict = ATOMIC_REPLACEMENT_VERDICTS.UNMEASURED;
  else verdict = ATOMIC_REPLACEMENT_VERDICTS.HELD;

  const receipt = finalizeAtomicReplacementReceipt({
    at: new Date().toISOString(),
    engine: ATOMIC_REPLACEMENT_PROBE_ENGINE,
    hits,
    observed,
    property:
      'atomic state replacement on the PRODUCTION COMMIT PATH: when production '
      + 'writeAtomicState is called with the target state.json PRESENT — the '
      + 'branch model-village-phase0b-runtime.mjs:2592 takes on every committed '
      + 'action, and the branch the create-path torn-read probe can never reach '
      + '— the published path acquires a NEW file object rather than being '
      + 'rewritten in place, the state still validates afterwards, a fault '
      + 'before the rename leaves the previous file byte-identical, and a fault '
      + 'after the rename leaves the new one published. DETERMINISTIC: an '
      + 'in-place rewrite is detected on the first replacement with probability '
      + '1, so the replacement floor is an anti-vacuity count, not a sample '
      + 'size. MECHANISM: production is not edited; the seam is a byte-identical '
      + 'copy of the shipping runtime with exactly one appended line, '
      + `'${SEAM_EXPORT_LINE}', and the shipping file's sha256 and the appended `
      + 'byte count are both recorded here. NOT COVERED: an implementation that '
      + 'unlinks the target before renaming also acquires a new file object, so '
      + 'it reads as atomic here while leaving a window in which state.json does '
      + 'not exist at all (gap G-VANISH, executed as a test, NOT closed).',
    replacementFloor: replacements,
    schema: ATOMIC_REPLACEMENT_PROBE_SCHEMA,
    unmeasuredReasons: unmeasuredReasons.map((reason) => boundString(reason, 300)),
    verdict,
  });

  try {
    rmSync(caseDir, { recursive: true, force: true });
  } catch {
    /* best-effort scratch cleanup */
  }
  return { receipt };
}

const ATOMIC_REPLACEMENT_RECEIPT_KEYS = Object.freeze([
  'at',
  'engine',
  'hits',
  'observed',
  'property',
  'replacementFloor',
  'schema',
  'unmeasuredReasons',
  'verdict',
]);

const ATOMIC_REPLACEMENT_OBSERVED_KEYS = Object.freeze([
  'comparatorControl',
  'faultAfterRenamePublished',
  'faultAfterRenameThrew',
  'faultBeforeRenameLeftTargetIntact',
  'faultBeforeRenameThrew',
  'inPlaceRewritesObserved',
  'postReplacementValidationFailures',
  'replacementsExecuted',
  'replacementsWithTargetPresent',
  'sampleDetail',
  'seamAppendedBytes',
  'seamShippedRuntimeSha256',
]);

const ATOMIC_REPLACEMENT_CONTROL_KEYS = Object.freeze([
  'atomicReplaceReadsAsNewFile',
  'inPlaceRewriteReadsAsSameFile',
]);

function finalizeAtomicReplacementReceipt(fields) {
  const receipt = {};
  for (const key of ATOMIC_REPLACEMENT_RECEIPT_KEYS) receipt[key] = fields[key];
  receipt.receiptHash = canonicalDigest(receipt);
  return Object.freeze(receipt);
}

/**
 * Validates an atomic-replacement receipt AND re-derives its hit count and
 * verdict from its own counters, exactly like verifyTornReadProbeReceipt. A
 * HELD receipt must additionally satisfy the MODULE's floor, not the caller's,
 * so a caller who asked for one replacement cannot mint a cheaper HELD.
 */
export function verifyAtomicReplacementProbeReceipt(receipt) {
  assertProbeKeys(
    receipt,
    [...ATOMIC_REPLACEMENT_RECEIPT_KEYS, 'receiptHash'],
    'atomic-replacement receipt',
  );
  if (receipt.schema !== ATOMIC_REPLACEMENT_PROBE_SCHEMA) {
    throw new ModelVillageCrashDrillError('atomic-replacement receipt schema mismatch');
  }
  if (receipt.engine !== ATOMIC_REPLACEMENT_PROBE_ENGINE) {
    throw new ModelVillageCrashDrillError('atomic-replacement receipt engine mismatch');
  }
  if (!ISO_UTC_PATTERN.test(receipt.at)) {
    throw new ModelVillageCrashDrillError('atomic-replacement receipt at must be ISO-8601 UTC');
  }
  if (typeof receipt.property !== 'string' || receipt.property.length === 0) {
    throw new ModelVillageCrashDrillError('atomic-replacement property must be a non-empty string');
  }
  if (!Object.values(ATOMIC_REPLACEMENT_VERDICTS).includes(receipt.verdict)) {
    throw new ModelVillageCrashDrillError(
      `unknown atomic-replacement verdict ${receipt.verdict}`,
    );
  }
  if (!Array.isArray(receipt.unmeasuredReasons)) {
    throw new ModelVillageCrashDrillError('unmeasuredReasons must be an array');
  }
  if (!Number.isInteger(receipt.replacementFloor) || receipt.replacementFloor < 1) {
    throw new ModelVillageCrashDrillError('replacementFloor must be a positive integer');
  }
  assertProbeKeys(
    receipt.observed,
    ATOMIC_REPLACEMENT_OBSERVED_KEYS,
    'atomic-replacement observed',
  );
  assertProbeKeys(
    receipt.observed.comparatorControl,
    ATOMIC_REPLACEMENT_CONTROL_KEYS,
    'atomic-replacement observed.comparatorControl',
  );
  for (const key of ATOMIC_REPLACEMENT_CONTROL_KEYS) {
    if (typeof receipt.observed.comparatorControl[key] !== 'boolean') {
      throw new ModelVillageCrashDrillError(
        `observed.comparatorControl.${key} must be boolean`,
      );
    }
  }
  for (const key of [
    'faultAfterRenamePublished',
    'faultAfterRenameThrew',
    'faultBeforeRenameLeftTargetIntact',
    'faultBeforeRenameThrew',
  ]) {
    if (typeof receipt.observed[key] !== 'boolean') {
      throw new ModelVillageCrashDrillError(`observed.${key} must be boolean`);
    }
  }
  for (const key of [
    'inPlaceRewritesObserved',
    'postReplacementValidationFailures',
    'replacementsExecuted',
    'replacementsWithTargetPresent',
    'seamAppendedBytes',
  ]) {
    if (!Number.isInteger(receipt.observed[key]) || receipt.observed[key] < 0) {
      throw new ModelVillageCrashDrillError(
        `observed.${key} must be a non-negative integer`,
      );
    }
  }
  if (receipt.observed.replacementsWithTargetPresent > receipt.observed.replacementsExecuted) {
    throw new ModelVillageCrashDrillError(
      'observed.replacementsWithTargetPresent exceeds observed.replacementsExecuted',
    );
  }
  if (receipt.observed.inPlaceRewritesObserved > receipt.observed.replacementsExecuted) {
    throw new ModelVillageCrashDrillError(
      'observed.inPlaceRewritesObserved exceeds observed.replacementsExecuted',
    );
  }

  const o = receipt.observed;
  const expectedHits =
    o.inPlaceRewritesObserved
    + o.postReplacementValidationFailures
    + (o.faultBeforeRenameThrew && !o.faultBeforeRenameLeftTargetIntact ? 1 : 0)
    + (o.faultAfterRenameThrew && !o.faultAfterRenamePublished ? 1 : 0);
  if (receipt.hits !== expectedHits) {
    throw new ModelVillageCrashDrillError(
      `atomic-replacement hits ${receipt.hits} does not equal the observed defect `
      + `count ${expectedHits}`,
    );
  }

  let expectedVerdict;
  if (expectedHits > 0) expectedVerdict = ATOMIC_REPLACEMENT_VERDICTS.VIOLATED;
  else if (receipt.unmeasuredReasons.length > 0) {
    expectedVerdict = ATOMIC_REPLACEMENT_VERDICTS.UNMEASURED;
  } else expectedVerdict = ATOMIC_REPLACEMENT_VERDICTS.HELD;
  if (receipt.verdict !== expectedVerdict) {
    throw new ModelVillageCrashDrillError(
      `atomic-replacement verdict ${receipt.verdict} disagrees with its own `
      + `observations (${expectedVerdict})`,
    );
  }

  if (receipt.verdict === ATOMIC_REPLACEMENT_VERDICTS.HELD) {
    if (
      o.comparatorControl.inPlaceRewriteReadsAsSameFile !== true
      || o.comparatorControl.atomicReplaceReadsAsNewFile !== true
      // The floor is the MODULE's, not the caller's.
      || receipt.replacementFloor < ATOMIC_REPLACEMENT_MIN_REPLACEMENTS
      || o.replacementsExecuted < receipt.replacementFloor
      || o.replacementsWithTargetPresent !== o.replacementsExecuted
      || o.faultBeforeRenameThrew !== true
      || o.faultAfterRenameThrew !== true
      || o.faultBeforeRenameLeftTargetIntact !== true
      || o.faultAfterRenamePublished !== true
      || !SHA256_PATTERN.test(o.seamShippedRuntimeSha256)
      || o.seamAppendedBytes < 1
    ) {
      throw new ModelVillageCrashDrillError(
        'atomic-replacement receipt claims HELD without meeting every '
        + 'measurement precondition (comparator control discriminated, '
        + 'replacements >= the module floor and all with the target present, '
        + 'both fault windows driven and behaving, seam built from recorded '
        + 'shipping bytes)',
      );
    }
  }

  const { receiptHash, ...rest } = receipt;
  if (canonicalDigest(rest) !== receiptHash) {
    throw new ModelVillageCrashDrillError(
      'atomic-replacement receiptHash mismatch (receipt was altered)',
    );
  }
  return true;
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

// ---------------------------------------------------------------------------
// Probe child entrypoint.
//
// The torn-read probe's writer/reader/inspect children are THIS module, re-run
// as a script. They live here rather than in model-village-crash-worker.mjs so
// the probe's children and its power derivation cannot drift apart, and so the
// classification of a read (the thing the whole gate turns on) exists exactly
// once. Importing this module never triggers it: the guard requires that the
// process was started with this file as its entry script.
// ---------------------------------------------------------------------------

const CRASH_DRILL_INVOKED_PATH = process.argv[1];
if (
  CRASH_DRILL_INVOKED_PATH
  && pathToFileURL(CRASH_DRILL_INVOKED_PATH).href === import.meta.url
) {
  runProbeChild(process.argv.slice(2));
}
