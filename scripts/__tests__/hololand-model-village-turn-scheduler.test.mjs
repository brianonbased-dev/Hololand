#!/usr/bin/env node
/* global process, structuredClone */

// MV-B2 turn scheduler integration checker tests. FULLY OFFLINE: the run
// uses skipLive semantics, so both runs (mv-b2-live-r1 and mv-b2-live-r2)
// are served by the checker's in-process loopback stubs (ephemeral ports) --
// the same offline convention as the MV-B1 checker test. The deterministic
// V4 lane executes locally against the built HoloScript dist. Nothing here
// claims a live study run, Phase 1 admission, blinded alias assignment, or
// open-outcome canonical mutation: live proposals gate, deterministic
// receipts mutate, and this suite proves the whole chain end to end.

import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { canonicalDigest } from '../model-village-phase0b-runtime.mjs';
import {
  TURN_SCHEDULER_RECEIPT_SCHEMA,
  runTurnSchedulerCheck,
  verifyTurnSchedulerReceipt,
} from '../check-hololand-model-village-turn-scheduler.mjs';
import { loadTurnPolicyManifest } from '../model-village-turn-scheduler.mjs';
import {
  loadAdapterCustodyDrillManifest,
} from '../model-village-adapter-runtime.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..', '..');

const scratchDir = mkdtempSync(
  path.join(os.tmpdir(), 'mv-b2-turn-scheduler-'),
);
const storeParent = path.join(scratchDir, 'stores');
const outputPath = path.join(scratchDir, 'receipt.json');

// The deterministic lane leaves disposable fault/mismatch scratch stores;
// the checker cleans its own-pid stores itself, but clean again after the
// suite in case an assertion failure interrupted the checker mid-flight.
const tracerScratchRoot = path.join(
  repoRoot, '.tmp', 'hololand', 'model-village', 'phase0b-runtime',
);
const tracerScratchPattern = new RegExp(
  '^(main|fault-before-rename|fault-after-rename|mismatch-target'
  + `|mismatch-state-hashes)-${process.pid}-`,
);

const policyBundle = await loadTurnPolicyManifest({ hololandRoot: repoRoot });
const drillBundle = await loadAdapterCustodyDrillManifest({
  hololandRoot: repoRoot,
});

// One shared offline check run; every test below asserts against its receipt.
const { receipt, output, rounds } = await runTurnSchedulerCheck({
  root: repoRoot,
  output: outputPath,
  storeRoot: storeParent,
  skipLive: true,
});

const RESIDENT_IDS = [
  'resident-01', 'resident-02', 'resident-03',
  'resident-04', 'resident-05', 'resident-06',
];
// Stub proposal plan: route[0] (holoserve twin) proposes the catalog action,
// route[1] (jetson twin) abstains; residents ride round-robin, so EVEN
// indexes (01/03/05) are catalog matches and ODD indexes are valid
// non-matches.
const MATCH_INDEXES = [0, 2, 4];
const NON_MATCH_INDEXES = [1, 3, 5];

test.after(() => {
  rmSync(scratchDir, { recursive: true, force: true });
  if (existsSync(tracerScratchRoot)) {
    for (const entry of readdirSync(tracerScratchRoot)) {
      if (tracerScratchPattern.test(entry)) {
        rmSync(path.join(tracerScratchRoot, entry), {
          recursive: true,
          force: true,
        });
      }
    }
  }
});

