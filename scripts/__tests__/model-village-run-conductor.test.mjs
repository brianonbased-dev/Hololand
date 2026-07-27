/* global Buffer, structuredClone */

// Offline tests for the Model Village run conductor (the T-7 twelve-run dress
// rehearsal). node --test, node builtins only, zero network.
//
// NOTE ON THE PROBE URL BELOW. The provider-call tests dispatch against
// `http://provider.invalid/...`. `.invalid` is reserved by RFC 2606 and can
// never resolve, and in any case the fence REFUSES every absolute-http target
// before delegating, so no socket is ever opened. It is a sentinel chosen to
// exercise the classifier, not a stand-in for a real service.
//
// TWO THINGS THESE TESTS EXIST TO PROVE, because the audit that preceded this
// slice found both absent across the lane:
//
//  (1) THE PROVIDER-CALL COUNTER IS REAL. The lane's previous zero was
//      assert(0 === 0): the lifecycle emitted the literal `providerCalls: 0`
//      and then asserted the sum was 0, with nothing intercepting fetch. Here a
//      turn executor is fed that DOES call the fetch handed down to it, and the
//      rehearsal must FAIL — with every other measurement still green, so the
//      failure is attributable to the counter alone.
//
//  (2) THE CLAIM BOUNDARY SURVIVES CONSTANT MUTATION. Following the only
//      template in this lane that survived it
//      (__tests__/hololand-model-village-alias-custody.test.mjs:477-496): flip
//      a claim, RE-SIGN the receipt so the hash recomputes, and assert the
//      verifier still rejects with a specific reason. A boundary that only
//      catches un-re-hashed edits is a ritual.

import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, test } from 'node:test';

import {
  REHEARSAL_EXPECTATIONS,
  buildSeatAliasBindings,
  buildVillageRunPlan,
  createReplayTurnExecutor,
  deriveAggregate,
  installProviderCallFence,
  isProviderFetchTarget,
  loadStudyPolicyManifest,
  runRehearsal,
  verifyRehearsalReceipt,
} from '../model-village-run-conductor.mjs';
import { loadFrozenAssignmentMatrix } from '../model-village-alias-vault.mjs';
import { canonicalDigest } from '../model-village-phase0b-runtime.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const scratchBase = path.join(repoRoot, '.tmp', 'hololand', 'model-village', 'conductor-tests');

/** Reserved, non-resolvable, and refused by the fence before any dispatch. */
const PROBE_TARGET = 'http://provider.invalid/v1/chat/completions';

/** Re-signs a mutated receipt body so the self-hash recomputes cleanly. */
function reSign(receipt, mutate) {
  const unsigned = { ...receipt };
  delete unsigned.receiptHash;
  const mutated = mutate(structuredClone(unsigned));
  return { ...mutated, receiptHash: canonicalDigest(mutated) };
}

after(() => {
  if (existsSync(scratchBase)) {
    try {
      rmSync(scratchBase, { force: true, recursive: true });
    } catch {
      // Windows can hold a handle briefly after teardown; leftover scratch is
      // not a test failure.
    }
  }
});

// ---------------------------------------------------------------------------

