#!/usr/bin/env node
/* global Buffer, console, process */

/**
 * Model Village MV-B5 durability slice INTEGRATION CHECK — the drop-in proof
 * for the file-state fault boundary.
 *
 * Closes the spec gate rows (docs/specs/HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md):
 *   - row 578 "Atomic admission", REMAINING: "Full production policy receipts,
 *     multi-process CAS, and distributed locking."
 *   - row 581 "File-state fault boundary", REMAINING: "Process-crash durability
 *     testing, multi-process recovery, and fleet durability." The spec's own
 *     claim at 581 — "A fresh Node process rereads the validated state.
 *     Process-level exceptions immediately before/after rename expose the old or
 *     complete file state." — is turned by this slice into an EXECUTED,
 *     RECEIPTED drill instead of a prose assertion.
 *
 * WHAT THIS CHECKER RUNS (it does not assert these — it executes them):
 *   1. CRASH DRILLS — every crash scenario the harness knows, ONCE each (not
 *      swept). Each spawns a REAL child process that performs a production
 *      sealed-store / persistent-state operation (or deterministically
 *      establishes the exact on-disk state an un-catchable sub-syscall crash
 *      window would produce), is really SIGKILLed, and is recovered in a
 *      genuinely FRESH Node process using only production recovery code. The
 *      full scenario set is run because each scenario maps to a distinct
 *      durability invariant, including the two that were once the known gap
 *      scenarios (G1, G2) and now assert their positive invariants.
 *   2. CONTENTION DRILL — N real child processes race the SAME sealed custody
 *      store and the SAME phase0b persistence store; the exclusive locks
 *      serialize them, the final access-log chain is linear/monotonic, and a
 *      non-vacuity control confirms an unsynchronized fork IS flagged.
 *   3. AUDIT-OPEN DRILL — a preserved sealed custody copy is re-verified
 *      read-only, without acquiring the lock and without appending an
 *      access-log entry (byte-identical log, no lock file created).
 *
 * HONESTY, PINNED: `allInvariantsHeld` reflects REALITY, computed from the
 * embedded receipts — it is never forced true to keep the check green, and any
 * crash drill that receipts invariantHeld:false must surface as an executed gap
 * (a hidden gap is a hard failure). The two HIGH-severity gaps this slice
 * originally receipted as invariantHeld:false, G1 (destroyContentKey was not
 * crash-atomic) and G2 (phase0b leaked state.lock forever), have since been
 * FIXED in their owning lanes; their drills now assert the positive invariants
 * and this check FAILS the moment either regresses. The CHECK passes when every
 * scenario matches the harness's DOCUMENTED expectation and fails the moment
 * durability REGRESSES from that documentation.
 *
 * CLAIM BOUNDARY (HARD): proves SINGLE-HOST process-crash durability and
 * SAME-HOST multi-process contention only. Does NOT claim production/fleet
 * deployment, distributed (multi-host) consensus, or durability against media
 * failure / an OS that lies about fsync / power loss. fsync is TRUSTED, not
 * proven; no directory fsync exists in either store (G6), so a completed
 * rename/create/unlink can revert across true power loss on some filesystems
 * (consistency-safe, never a torn read; not power-loss-durable). Receipts carry
 * hashes, exit codes, and bounded outcomes only — never key material, never raw
 * model text, never a sovereign route.
 *
 * NEW FILE — reuses, never reimplements, the MV-B5 peer drills and the MV-B1..B4
 * production scripts. No production script is edited by this slice.
 */

import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  auditOpenCustodyStore,
  AUDIT_OPEN_SCHEMA,
  verifyAuditOpenResult,
} from './model-village-audit-open.mjs';
import {
  CONTENTION_DRILL_SCHEMA,
  runContentionDrill,
  verifyContentionDrillReceipt,
} from './model-village-contention-drill.mjs';
import {
  CRASH_DRILL_SCENARIO_EXPECTATIONS,
  CRASH_DRILL_SCENARIOS,
  runCrashDrill,
  verifyCrashDrillReceipt,
} from './model-village-crash-drill.mjs';
import { createSealedCustodyStore } from './model-village-custody-store.mjs';
import { canonicalDigest, canonicalJson } from './model-village-phase0b-runtime.mjs';

export const DURABILITY_RECEIPT_SCHEMA = 'hololand.model-village-durability.v1';

const DEFAULT_OUTPUT = '.tmp/hololand/model-village/durability-receipt.json';
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const RECEIPT_KEYS = Object.freeze([
  'allInvariantsHeld',
  'auditOpenDrill',
  'claimBoundary',
  'contentionDrill',
  'crashDrills',
  'gapsObserved',
  'generatedAt',
  'receiptHash',
  'schema',
]);

/**
 * Flags this slice must NEVER claim (pinned, asserted key-for-key by verify).
 * fsyncHonestyAssumed is TRUE on purpose: we trust the OS's fsync, we do not
 * prove the disk did not lie.
 */