test('receipt schema, manifest binding, and on-disk copy', () => {
  assert.equal(receipt.schema, TURN_SCHEDULER_RECEIPT_SCHEMA);
  assert.equal(receipt.schema, 'hololand.model-village-turn-scheduler.v1');
  assert.equal(receipt.policyHash, policyBundle.policyHash);
  assert.equal(receipt.vocabularyHash, policyBundle.vocabularyHash);
  assert.equal(output, outputPath);
  const onDisk = JSON.parse(readFileSync(outputPath, 'utf8'));
  assert.deepEqual(onDisk, JSON.parse(JSON.stringify(receipt)));

  assert.equal(receipt.runs.length, 2);
  assert.equal(receipt.runs[0].runId, 'mv-b2-live-r1');
  assert.equal(receipt.runs[1].runId, 'mv-b2-live-r2');
  // skipLive: run 1 is stubbed too, so live is false on BOTH runs and the
  // claim boundary must say no sovereign route was exercised.
  assert.equal(receipt.runs[0].live, false);
  assert.equal(receipt.runs[1].live, false);
  assert.equal(receipt.claimBoundary.liveSovereignRouteExercised, false);
});

test('routes certify and residents map round-robin across certified routes', () => {
  for (const run of receipt.runs) {
    assert.equal(run.routeCertifications.length, 2);
    const [first, second] = run.routeCertifications;
    assert.equal(first.routeId, drillBundle.routes[0].routeId);
    assert.equal(first.required, true);
    assert.equal(first.certified, true);
    assert.equal(first.stubbed, true);
    assert.equal(first.declaredEndpoint, drillBundle.routes[0].endpoint);
    // Under stubs the endpoint actually used is the ephemeral loopback
    // stub, never the declared sovereign endpoint.
    assert.notEqual(first.endpointUsed, first.declaredEndpoint);
    assert.equal(second.routeId, drillBundle.routes[1].routeId);
    assert.equal(second.required, false);
    assert.equal(second.certified, true);

    assert.equal(run.residentRouteMapping.length, 6);
    run.residentRouteMapping.forEach((entry, index) => {
      assert.equal(entry.residentId, RESIDENT_IDS[index]);
      const expectedRoute = run.routeCertifications[index % 2];
      assert.equal(entry.routeId, expectedRoute.routeId);
      assert.equal(
        entry.certificationReceiptHash,
        expectedRoute.certificationReceiptHash,
      );
    });
  }
});

test('proposal barrier closes before any adjudication (temporal + structural)', () => {
  for (const [runIndex, run] of receipt.runs.entries()) {
    const barrier = run.barrierReceipt;
    assert.equal(barrier.frozen, false);
    assert.equal(barrier.orderedTurnReceiptHashes.length, 6);
    assert.deepEqual(barrier.resolvedCounts, {
      completed: 6,
      failed: 0,
      timedOut: 0,
    });
    assert.equal(barrier.priorReceiptHash, receipt.policyHash);
    assert.deepEqual(run.contaminationRegister, []);

    // Temporal: every turn resolved at-or-before barrier close, and every
    // decision was made at-or-after barrier close.
    const closedAtMs = Date.parse(barrier.closedAt);
    for (const record of rounds[runIndex].round.turnReceipts) {
      assert.ok(Date.parse(record.resolvedAt) <= closedAtMs);
    }
    for (const decision of run.actionDecisionReceipts) {
      assert.ok(Date.parse(decision.decidedAt) >= closedAtMs);
    }

    // Structural: the barrier hash covers ALL six turn record hashes, and
    // the adjudication chain starts from the barrier hash -- so the full
    // turn set was fixed before the first safety/decision receipt existed.
    assert.deepEqual(
      barrier.orderedTurnReceiptHashes,
      rounds[runIndex].round.turnReceipts.map((record) => record.recordHash),
    );
    assert.equal(run.safetyCheckReceipts.length, 6);
    assert.equal(run.actionDecisionReceipts.length, 6);
    assert.equal(
      run.safetyCheckReceipts[0].priorReceiptHash,
      barrier.barrierHash,
    );
    for (let index = 0; index < 6; index += 1) {
      assert.equal(
        run.actionDecisionReceipts[index].priorReceiptHash,
        run.safetyCheckReceipts[index].receiptHash,
      );
      if (index > 0) {
        assert.equal(
          run.safetyCheckReceipts[index].priorReceiptHash,
          run.actionDecisionReceipts[index - 1].receiptHash,
        );
      }
    }

    // The receipted high-water mark must EQUAL the frozen limit: the pool
    // dispatches up to concurrencyLimit turns synchronously before the first
    // executor can resolve, so with six residents a compliant pool always
    // reaches the limit exactly. `=== limit` fails BOTH regressions the
    // review named: a pool collapsing to serial dispatch (mark 1) and a pool
    // ignoring the limit (mark 6). The independent executor-side in-flight
    // counter proof lives in the scheduler unit suite.
    assert.equal(
      barrier.concurrencyHighWaterMark,
      policyBundle.policy.concurrencyLimit,
    );
  }
});

