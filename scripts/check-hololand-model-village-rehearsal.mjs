#!/usr/bin/env node
/* global console, process, structuredClone */

/**
 * Model Village T-7 DRESS-REHEARSAL CHECK — the acceptance gate for the MV-B
 * backend lane.
 *
 * GATE THIS CLOSES: docs/specs/HOLOLAND_MODEL_VILLAGE_PRODUCTION_PLAN.md line
 * 726 — "Complete a full twelve-run dress rehearsal using captured responses and
 * zero provider calls." Before this file, `grep -r "twelveRun\|twelve-run\|
 * dressRehearsal" scripts/` returned nothing: five slices had shipped and none
 * of them composed into a run. The rehearsal needs no live model and no
 * open-outcome receipt tier — replayed captures make the final state
 * predetermined — so it was, and remains, the cheapest available falsification
 * of the whole lane.
 *
 * ---------------------------------------------------------------------------
 * THIS CHECKER EXECUTES. IT DOES NOT ASSERT.
 * ---------------------------------------------------------------------------
 * Default behaviour is to RUN the twelve-run rehearsal end to end through
 * scripts/model-village-run-conductor.mjs (twelve isolated shards, seventy-two
 * hash-chained turn rounds, four hundred and thirty-two replayed model turns
 * read back out of sealed custody), then to verify the artifact it produced.
 * There is no path through this file that reports a green rehearsal without one
 * having happened in this process.
 *
 * ---------------------------------------------------------------------------
 * FIVE THINGS THIS CHECKER DOES THAT THE CONDUCTOR CANNOT DO FOR ITSELF
 * ---------------------------------------------------------------------------
 * The audit that preceded this lane found checkers that verified a receipt
 * against the same constant they wrote it from — verify(emit()) === X === X.
 * Every one of the five below is deliberately OUT-OF-BAND with respect to the
 * conductor, so none of them can be satisfied by the conductor agreeing with
 * itself.
 *
 *  (1) AN INDEPENDENT SECOND PROVIDER-CALL COUNTER. This checker installs its
 *      OWN counting fence over globalThis.fetch BEFORE runRehearsal installs
 *      the conductor's, so the conductor's fence delegates through this one.
 *      Two consequences, both load-bearing: a provider call that the inner
 *      fence failed to refuse would be counted and refused HERE, and the
 *      identity `outer.calls === inner.calls - inner.providerCalls` must hold
 *      exactly — it is the arithmetic signature of one fence nested inside the
 *      other, and it breaks if either counter is bypassed, reset, or faked.
 *
 *      NON-VACUITY, MEASURED rather than argued (probe run 2026-07-27, one
 *      village-run, expectations scaled to it so the run count could not be the
 *      cause). An executor was given a reference to fetch captured BEFORE the
 *      conductor installed its fence — the exact case the conductor names as
 *      out of its own scope — and made one provider call per turn. Result:
 *      the conductor's fence reported providerFetchCallsObserved 0 and the
 *      rehearsal `passed: true`, while THIS checker's outer fence counted 36
 *      provider calls, refused every one, and broke the nesting identity
 *      (37 outer calls against an expected 1). The conductor alone would have
 *      certified that run. The outer fence is what fails it, and both of the
 *      checks below fire on it.
 *
 *  (2) LIVE MUTATION CONTROLS AGAINST TODAY'S ARTIFACT. Five mutations are
 *      applied to the receipt that was just produced, each one RE-SIGNED so the
 *      self-hash recomputes cleanly, and each must be REJECTED by
 *      verifyRehearsalReceipt. This is the alias-custody template
 *      (__tests__/hololand-model-village-alias-custody.test.mjs:477-496) —
 *      the only claim test in this lane that survived constant mutation —
 *      executed by the gate itself rather than only in a test file. A boundary
 *      that catches un-re-hashed edits is a ritual; if any control PASSES
 *      verification, this checker fails, because the boundary has gone ritual.
 *
 *  (3) THE ON-DISK ARTIFACT, NOT THE IN-MEMORY OBJECT. The receipt is read back
 *      off disk and verified from those bytes. A write path that serializes
 *      something other than what it verified is caught here and nowhere else.
 *
 *  (4) A REFUSAL PROOF FOR THE BOUNDED SMOKE. `--runs N` (N < 12) is a
 *      structural probe, never acceptance evidence. It is written to a
 *      DIFFERENT path, and the checker proves — by running it — that the
 *      default twelve-run expectation table REJECTS the short receipt. A smoke
 *      therefore cannot be handed off as the dress rehearsal.
 *
 *  (5) THE STATE OF THE DISK AFTER THE RUN. Found by looking rather than by
 *      reading the teardown path: context.teardown() and custodyStore.close()
 *      release handles but remove nothing, so every completed rehearsal was
 *      leaving each village-run's sealed custody store on disk TOGETHER WITH
 *      custody/key/content-key.bin — the key that opens the ciphertext beside
 *      it — plus the sealed validator PKCS8 (measured 2026-07-27: 958 files,
 *      ~718 KB per rehearsal, one tree per invocation, nine accumulated in a
 *      single afternoon). The conductor now destroys the tree it created; this
 *      checker STATS the filesystem to confirm it went, so a best-effort
 *      removal that silently failed cannot pass as success.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS CHECKER DOES NOT CLAIM
 * ---------------------------------------------------------------------------
 * It inherits the conductor's honest limits verbatim and re-publishes them:
 * no live study run, no operational blinding proof (the process that seals the
 * assignment is the process that replays it), no open-outcome receipt tier, no
 * Phase-1 admission, no world mutation, and no tamper-PROOF receipt (the
 * artifact is tamper-EVIDENT — no single edit and no re-signed single edit
 * passes — but it carries no signature over itself). The provider-call
 * measurement covers globalThis.fetch and the injected fetchImpl handle only:
 * raw node:http/https sockets, child processes, and references to fetch
 * captured before either fence was installed are OUT of scope, and are stated
 * as out of scope rather than quietly counted as zero.
 *
 * Usage:
 *   node scripts/check-hololand-model-village-rehearsal.mjs [options]
 *
 * Options:
 *   --runs N        Bounded smoke over the first N village-runs (1..12).
 *                   Default is the FULL twelve-run shape.
 *   --verify [path] Verify an existing rehearsal receipt and exit (no run).
 *   --root <path>   Hololand repository root.
 *   --output <path> Check-receipt output path.
 *   --json          Print the check receipt as JSON.
 *   --help
 *
 * Exit codes: 0 pass · 1 failure · 2 usage error.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  REHEARSAL_EXPECTATIONS,
  REHEARSAL_RECEIPT_OUTPUT_PATH,
  installProviderCallFence,
  runRehearsal,
  verifyRehearsalReceipt,
} from './model-village-run-conductor.mjs';
import {
  canonicalDigest,
  canonicalJson,
} from './model-village-phase0b-runtime.mjs';

export const CHECK_RECEIPT_SCHEMA = 'hololand.model-village-rehearsal-check.v1';
export const CHECK_ENGINE = 'hololand-model-village-rehearsal-check-v1';

export const DEFAULT_CHECK_OUTPUT =
  '.tmp/hololand/model-village/rehearsal-check-receipt.json';
/**
 * A bounded smoke gets its OWN default paths for both artifacts. Sharing them
 * with the full shape would let a fast `--runs 2` clobber the twelve-run
 * evidence at the canonical path and leave an acceptanceEvidence:false receipt
 * sitting where a reader expects the dress rehearsal.
 */
