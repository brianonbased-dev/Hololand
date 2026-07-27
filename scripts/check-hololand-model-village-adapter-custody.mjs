#!/usr/bin/env node
/* global Buffer, console, process */

// HoloLand Model Village MV-B1 adapter + custody integration checker.
//
// ENGINEERING CERTIFICATION LANE (drill), NOT the study lane. Routes are
// declared openly by the frozen drill manifest; the sealed
// adapter_a/adapter_b/adapter_c alias-to-route assignment is explicitly OUT
// of scope and is never performed, claimed, or receipted here.
//
// Language boundary (spec HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md lines
// 106-108): this checker is JavaScript transport/canonicalize/verify only.
// The prompt, vocabulary, and route declarations are canonical `.hs` source
// data; certification and turn behavior live in the adapter runtime; sealed
// byte custody lives in the custody store. This file orchestrates and
// verifies; it authors no resident reasoning, treatments, or scoring.
//
// Public-receipt rule (spec lines 288-289): the emitted receipt carries
// hashes and bounded summaries only. Raw prompts, raw responses, and raw
// model text live exclusively in the sealed custody store.

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
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
  executeCertifiedModelTurn,
  loadAdapterCustodyDrillManifest,
  verifyAdapterCertificationReceipt,
  verifyModelTurnReceipt,
} from './model-village-adapter-runtime.mjs';
import {
  createSealedCustodyStore,
} from './model-village-custody-store.mjs';

export const ADAPTER_CUSTODY_RECEIPT_SCHEMA =
  'hololand.model-village-adapter-custody.v1';

const DEFAULT_OUTPUT = path.join(
  '.tmp', 'hololand', 'model-village', 'adapter-custody-receipt.json',
);
const DEFAULT_STORE_PARENT = path.join(
  '.tmp', 'hololand', 'model-village', 'adapter-custody',
);
const OPERATOR = 'mv-b1-adapter-custody-checker';
const RETENTION_POLICY_ID = 'mv-b1-drill-retention-v1';
const RETENTION_DESCRIPTION =
  'Engineering certification drill custody store: bounded drill artifacts '
  + 'only; deletable at any time via content-key destruction with a '
  + 'nonidentifying tombstone.';
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const RECEIPT_KEYS = Object.freeze([
  'accessLogEntryCount',
  'claimBoundary',
  'custodyDrills',
  'drillId',
  'generatedAt',
  'manifestHash',
  'receiptHash',
  'routes',
  'schema',
  'storeManifestHash',
]);
const ROUTE_ENTRY_KEYS = Object.freeze([
  'certification',
  'certificationError',
  'declaredEndpoint',
  'endpointUsed',
  'required',
  'routeId',
  'turn',
  'turnError',
  'turnSkippedReason',
]);
const CUSTODY_DRILLS_KEYS = Object.freeze([
  'allOk',
  'backup',
  'backupVerify',
  'deletion',
  'deletionStoreRoot',
  'integrity',
  'readBackReplay',
  'storeRoot',
]);
const CLAIM_BOUNDARY_KEYS = Object.freeze([
  'blindedAliasAssignmentClaimed',
  'canonicalLaneProviderCallsIntroduced',
  'liveSovereignRouteExercised',
  'liveStudyRunClaimed',
  'notObserved',
  'observed',
  'phase1AdmissionClaimed',
  'processCrashDurabilityClaimed',
  'productionValidatorCustodyClaimed',
  'providerSamplingDeterminismClaimed',
  'sealedAdapterAliasRouteAssignmentIncluded',
  'sixResidentLiveTurnsClaimed',
]);
// Every flag this lane must NEVER claim, pinned to its only legal value.
const PINNED_CLAIM_BOUNDARY_VALUES = Object.freeze({
  blindedAliasAssignmentClaimed: false,
  canonicalLaneProviderCallsIntroduced: 0,
  liveStudyRunClaimed: false,
  phase1AdmissionClaimed: false,
  processCrashDurabilityClaimed: false,
  productionValidatorCustodyClaimed: false,
  providerSamplingDeterminismClaimed: false,
  sealedAdapterAliasRouteAssignmentIncluded: false,
  sixResidentLiveTurnsClaimed: false,
});