test('exactly one deterministic-lane commit per run; every other outcome is a receipted refusal', () => {
  for (const run of receipt.runs) {
    assert.equal(run.gatedAdmissionReceipts.length, 6);

    // Decisions: catalog matches on the contribute route, admitted
    // non-matches (abstain) on the other.
    for (const index of MATCH_INDEXES) {
      const decision = run.actionDecisionReceipts[index];
      assert.equal(decision.decision, 'admit');
      assert.equal(decision.preauthorizedMatch, true);
      assert.equal(decision.reason, 'admitted_preauthorized_action_match');
    }
    for (const index of NON_MATCH_INDEXES) {
      const decision = run.actionDecisionReceipts[index];
      assert.equal(decision.decision, 'admit');
      assert.equal(decision.preauthorizedMatch, false);
      assert.equal(decision.reason, 'admitted_no_preauthorized_action');
    }

    // Gated admissions: EXACTLY ONE commit (the first catalog match); the
    // other matches are refused already-committed; non-matches are refused
    // no_preauthorized_match. All refusals carry null V4 fields.
    const admitted = run.gatedAdmissionReceipts.filter(
      (entry) => entry.admitted === true,
    );
    assert.equal(admitted.length, 1);
    const commit = run.gatedAdmissionReceipts[0];
    assert.equal(commit.admitted, true);
    assert.equal(commit.residentId, 'resident-01');
    assert.deepEqual(commit.committedAction, {
      action: 'contribute_water',
      amount: 1,
      target: 'commons_cistern',
    });
    assert.equal(commit.mutationExecutedByDeterministicLaneOnly, true);
    assert.match(commit.v4TerminalCommitment, /^[a-f0-9]{64}$/);
    assert.match(commit.persistentStoreStateHash, /^[a-f0-9]{64}$/);
    assert.notEqual(commit.worldStateBeforeHash, commit.worldStateAfterHash);

    for (const index of [2, 4]) {
      const refusal = run.gatedAdmissionReceipts[index];
      assert.equal(refusal.admitted, false);
      assert.equal(
        refusal.refusalClass,
        'preauthorized_action_already_committed',
      );
      assert.equal(refusal.committedAction, null);
      assert.equal(refusal.v4TerminalCommitment, null);
      assert.equal(refusal.mutationExecutedByDeterministicLaneOnly, true);
    }
    for (const index of NON_MATCH_INDEXES) {
      const refusal = run.gatedAdmissionReceipts[index];
      assert.equal(refusal.admitted, false);
      assert.equal(refusal.refusalClass, 'no_preauthorized_match');
      assert.equal(refusal.reason, 'admitted_no_preauthorized_action');
      assert.equal(refusal.persistentStoreStateHash, null);
    }

    // Admission chain: first gated receipt chains from the LAST decision
    // receipt (admission strictly after adjudication), then each receipt
    // chains onto the previous one.
    assert.equal(
      run.gatedAdmissionReceipts[0].priorReceiptHash,
      run.actionDecisionReceipts[5].receiptHash,
    );
    for (let index = 1; index < 6; index += 1) {
      assert.equal(
        run.gatedAdmissionReceipts[index].priorReceiptHash,
        run.gatedAdmissionReceipts[index - 1].receiptHash,
      );
    }
    // Every gated receipt binds its decision receipt by hash.
    run.gatedAdmissionReceipts.forEach((admission, index) => {
      assert.equal(
        admission.actionDecisionReceiptHash,
        run.actionDecisionReceipts[index].receiptHash,
      );
      assert.equal(
        admission.residentId,
        run.actionDecisionReceipts[index].residentId,
      );
    });
  }
});

