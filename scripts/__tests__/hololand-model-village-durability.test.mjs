/**
 * Offline node --test suite for the MV-B5 durability checker
 * (scripts/check-hololand-model-village-durability.mjs). Runs the REAL drill
 * once (spawning + SIGKILLing real child processes, racing real child processes
 * for contention, and re-verifying a real sealed store read-only), then asserts
 * the emitted receipt's shape, schema, drill presence, honest gap surfacing,
 * exact claim-boundary flags, self-hash verification, tamper rejection, and
 * scratch isolation.
 *
 * No network, no providers, no git. Every store lives under an os.tmpdir scratch
 * root the drill creates and removes; the only durable artifact is the receipt
 * written to a temp --output path this suite cleans up.
 */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

import {
  AUDIT_OPEN_SCHEMA,
} from '../model-village-audit-open.mjs';
import {
  CONTENTION_DRILL_SCHEMA,
} from '../model-village-contention-drill.mjs';
import {
  CRASH_DRILL_SCENARIO_EXPECTATIONS,
  CRASH_DRILL_SCENARIOS,
  CRASH_DRILL_SCHEMA,
} from '../model-village-crash-drill.mjs';
import {
  DURABILITY_RECEIPT_SCHEMA,
  runDurabilityDrill,
  verifyDurabilityReceipt,
} from '../check-hololand-model-village-durability.mjs';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SUITE_TIMEOUT_MS = 120000;

// The full drill is expensive (spawns + kills many child processes). Run it ONCE
// in a before() hook and share the receipt across the assertion tests.
let SCRATCH_BASE;
let OUTPUT_PATH;
let RECEIPT;

before(async () => {
  SCRATCH_BASE = mkdtempSync(path.join(os.tmpdir(), 'mv-b5-durability-test-'));
  const storeRoot = path.join(SCRATCH_BASE, 'store');
  mkdirSync(storeRoot, { recursive: true });
  OUTPUT_PATH = path.join(SCRATCH_BASE, 'durability-receipt.json');
  const result = await runDurabilityDrill({
    storeRoot,
    output: OUTPUT_PATH,
    root: SCRATCH_BASE,
    // Smaller contention config keeps the suite bounded while still contending.
    contentionWorkerCount: 3,
    contentionOpsPerWorker: 2,
  });
  RECEIPT = result.receipt;
}, { timeout: SUITE_TIMEOUT_MS });

after(() => {
  try {
    rmSync(SCRATCH_BASE, { recursive: true, force: true });
  } catch {
    /* best-effort cleanup */
  }
});