describe('study policy source', () => {
  let studyBundle;

  before(async () => {
    studyBundle = await loadStudyPolicyManifest({ hololandRoot: repoRoot });
  });

  test('mv-study-policy-v1 carries the study shape the production plan requires', () => {
    assert.equal(studyBundle.policy.policyId, 'mv-study-policy-v1');
    assert.equal(studyBundle.policy.residentsPerTurn, 6);
    assert.equal(studyBundle.policy.turnsPerRun, 6);
    assert.equal(studyBundle.policy.concurrencyLimit, 2);
    assert.equal(studyBundle.policy.retryCount, 0);
    assert.equal(studyBundle.policy.adjudicationDefault, 'deny');
    assert.equal(
      studyBundle.policy.barrierRule,
      'all-turns-resolved-before-any-adjudication',
    );
  });

  test('the lane statement REQUIRES sealed alias assignment (the inverse of mv-b2)', () => {
    const statement = studyBundle.policy.laneStatement;
    assert.match(statement, /sealed alias assignment is REQUIRED/i);
    // The MV-B2 clause that seals that policy against MV-B3 must NOT be
    // restated here — that is the whole reason this is a new source.
    assert.doesNotMatch(statement, /no blinded alias assignment is performed/i);
  });

  test('the vocabulary is referenced, never duplicated', () => {
    assert.equal(
      studyBundle.policy.vocabularyRef,
      'model-village-adapter-custody-drill.hs#ModelVillageProposalVocabulary',
    );
    // The loaded vocabulary is MV-B1's, arriving through MV-B1's own loader.
    assert.deepEqual(
      [...studyBundle.vocabulary.allowedActions].sort(),
      ['abstain', 'contribute_water'],
    );
    assert.equal(studyBundle.vocabulary.defaultDecision, 'deny');
  });

  test('the pre-authorized catalog is wider than one action and states its own limit', () => {
    assert.ok(
      studyBundle.catalogActions.length >= 2,
      'a one-action catalog is a permission check, not a choice set',
    );
    const actions = studyBundle.catalogActions.map((entry) => entry.action).sort();
    assert.deepEqual(actions, ['abstain', 'contribute_water']);
    assert.match(studyBundle.catalog.catalogStatement, /catalog width/i);
    assert.match(
      studyBundle.catalog.catalogStatement,
      /idea-seeds\/2026-07-26-open-outcome-receipt-tier\.md/,
    );
  });

  test('the block order is derived from the frozen kernel, not authored beside it', () => {
    // Loading already refuses on disagreement; this pins the observed values.
    assert.deepEqual(studyBundle.conditionOrder.block1, [
      'mixed', 'adapter_a_only', 'adapter_b_only', 'adapter_c_only',
    ]);
    assert.deepEqual(studyBundle.conditionOrder.block2, [
      'adapter_b_only', 'adapter_c_only', 'mixed', 'adapter_a_only',
    ]);
    assert.deepEqual(studyBundle.conditionOrder.block3, [
      'adapter_c_only', 'adapter_b_only', 'adapter_a_only', 'mixed',
    ]);
  });

  test('the scheduler projection is the exact eight-key bundle MV-B2 accepts', () => {
    assert.deepEqual(
      Object.keys(studyBundle.schedulerPolicyBundle).sort(),
      [
        'manifestHash', 'policy', 'policyHash', 'preauthorizedCatalog',
        'promptTemplate', 'snapshotFixture', 'vocabulary', 'vocabularyHash',
      ],
    );
    assert.equal(
      studyBundle.schedulerPolicyBundle.policyHash,
      studyBundle.schedulerPolicyBundle.manifestHash,
    );
  });

  test('the plan is three seed blocks of four conditions = twelve village-runs', () => {
    const plan = buildVillageRunPlan(studyBundle);
    assert.equal(plan.length, 12);
    assert.equal(new Set(plan.map((run) => run.runId)).size, 12);
    assert.deepEqual([...new Set(plan.map((run) => run.dayIndex))], [1, 2, 3]);
  });

  test('homogeneous conditions give all six seats one alias; mixed takes the latin square row', () => {
    const matrixBundle = loadFrozenAssignmentMatrix({ hololandRoot: repoRoot });
    const homogeneous = buildSeatAliasBindings({
      blockId: 'block1',
      condition: 'adapter_b_only',
      matrix: matrixBundle.matrix,
    });
    assert.equal(homogeneous.length, 6);
    assert.deepEqual([...new Set(homogeneous.map((b) => b.adapterAlias))], ['adapter_b']);

    const mixed = buildSeatAliasBindings({
      blockId: 'block1',
      condition: 'mixed',
      matrix: matrixBundle.matrix,
    });
    assert.deepEqual(
      mixed.map((b) => b.adapterAlias),
      matrixBundle.matrix.blocks.block1,
    );
    // Seat -> alias is public study vocabulary; no route ever appears here.
    assert.equal(canonicalDigest(mixed).length, 64);
    assert.doesNotMatch(JSON.stringify(mixed), /sovereign-|http/i);
  });
});