test('per-run isolation is proven and receipted', () => {
  assert.equal(receipt.runs[0].isolation, null);
  const isolation = receipt.runs[1].isolation;
  assert.equal(isolation.priorRunId, 'mv-b2-live-r1');
  assert.equal(isolation.priorRunUntouched, true);
  assert.equal(isolation.crossRunCustodyReadRefused, true);
  assert.equal(
    isolation.priorRunRootHashBefore,
    isolation.priorRunRootHashAfter,
  );
  assert.match(isolation.priorRunRootHashBefore, /^[a-f0-9]{64}$/);
  // Physically distinct run roots.
  assert.notEqual(
    receipt.runs[0].runRootRelative,
    receipt.runs[1].runRootRelative,
  );
  // Each run kept its own custody access log.
  for (const run of receipt.runs) {
    assert.ok(run.custodyAccessLogEntryCount >= 5);
  }
});

test('claim-boundary flags are exactly the pinned never-claim set', () => {
  const boundary = receipt.claimBoundary;
  assert.equal(boundary.liveStudyRunClaimed, false);
  assert.equal(boundary.phase1AdmissionClaimed, false);
  assert.equal(boundary.sixResidentLiveTurnsClaimed, false);
  assert.equal(boundary.sixResidentLiveStudyClaimed, false);
  assert.equal(boundary.blindedAliasAssignmentClaimed, false);
  assert.equal(boundary.productionValidatorCustodyClaimed, false);
  assert.equal(boundary.processCrashDurabilityClaimed, false);
  assert.equal(boundary.providerSamplingDeterminismClaimed, false);
  assert.equal(boundary.canonicalLaneProviderCallsIntroduced, 0);
  assert.equal(boundary.sealedAdapterAliasRouteAssignmentIncluded, false);
  assert.equal(boundary.openOutcomeCanonicalMutationClaimed, false);
  assert.equal(boundary.nativeLifecycleDispatchClaimed, false);
  assert.equal(boundary.multiDayRunControlsClaimed, false);
  assert.equal(boundary.liveSovereignRouteExercised, false);
  assert.ok(Array.isArray(boundary.observed) && boundary.observed.length > 0);
  assert.ok(
    Array.isArray(boundary.notObserved) && boundary.notObserved.length > 0,
  );
  assert.ok(
    boundary.notObserved.some((item) => item.includes('out of scope')),
    'alias-assignment exclusion must be stated',
  );
  assert.ok(
    boundary.notObserved.some((item) =>
      item.includes('idea-seeds/2026-07-26-open-outcome-receipt-tier.md')),
    'the open-outcome seeded-slice boundary must be stated',
  );
  assert.ok(
    boundary.observed.some((item) =>
      item.includes('live proposals gate, deterministic receipts mutate')),
    'the admission-gating law must be stated in observed',
  );
});

test('public receipt carries no raw model text', () => {
  const serialized = JSON.stringify(receipt);
  // The stub replies contain these raw reason strings; only their bounded
  // projections (length + sha256) may appear in public receipts.
  assert.ok(!serialized.includes('stub tracer contribution'));
  assert.ok(!serialized.includes('stub tracer abstention'));
});

test('receipt self-hash verifies and recomputes', () => {
  assert.deepEqual(verifyTurnSchedulerReceipt(receipt), {
    ok: true,
    failureReason: null,
  });
  const { receiptHash, ...unsigned } = receipt;
  assert.equal(canonicalDigest(unsigned), receiptHash);
});