const PINNED_CLAIM_BOUNDARY = Object.freeze({
  fleetOrMultiHostConsensusClaimed: false,
  fsyncHonestyAssumed: true,
  mediaFailureDurabilityClaimed: false,
  productionDeploymentClaimed: false,
});

/**
 * Static catalog of every durability gap the MV-B5 builders reported that is
 * still OPEN, keyed by reference. All remaining entries are DOCUMENTED by
 * source read (none is surfaced by an executed crash drill), and each carries a
 * file:line and the minimal fix for the OWNING lane. The catalog stays wired to
 * the executed drills: if a fixed gap ever regresses, its drill receipts
 * invariantHeld:false and assembleGaps demands a catalog entry that no longer
 * exists — the check fails loudly rather than quietly re-listing it.
 *
 * BOTH HIGH-severity gaps are now FIXED and therefore no longer catalogued:
 *   - G1 (destroyContentKey was not crash-atomic): the durable commit record is
 *     the HASH-CHAINED 'destroy-key' access-log entry and it is appended FIRST,
 *     before any key byte is touched; openSealedCustodyStore rolls a
 *     committed-but-interrupted destruction forward instead of wedging, and
 *     refuses to destroy a live key on the strength of an unauthenticated
 *     tombstone line that no chain entry corroborates.
 *   - G2 (phase0b leaked state.lock forever): withStoreLock now takes a
 *     pid-stamped lock mirroring the sealed custody store, breaking a stale
 *     lock exactly once when its recorded pid is proven dead and failing closed
 *     when the holder cannot be identified. The break is IDENTITY-bound (it
 *     proves it moved the exact bytes it inspected) and is the same shared
 *     primitive both custody-bearing locks use, so N contenders racing one
 *     stale lock still produce exactly ONE winner.
 * Their drill scenarios (custody-destroy-key-killed-mid-destroy,
 * custody-destroy-key-killed-before-key-scrub, custody-tombstone-torn-append,
 * persistent-state-lock-leak-after-kill) now expect invariantHeld:true and FAIL
 * this check if either fix regresses — including the ORDERING half of G1, which
 * the completion-then-restore case structurally cannot detect.
 */
const GAP_CATALOG = Object.freeze({
  'G-EXPORT': {
    severity: 'MEDIUM',
    file: 'scripts/model-village-phase0b-runtime.mjs:1546-2564',
    summary:
      'Durability-VERIFICATION gap (not a runtime defect), NARROWED: the '
      + 'persistence lock seam is now exported (acquire/releasePersistentStore'
      + 'Lock), so the lock-leak drill holds a REAL production lock and is '
      + 'killed holding it. Still module-private: writeAtomicState, '
      + 'withStoreLock, the three commit* functions and '
      + 'readPersistentStateHashInFreshProcess — so a consumer still cannot '
      + 'drive the deterministic before_rename/after_rename fault seam; the '
      + 'synchronous temp->fsync->rename window cannot be split by an external '
      + 'SIGKILL, so the drill models the pre-rename disk state and recovers '
      + 'with production code.',
    minimalFix:
      'Export a thin test-only fault-injection seam (e.g. '
      + 'export { commitVerifiedAttemptFromSourceRun }) so a crash drill can '
      + 'drive before_rename/after_rename against an arbitrary commit '
      + 'deterministically.',
    owner: 'phase0b-runtime lane',
  },
  G6: {
    severity: 'LOW',
    file: 'scripts/model-village-phase0b-runtime.mjs:1561',
    summary:
      'No directory fsync anywhere: writeAtomicState rename and every custody '
      + 'writeFileDurable/appendLineDurable (custody-store.mjs:331-353) fsync '
      + 'the file but never the parent directory, so a completed '
      + 'rename/create/unlink can revert across true power loss on some '
      + 'filesystems (consistency-safe: never a torn read; not '
      + 'power-loss-durable). Out of this slice claim scope.',
    minimalFix:
      'If power-loss durability is ever claimed: openSync the parent dir and '
      + 'fsyncSync it after each rename/create/unlink.',
    owner: 'phase0b-runtime + custody-store lanes',
  },
  'G4-G5': {
    severity: 'LOW',
    file: 'scripts/model-village-custody-store.mjs:412-415,930',
    summary:
      'Fail-loud-by-design, consistency-safe states (not silent corruption): a '
      + 'partial seal leaves an orphan .enc that verifyIntegrity flags and the '
      + 'duplicate guard blocks re-sealing; a torn ACCESS-LOG tail wedges open '
      + 'via readJsonlEntries JSON.parse with no auto-truncate. Recovery is '
      + 'manual. NARROWED: the torn TOMBSTONE tail no longer belongs to this '
      + 'class — an unterminated tombstone line was never a durable record, so '
      + 'open repairs it and re-emits the tombstone from the committed chain '
      + 'entry (drill: custody-tombstone-torn-append). The access log keeps the '
      + 'opposite behaviour on purpose: it is the authenticated record, so a '
      + 'torn tail there is evidence, not residue.',
    minimalFix:
      'No production change recommended beyond an optional operator repair '
      + 'tool; both remaining states already fail loud rather than corrupt '
      + 'silently.',
    owner: 'MV-B1 custody-store lane',
  },
  'G-LOCKBREAK': {
    severity: 'LOW',
    file: 'scripts/model-village-phase0b-runtime.mjs:1631-2093',
    summary:
      'Residual, NARROWED TWICE. This entry previously called the window '
      + '"not executed, not reproduced" and cited 12/12 clean trials. Both '
      + 'claims were wrong, and how they were wrong is the lesson: the '
      + 'measurement was under-powered (6 trials/run against a ~6.7% per-trial '
      + 'defect = 34% detection), so a green run meant almost nothing. The race '
      + 'WAS then reproduced — two simultaneous live holders on the 70th 8-way '
      + 'trial, with the winner rows showing the exact predicted fingerprint (a '
      + "winner whose recordedPid is a DIFFERENT winner's pid). Cause: the "
      + 'read-then-rename pair is two syscalls, so a preempted contender moved a '
      + "WINNER's fresh lock aside and a third contender's ordinary exclusive "
      + 'create then succeeded on the momentarily free path. The break is now '
      + 'SERIALIZED behind an exclusive break token, with the identity-bound '
      + 'move-aside kept as the inner detector — and BOTH layers are '
      + "load-bearing: the token cannot close the window (its own reclaim can't "
      + 'be tokenized without infinite regress), so what actually holds under a '
      + 'stalled or pid-recycled token holder is the post-rename byte check '
      + 'failing the displaced breaker closed. Measured after the fix: 0 '
      + 'double-acquires in 160 racing trials plus 65 trials engineered to force '
      + 'two processes into the break section simultaneously. The racing test is '
      + 'now 40 trials/run (94% detection) precisely because the old 6 were not '
      + 'a guard.',
    minimalFix:
      'Three residuals remain and are documented at the function: (1) a process '
      + 'that dies or STALLS mid-break blocks breaking until its token floor '
      + 'expires (2s proven-dead / 30s unidentified / 60s live-pid) — a bounded '
      + 'delay, never an outage, because the token gates breaking and never '
      + 'acquiring; (2) the token reclaim is the one unserialized sequence left, '
      + 'and is what the inner identity check exists to catch; (3) a '
      + 'future-stamped token under backwards clock skew never ages out, repaired '
      + 'by removing the named file. An OS-backed advisory lock (flock / '
      + "LockFileEx) would remove the window entirely; node's builtin fs exposes "
      + 'neither, so it would need a native addon or an out-of-process lock '
      + 'service — out of scope for a node-builtins-only lane.',
    owner: 'phase0b-runtime + custody-store lanes',
  },
});