// ---------------------------------------------------------------------------

describe('provider-call fence', () => {
  test('classifies absolute http targets as provider calls and everything else as not', () => {
    assert.equal(isProviderFetchTarget(PROBE_TARGET), true);
    assert.equal(isProviderFetchTarget('https://example.invalid/x'), true);
    assert.equal(isProviderFetchTarget('/holoscript_wasm_bg.wasm'), false);
    assert.equal(isProviderFetchTarget('file:///tmp/x'), false);
    assert.equal(isProviderFetchTarget('not a url'), false);
  });

  test('the counter increments and the provider call is refused', async () => {
    const fence = installProviderCallFence();
    try {
      await assert.rejects(
        () => fence.fetch(PROBE_TARGET),
        /provider call was attempted/,
      );
      assert.equal(fence.state.providerCalls, 1);
      assert.equal(fence.state.calls, 1);
      assert.deepEqual(fence.state.providerTargets, [PROBE_TARGET]);
    } finally {
      fence.restore();
    }
  });

  test('restore puts the original binding back', () => {
    const original = globalThis.fetch;
    const fence = installProviderCallFence();
    assert.notEqual(globalThis.fetch, original);
    fence.restore();
    assert.equal(globalThis.fetch, original);
  });
});

// ---------------------------------------------------------------------------

