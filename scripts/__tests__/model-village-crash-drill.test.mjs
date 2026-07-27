import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';

import {
  CRASH_DRILL_ENGINE,
  CRASH_DRILL_SCENARIO_EXPECTATIONS,
  CRASH_DRILL_SCENARIOS,
  CRASH_DRILL_SCHEMA,
  ModelVillageCrashDrillError,
  runCrashDrill,
  runNegativeControl,
  verifyCrashDrillReceipt,
} from '../model-village-crash-drill.mjs';

const SCRATCH_ROOT = path.join(
  os.tmpdir(),
  `mv-b5-crash-drill-tests-${randomUUID()}`,
);
mkdirSync(SCRATCH_ROOT, { recursive: true });

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SCENARIO_TIMEOUT_MS = 90000;

after(() => {
  try {
    rmSync(SCRATCH_ROOT, { recursive: true, force: true });
  } catch {
    /* best-effort cleanup */
  }
});

function assertCommonReceipt(receipt, scenario) {
  assert.equal(verifyCrashDrillReceipt(receipt), true, 'receipt must self-verify');
  assert.equal(receipt.schema, CRASH_DRILL_SCHEMA);
  assert.equal(receipt.engine, CRASH_DRILL_ENGINE);
  assert.equal(receipt.scenario, scenario);
  assert.equal(receipt.recoveredInFreshProcess, true);
  assert.ok(Number.isInteger(receipt.workerPid), 'workerPid is an integer');
  assert.ok(Number.isInteger(receipt.recoveryPid), 'recoveryPid is an integer');

  // Recovery really happened in a FRESH process: a distinct pid.
  assert.notEqual(
    receipt.recoveryPid,
    receipt.workerPid,
    'recovery pid must differ from the crashed worker pid',
  );

  // The child was really killed: it did NOT exit cleanly.
  const exitedCleanly =
    receipt.workerExitCode === 0 && receipt.workerExitSignal === null;
  assert.ok(!exitedCleanly, 'crash worker must not have exited cleanly');

  assert.ok(
    receipt.storeStateHashAfterRecovery === null
      || SHA256_PATTERN.test(receipt.storeStateHashAfterRecovery),
    'store state hash is sha256 or null',
  );
  assert.ok(
    typeof receipt.observedOutcome === 'string'
      && receipt.observedOutcome.length > 0
      && receipt.observedOutcome.length <= 600,
    'observedOutcome is a bounded non-empty string',
  );
}

for (const scenario of CRASH_DRILL_SCENARIOS) {
  test(
    `scenario ${scenario}: real kill, fresh recovery, honest invariant`,
    { timeout: SCENARIO_TIMEOUT_MS },
    async () => {
      const { receipt } = await runCrashDrill({ scratchRoot: SCRATCH_ROOT, scenario });
      assertCommonReceipt(receipt, scenario);

      const expected = CRASH_DRILL_SCENARIO_EXPECTATIONS[scenario];
      assert.equal(
        receipt.invariantHeld,
        expected,
        `invariantHeld must be ${expected} for ${scenario} — observed: ${receipt.observedOutcome}`,
      );

      // Gap scenarios must be receipted honestly with a gap reference.
      if (expected === false) {
        assert.match(receipt.gapReference, /^G\d+$/, 'gap scenario carries a gapReference');
      } else {
        assert.equal(receipt.gapReference, null, 'recoverable scenario has no gapReference');
      }
    },
  );
}

test('custody-seal recovery is non-vacuous (object was not admitted as valid)', {
  timeout: SCENARIO_TIMEOUT_MS,
}, async () => {
  const { receipt } = await runCrashDrill({
    scratchRoot: SCRATCH_ROOT,
    scenario: 'custody-seal-killed-mid-write',
  });
  assert.equal(receipt.invariantHeld, true);
  assert.match(
    receipt.observedOutcome,
    /not admitted as a valid recorded object/,
    'observedOutcome documents the object was rejected/absent/unrecorded',
  );
});

test('access-log-torn recovery fails closed with a typed integrity error', {
  timeout: SCENARIO_TIMEOUT_MS,
}, async () => {
  const { receipt } = await runCrashDrill({
    scratchRoot: SCRATCH_ROOT,
    scenario: 'access-log-torn-append',
  });
  assert.equal(receipt.invariantHeld, true);
  assert.match(receipt.observedOutcome, /failed closed/i);
});

test('the two formerly-gapped scenarios (G1, G2) now hold and stay unmasked', {
  timeout: SCENARIO_TIMEOUT_MS,
}, async () => {
  // G1: destroyContentKey commits its tombstone FIRST, so a crash after that
  // commit point is rolled forward at open rather than wedging the store.
  const g1 = await runCrashDrill({
    scratchRoot: SCRATCH_ROOT,
    scenario: 'custody-destroy-key-killed-mid-destroy',
  });
  assert.equal(
    g1.receipt.invariantHeld,
    true,
    `G1 must stay fixed — observed: ${g1.receipt.observedOutcome}`,
  );
  assert.equal(g1.receipt.gapReference, null);
  assert.match(g1.receipt.observedOutcome, /rolled FORWARD/);
  assert.match(g1.receipt.observedOutcome, /CustodyKeyDestroyedError/);
  assert.doesNotMatch(g1.receipt.observedOutcome, /REGRESSION/);

  // G2: the phase0b state.lock is pid-stamped, so a lock leaked by a SIGKILLed
  // holder is reclaimed once its recorded pid is proven dead.
  const g2 = await runCrashDrill({
    scratchRoot: SCRATCH_ROOT,
    scenario: 'persistent-state-lock-leak-after-kill',
  });
  assert.equal(
    g2.receipt.invariantHeld,
    true,
    `G2 must stay fixed — observed: ${g2.receipt.observedOutcome}`,
  );
  assert.equal(g2.receipt.gapReference, null);
  assert.match(g2.receipt.observedOutcome, /reclaimed/);
  assert.doesNotMatch(g2.receipt.observedOutcome, /REGRESSION/);
});