export const SMOKE_CHECK_OUTPUT =
  '.tmp/hololand/model-village/rehearsal-check-smoke-receipt.json';
export const SMOKE_RECEIPT_OUTPUT_PATH =
  '.tmp/hololand/model-village/rehearsal-smoke-receipt.json';

/** The frozen study design. Three seed blocks x four conditions = twelve. */
export const FULL_VILLAGE_RUNS = 12;
export const ROUNDS_PER_RUN = 6;
export const RESIDENTS_PER_ROUND = 6;
export const STUDY_BLOCKS = 3;

const repoRootDefault = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

/**
 * Derives the expectation table for a bounded smoke of `villageRuns` runs.
 *
 * Authored HERE from the study DESIGN (runs x rounds x residents), never read
 * from a receipt. Its correctness is falsifiable and is falsified on every
 * invocation: at villageRuns = 12 it MUST equal the conductor's independently
 * hand-authored REHEARSAL_EXPECTATIONS, and assertSmokeDerivationPinned()
 * fails the checker if the two ever drift apart.
 */
export function deriveExpectations(villageRuns) {
  if (!Number.isInteger(villageRuns) || villageRuns < 1 || villageRuns > FULL_VILLAGE_RUNS) {
    throw new Error(
      `villageRuns must be an integer in 1..${FULL_VILLAGE_RUNS}; received ${canonicalJson(villageRuns)}`,
    );
  }
  const rounds = villageRuns * ROUNDS_PER_RUN;
  const turns = rounds * RESIDENTS_PER_ROUND;
  return Object.freeze({
    // The alias vault seals and unblinds every block regardless of how many
    // runs execute — the assignment is a STUDY secret, not per-run state.
    aliasBlocksSealed: STUDY_BLOCKS,
    aliasCommitmentVerificationFailures: 0,
    aliasUnblindingsVerified: STUDY_BLOCKS,
    chainVerificationFailures: 0,
    crossRunStateFindings: 0,
    distinctRunDirectoryCount: villageRuns,
    distinctRunIdCount: villageRuns,
    distinctValidatorIdCount: villageRuns,
    modelTurnsResolved: turns,
    providerFetchCallsObserved: 0,
    runManifestSignatureFailures: 0,
    runManifestSignaturesVerified: villageRuns,
    schedulerFrozenRounds: 0,
    trustRegistryEntriesAppended: villageRuns,
    trustRegistryVerified: true,
    turnRoundsExecuted: rounds,
    turnsCompleted: turns,
    turnsFailed: 0,
    turnsTimedOut: 0,
    villageRunsExecuted: villageRuns,
  });
}

/**
 * The derivation above is only trustworthy if it reproduces the conductor's
 * hand-authored full-shape table exactly. Checked on every invocation so a
 * drift in either surface is a loud failure rather than a silent relaxation.
 */