/** Documented-only references (not surfaced by an executed crash drill). */
const DOCUMENTED_GAP_REFS = Object.freeze([
  'G-EXPORT',
  'G-LOCKBREAK',
  'G6',
  'G4-G5',
]);

const CLAIM_BOUNDARY_OBSERVED = Object.freeze([
  'single-host process-crash durability: for each scenario a REAL child process '
  + 'is SIGKILLed mid-operation (or at the exact modeled crash window) and the '
  + 'store is recovered in a genuinely FRESH Node process using only production '
  + 'recovery code (openSealedCustodyStore, verifyIntegrity, readObject, '
  + 'readPersistentState, validatePersistentState)',
  'same-host multi-process lock serialization: N real child processes race the '
  + 'SAME sealed custody store and the SAME phase0b persistence store; the '
  + 'exclusive locks serialize them and the final access-log chain is '
  + 'linear/monotonic under contention, with a non-vacuity control confirming an '
  + 'unsynchronized fork is flagged',
  'read-only audit-open of a preserved custody copy: the on-disk sealed store is '
  + 're-verified without acquiring the lock and without appending an access-log '
  + 'entry (byte-identical log, unchanged mtime, no lock file created)',
  'both previously receipted HIGH-severity durability gaps are FIXED, and their '
  + 'drills now execute the POSITIVE invariants: a key destruction crashed '
  + 'after its commit point (the hash-chained destroy-key entry) is rolled '
  + 'forward at open (the key is never resurrected, verifyIntegrity passes in '
  + 'ciphertext-checksum-only mode), and a state.lock genuinely leaked by a '
  + 'SIGKILLed holder is reclaimed exactly once after its recorded pid is '
  + 'proven dead',
  'the ORDERING half of G1 is executed, not assumed: the real production '
  + 'destroyContentKey is interrupted AT the key scrub by a real filesystem '
  + 'fault, so the drill goes red if the commit record ever moves back behind '
  + 'the first key byte — the window that the completion-then-restore case is '
  + 'structurally blind to',
  'a torn tombstone append is repaired rather than fatal (the tombstone is '
  + 're-emitted verbatim from the committed chain entry) while a torn '
  + 'access-log tail still fails closed — the authenticated record and the '
  + 'unauthenticated one are treated differently on purpose',
]);