export class AdapterCustodyCheckError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AdapterCustodyCheckError';
  }
}

function fail(message) {
  throw new AdapterCustodyCheckError(message);
}

function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
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
    const missing = expected.filter((key) => !actual.includes(key));
    const unexpected = actual.filter((key) => !expected.includes(key));
    fail(
      `${label} keys differ; missing=${canonicalJson(missing)} `
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

function drillTimestamp() {
  return `${new Date().toISOString().replace(/[:.]/g, '-')}-p${process.pid}`;
}

function countJsonlLines(filePath) {
  if (!existsSync(filePath)) return 0;
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0)
    .length;
}

// ---------------------------------------------------------------------------
// --skip-live stub: one in-process OpenAI-compatible node:http server per
// route on 127.0.0.1 (ephemeral port). Payloads embed the routeId so the two
// routes seal DISTINCT bytes (the custody store is content-addressed and
// refuses duplicate plaintext). The stub's chat reply is a vocabulary-valid
// proposal so the offline lane exercises the full parse path.
// ---------------------------------------------------------------------------

function stubChatContent(routeId) {
  return JSON.stringify({
    action: 'contribute_water',
    target: 'commons_cistern',
    amount: 1,
    reason: `stub drill contribution (${routeId})`,
  });
}

function startCertificationStub(route) {
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
            message: { content: stubChatContent(routeId), role: 'assistant' },
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
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        endpoint: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Custody drills on the primary and disposable stores.
// ---------------------------------------------------------------------------

function runReadBackReplayDrill(store, requiredTurn) {
  if (
    !requiredTurn
    || requiredTurn.turnCompleted !== true
    || typeof requiredTurn.custodyRefs?.requestCustodyId !== 'string'
    || typeof requiredTurn.custodyRefs?.responseCustodyId !== 'string'
  ) {
    return {
      ok: false,
      requestByteHashMatches: false,
      requestCustodyId: requiredTurn?.custodyRefs?.requestCustodyId ?? null,
      responseByteHashMatches: false,
      responseCustodyId: requiredTurn?.custodyRefs?.responseCustodyId ?? null,
      responseHashMatches: false,
    };
  }
  const { requestCustodyId, responseCustodyId } = requiredTurn.custodyRefs;
  const requestRead = store.readObject(requestCustodyId);
  const responseRead = store.readObject(responseCustodyId);
  const requestByteHashMatches =
    sha256Hex(requestRead.bytes) === requestCustodyId
    && sha256Hex(requestRead.bytes) === requiredTurn.promptHash;
  const responseByteHashMatches =
    sha256Hex(responseRead.bytes) === responseCustodyId;
  const responseHashMatches =
    sha256Hex(responseRead.bytes) === requiredTurn.responseHash;
  return {
    ok: requestByteHashMatches && responseByteHashMatches && responseHashMatches,
    requestByteHashMatches,
    requestCustodyId,
    responseByteHashMatches,
    responseCustodyId,
    responseHashMatches,
  };
}

function summarizeChecks(result) {
  return {
    ok: result.ok === true,
    checkCount: result.checks.length,
    failedChecks: result.checks
      .filter((check) => check.ok !== true)
      .map((check) => check.name),
  };
}

function runDeletionDrill({ deletionRoot, primaryStore, primaryStoreRoot }) {
  const deletionStore = createSealedCustodyStore({
    rootDir: deletionRoot,
    runLabel: 'mv-b1-adapter-custody-deletion-drill',
    operator: OPERATOR,
    retentionPolicy: {
      description: RETENTION_DESCRIPTION,
      frozenAt: new Date().toISOString(),
      policyId: RETENTION_POLICY_ID,
    },
  });
  const sealed = deletionStore.sealObject({
    bytes: Buffer.from(
      `mv-b1 deletion drill object ${new Date().toISOString()} p${process.pid}`,
      'utf8',
    ),
    kind: 'deletion-drill-object',
    label: 'mv-b1:deletion-drill',
  });
  const tombstone = deletionStore.destroyContentKey({
    reason: 'mv-b1 engineering drill: prove deletion-by-key-destruction',
  });
  let readFailsAfterKeyDestruction = false;
  let readFailureName = null;
  try {
    deletionStore.readObject(sealed.custodyId);
  } catch (error) {
    readFailsAfterKeyDestruction = true;
    readFailureName = error?.name ?? 'Error';
  }
  const tombstoneWritten =
    typeof tombstone?.at === 'string'
    && countJsonlLines(path.join(deletionRoot, 'tombstones.jsonl')) >= 1;
  const checksumVerify = deletionStore.verifyIntegrity();
  const primaryStoreKeyIntact =
    primaryStore.keyDestroyed === false
    && existsSync(path.join(primaryStoreRoot, 'key', 'content-key.bin'));
  const ok =
    readFailsAfterKeyDestruction
    && readFailureName === 'CustodyKeyDestroyedError'
    && tombstoneWritten
    && checksumVerify.mode === 'ciphertext-checksum-only'
    && checksumVerify.ok === true
    && primaryStoreKeyIntact;
  // Release the exclusive store lock: the deletion drill's handle is done.
  deletionStore.close();
  return {
    ok,
    checksumOnlyVerifyMode: checksumVerify.mode,
    checksumOnlyVerifyOk: checksumVerify.ok === true,
    custodyId: sealed.custodyId,
    primaryStoreKeyIntact,
    readFailsAfterKeyDestruction,
    readFailureName,
    tombstoneWritten,
  };
}

// ---------------------------------------------------------------------------
// Drill execution.
// ---------------------------------------------------------------------------

export async function runAdapterCustodyDrill({
  root = process.cwd(),
  output = DEFAULT_OUTPUT,
  storeRoot = null,
  skipLive = false,
  fetchImpl = null,
} = {}) {
  const resolvedRoot = path.resolve(root);
  const bundle = await loadAdapterCustodyDrillManifest({
    hololandRoot: resolvedRoot,
  });
  const { manifestHash } = bundle;

  const storeParent = storeRoot
    ? path.resolve(resolvedRoot, storeRoot)
    : path.resolve(resolvedRoot, DEFAULT_STORE_PARENT, drillTimestamp());
  const primaryStoreRoot = path.join(storeParent, 'store');
  const deletionRoot = path.join(storeParent, 'deletion-drill');

  const store = createSealedCustodyStore({
    rootDir: primaryStoreRoot,
    runLabel: 'mv-b1-adapter-custody-drill',
    operator: OPERATOR,
    retentionPolicy: {
      description: RETENTION_DESCRIPTION,
      frozenAt: new Date().toISOString(),
      policyId: RETENTION_POLICY_ID,
    },
  });

  const failures = [];
  const routeEntries = [];
  const stubs = [];
  const activeFetch = fetchImpl ?? globalThis.fetch;

  try {
    for (const route of bundle.routes) {
      let effectiveRoute = {
        ...route,
        ceilings: { ...route.ceilings },
      };
      if (skipLive) {
        const stub = await startCertificationStub(route);
        stubs.push(stub);
        effectiveRoute = { ...effectiveRoute, endpoint: stub.endpoint };
      }

      const entry = {
        certification: null,
        certificationError: null,
        declaredEndpoint: route.endpoint,
        endpointUsed: effectiveRoute.endpoint,
        required: route.required,
        routeId: route.routeId,
        turn: null,
        turnError: null,
        turnSkippedReason: null,
      };

      try {
        entry.certification = await certifyLockedAdapterRoute({
          route: effectiveRoute,
          drill: bundle,
          custodyStore: store,
          operator: OPERATOR,
          priorReceiptHash: manifestHash,
          fetchImpl: activeFetch,
        });
      } catch (error) {
        entry.certificationError = error?.message ?? String(error);
        entry.turnSkippedReason = 'certification-error';
      }

      if (entry.certification && entry.certification.certified !== true) {
        entry.turnSkippedReason = 'route-not-certified';
      } else if (entry.certification) {
        try {
          entry.turn = await executeCertifiedModelTurn({
            route: effectiveRoute,
            certification: entry.certification,
            drill: bundle,
            custodyStore: store,
            operator: OPERATOR,
            priorReceiptHash: entry.certification.receiptHash,
            fetchImpl: activeFetch,
          });
        } catch (error) {
          entry.turnError = error?.message ?? String(error);
        }
      }

      routeEntries.push(entry);

      if (route.required) {
        if (!entry.certification) {
          failures.push(
            `required route ${route.routeId} certification errored: `
            + `${entry.certificationError}`,
          );
        } else if (entry.certification.certified !== true) {
          failures.push(
            `required route ${route.routeId} did not certify `
            + `(${entry.certification.failureReason})`,
          );
        } else if (!entry.turn) {
          failures.push(
            `required route ${route.routeId} turn errored: ${entry.turnError}`,
          );
        } else if (entry.turn.turnCompleted !== true) {
          failures.push(
            `required route ${route.routeId} turn did not complete `
            + `(${entry.turn.errorClass})`,
          );
        } else if (entry.turn.proposalDecision === 'not_evaluated') {
          failures.push(
            `required route ${route.routeId} turn produced no parsed `
            + 'proposal decision',
          );
        }
      }
      // Optional route failures are receipted above, never fatal.
    }
  } finally {
    for (const stub of stubs) await stub.close();
  }

  // Custody drills on the primary store, then the disposable deletion store.
  const requiredEntry = routeEntries.find((entry) => entry.required) ?? null;
  const readBackReplay = runReadBackReplayDrill(
    store,
    requiredEntry?.turn ?? null,
  );
  const integrity = {
    mode: null,
    ...(() => {
      const result = store.verifyIntegrity();
      return { ...summarizeChecks(result), mode: result.mode };
    })(),
  };
  const backupResult = store.createBackup();
  const backup = {
    ok: backupResult.ok === true,
    fileCount: backupResult.fileCount,
  };
  const backupVerifyResult = store.verifyBackup();
  const backupVerify = {
    ok: backupVerifyResult.ok === true,
    failedChecks: backupVerifyResult.checks
      .filter((check) => check.ok !== true)
      .map((check) => check.name),
  };
  const deletion = runDeletionDrill({
    deletionRoot,
    primaryStore: store,
    primaryStoreRoot,
  });
  const custodyDrills = {
    allOk:
      readBackReplay.ok
      && integrity.ok
      && backup.ok
      && backupVerify.ok
      && deletion.ok,
    backup,
    backupVerify,
    deletion,
    deletionStoreRoot: normalizePath(resolvedRoot, deletionRoot),
    integrity,
    readBackReplay,
    storeRoot: normalizePath(resolvedRoot, primaryStoreRoot),
  };
  for (const [name, drill] of Object.entries({
    'read-back replay': readBackReplay,
    integrity,
    backup,
    'backup verify': backupVerify,
    deletion,
  })) {
    if (drill.ok !== true) failures.push(`custody drill failed: ${name}`);
  }

  const storeManifestHash = canonicalDigest(store.getManifest());
  const accessLogEntryCount = countJsonlLines(
    path.join(primaryStoreRoot, 'access-log.jsonl'),
  );
  // All primary-store drills are complete; release its exclusive lock so a
  // later operator handle can open the store root for audit.
  store.close();

  const claimBoundary = {
    observed: [
      'first executable adapter seam: manifest-pinned route certification and model-turn execution',
      `certified sovereign route(s): ${routeEntries
        .filter((entry) => entry.certification?.certified === true)
        .map((entry) => entry.routeId)
        .join(', ') || 'none'}`,
      'one receipted model turn per certified route in the engineering certification lane',
      'sealed custody write, read-back replay, integrity verify, backup, backup verify, hash-chained access log, key destruction, and nonidentifying tombstone drills',
      'zero-retry by construction: retryCount pinned 0 in the manifest and verified in every receipt',
      'raw prompt and response bytes custody-only; the public receipt carries hashes and bounded summaries',
    ],
    notObserved: [
      'live study run',
      'Phase 1 admission or readiness',
      'six-resident live turns',
      'blinded alias assignment (the sealed adapter_a/adapter_b/adapter_c alias-to-route assignment is out of scope for this drill)',
      'production validator custody',
      'process-crash durability',
      'provider sampling determinism (temperature zero is not a determinism receipt)',
    ],
    liveSovereignRouteExercised: skipLive === false,
    ...PINNED_CLAIM_BOUNDARY_VALUES,
  };

  const unsigned = {
    schema: ADAPTER_CUSTODY_RECEIPT_SCHEMA,
    drillId: bundle.drill.drillId,
    manifestHash,
    generatedAt: new Date().toISOString(),
    routes: routeEntries,
    custodyDrills,
    storeManifestHash,
    accessLogEntryCount,
    claimBoundary,
  };
  const receipt = { ...unsigned, receiptHash: canonicalDigest(unsigned) };

  const resolvedOutput = path.resolve(resolvedRoot, output);
  mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  writeFileSync(resolvedOutput, `${JSON.stringify(receipt, null, 2)}\n`);

  const verification = verifyAdapterCustodyReceipt(receipt);
  if (!verification.ok) {
    failures.push(`emitted receipt failed self-verification: ${verification.failureReason}`);
  }

  if (failures.length > 0) {
    throw new AdapterCustodyCheckError(
      `Model Village adapter custody drill failed: ${failures.join('; ')}. `
      + `Receipt: ${resolvedOutput}`,
    );
  }

  return { receipt, output: resolvedOutput };
}

// ---------------------------------------------------------------------------
// Receipt verification (closed keys, schema pin, pinned claim boundary,
// nested receipt verification, chain binding, self-hash recompute — same
// pattern as verifyPhase0BReceiptHash: the receiptHash covers everything
// but itself, so tampering ANY field fails).
// ---------------------------------------------------------------------------

export function verifyAdapterCustodyReceipt(receipt) {
  try {
    assertExactKeys(receipt, RECEIPT_KEYS, 'adapter custody receipt');
    if (receipt.schema !== ADAPTER_CUSTODY_RECEIPT_SCHEMA) {
      fail(`receipt schema must be '${ADAPTER_CUSTODY_RECEIPT_SCHEMA}'`);
    }
    assertNonEmptyString(receipt.drillId, 'receipt.drillId');
    assertSha256(receipt.manifestHash, 'receipt.manifestHash');
    assertNonEmptyString(receipt.generatedAt, 'receipt.generatedAt');
    assertSha256(receipt.storeManifestHash, 'receipt.storeManifestHash');
    if (
      !Number.isInteger(receipt.accessLogEntryCount)
      || receipt.accessLogEntryCount < 1
    ) {
      fail('receipt.accessLogEntryCount must be a positive integer');
    }

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

    if (!Array.isArray(receipt.routes) || receipt.routes.length === 0) {
      fail('receipt.routes must be a non-empty array');
    }
    let requiredCount = 0;
    receipt.routes.forEach((entry, index) => {
      const label = `receipt.routes[${index}]`;
      assertExactKeys(entry, ROUTE_ENTRY_KEYS, label);
      assertNonEmptyString(entry.routeId, `${label}.routeId`);
      assertNonEmptyString(entry.declaredEndpoint, `${label}.declaredEndpoint`);
      assertNonEmptyString(entry.endpointUsed, `${label}.endpointUsed`);
      if (typeof entry.required !== 'boolean') {
        fail(`${label}.required must be boolean`);
      }
      if (entry.required) requiredCount += 1;
      if (entry.certification !== null) {
        const check = verifyAdapterCertificationReceipt(entry.certification);
        if (!check.ok) {
          fail(`${label}.certification invalid: ${check.failureReason}`);
        }
        if (entry.certification.routeId !== entry.routeId) {
          fail(`${label}.certification routeId does not bind this route`);
        }
        if (entry.certification.priorReceiptHash !== receipt.manifestHash) {
          fail(`${label}.certification does not chain from the manifest hash`);
        }
      }
      if (entry.turn !== null) {
        if (entry.certification === null) {
          fail(`${label} carries a turn without a certification`);
        }
        const check = verifyModelTurnReceipt(entry.turn);
        if (!check.ok) fail(`${label}.turn invalid: ${check.failureReason}`);
        if (entry.turn.routeId !== entry.routeId) {
          fail(`${label}.turn routeId does not bind this route`);
        }
        if (entry.turn.priorReceiptHash !== entry.certification.receiptHash) {
          fail(`${label}.turn does not chain from its certification receipt`);
        }
      }
    });
    if (requiredCount < 1) {
      fail('receipt.routes must include at least one required route');
    }

    assertExactKeys(receipt.custodyDrills, CUSTODY_DRILLS_KEYS, 'receipt.custodyDrills');
    for (const drillKey of [
      'readBackReplay', 'integrity', 'backup', 'backupVerify', 'deletion',
    ]) {
      assertObject(receipt.custodyDrills[drillKey], `receipt.custodyDrills.${drillKey}`);
      if (typeof receipt.custodyDrills[drillKey].ok !== 'boolean') {
        fail(`receipt.custodyDrills.${drillKey}.ok must be boolean`);
      }
    }
    if (typeof receipt.custodyDrills.allOk !== 'boolean') {
      fail('receipt.custodyDrills.allOk must be boolean');
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
      console.log(`HoloLand Model Village adapter + custody drill check

Usage:
  node scripts/check-hololand-model-village-adapter-custody.mjs [options]

Options:
  --root <path>        HoloLand repository root
  --output <path>      Receipt output path
  --store-root <path>  Parent directory for the drill custody stores
  --skip-live          Certify against in-process stubs instead of the
                       declared sovereign routes (marks
                       claimBoundary.liveSovereignRouteExercised false)
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

function describeRoute(entry) {
  const certified = entry.certification?.certified === true;
  const parts = [
    `route ${entry.routeId} (${entry.required ? 'required' : 'optional'}):`,
    certified ? 'certified' : `NOT certified (${entry.certification?.failureReason ?? entry.certificationError})`,
  ];
  if (entry.turn) {
    parts.push(
      `turn ${entry.turn.turnCompleted ? 'completed' : `failed (${entry.turn.errorClass})`}`,
      `latency ${entry.turn.latencyMs}ms`,
      `proposal ${entry.turn.proposalDecision}`,
    );
  } else if (entry.turnSkippedReason) {
    parts.push(`turn skipped: ${entry.turnSkippedReason}`);
  } else if (entry.turnError) {
    parts.push(`turn errored: ${entry.turnError}`);
  }
  return parts.join(' ');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs();
    if (args.verify) {
      const receipt = JSON.parse(
        readFileSync(path.resolve(args.root, args.verify), 'utf8'),
      );
      const verification = verifyAdapterCustodyReceipt(receipt);
      if (!verification.ok) {
        console.error('[hololand-model-village-adapter-custody] verify FAILED');
        console.error(verification.failureReason);
        process.exit(1);
      }
      console.log('[hololand-model-village-adapter-custody] verify ok');
      console.log(`receiptHash: ${receipt.receiptHash}`);
    } else {
      const { receipt, output } = await runAdapterCustodyDrill(args);
      if (args.json) {
        console.log(JSON.stringify(receipt, null, 2));
      } else {
        console.log('[hololand-model-village-adapter-custody] ok');
        console.log(`receipt: ${output}`);
        console.log(`manifestHash: ${receipt.manifestHash}`);
        for (const entry of receipt.routes) console.log(describeRoute(entry));
        console.log(`custody drills allOk: ${receipt.custodyDrills.allOk}`);
        console.log(`access-log entries: ${receipt.accessLogEntryCount}`);
        console.log(
          `live sovereign route exercised: `
          + `${receipt.claimBoundary.liveSovereignRouteExercised}`,
        );
        console.log('live study run: not claimed (engineering certification lane)');
      }
    }
  } catch (error) {
    console.error('[hololand-model-village-adapter-custody] failed');
    console.error(error.message || error);
    process.exit(1);
  }
}