export function assertSmokeDerivationPinned() {
  const derived = deriveExpectations(FULL_VILLAGE_RUNS);
  if (canonicalJson(derived) !== canonicalJson(REHEARSAL_EXPECTATIONS)) {
    throw new Error(
      'deriveExpectations(12) does not reproduce the conductor\'s independently '
      + 'authored REHEARSAL_EXPECTATIONS; the smoke derivation and the full-shape '
      + `table have drifted apart.\n  derived: ${canonicalJson(derived)}\n  table:   ${canonicalJson(REHEARSAL_EXPECTATIONS)}`,
    );
  }
  return true;
}

/**
 * The five mutation controls. Each returns a RE-SIGNED receipt, so a boundary
 * that only detects a broken self-hash catches none of them. Every one must be
 * REJECTED; a control that verifies means the claim boundary has stopped
 * biting, and that is a checker failure, not a warning.
 */
export const MUTATION_CONTROLS = Object.freeze([
  Object.freeze({
    id: 'flip-passed',
    description: 'flip `passed` and re-sign',
    mutate(body) {
      body.passed = !body.passed;
      return body;
    },
  }),
  Object.freeze({
    id: 'zero-custody-reads',
    description: 'zero the sealed-custody read counter and re-sign',
    mutate(body) {
      body.observed.custodyResponseReadsObserved = 0;
      return body;
    },
  }),
  Object.freeze({
    id: 'drop-a-run-and-rebuild-aggregate',
    description: 'drop one village-run, rebuild the aggregate honestly, re-sign',
    mutate(body) {
      body.runs = body.runs.slice(0, Math.max(0, body.runs.length - 1));
      // Recompute the aggregate the way the verifier will, so the mutation is
      // internally CONSISTENT and can only be caught by the expectation table.
      body.aggregate = null;
      return body;
    },
    rebuildAggregate: true,
  }),
  Object.freeze({
    id: 'claim-a-live-study-run',
    description: 'flip declared.liveStudyRunClaimed to true and re-sign',
    mutate(body) {
      body.declared.liveStudyRunClaimed = true;
      return body;
    },
  }),
  Object.freeze({
    id: 'hide-a-provider-call',
    description:
      'record a provider-call target while leaving the gated counter at zero, and re-sign',
    mutate(body) {
      body.observed.providerFetchCallTargets = [
        ...body.observed.providerFetchCallTargets,
        'https://provider.invalid/v1/chat/completions',
      ];
      return body;
    },
  }),
]);

function reSign(receipt, control, deriveAggregateFn) {
  const unsigned = { ...receipt };
  delete unsigned.receiptHash;
  const mutated = control.mutate(structuredClone(unsigned));
  if (control.rebuildAggregate) {
    mutated.aggregate = deriveAggregateFn(mutated.runs);
  }
  return { ...mutated, receiptHash: canonicalDigest(mutated) };
}

/**
 * Per-run projection. Every field is MEASURED or derived from the rehearsal's
 * own run entries; nothing here is restated from a constant.
 *
 * `seatsStaged` is derived rather than declared: it is the number of residents
 * the scheduler actually resolved in a round (completed + failed + timedOut),
 * and `seatsStableAcrossRounds` records whether every round of the run staged
 * that same number. A run whose seat count drifted between rounds would show up
 * as false rather than being averaged away.
 */
export function projectRun(run) {
  const roundSeatCounts = run.turnRounds.map(
    (round) => round.resolvedCounts.completed
      + round.resolvedCounts.failed
      + round.resolvedCounts.timedOut,
  );
  const seatsStaged = roundSeatCounts.length > 0 ? roundSeatCounts[0] : 0;
  return {
    admitted: run.decisionCounts.admitted,
    blockId: run.blockId,
    chainVerified: run.chainVerified,
    condition: run.condition,
    crossRunStateFindings: run.crossRunStateFindings.length,
    denied: run.decisionCounts.denied,
    isolationProven: run.crossRunStateFindings.length === 0,
    noPreauthorizedMatch: run.decisionCounts.noPreauthorizedMatch,
    preauthorizedMatch: run.decisionCounts.preauthorizedMatch,
    receiptChainRoot: run.receiptChainRoot,
    runId: run.runId,
    runManifestSignatureVerified: run.runManifestSignatureVerified,
    seatsStableAcrossRounds: roundSeatCounts.every((count) => count === seatsStaged),
    seatsStaged,
    turnRounds: run.turnRounds.length,
    turnsCompleted: run.turnOutcomeCounts.completed,
    turnsExecuted: run.turnOutcomeCounts.completed
      + run.turnOutcomeCounts.failed
      + run.turnOutcomeCounts.timedOut,
    turnsFailed: run.turnOutcomeCounts.failed,
    turnsTimedOut: run.turnOutcomeCounts.timedOut,
    validatorId: run.validatorId,
  };
}

/**
 * Executes the rehearsal and every out-of-band control.
 *
 * Returns { receipt, output, failures }. `receipt.passed` is COMPUTED from the
 * failures list; there is no path that sets it directly.
 */