describe('the twelve-run dress rehearsal', () => {
  let result;
  let receipt;

  before(async () => {
    result = await runRehearsal({
      hololandRoot: repoRoot,
      scratchRoot: path.join(scratchBase, 'clean'),
      writeReceipt: false,
    });
    receipt = result.receipt;
  });

  test('it executes and passes', () => {
    assert.deepEqual(result.failures, [], 'rehearsal reported expectation failures');
    assert.equal(receipt.passed, true);
    assert.equal(receipt.schema, 'hololand.model-village-rehearsal.v1');
    assert.equal(receipt.studyPolicyId, 'mv-study-policy-v1');
  });

  test('the twelve-run shape actually ran', () => {
    assert.equal(receipt.runs.length, 12);
    assert.equal(receipt.aggregate.villageRunsExecuted, 12);
    assert.equal(receipt.aggregate.turnRoundsExecuted, 72);
    assert.equal(receipt.aggregate.modelTurnsResolved, 432);
    assert.equal(receipt.aggregate.turnOutcomeCounts.completed, 432);
    assert.equal(receipt.aggregate.turnOutcomeCounts.failed, 0);
    assert.equal(receipt.aggregate.turnOutcomeCounts.timedOut, 0);
    for (const run of receipt.runs) {
      assert.equal(run.turnRounds.length, 6);
    }
  });

  test('zero provider calls, MEASURED — and non-provider traffic is published, not hidden', () => {
    assert.equal(receipt.observed.providerFetchCallsObserved, 0);
    assert.deepEqual(receipt.observed.providerFetchCallTargets, []);
    // The fence saw at least the HoloScript core WASM initialization. It is
    // counted and named rather than silently excluded.
    assert.ok(receipt.observed.fetchCallsObserved >= 0);
    assert.equal(
      receipt.observed.nonProviderFetchCallTargets.every(
        (target) => !isProviderFetchTarget(target),
      ),
      true,
    );
  });

  test('every replayed turn was one sealed-custody read', () => {
    assert.equal(
      receipt.observed.custodyResponseReadsObserved,
      receipt.aggregate.modelTurnsResolved,
    );
    assert.equal(receipt.observed.custodyResponseReadsObserved, 432);
  });

  test('all five slices actually composed', () => {
    // MV-B2 isolation: twelve distinct shards, none carrying cross-run state.
    assert.equal(receipt.aggregate.distinctRunDirectoryCount, 12);
    assert.equal(receipt.aggregate.crossRunStateFindings, 0);
    // MV-B3 alias vault: sealed per block, and the sealed record re-derived
    // every public commitment at unblinding.
    assert.equal(receipt.observed.aliasBlocksSealed, 3);
    assert.equal(receipt.observed.aliasUnblindingsVerified, 3);
    assert.equal(receipt.observed.aliasCommitmentVerificationFailures, 0);
    // MV-B4: the conductor's OWN run manifest is the one that was signed and
    // fleet-verified against the published trust registry.
    assert.equal(receipt.observed.trustRegistryEntriesAppended, 12);
    assert.equal(receipt.observed.trustRegistryVerified, true);
    assert.equal(receipt.aggregate.runManifestSignaturesVerified, 12);
    assert.equal(receipt.aggregate.runManifestSignatureFailures, 0);
    // MV-B2 adjudication chains close on every round of every run.
    assert.equal(receipt.aggregate.chainVerificationFailures, 0);
    assert.equal(receipt.aggregate.schedulerFrozenRounds, 0);
  });

  test('both catalog entries were exercised, so the wider catalog is not decorative', () => {
    const counts = receipt.aggregate.decisionCounts;
    assert.ok(counts.preauthorizedMatch > 0, 'the gating action never occurred');
    assert.ok(counts.noPreauthorizedMatch > 0, 'the deny case never occurred');
    assert.equal(counts.admitted, counts.preauthorizedMatch + counts.noPreauthorizedMatch);
    assert.equal(counts.admitted + counts.denied, receipt.aggregate.modelTurnsResolved);
  });

  test('no route identity leaks into the public rehearsal receipt', () => {
    const serialized = JSON.stringify(receipt);
    assert.doesNotMatch(serialized, /sovereign-holoserve|sovereign-holollama/);
    assert.doesNotMatch(serialized, /127\.0\.0\.1|192\.168\./);
  });

  test('the receipt verifies', () => {
    const check = verifyRehearsalReceipt(receipt);
    assert.equal(check.ok, true, check.failureReason);
    assert.deepEqual(check.failures, []);
  });

  // -------------------------------------------------------------------------
  // Claim enforcement: flip AND RE-SIGN.
  // -------------------------------------------------------------------------

  test('a flipped `passed` cannot be laundered by re-signing', () => {
    const forged = reSign(receipt, (body) => {
      body.passed = false;
      return body;
    });
    const check = verifyRehearsalReceipt(forged);
    assert.equal(check.ok, false, '`passed` was allowed to disagree with the recomputation');
    assert.match(check.failureReason, /does not match the recomputed verdict/);
  });

  test('a flipped observed counter cannot be laundered by re-signing', () => {
    for (const [key, value] of [
      ['providerFetchCallsObserved', 7],
      ['custodyResponseReadsObserved', 431],
      ['aliasBlocksSealed', 2],
      ['aliasUnblindingsVerified', 0],
      ['trustRegistryEntriesAppended', 11],
    ]) {
      const forged = reSign(receipt, (body) => {
        body.observed = { ...body.observed, [key]: value };
        return body;
      });
      const check = verifyRehearsalReceipt(forged);
      assert.equal(check.ok, false, `observed.${key} was allowed to be rewritten`);
    }
  });

  test('a flipped aggregate cannot be laundered by re-signing (it is re-derived)', () => {
    for (const mutate of [
      (body) => { body.aggregate = { ...body.aggregate, villageRunsExecuted: 13 }; return body; },
      (body) => { body.aggregate = { ...body.aggregate, modelTurnsResolved: 999 }; return body; },
      (body) => { body.aggregate = { ...body.aggregate, rehearsalRoot: '0'.repeat(64) }; return body; },
    ]) {
      const forged = reSign(receipt, mutate);
      const check = verifyRehearsalReceipt(forged);
      assert.equal(check.ok, false, 'a rewritten aggregate survived');
      assert.match(check.failureReason, /aggregate does not re-derive/);
    }
  });

  test('a run entry cannot be dropped, and a dropped run cannot be papered over', () => {
    const forged = reSign(receipt, (body) => {
      body.runs = body.runs.slice(0, 11);
      return body;
    });
    const check = verifyRehearsalReceipt(forged);
    assert.equal(check.ok, false);
    assert.match(check.failureReason, /aggregate does not re-derive/);

    // ...and rebuilding the aggregate around the drop still hits the
    // independent expectation table.
    const forgedConsistent = reSign(receipt, (body) => {
      body.runs = body.runs.slice(0, 11);
      body.aggregate = deriveAggregate(body.runs);
      return body;
    });
    const consistentCheck = verifyRehearsalReceipt(forgedConsistent);
    assert.equal(consistentCheck.ok, false);
    assert.match(consistentCheck.failureReason, /recomputed verdict/);
  });

  test('a run entry field cannot be edited without breaking its own entryHash', () => {
    const forged = reSign(receipt, (body) => {
      body.runs = body.runs.map((run, index) => (
        index === 0 ? { ...run, chainVerified: false } : run
      ));
      return body;
    });
    const check = verifyRehearsalReceipt(forged);
    assert.equal(check.ok, false);
    assert.match(check.failureReason, /entryHash does not recompute/);
  });

  test('a re-signed run entry still cannot break the round chain', () => {
    const forged = reSign(receipt, (body) => {
      const run = structuredClone(body.runs[0]);
      delete run.entryHash;
      run.turnRounds[3].priorReceiptHash = '0'.repeat(64);
      run.turnRounds[3].terminalReceiptHash = '1'.repeat(64);
      const resealed = { ...run, entryHash: canonicalDigest(run) };
      body.runs = [resealed, ...body.runs.slice(1)];
      body.aggregate = deriveAggregate(body.runs);
      return body;
    });
    const check = verifyRehearsalReceipt(forged);
    assert.equal(check.ok, false, 'a broken round chain survived a full re-sign');
    assert.match(
      check.failureReason,
      /does not chain from|does not recompute from its round chain/,
    );
  });

  test('a pinned declared flag cannot be flipped, even with a recomputed hash', () => {
    for (const flag of [
      'liveStudyRunClaimed',
      'openOutcomeTierClaimed',
      'operationalBlindingProven',
      'phase1AdmissionClaimed',
      'tamperProofReceiptClaimed',
      'worldMutationPerformedClaimed',
    ]) {
      const forged = reSign(receipt, (body) => {
        body.declared = { ...body.declared, [flag]: true };
        return body;
      });
      const check = verifyRehearsalReceipt(forged);
      assert.equal(check.ok, false, `${flag} was allowed to flip to true`);
      assert.match(check.failureReason, /pinned claim flag/);
    }
  });

  test('declared{} may not shadow a measured key', () => {
    const forged = reSign(receipt, (body) => {
      body.declared = { ...body.declared, providerFetchCallsObserved: 0 };
      return body;
    });
    const check = verifyRehearsalReceipt(forged);
    assert.equal(check.ok, false);
    assert.match(check.failureReason, /keys differ|shadows a measured key/);
  });

  test('an un-re-signed edit still fails on the self-hash', () => {
    const edited = { ...receipt, generatedAt: '2000-01-01T00:00:00.000Z' };
    const check = verifyRehearsalReceipt(edited);
    assert.equal(check.ok, false);
    assert.match(check.failureReason, /receiptHash does not recompute/);
  });

  test('a provider call cannot be reclassified out of the gated count', () => {
    const forged = reSign(receipt, (body) => {
      body.observed = {
        ...body.observed,
        fetchCallsObserved: body.observed.fetchCallsObserved + 1,
        nonProviderFetchCallTargets: [
          ...body.observed.nonProviderFetchCallTargets,
          PROBE_TARGET,
        ],
      };
      return body;
    });
    const check = verifyRehearsalReceipt(forged);
    assert.equal(check.ok, false);
    assert.match(check.failureReason, /recomputed verdict/);
  });
});