test('tampering any receipt region fails verification', () => {
  const perturb = (value) => {
    if (typeof value === 'string') return `${value}x`;
    if (typeof value === 'number') return value + 1;
    if (typeof value === 'boolean') return !value;
    if (Array.isArray(value)) return [...value, 'tampered'];
    if (value === null) return 'tampered';
    return { ...value, injected: true };
  };
  for (const key of Object.keys(receipt)) {
    const tampered = structuredClone(receipt);
    tampered[key] = perturb(tampered[key]);
    assert.equal(
      verifyTurnSchedulerReceipt(tampered).ok,
      false,
      `tampering top-level '${key}' must fail verification`,
    );
  }

  const deepTampers = [
    (clone) => { clone.runs[0].live = true; },
    (clone) => { clone.runs[0].runId = 'phase1-live-study'; },
    (clone) => { clone.runs[0].barrierReceipt.frozen = true; },
    (clone) => {
      clone.runs[0].actionDecisionReceipts[1].reason =
        'admitted_preauthorized_action_match';
    },
    (clone) => {
      clone.runs[0].gatedAdmissionReceipts[0].committedAction.amount = 2;
    },
    (clone) => {
      clone.runs[0].gatedAdmissionReceipts[2].refusalClass = null;
    },
    (clone) => { clone.runs[1].isolation.priorRunUntouched = false; },
    (clone) => { clone.runs[1].isolation = null; },
    (clone) => { clone.claimBoundary.liveStudyRunClaimed = true; },
    (clone) => { clone.claimBoundary.openOutcomeCanonicalMutationClaimed = true; },
    (clone) => { clone.claimBoundary.canonicalLaneProviderCallsIntroduced = 1; },
    (clone) => { clone.runs[0].rawModelText = 'smuggled'; },
    (clone) => { clone.receiptHash = '0'.repeat(64); },
    (clone) => { delete clone.runs[0].residentRouteMapping; },
  ];
  deepTampers.forEach((mutate, index) => {
    const tampered = structuredClone(receipt);
    mutate(tampered);
    assert.equal(
      verifyTurnSchedulerReceipt(tampered).ok,
      false,
      `deep tamper #${index} must fail verification`,
    );
  });

  // A RE-SIGNED tamper that claims a second deterministic-lane commit still
  // fails: the exactly-one-commit law is semantic, not just hash-borne.
  const resigned = structuredClone(receipt);
  const run = resigned.runs[0];
  const forgedCommit = structuredClone(run.gatedAdmissionReceipts[0]);
  forgedCommit.actionDecisionReceiptHash =
    run.actionDecisionReceipts[2].receiptHash;
  forgedCommit.priorReceiptHash = run.gatedAdmissionReceipts[1].receiptHash;
  forgedCommit.residentId = 'resident-03';
  {
    const { receiptHash, ...unsigned } = forgedCommit;
    void receiptHash;
    forgedCommit.receiptHash = canonicalDigest(unsigned);
  }
  run.gatedAdmissionReceipts[2] = forgedCommit;
  // Re-chain the remaining receipts so ONLY the one-commit law is violated.
  for (let index = 3; index < 6; index += 1) {
    const next = structuredClone(run.gatedAdmissionReceipts[index]);
    next.priorReceiptHash = run.gatedAdmissionReceipts[index - 1].receiptHash;
    const { receiptHash, ...unsigned } = next;
    void receiptHash;
    next.receiptHash = canonicalDigest(unsigned);
    run.gatedAdmissionReceipts[index] = next;
  }
  {
    const { receiptHash, ...unsigned } = resigned;
    void receiptHash;
    resigned.receiptHash = canonicalDigest(unsigned);
  }
  assert.equal(verifyTurnSchedulerReceipt(resigned).ok, false);

  assert.equal(verifyTurnSchedulerReceipt(null).ok, false);
  assert.equal(verifyTurnSchedulerReceipt({}).ok, false);
});

test('durable per-run stores exist under the scratch parent only', () => {
  for (const run of receipt.runs) {
    const runRoot = path.join(storeParent, run.runId);
    assert.ok(existsSync(path.join(runRoot, 'persistent-store', 'state.json')));
    assert.ok(existsSync(path.join(runRoot, 'custody', 'access-log.jsonl')));
  }
});