export async function runRehearsalCheck({
  root = repoRootDefault,
  runs = FULL_VILLAGE_RUNS,
  output = null,
  json = false,
} = {}) {
  void json;
  const hololandRoot = path.resolve(root);
  const failures = [];
  const startedAt = Date.now();

  // The smoke derivation is pinned to the conductor's hand-authored table
  // before anything else runs. A drift here would silently weaken every
  // expectation in this file.
  assertSmokeDerivationPinned();

  const fullShape = runs === FULL_VILLAGE_RUNS;
  const expectations = deriveExpectations(runs);

  // (1) THE INDEPENDENT OUTER FENCE. Installed BEFORE the conductor's, so the
  // conductor's fence delegates non-provider traffic through this one and a
  // provider call the inner fence failed to refuse is refused here.
  const outerFence = installProviderCallFence();
  let rehearsal;
  try {
    rehearsal = await runRehearsal({
      expectations,
      hololandRoot,
      // A bounded smoke NEVER writes the canonical dress-rehearsal receipt.
      runLimit: fullShape ? null : runs,
      writeReceipt: fullShape,
    });
  } finally {
    outerFence.restore();
  }

  const receipt = rehearsal.receipt;
  const observedInner = receipt.observed;

  // (1a) The nesting identity. Provider calls are refused by the inner fence
  // BEFORE delegation, so exactly the non-provider calls reach the outer one.
  const expectedOuterCalls = observedInner.fetchCallsObserved - observedInner.providerFetchCallsObserved;
  if (outerFence.state.calls !== expectedOuterCalls) {
    failures.push(
      `independent outer fence saw ${outerFence.state.calls} fetch call(s) but the `
      + `conductor's fence reports ${observedInner.fetchCallsObserved} total minus `
      + `${observedInner.providerFetchCallsObserved} refused = ${expectedOuterCalls}; `
      + 'the two counters disagree, so at least one of them was bypassed',
    );
  }
  if (outerFence.state.providerCalls !== 0) {
    failures.push(
      `independent outer fence measured ${outerFence.state.providerCalls} provider `
      + `call(s) (${outerFence.state.providerTargets.join(', ')}); a provider call `
      + 'reached the outer fence, which means the conductor\'s fence did not refuse it',
    );
  }
  if (observedInner.providerFetchCallsObserved !== 0) {
    failures.push(
      `the rehearsal measured ${observedInner.providerFetchCallsObserved} provider `
      + `call(s): ${observedInner.providerFetchCallTargets.join(', ')}`,
    );
  }

  // (2) The rehearsal's own verdict, recomputed by the shipped verifier.
  const verification = verifyRehearsalReceipt(receipt, { expectations });
  if (!verification.ok) {
    failures.push(`rehearsal receipt failed verification: ${verification.failureReason}`);
  }
  if (receipt.passed !== true) {
    for (const failure of rehearsal.failures.slice(0, 12)) {
      failures.push(`rehearsal expectation failure: ${failure}`);
    }
  }

  // (3) THE ON-DISK ARTIFACT. Read back off disk and verified from those bytes.
  const rehearsalReceiptPath = fullShape
    ? path.join(hololandRoot, ...REHEARSAL_RECEIPT_OUTPUT_PATH.split('/'))
    : path.join(hololandRoot, ...SMOKE_RECEIPT_OUTPUT_PATH.split('/'));
  if (!fullShape) {
    mkdirSync(path.dirname(rehearsalReceiptPath), { recursive: true });
    writeFileSync(rehearsalReceiptPath, `${canonicalJson(receipt)}\n`, 'utf8');
  }
  let onDiskVerified = false;
  let onDiskReceiptHash = null;
  try {
    const onDisk = JSON.parse(readFileSync(rehearsalReceiptPath, 'utf8'));
    onDiskReceiptHash = onDisk.receiptHash ?? null;
    const onDiskVerification = verifyRehearsalReceipt(onDisk, { expectations });
    onDiskVerified = onDiskVerification.ok === true;
    if (!onDiskVerified) {
      failures.push(
        `the receipt ON DISK at ${rehearsalReceiptPath} does not verify: `
        + `${onDiskVerification.failureReason}`,
      );
    }
    if (onDiskReceiptHash !== receipt.receiptHash) {
      failures.push(
        'the receipt written to disk is not the receipt that was verified in '
        + `memory (${onDiskReceiptHash} != ${receipt.receiptHash})`,
      );
    }
  } catch (error) {
    failures.push(
      `could not read back the rehearsal receipt at ${rehearsalReceiptPath}: `
      + `${error?.message ?? error}`,
    );
  }

  // (4) LIVE MUTATION CONTROLS on today's artifact. Every one is re-signed;
  // every one must be REJECTED. A control that verifies is a checker failure.
  const { deriveAggregate } = await import('./model-village-run-conductor.mjs');
  const mutationControls = [];
  for (const control of MUTATION_CONTROLS) {
    let rejected = false;
    let failureReason = null;
    try {
      const mutated = reSign(receipt, control, deriveAggregate);
      const result = verifyRehearsalReceipt(mutated, { expectations });
      rejected = result.ok === false;
      failureReason = result.failureReason;
      if (!rejected) {
        // Some mutations are only caught by the recomputed `passed`, which the
        // verifier reports as a failureReason rather than ok:false only when it
        // disagrees. Treat "verified clean" as the ritual signal it is.
        failures.push(
          `mutation control "${control.id}" (${control.description}) was ACCEPTED by `
          + 'verifyRehearsalReceipt after re-signing; the claim boundary is a ritual',
        );
      }
    } catch (error) {
      // A throw is a rejection too, but an unstructured one — record it.
      rejected = true;
      failureReason = `threw: ${error?.message ?? error}`;
    }
    mutationControls.push({
      description: control.description,
      id: control.id,
      rejected,
      rejectionReason: failureReason ? String(failureReason).slice(0, 240) : null,
    });
  }

  // (5) The bounded smoke must be REFUSED by the full-shape table. Proven by
  // running that verification, not by asserting it.
  let smokeRefusedByFullTable = null;
  if (!fullShape) {
    const refusal = verifyRehearsalReceipt(receipt, { expectations: REHEARSAL_EXPECTATIONS });
    smokeRefusedByFullTable = refusal.ok === false;
    if (!smokeRefusedByFullTable) {
      failures.push(
        'a bounded smoke receipt was ACCEPTED by the full twelve-run expectation '
        + 'table; a short run could be handed off as the dress rehearsal',
      );
    }
  }

  // (6) CUSTODY HYGIENE, MEASURED ON THE DISK. A rehearsal's per-run sealed
  // stores contain the sealed validator PKCS8 and custody/key/content-key.bin —
  // the key that opens the ciphertext next to it. The conductor destroys the
  // tree it created; this check reads the filesystem to confirm it actually
  // went, because a best-effort rmSync that silently failed would otherwise
  // leave decryption keys behind with nothing reporting it.
  const scratchRootRemoved = !existsSync(rehearsal.scratchRoot);
  if (!scratchRootRemoved) {
    failures.push(
      `the rehearsal scratch root ${rehearsal.scratchRoot} still exists after the `
      + 'run; it holds each village-run\'s sealed custody store together with its '
      + 'own content key, and must not survive the rehearsal',
    );
  }
  const villageScratchDir = path.join(hololandRoot, '.tmp', 'hololand', 'model-village');
  let residualScratchRoots = 0;
  try {
    residualScratchRoots = readdirSync(villageScratchDir)
      .filter((entry) => entry.startsWith('rehearsal-')
        && statSync(path.join(villageScratchDir, entry)).isDirectory())
      .length;
  } catch {
    residualScratchRoots = 0;
  }

  const perRun = receipt.runs.map((run) => projectRun(run));
  const mutationControlsRejected = mutationControls.filter((entry) => entry.rejected).length;

  const observed = {
    checkWallClockMs: Math.max(0, Date.now() - startedAt),
    custodyResponseReadsObserved: observedInner.custodyResponseReadsObserved,
    innerFenceFetchCallsObserved: observedInner.fetchCallsObserved,
    innerFenceProviderCallsObserved: observedInner.providerFetchCallsObserved,
    modelTurnsResolved: receipt.aggregate.modelTurnsResolved,
    mutationControlsRejected,
    mutationControlsRun: mutationControls.length,
    nonProviderFetchCallTargets: [...observedInner.nonProviderFetchCallTargets],
    onDiskReceiptHash,
    onDiskReceiptVerified: onDiskVerified,
    outerFenceFetchCallsObserved: outerFence.state.calls,
    outerFenceProviderCallsObserved: outerFence.state.providerCalls,
    rehearsalExecuted: true,
    rehearsalPassed: receipt.passed === true,
    rehearsalVerified: verification.ok === true,
    // Counted, not gated: pre-existing trees from earlier builds are somebody
    // else's mess and failing on them would make this gate un-runnable on a
    // dirty machine. Only THIS run's own scratch root is load-bearing.
    residualScratchRoots,
    scratchRootRemoved,
    smokeRefusedByFullTable,
    turnRoundsExecuted: receipt.aggregate.turnRoundsExecuted,
    turnsCompleted: receipt.aggregate.turnOutcomeCounts.completed,
    turnsFailed: receipt.aggregate.turnOutcomeCounts.failed,
    turnsTimedOut: receipt.aggregate.turnOutcomeCounts.timedOut,
    villageRunsExecuted: receipt.aggregate.villageRunsExecuted,
  };

  if (mutationControlsRejected !== mutationControls.length) {
    failures.push(
      `${mutationControls.length - mutationControlsRejected} of `
      + `${mutationControls.length} mutation controls survived verification`,
    );
  }

  const checkReceipt = buildCheckReceipt({
    acceptanceShape: fullShape ? 'full-twelve-run' : 'bounded-smoke',
    aggregate: receipt.aggregate,
    failures,
    mutationControls,
    observed,
    perRun,
    rehearsalReceiptHash: receipt.receiptHash,
    rehearsalReceiptPath,
    requestedRuns: runs,
  });

  const outPath = output
    ? path.resolve(output)
    : path.join(
      hololandRoot,
      ...(fullShape ? DEFAULT_CHECK_OUTPUT : SMOKE_CHECK_OUTPUT).split('/'),
    );
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(checkReceipt, null, 2)}\n`, 'utf8');

  return { failures, output: outPath, rehearsalScratchRoot: rehearsal.scratchRoot, receipt: checkReceipt };
}

export function buildCheckReceipt({
  acceptanceShape,
  aggregate,
  failures,
  mutationControls,
  observed,
  perRun,
  rehearsalReceiptHash,
  rehearsalReceiptPath,
  requestedRuns,
}) {
  const passed = failures.length === 0;
  const body = {
    // Acceptance evidence is DERIVED: only a full twelve-run shape that passed
    // every control can be it. A bounded smoke can never set this true.
    acceptanceEvidence: passed && acceptanceShape === 'full-twelve-run',
    acceptanceShape,
    aggregate,
    declared: {
      gateClosed:
        'HOLOLAND_MODEL_VILLAGE_PRODUCTION_PLAN.md:726 — full twelve-run dress '
        + 'rehearsal using captured responses and zero provider calls.',
      laneStatement:
        'Executed T-7 dress rehearsal plus four out-of-band controls the '
        + 'conductor cannot run against itself: an independent nested fetch '
        + 'fence, five re-signed mutation controls, an on-disk read-back, and '
        + '(for a bounded smoke) a proof that the full-shape table refuses it. '
        + 'Everything in observed{} is measured; everything in declared{} is an '
        + 'author assertion and is not evidence for anything.',
      liveStudyRunClaimed: false,
      openOutcomeTierClaimed: false,
      operationalBlindingProven: false,
      phase1AdmissionClaimed: false,
      providerCallMeasurementScope:
        'globalThis.fetch and the injected fetchImpl handle, measured by TWO '
        + 'nested counting fences whose arithmetic must agree. Raw node:http / '
        + 'node:https sockets, child processes, and references to fetch captured '
        + 'before either fence was installed are OUT of scope and are not '
        + 'measured — they are excluded by a stated rule, not counted as zero.',
      tamperProofReceiptClaimed: false,
      worldMutationPerformedClaimed: false,
    },
    engine: CHECK_ENGINE,
    failures: failures.slice(0, 24).map((entry) => entry.slice(0, 400)),
    generatedAt: new Date().toISOString(),
    mutationControls,
    observed,
    passed,
    perRun,
    rehearsalReceiptHash,
    rehearsalReceiptPath,
    requestedRuns,
    schema: CHECK_RECEIPT_SCHEMA,
  };
  return { ...body, receiptHash: canonicalDigest(body) };
}

/**
 * Verifies a CHECK receipt. Recomputes `passed` and `acceptanceEvidence` rather
 * than reading either, and recomputes the self-hash last.
 */
export function verifyCheckReceipt(receipt) {
  try {
    if (!receipt || typeof receipt !== 'object') throw new Error('check receipt must be an object');
    if (receipt.schema !== CHECK_RECEIPT_SCHEMA) {
      throw new Error(`check receipt schema is not ${CHECK_RECEIPT_SCHEMA}`);
    }
    if (receipt.engine !== CHECK_ENGINE) {
      throw new Error(`check receipt engine is not ${CHECK_ENGINE}`);
    }
    if (!Array.isArray(receipt.failures)) throw new Error('failures must be an array');
    if (receipt.passed !== (receipt.failures.length === 0)) {
      throw new Error('check receipt passed does not match its own failure list');
    }
    if (receipt.acceptanceEvidence
      !== (receipt.passed === true && receipt.acceptanceShape === 'full-twelve-run')) {
      throw new Error(
        'check receipt acceptanceEvidence does not recompute from (passed, acceptanceShape)',
      );
    }
    if (!Array.isArray(receipt.mutationControls) || receipt.mutationControls.length === 0) {
      throw new Error('check receipt carries no mutation controls');
    }
    if (receipt.observed?.mutationControlsRun !== receipt.mutationControls.length) {
      throw new Error('mutationControlsRun does not equal the recorded control list length');
    }
    const rejected = receipt.mutationControls.filter((entry) => entry.rejected === true).length;
    if (receipt.observed?.mutationControlsRejected !== rejected) {
      throw new Error('mutationControlsRejected does not equal the recorded rejections');
    }
    if (receipt.passed === true && rejected !== receipt.mutationControls.length) {
      throw new Error('a check receipt cannot pass while a mutation control survived');
    }
    if (receipt.passed === true && receipt.observed?.outerFenceProviderCallsObserved !== 0) {
      throw new Error('a check receipt cannot pass with a non-zero independent provider count');
    }
    if (receipt.passed === true && receipt.observed?.innerFenceProviderCallsObserved !== 0) {
      throw new Error('a check receipt cannot pass with a non-zero conductor provider count');
    }
    if (receipt.passed === true && receipt.observed?.scratchRootRemoved !== true) {
      throw new Error(
        'a check receipt cannot pass while the rehearsal scratch root — which holds '
        + 'every village-run\'s custody content key — still exists',
      );
    }
    if (!Array.isArray(receipt.perRun)) throw new Error('perRun must be an array');
    if (receipt.perRun.length !== receipt.observed?.villageRunsExecuted) {
      throw new Error('perRun length does not equal the observed village-run count');
    }
    const { receiptHash, ...body } = receipt;
    if (typeof receiptHash !== 'string' || canonicalDigest(body) !== receiptHash) {
      throw new Error('check receipt receiptHash does not recompute');
    }
    return { failureReason: null, ok: true };
  } catch (error) {
    return { failureReason: error?.message ?? String(error), ok: false };
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    help: false, json: false, output: null, root: repoRootDefault,
    runs: FULL_VILLAGE_RUNS, verify: null, verifyRequested: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--json') args.json = true;
    else if (arg === '--verify') {
      args.verifyRequested = true;
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args.verify = next; i += 1; }
    } else if (arg.startsWith('--verify=')) {
      args.verifyRequested = true;
      args.verify = arg.slice('--verify='.length);
    } else if (arg === '--runs') args.runs = Number(argv[++i]);
    else if (arg.startsWith('--runs=')) args.runs = Number(arg.slice('--runs='.length));
    else if (arg === '--root') args.root = argv[++i];
    else if (arg.startsWith('--root=')) args.root = arg.slice('--root='.length);
    else if (arg === '--output') args.output = argv[++i];
    else if (arg.startsWith('--output=')) args.output = arg.slice('--output='.length);
    else {
      const error = new Error(`Unknown argument: ${arg}`);
      error.usage = true;
      throw error;
    }
  }
  if (!Number.isInteger(args.runs) || args.runs < 1 || args.runs > FULL_VILLAGE_RUNS) {
    const error = new Error(`--runs must be an integer in 1..${FULL_VILLAGE_RUNS}`);
    error.usage = true;
    throw error;
  }
  return args;
}

function printHelp() {
  console.log(`HoloLand Model Village T-7 dress-rehearsal check