// ---------------------------------------------------------------------------

describe('the provider-call counter is load-bearing', () => {
  let receipt;
  let failures;

  before(async () => {
    // An executor that calls the fetch the conductor hands down, swallows the
    // refusal, and then replays normally. EVERYTHING else about this run is
    // green — every turn completes, every chain verifies, every signature
    // verifies — so the only thing that can fail the rehearsal is the measured
    // provider-call count. That is what makes this a test of the counter
    // rather than a test of the executor.
    const result = await runRehearsal({
      hololandRoot: repoRoot,
      scratchRoot: path.join(scratchBase, 'provider-call'),
      turnExecutorFactory: (context) => {
        const inner = createReplayTurnExecutor({
          captureIndex: context.captureIndex,
          readCounter: context.readCounter,
          turnCursor: context.turnCursor,
          vocabulary: context.vocabulary,
        });
        return async (args) => {
          try {
            await args.fetchImpl(PROBE_TARGET);
          } catch {
            // The fence refused it. It was still counted — that is the point.
          }
          return inner(args);
        };
      },
      writeReceipt: false,
    });
    receipt = result.receipt;
    failures = result.failures;
  });

  test('the rehearsal FAILS', () => {
    assert.equal(receipt.passed, false, 'a rehearsal that made provider calls passed');
    assert.ok(failures.length > 0);
    assert.ok(
      failures.some((entry) => entry.includes('providerFetchCallsObserved')),
      `provider-call failure not reported; got ${JSON.stringify(failures)}`,
    );
  });

  test('the counter actually counted — one call per model turn', () => {
    assert.equal(receipt.observed.providerFetchCallsObserved, 432);
    assert.equal(
      receipt.observed.providerFetchCallsObserved,
      receipt.aggregate.modelTurnsResolved,
    );
    assert.ok(receipt.observed.providerFetchCallTargets.length > 0);
    assert.equal(
      isProviderFetchTarget(receipt.observed.providerFetchCallTargets[0]),
      true,
    );
  });

  test('nothing ELSE failed, so the failure is attributable to the counter alone', () => {
    assert.equal(receipt.aggregate.turnOutcomeCounts.completed, 432);
    assert.equal(receipt.aggregate.turnOutcomeCounts.failed, 0);
    assert.equal(receipt.aggregate.chainVerificationFailures, 0);
    assert.equal(receipt.aggregate.runManifestSignatureFailures, 0);
    assert.equal(receipt.aggregate.villageRunsExecuted, 12);
  });

  test('the failing receipt still verifies as an honest record of failure', () => {
    const check = verifyRehearsalReceipt(receipt);
    assert.equal(check.ok, true, check.failureReason);
    assert.ok(check.failures.length > 0);
  });

  test('the failure cannot be laundered by flipping `passed` and re-signing', () => {
    const forged = reSign(receipt, (body) => {
      body.passed = true;
      return body;
    });
    const check = verifyRehearsalReceipt(forged);
    assert.equal(check.ok, false, 'a failed rehearsal was laundered into a pass');
    assert.match(check.failureReason, /does not match the recomputed verdict/);
  });

  test('zeroing the counter alone breaks its own incident log', () => {
    const forged = reSign(receipt, (body) => {
      body.observed = { ...body.observed, providerFetchCallsObserved: 0 };
      body.passed = true;
      return body;
    });
    const check = verifyRehearsalReceipt(forged);
    assert.equal(check.ok, false, 'the counter was zeroed without contradiction');
    assert.match(check.failureReason, /recomputed verdict/);
  });
});

// ---------------------------------------------------------------------------

describe('expectation table', () => {
  test('the twelve-run arithmetic is internally consistent', () => {
    const e = REHEARSAL_EXPECTATIONS;
    assert.equal(e.villageRunsExecuted, 12);
    assert.equal(e.turnRoundsExecuted, e.villageRunsExecuted * 6);
    assert.equal(e.modelTurnsResolved, e.turnRoundsExecuted * 6);
    assert.equal(
      e.modelTurnsResolved,
      e.turnsCompleted + e.turnsFailed + e.turnsTimedOut,
    );
    assert.equal(e.providerFetchCallsObserved, 0);
  });

  test('deriveAggregate refuses a non-array', () => {
    assert.throws(() => deriveAggregate(null), /runs must be an array/);
  });

  test('Buffer-backed hashing is available offline', () => {
    assert.equal(canonicalDigest({ a: Buffer.from('x').toString('hex') }).length, 64);
  });
});