test('receipt has the exact top-level schema shape', { timeout: SUITE_TIMEOUT_MS }, () => {
  assert.equal(RECEIPT.schema, DURABILITY_RECEIPT_SCHEMA);
  assert.ok(SHA256_PATTERN.test(RECEIPT.receiptHash), 'receiptHash is sha256 hex');
  assert.equal(typeof RECEIPT.allInvariantsHeld, 'boolean');
  assert.ok(!Number.isNaN(Date.parse(RECEIPT.generatedAt)), 'generatedAt parses');

  const keys = Object.keys(RECEIPT).sort();
  assert.deepEqual(keys, [
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
});

test('every crash scenario ran ONCE and matches its documented expectation', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  const scenarios = RECEIPT.crashDrills.map((drill) => drill.scenario);
  // Full scenario set, each exactly once (not swept).
  assert.deepEqual(
    [...scenarios].sort(),
    [...CRASH_DRILL_SCENARIOS].sort(),
    'all known crash scenarios are present',
  );
  assert.equal(new Set(scenarios).size, scenarios.length, 'no scenario ran twice');

  for (const drill of RECEIPT.crashDrills) {
    assert.equal(drill.schema, CRASH_DRILL_SCHEMA);
    assert.equal(drill.recoveredInFreshProcess, true);
    assert.notEqual(drill.recoveryPid, drill.workerPid, 'recovery ran in a fresh process');
    assert.equal(
      drill.invariantHeld,
      CRASH_DRILL_SCENARIO_EXPECTATIONS[drill.scenario],
      `${drill.scenario} must match its documented expectation`,
    );
  }
});

test('contention drill and audit-open drill are both present and honest', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  assert.equal(RECEIPT.contentionDrill.schema, CONTENTION_DRILL_SCHEMA);
  assert.equal(RECEIPT.contentionDrill.finalChainLinear, true);
  assert.equal(RECEIPT.contentionDrill.persistenceStoreLock.serialized, true);
  assert.equal(RECEIPT.contentionDrill.nonVacuityControl.flaggedByChainCheck, true);
  assert.equal(
    RECEIPT.contentionDrill.opsCommitted,
    RECEIPT.contentionDrill.workerCount * RECEIPT.contentionDrill.opsPerWorker,
  );

  assert.equal(RECEIPT.auditOpenDrill.schema, AUDIT_OPEN_SCHEMA);
  assert.equal(RECEIPT.auditOpenDrill.ok, true);
  assert.equal(RECEIPT.auditOpenDrill.appendedNothing, true);
  assert.equal(RECEIPT.auditOpenDrill.createdNoLock, true);
  assert.equal(RECEIPT.auditOpenDrill.mtimeUnchanged, true);
  assert.ok(SHA256_PATTERN.test(RECEIPT.auditOpenDrill.accessLogTailHash));
  assert.ok(Array.isArray(RECEIPT.auditOpenDrill.checkNames));
  assert.ok(RECEIPT.auditOpenDrill.checkNames.includes('access-log-chain'));
});

test('the two real durability gaps are surfaced honestly, not masked', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  // Reality: G1 and G2 stand, so allInvariantsHeld MUST be false.
  assert.equal(RECEIPT.allInvariantsHeld, false, 'a real gap must not be hidden to stay green');

  const executed = RECEIPT.gapsObserved.filter((gap) => gap.executed === true);
  const executedRefs = executed.map((gap) => gap.ref).sort();
  assert.deepEqual(executedRefs, ['G1', 'G2'], 'both HIGH gaps are executed and surfaced');

  for (const gap of executed) {
    assert.equal(gap.severity, 'HIGH');
    assert.match(gap.file, /:\d/, 'gap carries a file:line reference');
    assert.ok(gap.minimalFix.length > 0, 'gap names a minimal fix');
    assert.ok(gap.owner.length > 0, 'gap names an owning lane');
    // The executed gap must name the crash scenario that surfaced it, and that
    // scenario must in fact be a receipted gap (invariantHeld:false).
    const drill = RECEIPT.crashDrills.find((entry) => entry.scenario === gap.scenario);
    assert.ok(drill, `executed gap ${gap.ref} names a real scenario`);
    assert.equal(drill.invariantHeld, false);
    assert.equal(drill.gapReference, gap.ref);
  }

  // Every crash drill that reported a gap appears as an executed gap.
  for (const drill of RECEIPT.crashDrills) {
    if (drill.invariantHeld === false) {
      const match = RECEIPT.gapsObserved.find(
        (gap) => gap.ref === drill.gapReference && gap.executed === true,
      );
      assert.ok(match, `crash gap ${drill.gapReference} is not hidden`);
    }
  }
});

test('claim-boundary flags are pinned exactly (honest about what is NOT proven)', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  const cb = RECEIPT.claimBoundary;
  assert.equal(cb.fleetOrMultiHostConsensusClaimed, false);
  assert.equal(cb.mediaFailureDurabilityClaimed, false);
  assert.equal(cb.productionDeploymentClaimed, false);
  // fsync is TRUSTED, not proven — pinned true on purpose.
  assert.equal(cb.fsyncHonestyAssumed, true);
  assert.ok(Array.isArray(cb.observed) && cb.observed.length > 0);
  assert.ok(Array.isArray(cb.notObserved) && cb.notObserved.length > 0);
  // The boundary must name the process-crash + contention + audit-open proofs.
  assert.match(cb.observed.join(' '), /process-crash/i);
  assert.match(cb.observed.join(' '), /multi-process/i);
  assert.match(cb.observed.join(' '), /audit-open/i);
});