Executes the twelve-run captured-response dress rehearsal required by
docs/specs/HOLOLAND_MODEL_VILLAGE_PRODUCTION_PLAN.md:726, then runs four
out-of-band controls the conductor cannot run against itself: an independent
nested fetch fence, five RE-SIGNED mutation controls against today's artifact,
an on-disk read-back, and a refusal proof for the bounded smoke.

Usage:
  node scripts/check-hololand-model-village-rehearsal.mjs [options]

Options:
  --runs N         Bounded smoke over the first N village-runs (1..12).
                   Default is the FULL twelve-run shape. A smoke writes to
                   ${SMOKE_RECEIPT_OUTPUT_PATH} and
                   ${SMOKE_CHECK_OUTPUT},
                   never over the full-shape artifacts, and can never be
                   acceptance evidence.
  --verify [path]  Verify an existing rehearsal receipt and exit without running
                   (default ${REHEARSAL_RECEIPT_OUTPUT_PATH}).
  --root <path>    Hololand repository root.
  --output <path>  Check-receipt output path (default ${DEFAULT_CHECK_OUTPUT}).
  --json           Print the check receipt as JSON.
  --help           This text.

Exit codes: 0 pass · 1 failure · 2 usage error.`);
}

async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`[mv-rehearsal] ${error.message}`);
    printHelp();
    return 2;
  }
  if (args.help) { printHelp(); return 0; }

  const hololandRoot = path.resolve(args.root);

  if (args.verifyRequested) {
    const target = args.verify
      ? path.resolve(hololandRoot, args.verify)
      : path.join(hololandRoot, ...REHEARSAL_RECEIPT_OUTPUT_PATH.split('/'));
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(target, 'utf8'));
    } catch (error) {
      console.error(`[mv-rehearsal] verify FAILED — cannot read ${target}: ${error?.message ?? error}`);
      return 1;
    }
    // --verify is receipt verification ONLY. It is deliberately held to the
    // FULL twelve-run table so it can never certify a short receipt, and it
    // never sets acceptanceEvidence — only an execution can.
    const verification = verifyRehearsalReceipt(parsed);
    const checkVerification = parsed.schema === CHECK_RECEIPT_SCHEMA
      ? verifyCheckReceipt(parsed)
      : null;
    if (checkVerification) {
      console.log(`[mv-rehearsal] target is a CHECK receipt: ${target}`);
      console.log(`  verified: ${checkVerification.ok}`);
      if (!checkVerification.ok) console.error(`  reason: ${checkVerification.failureReason}`);
      if (args.json) console.log(JSON.stringify(parsed, null, 2));
      return checkVerification.ok ? 0 : 1;
    }
    if (!verification.ok) {
      console.error(`[mv-rehearsal] verify FAILED: ${verification.failureReason}`);
      return 1;
    }
    console.log(`[mv-rehearsal] verify ok — ${target}`);
    console.log(`  receiptHash:          ${parsed.receiptHash}`);
    console.log(`  rehearsalRoot:        ${parsed.aggregate.rehearsalRoot}`);
    console.log(`  villageRunsExecuted:  ${parsed.aggregate.villageRunsExecuted}`);
    console.log(`  modelTurnsResolved:   ${parsed.aggregate.modelTurnsResolved}`);
    console.log(`  providerCalls:        ${parsed.observed.providerFetchCallsObserved} (measured)`);
    console.log(`  generatedAt:          ${parsed.generatedAt}`);
    console.log(
      '  NOTE: this is receipt verification, not execution. It is NOT acceptance '
      + 'evidence for a fresh tree.',
    );
    if (args.json) console.log(JSON.stringify(parsed, null, 2));
    return 0;
  }

  const fullShape = args.runs === FULL_VILLAGE_RUNS;
  console.log(
    `[mv-rehearsal] executing ${args.runs}-run ${fullShape ? 'FULL dress rehearsal' : 'BOUNDED SMOKE'} `
    + `at ${hololandRoot}`,
  );

  let result;
  try {
    result = await runRehearsalCheck({
      json: args.json,
      output: args.output,
      root: hololandRoot,
      runs: args.runs,
    });
  } catch (error) {
    console.error('[mv-rehearsal] FAILED — the rehearsal did not complete');
    console.error(error?.stack ?? error?.message ?? error);
    return 1;
  }

  const { receipt } = result;
  const selfCheck = verifyCheckReceipt(receipt);

  if (args.json) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    const o = receipt.observed;
    console.log('');
    console.log(`[mv-rehearsal] shape:            ${receipt.acceptanceShape}`);
    console.log(`[mv-rehearsal] villageRuns:      ${o.villageRunsExecuted}/${receipt.requestedRuns}`);
    console.log(`[mv-rehearsal] turnRounds:       ${o.turnRoundsExecuted}`);
    console.log(
      `[mv-rehearsal] modelTurns:       ${o.modelTurnsResolved} `
      + `(completed ${o.turnsCompleted} / failed ${o.turnsFailed} / timedOut ${o.turnsTimedOut})`,
    );
    console.log(
      `[mv-rehearsal] providerCalls:    ${o.innerFenceProviderCallsObserved} `
      + `(conductor fence) · ${o.outerFenceProviderCallsObserved} (independent outer fence) `
      + `— MEASURED, from counters`,
    );
    console.log(
      `[mv-rehearsal] fetch total:      ${o.innerFenceFetchCallsObserved} inner / `
      + `${o.outerFenceFetchCallsObserved} outer · non-provider targets: `
      + `${o.nonProviderFetchCallTargets.join(', ') || 'none'}`,
    );
    console.log(`[mv-rehearsal] custody reads:    ${o.custodyResponseReadsObserved}`);
    console.log(
      `[mv-rehearsal] mutationControls: ${o.mutationControlsRejected}/${o.mutationControlsRun} rejected`,
    );
    for (const control of receipt.mutationControls) {
      console.log(`    ${control.rejected ? 'REJECTED' : 'ACCEPTED !!'}  ${control.id}: ${control.description}`);
    }
    console.log(`[mv-rehearsal] onDiskVerified:   ${o.onDiskReceiptVerified} (${receipt.rehearsalReceiptPath})`);
    console.log(
      `[mv-rehearsal] custodyHygiene:   scratchRootRemoved=${o.scratchRootRemoved} `
      + `(measured on disk) · residual rehearsal-* trees from earlier runs: ${o.residualScratchRoots}`,
    );
    if (receipt.acceptanceShape === 'bounded-smoke') {
      console.log(`[mv-rehearsal] smokeRefused:     ${o.smokeRefusedByFullTable} (by the full twelve-run table)`);
    }
    console.log('');
    console.log('[mv-rehearsal] per village-run:');
    for (const run of receipt.perRun) {
      console.log(
        `    ${run.runId.padEnd(38)} seats=${run.seatsStaged} rounds=${run.turnRounds} `
        + `turns=${run.turnsExecuted} admit=${run.admitted} deny=${run.denied} `
        + `(preauth=${run.preauthorizedMatch}/noMatch=${run.noPreauthorizedMatch}) `
        + `chain=${run.chainVerified ? 'ok' : 'FAIL'} sig=${run.runManifestSignatureVerified ? 'ok' : 'FAIL'} `
        + `isolated=${run.isolationProven ? 'yes' : 'NO'} root=${run.receiptChainRoot.slice(0, 12)}`,
      );
    }
    console.log('');
    for (const failure of receipt.failures) console.error(`[mv-rehearsal] FAILURE ${failure}`);
    console.log(
      `[mv-rehearsal] ${receipt.passed ? 'PASS' : 'FAIL'} — acceptanceEvidence=${receipt.acceptanceEvidence} `
      + `checkReceipt=${result.output}`,
    );
    console.log(
      'claim boundary: replayed captured responses only; no live study run, no '
      + 'operational blinding proof, no open-outcome tier, no Phase-1 admission, '
      + 'no world mutation. The receipt is tamper-EVIDENT, not tamper-proof.',
    );
  }

  if (!selfCheck.ok) {
    console.error(`[mv-rehearsal] check receipt failed its own verification: ${selfCheck.failureReason}`);
    return 1;
  }
  return receipt.passed ? 0 : 1;
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(path.resolve(invokedPath)).href) {
  main()
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      console.error('[mv-rehearsal] FAILED');
      console.error(error?.stack ?? error?.message ?? error);
      process.exitCode = 1;
    });
}
