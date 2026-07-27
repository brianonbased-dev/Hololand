#!/usr/bin/env node
/* global Buffer, console, process */

// HoloLand Model Village MV-B2 live turn scheduler integration checker.
//
// ENGINEERING TRACER LANE, NOT the study lane. Residents resident-01..06 are
// engineering aliases mapped ROUND-ROBIN across the openly-declared certified
// sovereign routes from the frozen MV-B1 drill manifest; no blinded alias
// assignment is performed, claimed, or receipted here.
//
// ADMISSION-GATING DESIGN (load-bearing; stated on every receipt): a live
// model proposal NEVER becomes a world mutation directly. After the proposal
// barrier closes and adjudication runs, an ADMITTED proposal that EXACTLY
// matches the pre-authorized deterministic action (contribute_water ->
// commons_cistern, amount 1 -- the action already encoded in the frozen
// phase0b plan) GATES the execution of the existing deterministic V4 lane,
// and the action is committed from the VERIFIED V4 receipt through the
// existing atomic admission path. Admitted non-matches are receipted
// admitted_no_preauthorized_action and mutate nothing; denied proposals
// mutate nothing; a second admitted match in the same run is receipted
// preauthorized_action_already_committed and mutates nothing (the frozen
// plan pre-authorizes exactly one action per run). LIVE PROPOSALS GATE,
// DETERMINISTIC RECEIPTS MUTATE.
//
// Language boundary (spec HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md lines
// 106-108): this checker is orchestration, canonicalization, and
// verification only. The turn policy, snapshot fixture, pre-authorized
// catalog, routes, prompt, and vocabulary are canonical `.hs` source data.
//
// Public-receipt rule: the emitted receipt carries hashes, enums, and
// bounded projections only -- never raw model text (raw bytes live only in
// the per-run sealed custody stores).
//
// Two runs prove per-run isolation:
//   mv-b2-live-r1 -- LIVE sovereign routes (holoserve required, jetson
//                    optional-but-attempted; both endpoints are the frozen
//                    manifest-declared sovereign routes) unless --skip-live;
//   mv-b2-live-r2 -- in-process loopback stub routes ALWAYS (even in live
//                    mode; the same --skip-live offline convention as the
//                    shipped MV-B1 checker), proving multi-run isolation
//                    cheaply: the r1 run directory is byte-identical after
//                    r2 completes and cross-run custody reads are refused.

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  canonicalDigest,
  canonicalJson,
} from './model-village-phase0b-runtime.mjs';
import {
  certifyLockedAdapterRoute,
  loadAdapterCustodyDrillManifest,
} from './model-village-adapter-runtime.mjs';
import {
  createTurnScheduler,
  loadTurnPolicyManifest,
  verifyRoundReceiptChain,
} from './model-village-turn-scheduler.mjs';
import {
  PREAUTHORIZED_ACTION_CATALOG,
  buildRefusedAdmissionReceipt,
  executeGatedAdmission,
  provisionIsolatedRun,
  verifyGatedAdmissionReceipt,
} from './model-village-admission-bridge.mjs';

export const TURN_SCHEDULER_RECEIPT_SCHEMA =
  'hololand.model-village-turn-scheduler.v1';

const DEFAULT_OUTPUT = path.join(
  '.tmp', 'hololand', 'model-village', 'turn-scheduler-receipt.json',
);
const DEFAULT_STORE_PARENT = path.join(
  '.tmp', 'hololand', 'model-village', 'turn-scheduler',
);
const OPERATOR = 'mv-b2-turn-scheduler-checker';
const LIVE_RUN_ID = 'mv-b2-live-r1';
const STUB_RUN_ID = 'mv-b2-live-r2';
// Loopback bind for the in-process offline stubs (MV-B1 checker convention).
const STUB_LOOPBACK_HOST = '127.0.0.1';
const RESIDENT_IDS = Object.freeze([
  'resident-01', 'resident-02', 'resident-03',
  'resident-04', 'resident-05', 'resident-06',
]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
// Disposable scratch stores the deterministic lane (tracer) leaves per gated
// execution; the checker owns cleanup of its OWN process's stores (same
// convention as the phase0b and admission-bridge test suites).
const TRACER_SCRATCH_SUBPATH = path.join(
  '.tmp', 'hololand', 'model-village', 'phase0b-runtime',
);
const TRACER_SCRATCH_PATTERN = new RegExp(
  '^(main|fault-before-rename|fault-after-rename|mismatch-target'
  + `|mismatch-state-hashes)-${process.pid}-`,
);

const RECEIPT_KEYS = Object.freeze([
  'claimBoundary',
  'generatedAt',
  'policyHash',
  'receiptHash',
  'runs',
  'schema',
  'vocabularyHash',
]);
const RUN_ENTRY_KEYS = Object.freeze([
  'actionDecisionReceipts',
  'barrierReceipt',
  'contaminationRegister',
  'custodyAccessLogEntryCount',
  'gatedAdmissionReceipts',
  'isolation',
  'live',
  'residentRouteMapping',
  'routeCertifications',
  'runId',
  'runRootRelative',
  'safetyCheckReceipts',
]);
const ROUTE_CERTIFICATION_KEYS = Object.freeze([
  'certificationError',
  'certificationReceiptHash',
  'certified',
  'declaredEndpoint',
  'endpointUsed',
  'failureReason',
  'required',
  'routeId',
  'stubbed',
]);
const RESIDENT_MAPPING_KEYS = Object.freeze([
  'certificationReceiptHash',
  'residentId',
  'routeId',
]);
const ISOLATION_KEYS = Object.freeze([
  'crossRunCustodyReadRefused',
  'priorRunId',
  'priorRunRootHashAfter',
  'priorRunRootHashBefore',
  'priorRunUntouched',
]);
const CONTAMINATION_ENTRY_KEYS = Object.freeze(['at', 'detail', 'kind']);
// Every flag this lane must NEVER claim, pinned to its only legal value --
// the MV-B1 pinned set PLUS the four MV-B2 additions.
const PINNED_CLAIM_BOUNDARY_VALUES = Object.freeze({
  blindedAliasAssignmentClaimed: false,
  canonicalLaneProviderCallsIntroduced: 0,
  liveStudyRunClaimed: false,
  multiDayRunControlsClaimed: false,
  nativeLifecycleDispatchClaimed: false,
  openOutcomeCanonicalMutationClaimed: false,
  phase1AdmissionClaimed: false,
  processCrashDurabilityClaimed: false,
  productionValidatorCustodyClaimed: false,
  providerSamplingDeterminismClaimed: false,
  sealedAdapterAliasRouteAssignmentIncluded: false,
  sixResidentLiveStudyClaimed: false,
  sixResidentLiveTurnsClaimed: false,
});
const CLAIM_BOUNDARY_KEYS = Object.freeze([
  'liveSovereignRouteExercised',
  'notObserved',
  'observed',
  ...Object.keys(PINNED_CLAIM_BOUNDARY_VALUES),
]);

export class TurnSchedulerCheckError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TurnSchedulerCheckError';
  }
}