test('emitted receipt file self-verifies via verifyDurabilityReceipt', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  assert.ok(existsSync(OUTPUT_PATH), 'receipt file was written');
  const onDisk = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  assert.equal(onDisk.receiptHash, RECEIPT.receiptHash, 'on-disk receipt matches the returned one');
  const verification = verifyDurabilityReceipt(onDisk);
  assert.equal(verification.ok, true, `receipt must self-verify: ${verification.failureReason}`);
});

test('verifyDurabilityReceipt rejects a tampered receipt', { timeout: SUITE_TIMEOUT_MS }, () => {
  // Flip allInvariantsHeld true without recomputing the hash — rejected by the
  // self-hash recompute (and, were the hash rebuilt, by the reality check too).
  const flipped = { ...RECEIPT, allInvariantsHeld: true };
  assert.equal(verifyDurabilityReceipt(flipped).ok, false, 'a masked gap must be rejected');

  // Missing key → rejected by the closed-key assertion.
  const missingKey = { ...RECEIPT };
  delete missingKey.gapsObserved;
  assert.equal(verifyDurabilityReceipt(missingKey).ok, false, 'missing key must be rejected');

  // Extra key → rejected by the closed-key assertion.
  const extraKey = { ...RECEIPT, sneaky: true };
  assert.equal(verifyDurabilityReceipt(extraKey).ok, false, 'extra key must be rejected');
});

test('a hidden executed gap is rejected by verifyDurabilityReceipt', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  // Remove the executed gaps from gapsObserved while leaving the gap crash
  // drills in place: the anti-hiding invariant must reject this.
  const laundered = {
    ...RECEIPT,
    gapsObserved: RECEIPT.gapsObserved.filter((gap) => gap.executed !== true),
  };
  const verification = verifyDurabilityReceipt(laundered);
  assert.equal(verification.ok, false, 'stripping executed gaps must be rejected');
  assert.match(verification.failureReason, /hidden gap|not surfaced/i);
});

test('drill scratch is isolated and removed (no lingering store dirs)', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  // The drill created its own scratch subtree under storeRoot and removed it in
  // its finally. The only thing left under SCRATCH_BASE is the receipt file (and
  // the now-empty storeRoot). No crash/contention case dirs may remain.
  const storeRoot = path.join(SCRATCH_BASE, 'store');
  const leftovers = existsSync(storeRoot) ? readdirSync(storeRoot) : [];
  assert.equal(leftovers.length, 0, `store scratch must be empty: ${leftovers.join(',')}`);
});

test('a second isolated run reproduces the gaps and a self-verifying receipt', {
  timeout: SUITE_TIMEOUT_MS,
}, async () => {
  // Point the drill at a brand-new isolated store root and confirm it produces
  // a self-verifying receipt again with the same standing gaps — the harness
  // contract is deterministic across fresh scratch roots.
  const isolated = path.join(SCRATCH_BASE, `isolated-${randomUUID()}`);
  mkdirSync(isolated, { recursive: true });
  const output = path.join(isolated, 'receipt.json');
  const { receipt } = await runDurabilityDrill({
    storeRoot: isolated,
    output,
    root: isolated,
    contentionWorkerCount: 2,
    contentionOpsPerWorker: 1,
  });
  assert.equal(receipt.schema, DURABILITY_RECEIPT_SCHEMA);
  assert.equal(verifyDurabilityReceipt(receipt).ok, true);
  assert.equal(receipt.allInvariantsHeld, false, 'the gaps are reproducible across runs');
  const executedRefs = receipt.gapsObserved
    .filter((gap) => gap.executed === true)
    .map((gap) => gap.ref)
    .sort();
  assert.deepEqual(executedRefs, ['G1', 'G2']);
});
