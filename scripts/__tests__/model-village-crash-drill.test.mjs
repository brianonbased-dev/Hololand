import assert from 'node:assert/strict';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  canonicalDigest,
} from '../model-village-phase0b-runtime.mjs';
import {
  ATOMIC_REPLACEMENT_MIN_REPLACEMENTS,
  ATOMIC_REPLACEMENT_PROBE_SCHEMA,
  ATOMIC_REPLACEMENT_VERDICTS,
  CRASH_DRILL_ENGINE,
  CRASH_DRILL_SCENARIO_EXPECTATIONS,
  CRASH_DRILL_SCENARIOS,
  CRASH_DRILL_SCHEMA,
  ModelVillageCrashDrillError,
  runAtomicReplacementProbe,
  runCrashDrill,
  runNegativeControl,
  runTornReadProbe,
  verifyAtomicReplacementProbeReceipt,
  TORN_READ_CALIBRATED_HIT_RATE,
  TORN_READ_MIN_PUBLICATIONS_WITNESSED,
  TORN_READ_PROBE_SCHEMA,
  TORN_READ_REQUIRED_ATTEMPTS,
  TORN_READ_VERDICTS,
  verifyCrashDrillReceipt,
  verifyTornReadProbeReceipt,
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

// ---------------------------------------------------------------------------
// TORN-READ PROBE (DEFECT A).
//
// These are the only assertions in this suite that can see the write MECHANISM.
// Everything above passes unchanged when writeAtomicState is replaced by a naive
// direct write — that was measured, not assumed, and the A/B test below is that
// measurement, kept in the suite so it can never quietly stop being true.
// ---------------------------------------------------------------------------

const PROBE_TIMEOUT_MS = 120000;
const RUNTIME_FILE = 'model-village-phase0b-runtime.mjs';
const SCRIPTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The three modules a standalone crash-drill tree needs. */
const MUTANT_TREE_FILES = Object.freeze([
  'model-village-canonical-lifecycle.mjs',
  'model-village-crash-drill.mjs',
  RUNTIME_FILE,
]);

const WRITE_ATOMIC_SIGNATURE =
  "function writeAtomicState(storeDir, state, faultInjection = 'none') {";
const WRITE_ATOMIC_TAIL = '\nconst LOCK_HOLDER_MESSAGE =';

/**
 * The DEFECT A mutation, verbatim: writeAtomicState becomes a naive direct
 * write — no temp file, no fsync, no atomic rename — keeping only the two
 * faultInjection throws so the fault-seam drills behave exactly as before.
 */
const NAIVE_WRITE_ATOMIC_STATE = [
  WRITE_ATOMIC_SIGNATURE,
  "  if (faultInjection === 'before_rename') {",
  "    throw new Error('injected fault before atomic rename');",
  '  }',
  "  writeFileSync(statePath(storeDir), `${canonicalJson(state)}\\n`, 'utf8');",
  "  if (faultInjection === 'after_rename') {",
  "    throw new Error('injected fault after atomic rename');",
  '  }',
  '}',
  '',
].join('\n');

/**
 * Builds a throwaway copy of the crash-drill tree whose writeAtomicState is the
 * naive direct write, and returns its crash-drill module URL. Fails LOUD if the
 * anchors are gone: a refactor that moves writeAtomicState must break this test
 * rather than silently turn it into a no-op that "passes".
 */
function buildWriteAtomicMutantTree(label, bodySource, assertMutated) {
  const dir = mkdtempSync(path.join(os.tmpdir(), `mv-b5-${label}-mutant-`));
  for (const file of MUTANT_TREE_FILES) {
    copyFileSync(path.join(SCRIPTS_DIR, file), path.join(dir, file));
  }
  const runtimePath = path.join(dir, RUNTIME_FILE);
  const source = readFileSync(runtimePath, 'utf8');
  const start = source.indexOf(WRITE_ATOMIC_SIGNATURE);
  const end = source.indexOf(WRITE_ATOMIC_TAIL);
  assert.ok(
    start !== -1 && end > start,
    `the ${label} mutation anchors must still exist in the production runtime; `
    + 'if writeAtomicState moved, this A/B proof must be repaired, not skipped',
  );
  const mutated = source.slice(0, start) + bodySource + source.slice(end);
  assertMutated(mutated);
  writeFileSync(runtimePath, mutated, 'utf8');
  return { dir, moduleUrl: pathToFileURL(path.join(dir, 'model-village-crash-drill.mjs')).href };
}

function buildNaiveWriteMutantTree() {
  return buildWriteAtomicMutantTree('naive-write', NAIVE_WRITE_ATOMIC_STATE, (mutated) => {
    assert.ok(!mutated.includes('renameSync(temporary, target)'), 'the atomic rename is gone');
    assert.ok(mutated.includes('writeFileSync(statePath(storeDir)'), 'the naive write is in');
  });
}

/**
 * DEFECT A' (adversarial review FINDING A): atomic on CREATE, naive on REPLACE.
 * This is the mutation that exposed the torn-read probe as a CREATE-path probe:
 * initializePersistentStore refuses a live store, so every write the torn-read
 * harness can drive takes the create branch below and never the replace branch.
 */
const REPLACE_NAIVE_ATOMIC_STATE = [
  WRITE_ATOMIC_SIGNATURE,
  '  const target = statePath(storeDir);',
  '  if (existsSync(target)) {',
  "    if (faultInjection === 'before_rename') {",
  "      throw new Error('injected fault before atomic rename');",
  '    }',
  "    writeFileSync(target, `${canonicalJson(state)}\\n`, 'utf8');",
  "    if (faultInjection === 'after_rename') {",
  "      throw new Error('injected fault after atomic rename');",
  '    }',
  '    return;',
  '  }',
  '  const temporary = path.join(',
  '    storeDir,',
  '    `.state-${process.pid}-${randomUUID()}.tmp`,',
  '  );',
  "  const descriptor = openSync(temporary, 'wx');",
  '  let renamed = false;',
  '  try {',
  "    writeFileSync(descriptor, `${canonicalJson(state)}\\n`, 'utf8');",
  '    fsyncSync(descriptor);',
  '    closeSync(descriptor);',
  "    if (faultInjection === 'before_rename') {",
  "      throw new Error('injected fault before atomic rename');",
  '    }',
  '    renameSync(temporary, target);',
  '    renamed = true;',
  "    if (faultInjection === 'after_rename') {",
  "      throw new Error('injected fault after atomic rename');",
  '    }',
  '  } catch (error) {',
  '    try {',
  '      closeSync(descriptor);',
  '    } catch {',
  '      // Descriptor was already closed.',
  '    }',
  '    if (!renamed && existsSync(temporary)) unlinkSync(temporary);',
  '    throw error;',
  '  }',
  '}',
  '',
].join('\n');

/**
 * G-VANISH (adversarial review FINDING B): the standard "Windows will not
 * rename over an existing file" workaround, placed AFTER the before_rename
 * fault check. Identity still changes, so the atomic-replacement probe reads it
 * as atomic; the file is briefly absent, which the torn-read probe counts as
 * evidence the race happened rather than as a defect.
 */
const UNLINK_BEFORE_RENAME_ATOMIC_STATE = [
  WRITE_ATOMIC_SIGNATURE,
  '  const target = statePath(storeDir);',
  '  const temporary = path.join(',
  '    storeDir,',
  '    `.state-${process.pid}-${randomUUID()}.tmp`,',
  '  );',
  "  const descriptor = openSync(temporary, 'wx');",
  '  let renamed = false;',
  '  try {',
  "    writeFileSync(descriptor, `${canonicalJson(state)}\\n`, 'utf8');",
  '    fsyncSync(descriptor);',
  '    closeSync(descriptor);',
  "    if (faultInjection === 'before_rename') {",
  "      throw new Error('injected fault before atomic rename');",
  '    }',
  '    if (existsSync(target)) unlinkSync(target);',
  '    renameSync(temporary, target);',
  '    renamed = true;',
  "    if (faultInjection === 'after_rename') {",
  "      throw new Error('injected fault after atomic rename');",
  '    }',
  '  } catch (error) {',
  '    try {',
  '      closeSync(descriptor);',
  '    } catch {',
  '      // Descriptor was already closed.',
  '    }',
  '    if (!renamed && existsSync(temporary)) unlinkSync(temporary);',
  '    throw error;',
  '  }',
  '}',
  '',
].join('\n');

test('torn-read probe: the REAL writeAtomicState never lets a reader see a partial state', {
  timeout: PROBE_TIMEOUT_MS,
}, async () => {
  const { receipt } = await runTornReadProbe({
    scratchRoot: path.join(SCRATCH_ROOT, `torn-read-${randomUUID()}`),
  });
  assert.equal(verifyTornReadProbeReceipt(receipt), true, 'probe receipt self-verifies');
  assert.equal(receipt.schema, TORN_READ_PROBE_SCHEMA);
  assert.equal(
    receipt.verdict,
    TORN_READ_VERDICTS.HELD,
    `atomic replacement must hold — observed: ${JSON.stringify(receipt.observed)} `
    + `unmeasured: ${receipt.unmeasuredReasons.join('; ')}`,
  );
  assert.equal(receipt.hits, 0);
  assert.equal(receipt.observed.readsTorn, 0);
  assert.deepEqual(receipt.unmeasuredReasons, []);

  // The race must be PROVEN to have happened; "no tear seen" over no race is the
  // exact false green this probe exists to remove.
  assert.equal(receipt.observed.writerSignalledFirstWrite, true);
  assert.equal(receipt.observed.writerExitedEarly, false);
  assert.equal(receipt.observed.writerExitSignal, 'SIGKILL', 'the writer was really killed');
  assert.equal(receipt.observed.readersReporting, receipt.observed.readerCount);
  assert.ok(
    receipt.observed.publicationsWitnessed >= TORN_READ_MIN_PUBLICATIONS_WITNESSED,
    `readers witnessed ${receipt.observed.publicationsWitnessed} completed replacements`,
  );
  assert.ok(
    receipt.observed.publicationWindowAttempts >= TORN_READ_REQUIRED_ATTEMPTS,
    `${receipt.observed.publicationWindowAttempts} in-window attempts >= the power floor`,
  );
  assert.ok(
    receipt.power.detectionAtCalibratedRate >= 0.95,
    'the run reached >=95% detection at the calibrated hit rate',
  );
});

test('NON-VACUITY, EXECUTED: the probe goes VIOLATED against a naive direct write', {
  timeout: PROBE_TIMEOUT_MS,
}, async () => {
  // This is the whole point of the probe, and it is RUN rather than argued: a
  // real tree whose writeAtomicState has no temp file, no fsync and no rename.
  // Against that tree every OTHER gate in this slice stays green — measured —
  // so if this assertion ever stops firing, the probe has become decoration.
  const { dir, moduleUrl } = buildNaiveWriteMutantTree();
  try {
    const mutant = await import(moduleUrl);
    const { receipt } = await mutant.runTornReadProbe({
      scratchRoot: path.join(dir, 'scratch'),
    });
    assert.equal(
      receipt.verdict,
      mutant.TORN_READ_VERDICTS.VIOLATED,
      'a naive direct write MUST be caught — observed: '
      + `${JSON.stringify(receipt.observed)}`,
    );
    assert.ok(receipt.hits > 0, `at least one torn read (got ${receipt.hits})`);
    assert.ok(receipt.observed.tornSamples.length > 0, 'the tear is sampled, not just counted');
    assert.match(
      receipt.observed.tornSamples.join(' | '),
      /SyntaxError|Error/,
      'the sample names the real parse/validation failure the reader hit',
    );
    // The gap receipt must still be a VALID receipt: a real defect is receipted
    // honestly, never rejected as malformed and quietly dropped.
    assert.equal(mutant.verifyTornReadProbeReceipt(receipt), true);

    // And the measured hit rate must be in the neighbourhood of the calibration
    // the power constant was derived from. A rate that collapsed by orders of
    // magnitude would mean n is no longer sized for this defect class.
    const measured = receipt.observed.readsTorn / receipt.observed.publicationWindowAttempts;
    assert.ok(
      measured > TORN_READ_CALIBRATED_HIT_RATE / 10,
      `measured hit rate ${measured.toExponential(3)} must not have collapsed far below `
      + `the calibrated ${TORN_READ_CALIBRATED_HIT_RATE.toExponential(3)} that sized n`,
    );
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});

test('a run that cannot reach its power floor reports UNMEASURED, never HELD', {
  timeout: PROBE_TIMEOUT_MS,
}, async () => {
  // An attempt floor no run can reach in the deadline. The honest answer is
  // "could not measure", and it must NOT look like success.
  const { receipt } = await runTornReadProbe({
    scratchRoot: path.join(SCRATCH_ROOT, `torn-read-unmeasured-${randomUUID()}`),
    requiredAttempts: 50000000,
    deadlineMs: 4000,
  });
  assert.equal(receipt.verdict, TORN_READ_VERDICTS.UNMEASURED);
  assert.equal(receipt.hits, 0, 'no tear was seen — and that is exactly why it proves nothing');
  assert.ok(receipt.unmeasuredReasons.length > 0, 'the reason is stated');
  assert.match(receipt.unmeasuredReasons.join(' '), /in-window read attempts/);
  assert.equal(
    receipt.power.attemptsAchieved,
    receipt.observed.publicationWindowAttempts,
    'the reported power is derived from the attempts this run actually made',
  );
  assert.ok(
    receipt.power.attemptsAchieved < receipt.power.requiredAttempts,
    'the run genuinely fell short of its own floor',
  );
  assert.equal(verifyTornReadProbeReceipt(receipt), true, 'an UNMEASURED receipt is still valid');

  // Launder it into a HELD claim, re-signed exactly the way the harness signs.
  // The verdict re-derivation lets this one through (no hits, no reasons), and
  // the HELD PRECONDITIONS are what must catch it.
  const unsigned = { ...receipt, unmeasuredReasons: [], verdict: TORN_READ_VERDICTS.HELD };
  delete unsigned.receiptHash;
  const laundered = { ...unsigned, receiptHash: canonicalDigest(unsigned) };
  assert.throws(
    () => verifyTornReadProbeReceipt(laundered),
    /without meeting every measurement precondition/,
    'an under-powered run may not be relabelled HELD',
  );
});

test('a torn-read receipt with no observations at all cannot claim HELD', {
  timeout: PROBE_TIMEOUT_MS,
}, async () => {
  // The purest vacuous receipt: nothing ran, nothing was seen, everything zero.
  // "0 tears in 0 attempts" must never be a pass.
  const { receipt } = await runTornReadProbe({
    scratchRoot: path.join(SCRATCH_ROOT, `torn-read-vacuous-${randomUUID()}`),
    requiredAttempts: 50000000,
    deadlineMs: 4000,
  });
  const zeroed = {
    ...receipt,
    observed: {
      ...receipt.observed,
      readsAbsent: 0,
      readsComplete: 0,
      readsTorn: 0,
      readsTotal: 0,
      readsTransient: 0,
      publicationWindowAttempts: 0,
      publicationsWitnessed: 0,
      tornSamples: [],
    },
    power: {
      ...receipt.power,
      attemptsAchieved: 0,
      detectionAtCalibratedRate: 0,
      minimumHitRateStillDetectedAt95: 1,
    },
    unmeasuredReasons: [],
    verdict: TORN_READ_VERDICTS.HELD,
  };
  delete zeroed.receiptHash;
  const signed = { ...zeroed, receiptHash: canonicalDigest(zeroed) };
  assert.throws(
    () => verifyTornReadProbeReceipt(signed),
    /without meeting every measurement precondition/,
    'zero attempts is not zero tears',
  );
});

test('verifyTornReadProbeReceipt re-derives the verdict and rejects tampering', {
  timeout: PROBE_TIMEOUT_MS,
}, async () => {
  const { receipt } = await runTornReadProbe({
    scratchRoot: path.join(SCRATCH_ROOT, `torn-read-tamper-${randomUUID()}`),
    requiredAttempts: 50000000,
    deadlineMs: 4000,
  });

  // Unsigned edit → hash check.
  assert.throws(
    () => verifyTornReadProbeReceipt({ ...receipt, hits: 7 }),
    ModelVillageCrashDrillError,
  );
  // Extra key → closed-key check.
  assert.throws(
    () => verifyTornReadProbeReceipt({ ...receipt, sneaky: true }),
    ModelVillageCrashDrillError,
  );

  // A re-signed receipt whose observations say VIOLATED but whose verdict says
  // HELD: the verdict is recomputed from the counters, so this cannot survive.
  const hidden = {
    ...receipt,
    hits: 0,
    observed: {
      ...receipt.observed,
      readsTorn: 4,
      readsTotal: receipt.observed.readsTotal + 4,
      publicationWindowAttempts: receipt.observed.publicationWindowAttempts + 4,
    },
    unmeasuredReasons: [],
    verdict: TORN_READ_VERDICTS.HELD,
  };
  delete hidden.receiptHash;
  assert.throws(
    () => verifyTornReadProbeReceipt({ ...hidden, receiptHash: canonicalDigest(hidden) }),
    /does not equal the observed tear count|disagrees with its own observations/,
    'a hidden tear must not verify',
  );

  // Inflating the power block without the attempts to back it is rejected: the
  // power numbers are recomputed from publicationWindowAttempts, never trusted.
  const inflated = {
    ...receipt,
    power: { ...receipt.power, attemptsAchieved: receipt.power.requiredAttempts },
  };
  delete inflated.receiptHash;
  assert.throws(
    () => verifyTornReadProbeReceipt({ ...inflated, receiptHash: canonicalDigest(inflated) }),
    /does not recompute from the achieved attempts/,
    'power must be earned, not declared',
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

// ---------------------------------------------------------------------------
// ATOMIC-REPLACEMENT PROBE (closes DEFECT A' — the torn-read probe above races
// the CREATE path only) and the two blind spots that remain, pinned by
// execution so the gap register cannot drift away from what is true.
// ---------------------------------------------------------------------------

test('atomic-replacement probe: the production commit path replaces, never rewrites in place', {
  timeout: PROBE_TIMEOUT_MS,
}, async () => {
  const { receipt } = await runAtomicReplacementProbe({
    scratchRoot: path.join(SCRATCH_ROOT, `atomic-replacement-${randomUUID()}`),
  });
  assert.equal(verifyAtomicReplacementProbeReceipt(receipt), true, 'receipt self-verifies');
  assert.equal(receipt.schema, ATOMIC_REPLACEMENT_PROBE_SCHEMA);
  assert.equal(
    receipt.verdict,
    ATOMIC_REPLACEMENT_VERDICTS.HELD,
    `replacement must hold — observed: ${JSON.stringify(receipt.observed)} `
    + `unmeasured: ${receipt.unmeasuredReasons.join('; ')}`,
  );
  assert.equal(receipt.hits, 0);
  assert.deepEqual(receipt.unmeasuredReasons, []);

  // The comparator is CONTROLLED, not trusted: a host where ino/birthtime could
  // not discriminate would otherwise produce a confident wrong answer.
  assert.equal(receipt.observed.comparatorControl.inPlaceRewriteReadsAsSameFile, true);
  assert.equal(receipt.observed.comparatorControl.atomicReplaceReadsAsNewFile, true);
  // The branch under test really was the target-PRESENT branch.
  assert.ok(receipt.observed.replacementsExecuted >= ATOMIC_REPLACEMENT_MIN_REPLACEMENTS);
  assert.equal(
    receipt.observed.replacementsWithTargetPresent,
    receipt.observed.replacementsExecuted,
    'every measured replacement ran with the target present',
  );
  assert.equal(receipt.observed.inPlaceRewritesObserved, 0);
  // The fault seam G-EXPORT called undrivable is driven, on the replacement path.
  assert.equal(receipt.observed.faultBeforeRenameThrew, true);
  assert.equal(receipt.observed.faultBeforeRenameLeftTargetIntact, true);
  assert.equal(receipt.observed.faultAfterRenameThrew, true);
  assert.equal(receipt.observed.faultAfterRenamePublished, true);
  // The seam is provably the shipping bytes plus one appended export line.
  assert.match(receipt.observed.seamShippedRuntimeSha256, /^[a-f0-9]{64}$/);
  assert.equal(
    receipt.observed.seamShippedRuntimeSha256,
    createHash('sha256')
      .update(readFileSync(path.join(SCRIPTS_DIR, RUNTIME_FILE), 'utf8'), 'utf8')
      .digest('hex'),
    'the recorded seam hash is the hash of the SHIPPING runtime file',
  );
  assert.equal(
    receipt.observed.seamAppendedBytes,
    'export { writeAtomicState };'.length + 2,
    'exactly one appended line, and its length is recorded',
  );
});

test('NON-VACUITY, EXECUTED: atomic-replacement goes VIOLATED on the create-atomic/replace-naive mutant', {
  timeout: PROBE_TIMEOUT_MS,
}, async () => {
  // FINDING A of the second adversarial review, run rather than argued. This
  // mutant is atomic on create and naive on replace, so it is INVISIBLE to the
  // torn-read probe (which can only drive the create path) while breaking the
  // exact property the receipt names. Both halves are asserted here: the new
  // probe catches it, and the old one does not. If the second assertion ever
  // starts failing, G-TORNREAD item (0) has become wrong and must be rewritten.
  const { dir, moduleUrl } = buildWriteAtomicMutantTree(
    'replace-naive',
    REPLACE_NAIVE_ATOMIC_STATE,
    (mutated) => {
      assert.ok(mutated.includes('if (existsSync(target)) {'), 'the replace branch is in');
      assert.ok(mutated.includes('renameSync(temporary, target)'), 'the create path stays atomic');
    },
  );
  try {
    const mutant = await import(moduleUrl);
    const replacement = await mutant.runAtomicReplacementProbe({
      scratchRoot: path.join(dir, 'scratch-replacement'),
    });
    assert.equal(
      replacement.receipt.verdict,
      mutant.ATOMIC_REPLACEMENT_VERDICTS.VIOLATED,
      'a naive REPLACE must be caught — observed: '
      + `${JSON.stringify(replacement.receipt.observed)}`,
    );
    assert.ok(
      replacement.receipt.observed.inPlaceRewritesObserved
        >= ATOMIC_REPLACEMENT_MIN_REPLACEMENTS,
      'every replacement rewrote the same file object',
    );
    assert.match(replacement.receipt.observed.sampleDetail, /SAME file object/);
    // A real defect is receipted honestly, never rejected as malformed.
    assert.equal(mutant.verifyAtomicReplacementProbeReceipt(replacement.receipt), true);

    // The other half of the finding: the torn-read probe is blind to it.
    const torn = await mutant.runTornReadProbe({
      scratchRoot: path.join(dir, 'scratch-torn'),
    });
    assert.equal(
      torn.receipt.verdict,
      mutant.TORN_READ_VERDICTS.HELD,
      'DOCUMENTED (G-TORNREAD item 0): the torn-read probe races the CREATE '
      + 'path, so it cannot see a naive REPLACE. If this now fails, the probe '
      + 'got stronger and the gap entry is stale.',
    );
    assert.equal(torn.receipt.hits, 0);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});

test('G-VANISH, EXECUTED: BOTH probes are blind to an unlink-before-rename publish', {
  timeout: PROBE_TIMEOUT_MS,
}, async () => {
  // FINDING B of the second adversarial review. This is NOT a passing gate — it
  // is a documented OPEN gap whose blindness is measured so it cannot be
  // quietly forgotten, and so that closing it forces this test to be rewritten
  // together with the G-VANISH entry in check-hololand-model-village-durability.
  const { dir, moduleUrl } = buildWriteAtomicMutantTree(
    'unlink-before-rename',
    UNLINK_BEFORE_RENAME_ATOMIC_STATE,
    (mutated) => {
      assert.ok(
        /if \(existsSync\(target\)\) unlinkSync\(target\);\s*\n\s*renameSync/.test(mutated),
        'the unlink sits immediately before the rename',
      );
    },
  );
  try {
    const mutant = await import(moduleUrl);
    const replacement = await mutant.runAtomicReplacementProbe({
      scratchRoot: path.join(dir, 'scratch-replacement'),
    });
    assert.equal(
      replacement.receipt.verdict,
      mutant.ATOMIC_REPLACEMENT_VERDICTS.HELD,
      'DOCUMENTED (G-VANISH): unlink+rename still yields a NEW file object, so '
      + 'the identity comparator reads it as atomic',
    );
    const torn = await mutant.runTornReadProbe({
      scratchRoot: path.join(dir, 'scratch-torn'),
    });
    assert.equal(
      torn.receipt.verdict,
      mutant.TORN_READ_VERDICTS.HELD,
      'DOCUMENTED (G-VANISH): the torn-read probe counts ENOENT as evidence the '
      + 'race happened, so a wider disappearance window makes it MORE confident',
    );
    assert.equal(torn.receipt.hits, 0);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});

test('an atomic-replacement receipt cannot be laundered into HELD', {
  timeout: PROBE_TIMEOUT_MS,
}, async () => {
  const { receipt } = await runAtomicReplacementProbe({
    scratchRoot: path.join(SCRATCH_ROOT, `atomic-replacement-launder-${randomUUID()}`),
    replacements: 1,
  });
  // A caller asking for one replacement gets a real verdict...
  assert.equal(receipt.replacementFloor, 1);
  assert.equal(
    receipt.verdict,
    ATOMIC_REPLACEMENT_VERDICTS.HELD,
    'the run itself is honest at the caller floor',
  );
  // ...but the MODULE's floor, not the caller's, is what a HELD must satisfy.
  assert.throws(
    () => verifyAtomicReplacementProbeReceipt(receipt),
    /without meeting every measurement precondition/,
    'a cheaper caller floor must not verify as HELD',
  );

  // And a receipt whose in-run comparator control failed cannot be HELD either:
  // "no in-place rewrite seen" by a comparator that cannot see one is vacuous.
  const blind = {
    ...receipt,
    observed: {
      ...receipt.observed,
      comparatorControl: {
        atomicReplaceReadsAsNewFile: true,
        inPlaceRewriteReadsAsSameFile: false,
      },
      replacementsExecuted: ATOMIC_REPLACEMENT_MIN_REPLACEMENTS,
      replacementsWithTargetPresent: ATOMIC_REPLACEMENT_MIN_REPLACEMENTS,
    },
    replacementFloor: ATOMIC_REPLACEMENT_MIN_REPLACEMENTS,
  };
  delete blind.receiptHash;
  const signedBlind = { ...blind, receiptHash: canonicalDigest(blind) };
  assert.throws(
    () => verifyAtomicReplacementProbeReceipt(signedBlind),
    /without meeting every measurement precondition/,
    'a blind comparator may not be relabelled HELD',
  );
});

test('the torn-read probe carries an IN-RUN detector positive control', {
  timeout: PROBE_TIMEOUT_MS,
}, async () => {
  // Until this existed the gate shipped a detector whose liveness was only
  // proven under `node --test`. A readPersistentState that started tolerating
  // truncation would have turned the gate permanently green while still
  // printing detection=1.
  const { receipt } = await runTornReadProbe({
    scratchRoot: path.join(SCRATCH_ROOT, `torn-read-control-${randomUUID()}`),
  });
  assert.deepEqual(receipt.observed.detectorControl, {
    absentClassified: true,
    completeClassified: true,
    tornClassified: true,
  });
  assert.equal(receipt.verdict, TORN_READ_VERDICTS.HELD);

  // It is load-bearing: a HELD whose control did not fire must not verify.
  const blind = {
    ...receipt,
    observed: {
      ...receipt.observed,
      detectorControl: { ...receipt.observed.detectorControl, tornClassified: false },
    },
  };
  delete blind.receiptHash;
  const signedBlind = { ...blind, receiptHash: canonicalDigest(blind) };
  assert.throws(
    () => verifyTornReadProbeReceipt(signedBlind),
    /without meeting every measurement precondition/,
    'a HELD from a detector that could not see a tear is vacuous',
  );
});