const CLAIM_BOUNDARY_NOT_OBSERVED = Object.freeze([
  'no fleet or multi-host distributed consensus: every process is on THIS host',
  'no durability against media failure or an OS that lies about fsync: fsync is '
  + 'trusted, not proven — no directory fsync exists in either store (G6), so a '
  + 'completed rename/create/unlink can revert across true power loss on some '
  + 'filesystems',
  'no production or fleet deployment: this is an engineering durability drill '
  + 'under os.tmpdir scratch, not a deployed store',
  'the synchronous temp->fsync->rename window and the sub-syscall '
  + 'tombstone/key-scrub/log-append windows cannot be split by an external '
  + 'SIGKILL and still expose no consumer-drivable fault seam (G-EXPORT, now '
  + 'narrowed: the persistence lock seam IS exported, so the lock-leak drill is '
  + 'a genuine leak of a real production lock); the remaining windows are '
  + 'modeled with production code plus real file ops and recovered with '
  + 'production code, and each such receipt states its mechanism in '
  + 'observedOutcome',
  'no proof of PERFECT lock mutual exclusion: the stale-lock break is '
  + 'identity-bound and measured at exactly one winner per race, but it is '
  + 'built from separate read/rename syscalls, so a two-syscall residual window '
  + 'remains (G-LOCKBREAK). Removing it needs an OS-backed advisory lock, which '
  + 'node builtins do not expose',
]);

export class DurabilityCheckError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DurabilityCheckError';
  }
}

function fail(message) {
  throw new DurabilityCheckError(message);
}