function fail(message) {
  throw new TurnSchedulerCheckError(message);
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
}

function assertExactKeys(value, expectedKeys, label) {
  assertObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    const missingKeys = expected.filter((key) => !actual.includes(key));
    const unexpected = actual.filter((key) => !expected.includes(key));
    fail(
      `${label} keys differ; missing=${canonicalJson(missingKeys)} `
      + `unexpected=${canonicalJson(unexpected)}`,
    );
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    fail(`${label} must be a non-empty string`);
  }
}

function assertSha256(value, label) {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    fail(`${label} must be lowercase sha256 hex`);
  }
}

function normalizePath(root, target) {
  const relative = path.relative(root, target);
  const chosen = relative.startsWith('..') ? target : relative;
  return chosen.split(path.sep).join('/');
}

function runTimestamp() {
  return `${new Date().toISOString().replace(/[:.]/g, '-')}-p${process.pid}`;
}

function countJsonlLines(filePath) {
  if (!existsSync(filePath)) return 0;
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0)
    .length;
}

/**
 * Deterministic content hash of an entire directory tree (sorted relative
 * paths + file bytes). Byte-identical trees hash equal; any created,
 * deleted, or rewritten file changes the hash. This is the cross-run
 * isolation probe: run r1's tree must hash identically before and after
 * run r2 executes end to end.
 */
function hashDirectoryTree(rootDir) {
  const hash = createHash('sha256');
  const walk = (dir) => {
    for (const entry of readdirSync(dir).sort()) {
      const fullPath = path.join(dir, entry);
      const relative = path.relative(rootDir, fullPath).replaceAll('\\', '/');
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        hash.update(`D:${relative}\n`);
        walk(fullPath);
      } else {
        hash.update(`F:${relative}:${stats.size}\n`);
        hash.update(readFileSync(fullPath));
      }
    }
  };
  walk(rootDir);
  return hash.digest('hex');
}

function cleanOwnTracerScratch(resolvedRoot) {
  const scratchRoot = path.join(resolvedRoot, TRACER_SCRATCH_SUBPATH);
  if (!existsSync(scratchRoot)) return;
  for (const entry of readdirSync(scratchRoot)) {
    if (TRACER_SCRATCH_PATTERN.test(entry)) {
      rmSync(path.join(scratchRoot, entry), { recursive: true, force: true });
    }
  }
}

// ---------------------------------------------------------------------------
// --skip-live / r2 stub: one in-process OpenAI-compatible node:http server
// per route on the loopback interface (ephemeral port), the same offline
// convention as the MV-B1 checker. Payloads embed the routeId so routes seal
// distinct bytes. The first (required-twin) route proposes the exact
// pre-authorized catalog action; the second abstains (vocabulary-valid but
// NOT pre-authorized) so the offline lane exercises admit+match,
// admit+non-match, and already-committed refusals in one round.
// ---------------------------------------------------------------------------

function stubChatContent(routeId, proposalKind) {
  if (proposalKind === 'contribute') {
    return JSON.stringify({
      action: 'contribute_water',
      target: 'commons_cistern',
      amount: 1,
      reason: `stub tracer contribution (${routeId})`,
    });
  }
  return JSON.stringify({
    action: 'abstain',
    target: null,
    amount: null,
    reason: `stub tracer abstention (${routeId})`,
  });
}

