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

test('G1 and G2 gap scenarios are receipted as invariantHeld:false, never masked', {
  timeout: SCENARIO_TIMEOUT_MS,
}, async () => {
  const g1 = await runCrashDrill({
    scratchRoot: SCRATCH_ROOT,
    scenario: 'custody-destroy-key-killed-mid-destroy',
  });
  assert.equal(g1.receipt.invariantHeld, false);
  assert.equal(g1.receipt.gapReference, 'G1');
  assert.match(g1.receipt.observedOutcome, /wedge|no code path recovers/i);

  const g2 = await runCrashDrill({
    scratchRoot: SCRATCH_ROOT,
    scenario: 'persistent-state-lock-leak-after-kill',
  });
  assert.equal(g2.receipt.invariantHeld, false);
  assert.equal(g2.receipt.gapReference, 'G2');
  assert.match(g2.receipt.observedOutcome, /no stale reclamation|locked by another writer/i);
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