function assertExactKeys(value, expectedKeys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    const missing = expected.filter((key) => !actual.includes(key));
    const unexpected = actual.filter((key) => !expected.includes(key));
    fail(
      `${label} keys differ; missing=${canonicalJson(missing)} `
      + `unexpected=${canonicalJson(unexpected)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// The audit-open drill: seal a real store, then re-verify it read-only and
// prove the audit mutated nothing (no append, no lock, unchanged mtime).
// ---------------------------------------------------------------------------

function runAuditOpenDrill(scratchRoot) {
  const caseDir = path.join(scratchRoot, `audit-open-${randomUUID()}`);
  const rootDir = path.join(caseDir, 'custody');
  mkdirSync(caseDir, { recursive: true });
  try {
    const store = createSealedCustodyStore({
      operator: 'mv-b5-durability-audit-open',
      retentionPolicy: {
        description:
          'MV-B5 durability checker audit-open preserved copy; frozen before '
          + 'any live run per the sealed-store spec requirement.',
        frozenAt: new Date().toISOString(),
        policyId: 'mv-b5-durability-audit-open-v1',
      },
      rootDir,
      runLabel: 'mv-b5-durability-audit-open',
    });
    store.sealObject({
      bytes: Buffer.from('mv-b5-durability-audit-open-object', 'utf8'),
      kind: 'raw-model-response',
      label: 'durability-audit-obj-01',
    });
    store.sealObject({
      kind: 'structured-fixture',
      label: 'durability-audit-obj-02',
      value: { alpha: 1, nested: { deep: true } },
    });
    store.close();

    const logPath = path.join(rootDir, 'access-log.jsonl');
    const lockPath = path.join(rootDir, 'store.lock');
    const bytesBefore = readFileSync(logPath, 'utf8');
    const mtimeBefore = statSync(logPath).mtimeMs;
    const lockBefore = existsSync(lockPath);

    const result = auditOpenCustodyStore({ rootDir });
    verifyAuditOpenResult(result);
    // A second audit proves the operation is a pure function of on-disk state.
    const again = auditOpenCustodyStore({ rootDir });

    const bytesAfter = readFileSync(logPath, 'utf8');
    const mtimeAfter = statSync(logPath).mtimeMs;
    const lockAfter = existsSync(lockPath);

    const appendedNothing = bytesAfter === bytesBefore;
    const mtimeUnchanged = mtimeAfter === mtimeBefore;
    const createdNoLock = lockBefore === false && lockAfter === false;
    const stableTail = again.accessLogTailHash === result.accessLogTailHash;

    return {
      drill: {
        schema: result.schema,
        ok: result.ok === true,
        mode: result.mode,
        accessLogLength: result.accessLogLength,
        accessLogTailHash: result.accessLogTailHash,
        appendedNothing,
        createdNoLock,
        mtimeUnchanged,
        reVerificationStable: stableTail,
        checkNames: result.checks.map((check) => check.name),
      },
      failures: [
        result.ok === true ? null : `audit-open reported a failing sealed store: ${canonicalJson(
          result.checks.filter((c) => !c.ok).map((c) => c.detail),
        )}`,
        appendedNothing ? null : 'audit-open appended to the access log (must be read-only)',
        createdNoLock ? null : 'audit-open created or left a lock file (must not acquire the lock)',
        mtimeUnchanged ? null : 'audit-open rewrote the access log (mtime changed)',
        stableTail ? null : 'audit-open is not a pure function of on-disk state (tail hash drifted)',
      ].filter((entry) => entry !== null),
    };
  } finally {
    try {
      rmSync(caseDir, { recursive: true, force: true });
    } catch {
      /* best-effort scratch cleanup */
    }
  }
}

// ---------------------------------------------------------------------------
// Gap assembly.
// ---------------------------------------------------------------------------

function gapEntry(ref, executed, scenario) {
  const catalog = GAP_CATALOG[ref];
  if (!catalog) fail(`no catalog entry for gap ${ref}`);
  return {
    ref,
    severity: catalog.severity,
    executed,
    scenario: scenario ?? null,
    summary: catalog.summary,
    file: catalog.file,
    minimalFix: catalog.minimalFix,
    owner: catalog.owner,
  };
}

/**
 * Builds gapsObserved from the executed crash receipts (any invariantHeld:false
 * becomes an executed:true gap keyed by its gapReference) merged with the
 * documented-only catalog entries. Deterministically ordered by ref for stable
 * hashing.
 */
function assembleGaps(crashReceipts) {
  const gaps = [];
  const seen = new Set();
  for (const receipt of crashReceipts) {
    if (receipt.invariantHeld === false) {
      const ref = receipt.gapReference;
      if (!ref) fail(`crash drill ${receipt.scenario} reported a gap with no gapReference`);
      gaps.push(gapEntry(ref, true, receipt.scenario));
      seen.add(ref);
    }
  }
  for (const ref of DOCUMENTED_GAP_REFS) {
    if (!seen.has(ref)) gaps.push(gapEntry(ref, false, null));
  }
  return gaps.sort((a, b) => a.ref.localeCompare(b.ref));
}

// ---------------------------------------------------------------------------
// The drill.
// ---------------------------------------------------------------------------

export async function runDurabilityDrill({
  storeRoot = null,
  output = DEFAULT_OUTPUT,
  root = process.cwd(),
  contentionWorkerCount = 4,
  contentionOpsPerWorker = 2,
} = {}) {
  const resolvedRoot = path.resolve(root);
  const scratchRoot = storeRoot
    ? path.resolve(storeRoot)
    : path.join(os.tmpdir(), `mv-b5-durability-${process.pid}-${randomUUID()}`);
  mkdirSync(scratchRoot, { recursive: true });

  const failures = [];
  const crashDrills = [];
  let contentionReceipt = null;
  let auditOpen = null;
  let receipt = null;
  let resolvedOutput = null;

  try {
    // (1) CRASH DRILLS — every scenario ONCE (not swept).
    for (const scenario of CRASH_DRILL_SCENARIOS) {
      const { receipt: crashReceipt } = await runCrashDrill({
        scratchRoot: path.join(scratchRoot, 'crash'),
        scenario,
      });
      try {
        verifyCrashDrillReceipt(crashReceipt);
      } catch (error) {
        failures.push(`crash drill ${scenario} produced an unverifiable receipt: ${error.message}`);
      }
      const expected = CRASH_DRILL_SCENARIO_EXPECTATIONS[scenario];
      if (crashReceipt.invariantHeld !== expected) {
        failures.push(
          `crash drill ${scenario} REGRESSED from its documented expectation: `
          + `invariantHeld=${crashReceipt.invariantHeld}, expected ${expected} `
          + `(observed: ${crashReceipt.observedOutcome})`,
        );
      }
      // A fresh-process recovery is the load-bearing property; a pid collision
      // would mean recovery ran in the same process it was proving crashed.
      if (crashReceipt.recoveredInFreshProcess !== true) {
        failures.push(`crash drill ${scenario} did not recover in a fresh process`);
      }
      crashDrills.push(crashReceipt);
    }

    // (2) CONTENTION DRILL — one config, not swept. runContentionDrill goes
    // straight to mkdtempSync under this root, so the directory must pre-exist.
    const contentionScratch = path.join(scratchRoot, 'contention');
    mkdirSync(contentionScratch, { recursive: true });
    const contention = await runContentionDrill({
      scratchRoot: contentionScratch,
      operator: 'mv-b5-durability-contention',
      workerCount: contentionWorkerCount,
      opsPerWorker: contentionOpsPerWorker,
    });
    contentionReceipt = contention.receipt;
    try {
      verifyContentionDrillReceipt(contentionReceipt);
    } catch (error) {
      failures.push(`contention drill produced an unverifiable receipt: ${error.message}`);
    }
    if (contentionReceipt.finalChainLinear !== true) {
      failures.push('contention drill did not serialize custody writers into a linear chain');
    }
    if (contentionReceipt.persistenceStoreLock?.serialized !== true) {
      failures.push('contention drill did not serialize phase0b persistence initialization');
    }
    if (contentionReceipt.nonVacuityControl?.flaggedByChainCheck !== true) {
      failures.push('contention drill non-vacuity control did not flag the injected fork');
    }

    // (3) AUDIT-OPEN DRILL.
    const auditResult = runAuditOpenDrill(scratchRoot);
    auditOpen = auditResult.drill;
    for (const message of auditResult.failures) failures.push(`audit-open drill: ${message}`);

    // Reality, not expectation: allInvariantsHeld is false while any executed
    // gap stands. It is NEVER forced true to keep the check green.
    const gapsObserved = assembleGaps(crashDrills);
    const executedGapPresent = crashDrills.some((drill) => drill.invariantHeld === false);
    const happyPathsHeld = crashDrills
      .filter((drill) => CRASH_DRILL_SCENARIO_EXPECTATIONS[drill.scenario] === true)
      .every((drill) => drill.invariantHeld === true);
    const contentionOk = contentionReceipt.finalChainLinear === true
      && contentionReceipt.persistenceStoreLock?.serialized === true;
    const auditOk = auditOpen.ok === true
      && auditOpen.appendedNothing === true
      && auditOpen.createdNoLock === true;
    const allInvariantsHeld = happyPathsHeld && contentionOk && auditOk && !executedGapPresent;

    const unsigned = {
      allInvariantsHeld,
      auditOpenDrill: auditOpen,
      claimBoundary: {
        ...PINNED_CLAIM_BOUNDARY,
        notObserved: [...CLAIM_BOUNDARY_NOT_OBSERVED],
        observed: [...CLAIM_BOUNDARY_OBSERVED],
      },
      contentionDrill: contentionReceipt,
      crashDrills,
      gapsObserved,
      generatedAt: new Date().toISOString(),
      schema: DURABILITY_RECEIPT_SCHEMA,
    };
    receipt = { ...unsigned, receiptHash: canonicalDigest(unsigned) };

    resolvedOutput = path.resolve(resolvedRoot, output);
    mkdirSync(path.dirname(resolvedOutput), { recursive: true });
    writeFileSync(resolvedOutput, `${JSON.stringify(receipt, null, 2)}\n`);

    const selfVerification = verifyDurabilityReceipt(receipt);
    if (!selfVerification.ok) {
      failures.push(`emitted receipt failed self-verification: ${selfVerification.failureReason}`);
    }
  } finally {
    try {
      rmSync(scratchRoot, { recursive: true, force: true });
    } catch {
      /* best-effort scratch cleanup */
    }
  }

  if (failures.length > 0) {
    throw new DurabilityCheckError(
      `Model Village MV-B5 durability drill failed: ${failures.join('; ')}`
      + (resolvedOutput ? `. Receipt: ${resolvedOutput}` : ''),
    );
  }

  return { output: resolvedOutput, receipt, scratchRoot };
}

// ---------------------------------------------------------------------------
// Receipt verification.
//
// LIMIT, stated plainly: this is closed-key SELF-CONSISTENCY over receipts that
// are themselves the product of executed drills. It re-runs no drill; it proves
// the emitted receipt's own claims are internally coherent, that every embedded
// crash/contention receipt self-verifies, that every executed gap is surfaced,
// and that allInvariantsHeld equals the reality the embedded receipts describe.
// ---------------------------------------------------------------------------

export function verifyDurabilityReceipt(receipt) {
  try {
    assertExactKeys(receipt, RECEIPT_KEYS, 'durability receipt');
    if (receipt.schema !== DURABILITY_RECEIPT_SCHEMA) {
      fail(`receipt schema must be '${DURABILITY_RECEIPT_SCHEMA}'`);
    }
    if (typeof receipt.generatedAt !== 'string' || Number.isNaN(Date.parse(receipt.generatedAt))) {
      fail('receipt.generatedAt must be a parseable timestamp');
    }
    if (typeof receipt.allInvariantsHeld !== 'boolean') {
      fail('receipt.allInvariantsHeld must be a boolean');
    }

    // --- Crash drills: every embedded receipt self-verifies and matches the
    //     harness's documented expectation for its scenario. ---
    if (!Array.isArray(receipt.crashDrills) || receipt.crashDrills.length === 0) {
      fail('receipt.crashDrills must be a non-empty array');
    }
    const seenScenarios = new Set();
    for (const [index, drill] of receipt.crashDrills.entries()) {
      try {
        verifyCrashDrillReceipt(drill);
      } catch (error) {
        fail(`receipt.crashDrills[${index}] failed crash-drill verification: ${error.message}`);
      }
      if (!(drill.scenario in CRASH_DRILL_SCENARIO_EXPECTATIONS)) {
        fail(`receipt.crashDrills[${index}] has an unknown scenario '${drill.scenario}'`);
      }
      if (seenScenarios.has(drill.scenario)) {
        fail(`receipt.crashDrills has a duplicate scenario '${drill.scenario}' (scenarios run once)`);
      }
      seenScenarios.add(drill.scenario);
      if (drill.invariantHeld !== CRASH_DRILL_SCENARIO_EXPECTATIONS[drill.scenario]) {
        fail(
          `receipt.crashDrills[${index}] (${drill.scenario}) invariantHeld `
          + `${drill.invariantHeld} disagrees with the documented expectation `
          + `${CRASH_DRILL_SCENARIO_EXPECTATIONS[drill.scenario]}`,
        );
      }
      if (drill.recoveredInFreshProcess !== true) {
        fail(`receipt.crashDrills[${index}] (${drill.scenario}) did not recover in a fresh process`);
      }
    }

    // --- Contention drill. ---
    try {
      verifyContentionDrillReceipt(receipt.contentionDrill);
    } catch (error) {
      fail(`receipt.contentionDrill failed contention-drill verification: ${error.message}`);
    }
    if (receipt.contentionDrill.schema !== CONTENTION_DRILL_SCHEMA) {
      fail('receipt.contentionDrill schema mismatch');
    }

    // --- Audit-open drill. ---
    const audit = receipt.auditOpenDrill;
    if (!audit || typeof audit !== 'object') fail('receipt.auditOpenDrill must be an object');
    if (audit.schema !== AUDIT_OPEN_SCHEMA) fail('receipt.auditOpenDrill schema mismatch');
    if (audit.ok !== true) fail('receipt.auditOpenDrill.ok must be true (preserved copy audited clean)');
    if (audit.appendedNothing !== true) {
      fail('receipt.auditOpenDrill.appendedNothing must be true (read-only audit)');
    }
    if (audit.createdNoLock !== true) {
      fail('receipt.auditOpenDrill.createdNoLock must be true (no lock acquired)');
    }
    if (audit.mtimeUnchanged !== true) {
      fail('receipt.auditOpenDrill.mtimeUnchanged must be true (log not rewritten)');
    }
    if (!SHA256_PATTERN.test(audit.accessLogTailHash)) {
      fail('receipt.auditOpenDrill.accessLogTailHash must be sha256 hex');
    }
    if (!Array.isArray(audit.checkNames) || audit.checkNames.length === 0) {
      fail('receipt.auditOpenDrill.checkNames must be a non-empty array');
    }

    // --- Gaps: every executed crash gap is surfaced honestly. ---
    if (!Array.isArray(receipt.gapsObserved)) fail('receipt.gapsObserved must be an array');
    const gapRefs = new Set();
    for (const [index, gap] of receipt.gapsObserved.entries()) {
      for (const key of ['ref', 'severity', 'summary', 'file', 'minimalFix', 'owner']) {
        if (typeof gap[key] !== 'string' || gap[key].length === 0) {
          fail(`receipt.gapsObserved[${index}].${key} must be a non-empty string`);
        }
      }
      if (typeof gap.executed !== 'boolean') {
        fail(`receipt.gapsObserved[${index}].executed must be a boolean`);
      }
      if (!/^G[\w-]*$/.test(gap.ref)) {
        fail(`receipt.gapsObserved[${index}].ref must be a Gn-style reference`);
      }
      if (!/:\d/.test(gap.file)) {
        fail(`receipt.gapsObserved[${index}].file must carry a file:line reference`);
      }
      gapRefs.add(gap.ref);
    }
    // The anti-hiding invariant: a crash drill that receipted a gap MUST appear
    // in gapsObserved as an executed gap with the matching reference.
    for (const drill of receipt.crashDrills) {
      if (drill.invariantHeld === false) {
        const match = receipt.gapsObserved.find(
          (gap) => gap.ref === drill.gapReference && gap.executed === true,
        );
        if (!match) {
          fail(
            `crash drill ${drill.scenario} reported gap ${drill.gapReference} but it is `
            + 'not surfaced as an executed gap in gapsObserved (a hidden gap is forbidden)',
          );
        }
        if (match.scenario !== drill.scenario) {
          fail(`executed gap ${drill.gapReference} does not name its surfacing scenario`);
        }
      }
    }

    // --- Claim boundary. ---
    for (const [key, value] of Object.entries(PINNED_CLAIM_BOUNDARY)) {
      if (receipt.claimBoundary[key] !== value) {
        fail(`receipt.claimBoundary.${key} must be ${value}`);
      }
    }
    if (!Array.isArray(receipt.claimBoundary.observed) || receipt.claimBoundary.observed.length === 0) {
      fail('receipt.claimBoundary.observed must list what was exercised');
    }
    if (
      !Array.isArray(receipt.claimBoundary.notObserved)
      || receipt.claimBoundary.notObserved.length === 0
    ) {
      fail('receipt.claimBoundary.notObserved must list what was NOT exercised');
    }

    // --- allInvariantsHeld reflects the reality the embedded receipts describe. ---
    const executedGapPresent = receipt.crashDrills.some((drill) => drill.invariantHeld === false);
    const happyPathsHeld = receipt.crashDrills
      .filter((drill) => CRASH_DRILL_SCENARIO_EXPECTATIONS[drill.scenario] === true)
      .every((drill) => drill.invariantHeld === true);
    const contentionOk = receipt.contentionDrill.finalChainLinear === true
      && receipt.contentionDrill.persistenceStoreLock?.serialized === true;
    const auditOk = audit.ok === true && audit.appendedNothing === true && audit.createdNoLock === true;
    const expectedAll = happyPathsHeld && contentionOk && auditOk && !executedGapPresent;
    if (receipt.allInvariantsHeld !== expectedAll) {
      fail(
        `receipt.allInvariantsHeld ${receipt.allInvariantsHeld} does not equal the reality `
        + `computed from the embedded receipts (${expectedAll})`,
      );
    }

    // --- Self-hash. ---
    const { receiptHash, ...unsigned } = receipt;
    if (!SHA256_PATTERN.test(receiptHash)) fail('receipt.receiptHash must be sha256 hex');
    if (canonicalDigest(unsigned) !== receiptHash) {
      fail('receipt.receiptHash does not recompute (receipt was altered)');
    }
    return { ok: true, failureReason: null };
  } catch (error) {
    return { ok: false, failureReason: error?.message ?? String(error) };
  }
}

// ---------------------------------------------------------------------------
// CLI.
// ---------------------------------------------------------------------------

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    json: false,
    output: DEFAULT_OUTPUT,
    root: process.cwd(),
    storeRoot: null,
    verify: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') args.root = argv[++index];
    else if (arg === '--output') args.output = argv[++index];
    else if (arg === '--store-root') args.storeRoot = argv[++index];
    else if (arg === '--verify') args.verify = argv[++index];
    else if (arg === '--json') args.json = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`HoloLand Model Village MV-B5 durability drill check

Turns the spec's claimed file-state fault-boundary property (gate rows 578/581)
into an EXECUTED, RECEIPTED drill: real SIGKILL of a real child mid-operation,
fresh-process recovery with production code, same-host multi-process lock
serialization, and a read-only audit-open of a preserved custody copy. The two
HIGH-severity gaps this slice once receipted (G1 destroyContentKey wedge, G2
phase0b lock leak) are FIXED; their drills now assert the positive invariants and
this check fails if either regresses. Offline; node builtins only.

Usage:
  node scripts/check-hololand-model-village-durability.mjs [options]

Options:
  --root <path>        HoloLand repository root (receipt output base)
  --output <path>      Receipt output path (default ${DEFAULT_OUTPUT})
  --store-root <path>  Parent scratch directory for the drills (default os.tmpdir)
  --verify <path>      Verify an existing receipt file and exit
  --json               Print the receipt as JSON
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  try {
    const args = parseArgs();
    if (args.verify) {
      const parsed = JSON.parse(readFileSync(path.resolve(args.root, args.verify), 'utf8'));
      const verification = verifyDurabilityReceipt(parsed);
      if (!verification.ok) {
        console.error('[hololand-model-village-durability] verify FAILED');
        console.error(verification.failureReason);
        process.exit(1);
      }
      console.log('[hololand-model-village-durability] verify ok');
      console.log(`receiptHash: ${parsed.receiptHash}`);
      console.log(`allInvariantsHeld: ${parsed.allInvariantsHeld}`);
    } else {
      const { receipt, output, scratchRoot } = await runDurabilityDrill(args);
      if (args.json) {
        console.log(JSON.stringify(receipt, null, 2));
      } else {
        console.log('[hololand-model-village-durability] ok');
        console.log(`receipt: ${output}`);
        console.log(`scratch: ${scratchRoot} (removed)`);
        console.log(
          `allInvariantsHeld: ${receipt.allInvariantsHeld} (reality, computed `
          + `from the embedded receipts${receipt.allInvariantsHeld
            ? '; the gaps listed below are documented-only, none executed'
            : '; executed gaps below stand'})`,
        );
        for (const drill of receipt.crashDrills) {
          const verdict = drill.invariantHeld ? 'HELD' : `GAP ${drill.gapReference}`;
          console.log(
            `  CRASH ${drill.scenario}: ${verdict} `
            + `(worker pid=${drill.workerPid} exit=${drill.workerExitCode}/${drill.workerExitSignal}, `
            + `recovery pid=${drill.recoveryPid})`,
          );
        }
        console.log(
          `  CONTENTION: workers=${receipt.contentionDrill.workerCount} `
          + `opsCommitted=${receipt.contentionDrill.opsCommitted} `
          + `opsRefused=${receipt.contentionDrill.opsRefused} `
          + `chainLinear=${receipt.contentionDrill.finalChainLinear} `
          + `persistenceSerialized=${receipt.contentionDrill.persistenceStoreLock.serialized} `
          + `forkFlagged=${receipt.contentionDrill.nonVacuityControl.flaggedByChainCheck}`,
        );
        console.log(
          `  AUDIT-OPEN: ok=${receipt.auditOpenDrill.ok} `
          + `appendedNothing=${receipt.auditOpenDrill.appendedNothing} `
          + `createdNoLock=${receipt.auditOpenDrill.createdNoLock} `
          + `mtimeUnchanged=${receipt.auditOpenDrill.mtimeUnchanged}`,
        );
        for (const gap of receipt.gapsObserved) {
          console.log(
            `  GAP ${gap.ref} [${gap.severity}${gap.executed ? ', EXECUTED' : ', documented'}]: `
            + `${gap.file} (owner: ${gap.owner})`,
          );
        }
        console.log(
          'claim boundary: single-host process-crash durability + same-host '
          + 'multi-process contention only; no fleet/multi-host consensus, no media '
          + 'failure durability, fsync trusted (not proven), no production deployment.',
        );
      }
    }
  } catch (error) {
    console.error('[hololand-model-village-durability] FAILED');
    console.error(error?.stack ?? error?.message ?? error);
    process.exit(1);
  }
}