function startTurnStub(route, proposalKind) {
  const { routeId } = route;
  const server = createServer((req, res) => {
    const respond = (status, payload) => {
      const body = Buffer.from(JSON.stringify(payload), 'utf8');
      res.writeHead(status, {
        'content-type': 'application/json',
        'content-length': body.length,
      });
      res.end(body);
    };
    req.on('data', () => {});
    req.on('end', () => {
      if (req.method === 'GET' && req.url === route.healthPath) {
        respond(200, {
          process_instance_id: `stub-${routeId}`,
          status: 'ok',
          stub: true,
          version: `0.0.0-stub-${routeId}`,
        });
        return;
      }
      if (req.method === 'GET' && req.url === route.modelsPath) {
        respond(200, {
          data: [{ id: `stub-model-${routeId}`, object: 'model' }],
          object: 'list',
        });
        return;
      }
      if (req.method === 'POST' && req.url === route.chatPath) {
        respond(200, {
          choices: [{
            finish_reason: 'stop',
            index: 0,
            message: {
              content: stubChatContent(routeId, proposalKind),
              role: 'assistant',
            },
          }],
          id: `chatcmpl-stub-${routeId}`,
          model: `stub-model-${routeId}`,
          object: 'chat.completion',
          usage: { completion_tokens: 24, prompt_tokens: 96, total_tokens: 120 },
        });
        return;
      }
      respond(404, { error: 'not found' });
    });
  });
  return new Promise((resolve) => {
    server.listen(0, STUB_LOOPBACK_HOST, () => {
      const { port } = server.address();
      resolve({
        endpoint: `http://${STUB_LOOPBACK_HOST}:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

// ---------------------------------------------------------------------------
// One complete run: provision -> certify -> six residents round-robin ->
// turn round (snapshot freeze, bounded concurrency, barrier, adjudication)
// -> gated admissions -> access-log count -> teardown -> isolation evidence.
// ---------------------------------------------------------------------------

async function executeOneRun({
  runId,
  stubbed,
  policyBundle,
  drillBundle,
  storeParent,
  resolvedRoot,
  failures,
  priorRun = null,
}) {
  const context = provisionIsolatedRun({
    hololandRoot: resolvedRoot,
    operator: OPERATOR,
    runId,
    scratchRoot: storeParent,
  });
  const runRoot = path.resolve(storeParent, runId);
  // Per-run isolation marker: a custody object that exists ONLY in this
  // run's sealed store. The next run proves cross-run isolation by having
  // its own store REFUSE to read this custodyId.
  const marker = context.custodyStore.sealObject({
    bytes: Buffer.from(`mv-b2 run isolation marker ${runId}`, 'utf8'),
    kind: 'mv-b2-run-isolation-marker',
    label: `${runId}:isolation-marker`,
  });

  const routeCertifications = [];
  const residentRouteMapping = [];
  const certifiedRoutes = [];
  const gatedAdmissionReceipts = [];
  const stubs = [];
  let round = null;
  let custodyAccessLogEntryCount = 0;
  let crossRunCustodyReadRefused = null;

  try {
    // (c) Certify routes through the MV-B1 seam. LIVE mode contacts the two
    // openly-declared sovereign routes (holoserve required, jetson
    // optional-but-attempted); stub mode serves both from loopback stubs.
    for (const [routeIndex, route] of drillBundle.routes.entries()) {
      let effectiveRoute = { ...route, ceilings: { ...route.ceilings } };
      if (stubbed) {
        const stub = await startTurnStub(
          route,
          routeIndex === 0 ? 'contribute' : 'abstain',
        );
        stubs.push(stub);
        effectiveRoute = { ...effectiveRoute, endpoint: stub.endpoint };
      }
      const entry = {
        certificationError: null,
        certificationReceiptHash: null,
        certified: false,
        declaredEndpoint: route.endpoint,
        endpointUsed: effectiveRoute.endpoint,
        failureReason: null,
        required: route.required,
        routeId: route.routeId,
        stubbed,
      };
      try {
        const certification = await certifyLockedAdapterRoute({
          custodyStore: context.custodyStore,
          drill: drillBundle,
          operator: OPERATOR,
          priorReceiptHash: drillBundle.manifestHash,
          route: effectiveRoute,
        });
        entry.certified = certification.certified === true;
        entry.failureReason = certification.failureReason ?? null;
        entry.certificationReceiptHash = certification.receiptHash;
        if (entry.certified) {
          certifiedRoutes.push({
            certification,
            route: effectiveRoute,
            routeId: route.routeId,
          });
        }
      } catch (error) {
        entry.certificationError = error?.message ?? String(error);
      }
      if (route.required && entry.certified !== true) {
        failures.push(
          `[${runId}] required route ${route.routeId} did not certify `
          + `(${entry.failureReason ?? entry.certificationError})`,
        );
      }
      routeCertifications.push(entry);
    }
    if (certifiedRoutes.length === 0) {
      fail(
        `[${runId}] no route certified; the turn round cannot execute `
        + '(the required sovereign holoserve route must be reachable at its '
        + 'manifest-declared endpoint)',
      );
    }

    // Six residents, ROUND-ROBIN across the certified routes. This is the
    // openly-declared engineering mapping (receipted below), NOT a blinded
    // alias assignment. If only one route certifies, all six ride it.
    const residents = RESIDENT_IDS.map((residentId, index) => {
      const pick = certifiedRoutes[index % certifiedRoutes.length];
      residentRouteMapping.push({
        certificationReceiptHash: pick.certification.receiptHash,
        residentId,
        routeId: pick.routeId,
      });
      return {
        certification: pick.certification,
        residentId,
        route: pick.route,
      };
    });

    // (d) One scheduler round under the frozen policy: frozen snapshot
    // distribution, bounded concurrency, zero retry, proposal barrier,
    // default-deny adjudication. The scheduler emits receipts only.
    const scheduler = createTurnScheduler({
      custodyStore: context.custodyStore,
      operator: OPERATOR,
      policyBundle,
      residents,
    });
    round = await scheduler.executeTurnRound({
      priorReceiptHash: policyBundle.policyHash,
      publicSnapshot: JSON.parse(policyBundle.snapshotFixture.publicState),
      runId,
    });

    const chainCheck = verifyRoundReceiptChain({
      actionDecisionReceipts: round.actionDecisionReceipts,
      barrierReceipt: round.barrierReceipt,
      safetyCheckReceipts: round.safetyCheckReceipts,
    });
    if (!chainCheck.ok) {
      failures.push(
        `[${runId}] round receipt chain invalid: ${chainCheck.failureReason}`,
      );
    }
    if (round.barrierReceipt.frozen === true) {
      failures.push(
        `[${runId}] round froze on contamination: `
        + round.contaminationRegister.map((entry) => entry.kind).join(', '),
      );
    } else {
      const counts = round.barrierReceipt.resolvedCounts;
      const totalResolved = counts.completed + counts.failed + counts.timedOut;
      if (totalResolved !== residents.length) {
        failures.push(
          `[${runId}] barrier resolved ${totalResolved} turns for `
          + `${residents.length} residents`,
        );
      }
    }

    // Gated admissions -- LIVE PROPOSALS GATE, DETERMINISTIC RECEIPTS
    // MUTATE. The admission chain continues the round chain: the first
    // gated receipt chains from the LAST adjudication receipt (the barrier
    // hash when a frozen round produced none), so admission is provably
    // after the barrier closed and after adjudication completed.
    let admissionPrior = round.actionDecisionReceipts.length > 0
      ? round.actionDecisionReceipts[
        round.actionDecisionReceipts.length - 1
      ].receiptHash
      : round.barrierReceipt.barrierHash;
    let committed = false;
    for (const decision of round.actionDecisionReceipts) {
      const isCatalogMatch = decision.decision === 'admit'
        && decision.preauthorizedMatch === true;
      let outcome;
      if (isCatalogMatch && committed) {
        // The frozen plan pre-authorizes exactly ONE deterministic action
        // per run; further admitted matches are receipted refusals with NO
        // mutation (never a second V4 execution attempt).
        outcome = {
          admitted: false,
          receipt: buildRefusedAdmissionReceipt({
            actionDecisionReceiptHash: decision.receiptHash,
            policyHash: policyBundle.policyHash,
            priorReceiptHash: admissionPrior,
            refusalClass: 'preauthorized_action_already_committed',
            residentId: decision.residentId,
            runId,
            vocabularyHash: policyBundle.vocabularyHash,
          }),
        };
      } else {
        outcome = await executeGatedAdmission({
          actionDecisionReceipt: decision,
          expectedPolicyHash: policyBundle.policyHash,
          expectedVocabularyHash: policyBundle.vocabularyHash,
          operator: OPERATOR,
          preauthorizedCatalogEntry: PREAUTHORIZED_ACTION_CATALOG[0],
          priorReceiptHash: admissionPrior,
          runId,
          storeContext: context,
        });
        if (outcome.admitted === true) committed = true;
      }
      const admissionCheck = verifyGatedAdmissionReceipt(outcome.receipt);
      if (!admissionCheck.ok) {
        failures.push(
          `[${runId}] gated admission receipt for ${decision.residentId} `
          + `invalid: ${admissionCheck.failureReason}`,
        );
      }
      gatedAdmissionReceipts.push(outcome.receipt);
      admissionPrior = outcome.receipt.receiptHash;
    }
    const matchCount = round.actionDecisionReceipts.filter(
      (decision) =>
        decision.decision === 'admit' && decision.preauthorizedMatch === true,
    ).length;
    const admittedCount = gatedAdmissionReceipts.filter(
      (receipt) => receipt.admitted === true,
    ).length;
    if (admittedCount !== (matchCount > 0 ? 1 : 0)) {
      failures.push(
        `[${runId}] exactly-one-commit violated: ${admittedCount} `
        + `deterministic-lane commits for ${matchCount} catalog matches`,
      );
    }

    // Cross-run custody isolation probe: this run's sealed store must
    // refuse the PRIOR run's isolation-marker custodyId.
    if (priorRun) {
      crossRunCustodyReadRefused = false;
      try {
        context.custodyStore.readObject(priorRun.markerCustodyId);
      } catch {
        crossRunCustodyReadRefused = true;
      }
      if (crossRunCustodyReadRefused !== true) {
        failures.push(
          `[${runId}] cross-run custody read was NOT refused `
          + `(read ${priorRun.runId}'s isolation marker)`,
        );
      }
    }

    custodyAccessLogEntryCount = countJsonlLines(
      path.join(context.custodyDir, 'access-log.jsonl'),
    );
  } finally {
    context.teardown();
    for (const stub of stubs) await stub.close();
  }

  // Isolation evidence, computed AFTER this run has fully completed
  // (teardown included): the prior run's directory tree must be
  // byte-identical to its post-run snapshot.
  let isolation = null;
  if (priorRun) {
    const priorRunRootHashAfter = hashDirectoryTree(priorRun.runRoot);
    isolation = {
      crossRunCustodyReadRefused,
      priorRunId: priorRun.runId,
      priorRunRootHashAfter,
      priorRunRootHashBefore: priorRun.rootHashBefore,
      priorRunUntouched: priorRunRootHashAfter === priorRun.rootHashBefore,
    };
    if (isolation.priorRunUntouched !== true) {
      failures.push(
        `[${runId}] prior run ${priorRun.runId} directory changed during `
        + 'this run (cross-run state leak)',
      );
    }
  }

  return {
    custodyAccessLogEntryCount,
    gatedAdmissionReceipts,
    isolation,
    live: !stubbed,
    markerCustodyId: marker.custodyId,
    residentRouteMapping,
    round,
    routeCertifications,
    runId,
    runRoot,
  };
}

// ---------------------------------------------------------------------------
// Check execution.
// ---------------------------------------------------------------------------

export async function runTurnSchedulerCheck({
  root = process.cwd(),
  output = DEFAULT_OUTPUT,
  storeRoot = null,
  skipLive = false,
} = {}) {
  const resolvedRoot = path.resolve(root);
  // (a) Load and pin both frozen manifests: the MV-B2 turn policy bundle
  // (policyHash) and the MV-B1 drill manifest (routes/prompt/vocabulary).
  const policyBundle = await loadTurnPolicyManifest({
    hololandRoot: resolvedRoot,
  });
  const drillBundle = await loadAdapterCustodyDrillManifest({
    hololandRoot: resolvedRoot,
  });

  const storeParent = storeRoot
    ? path.resolve(resolvedRoot, storeRoot)
    : path.resolve(resolvedRoot, DEFAULT_STORE_PARENT, runTimestamp());
  mkdirSync(storeParent, { recursive: true });

  const failures = [];
  const runResults = [];
  try {
    // (b)-(d) Run 1: LIVE sovereign routes unless --skip-live.
    const firstRun = await executeOneRun({
      drillBundle,
      failures,
      policyBundle,
      resolvedRoot,
      runId: LIVE_RUN_ID,
      storeParent,
      stubbed: skipLive,
    });
    runResults.push(firstRun);

    // (e) Run 2: stub routes ALWAYS (even in live mode) -- multi-run
    // isolation proven cheaply against run 1's completed directory tree.
    const secondRun = await executeOneRun({
      drillBundle,
      failures,
      policyBundle,
      priorRun: {
        markerCustodyId: firstRun.markerCustodyId,
        rootHashBefore: hashDirectoryTree(firstRun.runRoot),
        runId: firstRun.runId,
        runRoot: firstRun.runRoot,
      },
      resolvedRoot,
      runId: STUB_RUN_ID,
      storeParent,
      stubbed: true,
    });
    runResults.push(secondRun);
  } finally {
    cleanOwnTracerScratch(resolvedRoot);
  }

  const runs = runResults.map((result) => ({
    actionDecisionReceipts: result.round.actionDecisionReceipts,
    barrierReceipt: result.round.barrierReceipt,
    contaminationRegister: result.round.contaminationRegister,
    custodyAccessLogEntryCount: result.custodyAccessLogEntryCount,
    gatedAdmissionReceipts: result.gatedAdmissionReceipts,
    isolation: result.isolation,
    live: result.live,
    residentRouteMapping: result.residentRouteMapping,
    routeCertifications: result.routeCertifications,
    runId: result.runId,
    runRootRelative: normalizePath(resolvedRoot, result.runRoot),
    safetyCheckReceipts: result.round.safetyCheckReceipts,
  }));

  // (g) Claim boundary: what this tracer observed, what it does not claim,
  // and the pinned never-claim flags (MV-B1 set plus the MV-B2 additions).
  const claimBoundary = {
    observed: [
      'runtime-issued turn opportunities with per-resident nonce and expiry, an in-run replay registry, and exactly one opportunity per resident per round',
      'frozen-snapshot distribution: one hash-pinned public snapshot for every resident, recomputed before each dispatch and again before adjudication',
      'bounded concurrency under the frozen concurrency+timeout policy with the measured high-water mark receipted in the proposal barrier',
      'proposal barrier closed before any adjudication or admission: safety and decision receipts chain from the barrier hash, gated admissions chain from the end of the adjudication chain',
      'default-deny adjudication receipts pinning the policy hash, proposal hash, and action-vocabulary hash',
      'gated admission where ONLY the deterministic V4 lane mutates: live proposals gate, deterministic receipts mutate; admitted non-matches, denials, and already-committed matches are receipted refusals with zero side effects',
      'per-run isolation: a fresh persistent store and fresh sealed custody store per runId; the prior run directory is byte-identical after the second run and cross-run custody reads are refused',
      'zero retry by construction: exactly one model-turn executor invocation per resident',
    ],
    notObserved: [
      'live study run',
      'Phase 1 admission or readiness',
      'blinded alias assignment (residents map to openly-declared engineering routes; the sealed adapter_a/adapter_b/adapter_c alias-to-route assignment is out of scope)',
      'native lifecycle execution',
      'open-outcome canonical mutation (the headless plan schema requires the outcome up front; the open-outcome tier is a seeded future slice: idea-seeds/2026-07-26-open-outcome-receipt-tier.md)',
      'multi-day run controls',
      'six-resident live study (this is an engineering tracer; residents are engineering aliases)',
      'production validator custody',
      'process-crash durability',
      'provider sampling determinism (temperature zero is not a determinism receipt)',
    ],
    liveSovereignRouteExercised: skipLive === false,
    ...PINNED_CLAIM_BOUNDARY_VALUES,
  };

  const unsigned = {
    schema: TURN_SCHEDULER_RECEIPT_SCHEMA,
    generatedAt: new Date().toISOString(),
    policyHash: policyBundle.policyHash,
    vocabularyHash: policyBundle.vocabularyHash,
    runs,
    claimBoundary,
  };
  const receipt = { ...unsigned, receiptHash: canonicalDigest(unsigned) };

  const resolvedOutput = path.resolve(resolvedRoot, output);
  mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  writeFileSync(resolvedOutput, `${JSON.stringify(receipt, null, 2)}\n`);

  const verification = verifyTurnSchedulerReceipt(receipt);
  if (!verification.ok) {
    failures.push(
      `emitted receipt failed self-verification: ${verification.failureReason}`,
    );
  }

  if (failures.length > 0) {
    throw new TurnSchedulerCheckError(
      `Model Village turn scheduler check failed: ${failures.join('; ')}. `
      + `Receipt: ${resolvedOutput}`,
    );
  }

  return { output: resolvedOutput, receipt, rounds: runResults };
}

// ---------------------------------------------------------------------------
// Receipt verification (closed keys, schema pin, pinned claim boundary,
// nested chain verification, gated-admission pairing and chain binding,
// isolation evidence, self-hash recompute).
// ---------------------------------------------------------------------------

function verifyRunEntry(run, index, receipt) {
  const label = `receipt.runs[${index}]`;
  assertExactKeys(run, RUN_ENTRY_KEYS, label);
  assertNonEmptyString(run.runId, `${label}.runId`);
  if (!run.runId.startsWith('mv-b2-')) {
    fail(`${label}.runId must use the engineering lane mv-b2- prefix`);
  }
  if (typeof run.live !== 'boolean') fail(`${label}.live must be boolean`);
  assertNonEmptyString(run.runRootRelative, `${label}.runRootRelative`);
  if (
    !Number.isInteger(run.custodyAccessLogEntryCount)
    || run.custodyAccessLogEntryCount < 1
  ) {
    fail(`${label}.custodyAccessLogEntryCount must be a positive integer`);
  }

  if (
    !Array.isArray(run.routeCertifications)
    || run.routeCertifications.length === 0
  ) {
    fail(`${label}.routeCertifications must be a non-empty array`);
  }
  const certifiedByRoute = new Map();
  let requiredCount = 0;
  run.routeCertifications.forEach((entry, certIndex) => {
    const certLabel = `${label}.routeCertifications[${certIndex}]`;
    assertExactKeys(entry, ROUTE_CERTIFICATION_KEYS, certLabel);
    assertNonEmptyString(entry.routeId, `${certLabel}.routeId`);
    assertNonEmptyString(entry.declaredEndpoint, `${certLabel}.declaredEndpoint`);
    assertNonEmptyString(entry.endpointUsed, `${certLabel}.endpointUsed`);
    if (typeof entry.required !== 'boolean') {
      fail(`${certLabel}.required must be boolean`);
    }
    if (typeof entry.certified !== 'boolean') {
      fail(`${certLabel}.certified must be boolean`);
    }
    if (entry.stubbed !== !run.live) {
      fail(`${certLabel}.stubbed must equal NOT ${label}.live`);
    }
    if (entry.required) requiredCount += 1;
    if (entry.certified) {
      assertSha256(
        entry.certificationReceiptHash,
        `${certLabel}.certificationReceiptHash`,
      );
      certifiedByRoute.set(entry.routeId, entry.certificationReceiptHash);
    }
  });
  if (requiredCount < 1) {
    fail(`${label}.routeCertifications must include a required route`);
  }

  if (
    !Array.isArray(run.residentRouteMapping)
    || run.residentRouteMapping.length === 0
  ) {
    fail(`${label}.residentRouteMapping must be a non-empty array`);
  }
  run.residentRouteMapping.forEach((entry, mapIndex) => {
    const mapLabel = `${label}.residentRouteMapping[${mapIndex}]`;
    assertExactKeys(entry, RESIDENT_MAPPING_KEYS, mapLabel);
    assertNonEmptyString(entry.residentId, `${mapLabel}.residentId`);
    if (!certifiedByRoute.has(entry.routeId)) {
      fail(`${mapLabel}.routeId ${entry.routeId} is not a certified route`);
    }
    if (entry.certificationReceiptHash !== certifiedByRoute.get(entry.routeId)) {
      fail(`${mapLabel} does not bind its route's certification receipt`);
    }
  });

  // Barrier + adjudication chain (the shared MV-B2 chain verifier), then
  // the receipt-level pins the chain verifier does not know about.
  const chainCheck = verifyRoundReceiptChain({
    actionDecisionReceipts: run.actionDecisionReceipts,
    barrierReceipt: run.barrierReceipt,
    safetyCheckReceipts: run.safetyCheckReceipts,
  });
  if (!chainCheck.ok) {
    fail(`${label} round chain invalid: ${chainCheck.failureReason}`);
  }
  if (run.barrierReceipt.runId !== run.runId) {
    fail(`${label}.barrierReceipt.runId does not bind this run`);
  }
  if (
    run.barrierReceipt.policyHash !== receipt.policyHash
    || run.barrierReceipt.priorReceiptHash !== receipt.policyHash
  ) {
    fail(`${label}.barrierReceipt does not pin/chain from the policy hash`);
  }
  for (const safety of run.safetyCheckReceipts) {
    if (safety.vocabularyHash !== receipt.vocabularyHash) {
      fail(`${label} safety receipt does not pin the vocabulary hash`);
    }
  }
  for (const decision of run.actionDecisionReceipts) {
    if (
      decision.policyHash !== receipt.policyHash
      || decision.vocabularyHash !== receipt.vocabularyHash
    ) {
      fail(`${label} decision receipt does not pin the policy/vocabulary hash`);
    }
  }

  if (!Array.isArray(run.contaminationRegister)) {
    fail(`${label}.contaminationRegister must be an array`);
  }
  run.contaminationRegister.forEach((entry, contaminationIndex) => {
    assertExactKeys(
      entry,
      CONTAMINATION_ENTRY_KEYS,
      `${label}.contaminationRegister[${contaminationIndex}]`,
    );
  });

  // Gated admissions: one receipt per decision receipt, chained from the
  // END of the adjudication chain (barrier hash when a frozen round emitted
  // no adjudication receipts), paired by decision hash and resident, and
  // committing through the deterministic lane EXACTLY once iff an admitted
  // catalog match exists.
  if (!Array.isArray(run.gatedAdmissionReceipts)) {
    fail(`${label}.gatedAdmissionReceipts must be an array`);
  }
  if (run.gatedAdmissionReceipts.length !== run.actionDecisionReceipts.length) {
    fail(`${label} gated admission receipts do not pair 1:1 with decisions`);
  }
  let admissionPrior = run.actionDecisionReceipts.length > 0
    ? run.actionDecisionReceipts[
      run.actionDecisionReceipts.length - 1
    ].receiptHash
    : run.barrierReceipt.barrierHash;
  let admittedCount = 0;
  let matchCount = 0;
  run.gatedAdmissionReceipts.forEach((admission, admissionIndex) => {
    const admissionLabel = `${label}.gatedAdmissionReceipts[${admissionIndex}]`;
    const admissionCheck = verifyGatedAdmissionReceipt(admission);
    if (!admissionCheck.ok) {
      fail(`${admissionLabel} invalid: ${admissionCheck.failureReason}`);
    }
    const decision = run.actionDecisionReceipts[admissionIndex];
    if (
      admission.runId !== run.runId
      || admission.residentId !== decision.residentId
      || admission.actionDecisionReceiptHash !== decision.receiptHash
    ) {
      fail(`${admissionLabel} does not bind its decision receipt`);
    }
    if (admission.priorReceiptHash !== admissionPrior) {
      fail(`${admissionLabel} breaks the admission chain`);
    }
    admissionPrior = admission.receiptHash;
    const isCatalogMatch = decision.decision === 'admit'
      && decision.preauthorizedMatch === true;
    if (isCatalogMatch) matchCount += 1;
    if (admission.admitted === true) {
      admittedCount += 1;
      if (!isCatalogMatch) {
        fail(`${admissionLabel} admitted without an admitted catalog match`);
      }
    } else if (decision.decision === 'deny') {
      if (
        !['barrier_frozen', 'decision_denied'].includes(admission.refusalClass)
      ) {
        fail(`${admissionLabel} denied decision has the wrong refusal class`);
      }
    } else if (!isCatalogMatch) {
      if (
        !['barrier_frozen', 'no_preauthorized_match']
          .includes(admission.refusalClass)
      ) {
        fail(`${admissionLabel} non-match admission has the wrong refusal class`);
      }
    } else if (
      !['barrier_frozen', 'preauthorized_action_already_committed']
        .includes(admission.refusalClass)
    ) {
      fail(
        `${admissionLabel} refused catalog match has the wrong refusal class`,
      );
    }
  });
  if (admittedCount > 1) {
    fail(`${label} committed the deterministic lane more than once`);
  }
  if (matchCount > 0 && admittedCount !== 1) {
    fail(
      `${label} has admitted catalog matches but `
      + `${admittedCount} deterministic-lane commits`,
    );
  }

  // Isolation evidence: absent on the first run, mandatory afterwards.
  if (index === 0) {
    if (run.isolation !== null) {
      fail(`${label}.isolation must be null for the first run`);
    }
  } else {
    assertExactKeys(run.isolation, ISOLATION_KEYS, `${label}.isolation`);
    assertSha256(
      run.isolation.priorRunRootHashBefore,
      `${label}.isolation.priorRunRootHashBefore`,
    );
    assertSha256(
      run.isolation.priorRunRootHashAfter,
      `${label}.isolation.priorRunRootHashAfter`,
    );
    if (
      run.isolation.priorRunUntouched !== true
      || run.isolation.priorRunRootHashBefore
        !== run.isolation.priorRunRootHashAfter
    ) {
      fail(`${label}.isolation does not prove the prior run untouched`);
    }
    if (run.isolation.crossRunCustodyReadRefused !== true) {
      fail(`${label}.isolation does not prove cross-run custody refusal`);
    }
    if (run.isolation.priorRunId !== receipt.runs[index - 1].runId) {
      fail(`${label}.isolation.priorRunId does not bind the prior run`);
    }
  }
}

export function verifyTurnSchedulerReceipt(receipt) {
  try {
    assertExactKeys(receipt, RECEIPT_KEYS, 'turn scheduler receipt');
    if (receipt.schema !== TURN_SCHEDULER_RECEIPT_SCHEMA) {
      fail(`receipt schema must be '${TURN_SCHEDULER_RECEIPT_SCHEMA}'`);
    }
    assertNonEmptyString(receipt.generatedAt, 'receipt.generatedAt');
    assertSha256(receipt.policyHash, 'receipt.policyHash');
    assertSha256(receipt.vocabularyHash, 'receipt.vocabularyHash');

    assertExactKeys(
      receipt.claimBoundary,
      CLAIM_BOUNDARY_KEYS,
      'receipt.claimBoundary',
    );
    for (const [key, pinned] of Object.entries(PINNED_CLAIM_BOUNDARY_VALUES)) {
      if (receipt.claimBoundary[key] !== pinned) {
        fail(
          `receipt.claimBoundary.${key} must be ${canonicalJson(pinned)} `
          + '(never-claim flag)',
        );
      }
    }
    if (typeof receipt.claimBoundary.liveSovereignRouteExercised !== 'boolean') {
      fail('receipt.claimBoundary.liveSovereignRouteExercised must be boolean');
    }
    for (const listName of ['observed', 'notObserved']) {
      const list = receipt.claimBoundary[listName];
      if (!Array.isArray(list) || list.length === 0) {
        fail(`receipt.claimBoundary.${listName} must be a non-empty array`);
      }
      for (const item of list) {
        assertNonEmptyString(item, `receipt.claimBoundary.${listName} entry`);
      }
    }

    if (!Array.isArray(receipt.runs) || receipt.runs.length === 0) {
      fail('receipt.runs must be a non-empty array');
    }
    receipt.runs.forEach((run, index) => verifyRunEntry(run, index, receipt));
    if (
      receipt.claimBoundary.liveSovereignRouteExercised
      !== receipt.runs.some((run) => run.live === true)
    ) {
      fail(
        'receipt.claimBoundary.liveSovereignRouteExercised does not match '
        + 'the receipted runs',
      );
    }

    const { receiptHash, ...unsigned } = receipt;
    assertSha256(receiptHash, 'receipt.receiptHash');
    if (canonicalDigest(unsigned) !== receiptHash) {
      fail('receipt.receiptHash does not recompute');
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
    root: process.cwd(),
    output: DEFAULT_OUTPUT,
    storeRoot: null,
    skipLive: false,
    verify: null,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') args.root = argv[++index];
    else if (arg === '--output') args.output = argv[++index];
    else if (arg === '--store-root') args.storeRoot = argv[++index];
    else if (arg === '--skip-live') args.skipLive = true;
    else if (arg === '--verify') args.verify = argv[++index];
    else if (arg === '--json') args.json = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`HoloLand Model Village MV-B2 live turn scheduler check

Usage:
  node scripts/check-hololand-model-village-turn-scheduler.mjs [options]

Options:
  --root <path>        HoloLand repository root
  --output <path>      Receipt output path
  --store-root <path>  Parent directory for the per-run isolated stores
  --skip-live          Run mv-b2-live-r1 against in-process loopback stubs
                       instead of the declared sovereign routes (marks
                       claimBoundary.liveSovereignRouteExercised false);
                       mv-b2-live-r2 uses stubs in EVERY mode
  --verify <path>      Verify an existing receipt file and exit
  --json               Print the bounded receipt as JSON
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function describeRun(run) {
  const lines = [];
  const barrier = run.barrierReceipt;
  lines.push(
    `run ${run.runId} `
    + `(${run.live ? 'LIVE sovereign routes' : 'loopback stubs'}):`,
  );
  for (const entry of run.routeCertifications) {
    lines.push(
      `  route ${entry.routeId} (${entry.required ? 'required' : 'optional'}): `
      + (entry.certified
        ? `certified via ${entry.endpointUsed}`
        : `NOT certified (${entry.failureReason ?? entry.certificationError})`),
    );
  }
  for (const [index, decision] of run.actionDecisionReceipts.entries()) {
    const admission = run.gatedAdmissionReceipts[index];
    const outcome = admission.admitted === true
      ? 'gated deterministic-lane COMMIT'
      : `refused (${admission.refusalClass})`;
    lines.push(
      `  ${decision.residentId}: ${decision.decision}`
      + `${decision.preauthorizedMatch ? ' [preauthorized-match]' : ''} `
      + `(${decision.reason}) -> ${outcome}`,
    );
  }
  const admitted = run.gatedAdmissionReceipts
    .filter((receipt) => receipt.admitted === true).length;
  lines.push(`  gated admissions committed: ${admitted}`);
  lines.push(
    `  concurrency high-water mark: ${barrier.concurrencyHighWaterMark}`,
  );
  lines.push(
    `  barrier resolved counts: completed=${barrier.resolvedCounts.completed} `
    + `failed=${barrier.resolvedCounts.failed} `
    + `timedOut=${barrier.resolvedCounts.timedOut} frozen=${barrier.frozen}`,
  );
  lines.push(
    `  custody access-log entries: ${run.custodyAccessLogEntryCount}`,
  );
  if (run.isolation) {
    lines.push(
      `  isolation vs ${run.isolation.priorRunId}: `
      + `priorRunUntouched=${run.isolation.priorRunUntouched} `
      + `crossRunCustodyReadRefused=${run.isolation.crossRunCustodyReadRefused}`,
    );
  }
  return lines.join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs();
    if (args.verify) {
      const receipt = JSON.parse(
        readFileSync(path.resolve(args.root, args.verify), 'utf8'),
      );
      const verification = verifyTurnSchedulerReceipt(receipt);
      if (!verification.ok) {
        console.error('[hololand-model-village-turn-scheduler] verify FAILED');
        console.error(verification.failureReason);
        process.exit(1);
      }
      console.log('[hololand-model-village-turn-scheduler] verify ok');
      console.log(`receiptHash: ${receipt.receiptHash}`);
    } else {
      const { receipt, output } = await runTurnSchedulerCheck(args);
      if (args.json) {
        console.log(JSON.stringify(receipt, null, 2));
      } else {
        console.log('[hololand-model-village-turn-scheduler] ok');
        console.log(`receipt: ${output}`);
        console.log(`policyHash: ${receipt.policyHash}`);
        console.log(`vocabularyHash: ${receipt.vocabularyHash}`);
        for (const run of receipt.runs) console.log(describeRun(run));
        console.log(
          'live sovereign route exercised: '
          + `${receipt.claimBoundary.liveSovereignRouteExercised}`,
        );
        console.log(
          'live study run: not claimed (engineering tracer lane; live '
          + 'proposals gate, deterministic receipts mutate)',
        );
      }
    }
  } catch (error) {
    console.error('[hololand-model-village-turn-scheduler] failed');
    console.error(error.message || error);
    process.exit(1);
  }
}