test('NEGATIVE CONTROL: recovery checker catches a torn state.json (drill is not vacuous)', {
  timeout: SCENARIO_TIMEOUT_MS,
}, () => {
  const result = runNegativeControl({ scratchRoot: SCRATCH_ROOT });
  assert.equal(
    result.caught,
    true,
    `negative control must catch the corruption; verdict: ${result.verdict.observedOutcome}`,
  );
  assert.equal(result.verdict.invariantHeld, false);
});

test('verifyCrashDrillReceipt rejects a tampered receipt', {
  timeout: SCENARIO_TIMEOUT_MS,
}, async () => {
  const { receipt } = await runCrashDrill({
    scratchRoot: SCRATCH_ROOT,
    scenario: 'persistent-state-killed-after-rename',
  });
  // Flip the invariant without recomputing the hash → must be rejected.
  const tampered = { ...receipt, invariantHeld: !receipt.invariantHeld };
  assert.throws(
    () => verifyCrashDrillReceipt(tampered),
    ModelVillageCrashDrillError,
    'altered receipt must fail hash verification',
  );

  // Extra/missing key → rejected.
  const withExtra = { ...receipt, sneaky: true };
  assert.throws(() => verifyCrashDrillReceipt(withExtra), ModelVillageCrashDrillError);
});

test('runCrashDrill rejects an unknown scenario', async () => {
  await assert.rejects(
    () => runCrashDrill({ scratchRoot: SCRATCH_ROOT, scenario: 'does-not-exist' }),
    ModelVillageCrashDrillError,
  );
});

test('scratch is cleaned up per case (no lingering case dirs)', {
  timeout: SCENARIO_TIMEOUT_MS,
}, async () => {
  const localRoot = path.join(SCRATCH_ROOT, `cleanup-${randomUUID()}`);
  await runCrashDrill({
    scratchRoot: localRoot,
    scenario: 'persistent-state-killed-after-rename',
  });
  // The per-case dir is removed in runCrashDrill's finally; only the root
  // (created by the drill) may remain and it must be empty of case dirs.
  const leftovers = existsSync(localRoot) ? readdirSync(localRoot) : [];
  assert.equal(leftovers.length, 0, `no leftover case dirs: ${leftovers.join(',')}`);
});

test('the G1 ORDERING case really interrupts production code at the commit boundary', {
  timeout: SCENARIO_TIMEOUT_MS,
}, async () => {
  // The completion-then-restore case (custody-destroy-key-killed-mid-destroy)
  // leaves the SAME on-disk state whether the commit record is written first or
  // last, so it can only prove the recovery half of G1. This case interrupts
  // the real destroyContentKey AT the key scrub, which only a commit-first
  // ordering survives — it is the assertion that goes red if the ordering
  // regresses.
  const { receipt } = await runCrashDrill({
    scratchRoot: SCRATCH_ROOT,
    scenario: 'custody-destroy-key-killed-before-key-scrub',
  });
  assertCommonReceipt(receipt, 'custody-destroy-key-killed-before-key-scrub');
  assert.equal(
    receipt.invariantHeld,
    true,
    `ordering must stay fixed — observed: ${receipt.observedOutcome}`,
  );
  assert.equal(receipt.gapReference, null);
  assert.match(receipt.observedOutcome, /rolled FORWARD/);
  assert.doesNotMatch(receipt.observedOutcome, /REGRESSION/);
  // On this host the injected fault must really have interrupted production
  // code; anything else would make the case non-discriminating, and the receipt
  // says which mechanism ran rather than implying coverage it does not have.
  assert.match(
    receipt.observedOutcome,
    /really interrupted AT the key scrub|did NOT discriminate the commit ordering/,
    'the receipt states which mechanism the run achieved',
  );
});

test('a torn tombstone append is repaired while a torn access-log tail still fails closed', {
  timeout: SCENARIO_TIMEOUT_MS,
}, async () => {
  const torn = await runCrashDrill({
    scratchRoot: SCRATCH_ROOT,
    scenario: 'custody-tombstone-torn-append',
  });
  assert.equal(
    torn.receipt.invariantHeld,
    true,
    `a torn tombstone must not wedge the store — observed: ${torn.receipt.observedOutcome}`,
  );
  assert.match(torn.receipt.observedOutcome, /exactly one valid line/);
  assert.match(torn.receipt.observedOutcome, /re-emitted from the committed destroy-key/);

  // The authenticated record keeps the OPPOSITE behaviour, on purpose.
  const log = await runCrashDrill({
    scratchRoot: SCRATCH_ROOT,
    scenario: 'access-log-torn-append',
  });
  assert.equal(log.receipt.invariantHeld, true);
  assert.match(log.receipt.observedOutcome, /failed closed/i);
  assert.match(log.receipt.observedOutcome, /no auto-truncate/i);
});
