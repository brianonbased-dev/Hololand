#!/usr/bin/env node
/* global structuredClone */

// MV-B1 adapter + custody integration checker tests. Fully offline: the run
// uses --skip-live semantics, so every route is served by the checker's
// in-process loopback stub (ephemeral port) — the same offline convention as
// model-village-adapter-runtime.test.mjs. Nothing here claims a live study
// run, Phase 1 admission, six-resident live turns, or blinded alias
// assignment; the manifest-declared sovereign endpoints are asserted as
// frozen data (compared against the loaded manifest), not contacted.

import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { canonicalDigest } from '../model-village-phase0b-runtime.mjs';
import {
  ADAPTER_CUSTODY_RECEIPT_SCHEMA,
  runAdapterCustodyDrill,
  verifyAdapterCustodyReceipt,
} from '../check-hololand-model-village-adapter-custody.mjs';
import {
  loadAdapterCustodyDrillManifest,
} from '../model-village-adapter-runtime.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..', '..');

// Snapshot the DEFAULT output/store locations before the isolated run so the
// isolation test can prove the run wrote nothing outside its scratch dir.
const defaultOutputPath = path.join(
  repoRoot, '.tmp', 'hololand', 'model-village', 'adapter-custody-receipt.json',
);
const defaultStoreParent = path.join(
  repoRoot, '.tmp', 'hololand', 'model-village', 'adapter-custody',
);
function snapshotPath(target) {
  if (!existsSync(target)) return { exists: false, mtimeMs: null };
  return { exists: true, mtimeMs: statSync(target).mtimeMs };
}
function listDir(target) {
  if (!existsSync(target)) return null;
  return readdirSync(target).sort();
}

const defaultOutputBefore = snapshotPath(defaultOutputPath);
const defaultStoreListingBefore = listDir(defaultStoreParent);

const scratchDir = mkdtempSync(path.join(os.tmpdir(), 'mv-b1-adapter-custody-'));
const storeParent = path.join(scratchDir, 'stores');
const outputPath = path.join(scratchDir, 'receipt.json');

// The frozen drill manifest is the endpoint authority for every assertion.
const bundle = await loadAdapterCustodyDrillManifest({ hololandRoot: repoRoot });

// One shared offline run; the tests below assert against its receipt.
const { receipt, output } = await runAdapterCustodyDrill({
  root: repoRoot,
  output: outputPath,
  storeRoot: storeParent,
  skipLive: true,
});

test('receipt schema, identity, and manifest binding', () => {
  assert.equal(receipt.schema, ADAPTER_CUSTODY_RECEIPT_SCHEMA);
  assert.equal(receipt.schema, 'hololand.model-village-adapter-custody.v1');
  assert.equal(receipt.drillId, 'mv-b1-adapter-custody-v1');
  assert.match(receipt.manifestHash, /^[a-f0-9]{64}$/);
  assert.match(receipt.storeManifestHash, /^[a-f0-9]{64}$/);
  assert.ok(Number.isInteger(receipt.accessLogEntryCount));
  assert.ok(receipt.accessLogEntryCount >= 10);
  assert.equal(receipt.manifestHash, bundle.manifestHash);
  assert.equal(output, outputPath);
  const onDisk = JSON.parse(readFileSync(outputPath, 'utf8'));
  assert.deepEqual(onDisk, JSON.parse(JSON.stringify(receipt)));
});

test('required route certified with a completed evaluated turn', () => {
  assert.equal(receipt.routes.length, 2);
  const required = receipt.routes.find((entry) => entry.required);
  assert.ok(required, 'a required route entry must exist');
  assert.equal(required.routeId, bundle.routes[0].routeId);
  assert.equal(required.routeId, 'sovereign-holoserve-laptop');
  // Declared endpoint is the frozen manifest value; the endpoint actually
  // used under --skip-live is the ephemeral stub, never the declared one.
  assert.equal(required.declaredEndpoint, bundle.routes[0].endpoint);
  assert.notEqual(required.endpointUsed, required.declaredEndpoint);
  assert.equal(required.certification.certified, true);
  assert.equal(required.certification.priorReceiptHash, receipt.manifestHash);
  assert.equal(required.turn.turnCompleted, true);
  assert.equal(required.turn.retries, 0);
  assert.equal(required.turn.priorReceiptHash, required.certification.receiptHash);
  assert.equal(required.turn.proposalDecision, 'valid_proposal');
  assert.notEqual(required.turn.proposalDecision, 'not_evaluated');
  // Public form only: bounded proposal, no raw reason text anywhere.
  assert.match(required.turn.parsedProposal.reasonSha256, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(receipt).includes('stub drill contribution'));

  const optional = receipt.routes.find((entry) => !entry.required);
  assert.equal(optional.routeId, bundle.routes[1].routeId);
  assert.equal(optional.declaredEndpoint, bundle.routes[1].endpoint);
  assert.equal(optional.certification.certified, true);
  assert.equal(optional.turn.turnCompleted, true);
});

test('all custody drills pass', () => {
  const drills = receipt.custodyDrills;
  assert.equal(drills.allOk, true);
  assert.equal(drills.readBackReplay.ok, true);
  assert.equal(drills.readBackReplay.requestByteHashMatches, true);
  assert.equal(drills.readBackReplay.responseByteHashMatches, true);
  assert.equal(drills.readBackReplay.responseHashMatches, true);
  assert.equal(drills.integrity.ok, true);
  assert.equal(drills.integrity.mode, 'plaintext-decrypt');
  assert.deepEqual(drills.integrity.failedChecks, []);
  assert.equal(drills.backup.ok, true);
  assert.ok(drills.backup.fileCount >= 3);
  assert.equal(drills.backupVerify.ok, true);
  assert.deepEqual(drills.backupVerify.failedChecks, []);
  assert.equal(drills.deletion.ok, true);
  assert.equal(drills.deletion.readFailsAfterKeyDestruction, true);
  assert.equal(drills.deletion.readFailureName, 'CustodyKeyDestroyedError');
  assert.equal(drills.deletion.tombstoneWritten, true);
  assert.equal(drills.deletion.checksumOnlyVerifyMode, 'ciphertext-checksum-only');
  assert.equal(drills.deletion.checksumOnlyVerifyOk, true);
  assert.equal(drills.deletion.primaryStoreKeyIntact, true);
});

test('claim-boundary flags are exactly the pinned never-claim set', () => {
  const boundary = receipt.claimBoundary;
  assert.equal(boundary.liveStudyRunClaimed, false);
  assert.equal(boundary.phase1AdmissionClaimed, false);
  assert.equal(boundary.sixResidentLiveTurnsClaimed, false);
  assert.equal(boundary.blindedAliasAssignmentClaimed, false);
  assert.equal(boundary.productionValidatorCustodyClaimed, false);
  assert.equal(boundary.processCrashDurabilityClaimed, false);
  assert.equal(boundary.providerSamplingDeterminismClaimed, false);
  assert.equal(boundary.canonicalLaneProviderCallsIntroduced, 0);
  assert.equal(boundary.sealedAdapterAliasRouteAssignmentIncluded, false);
  // --skip-live semantics: no sovereign route was exercised.
  assert.equal(boundary.liveSovereignRouteExercised, false);
  assert.ok(Array.isArray(boundary.observed) && boundary.observed.length > 0);
  assert.ok(Array.isArray(boundary.notObserved) && boundary.notObserved.length > 0);
  assert.ok(
    boundary.notObserved.some((item) => item.includes('out of scope')),
    'alias-assignment exclusion must be stated',
  );
  assert.ok(
    boundary.notObserved.some((item) => item.includes('not a determinism receipt')),
    'temperature-zero boundary must be stated',
  );
});

test('receipt self-hash verifies and recomputes', () => {
  assert.deepEqual(verifyAdapterCustodyReceipt(receipt), {
    ok: true,
    failureReason: null,
  });
  const { receiptHash, ...unsigned } = receipt;
  assert.equal(canonicalDigest(unsigned), receiptHash);
});

test('tampering any receipt field fails verification', () => {
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
      verifyAdapterCustodyReceipt(tampered).ok,
      false,
      `tampering top-level '${key}' must fail verification`,
    );
  }
  // Deep tampers across every receipt region.
  const deepTampers = [
    (clone) => { clone.routes[0].certification.certified = false; },
    (clone) => { clone.routes[0].certification.endpoint = 'tampered.invalid'; },
    (clone) => { clone.routes[0].turn.proposalDecision = 'deny'; },
    (clone) => { clone.routes[0].turn.retries = 1; },
    (clone) => { clone.routes[1].turn.priorReceiptHash = '0'.repeat(64); },
    (clone) => { clone.custodyDrills.deletion.ok = false; },
    (clone) => { clone.custodyDrills.readBackReplay.requestByteHashMatches = false; },
    (clone) => { clone.claimBoundary.liveStudyRunClaimed = true; },
    (clone) => { clone.claimBoundary.canonicalLaneProviderCallsIntroduced = 1; },
    (clone) => { clone.accessLogEntryCount += 1; },
    (clone) => { clone.receiptHash = '0'.repeat(64); },
    (clone) => { delete clone.custodyDrills; },
  ];
  deepTampers.forEach((mutate, index) => {
    const tampered = structuredClone(receipt);
    mutate(tampered);
    assert.equal(
      verifyAdapterCustodyReceipt(tampered).ok,
      false,
      `deep tamper #${index} must fail verification`,
    );
  });
  assert.equal(verifyAdapterCustodyReceipt(null).ok, false);
  assert.equal(verifyAdapterCustodyReceipt({}).ok, false);
});

test('store root is isolated under the given scratch dir', () => {
  // Everything the run wrote lives under the scratch dir.
  const primaryStoreRoot = path.join(storeParent, 'store');
  const deletionRoot = path.join(storeParent, 'deletion-drill');
  assert.ok(existsSync(path.join(primaryStoreRoot, 'store-manifest.json')));
  assert.ok(existsSync(path.join(primaryStoreRoot, 'access-log.jsonl')));
  assert.ok(existsSync(path.join(primaryStoreRoot, 'backup', 'checksums.json')));
  assert.ok(existsSync(path.join(deletionRoot, 'tombstones.jsonl')));
  assert.ok(!existsSync(path.join(deletionRoot, 'key', 'content-key.bin')));
  assert.ok(existsSync(path.join(primaryStoreRoot, 'key', 'content-key.bin')));
  assert.ok(existsSync(outputPath));
  // The recorded store root resolves back to the scratch store root.
  assert.equal(
    path.resolve(repoRoot, receipt.custodyDrills.storeRoot),
    path.resolve(primaryStoreRoot),
  );
  // And nothing was written to the DEFAULT locations by this isolated run.
  assert.deepEqual(snapshotPath(defaultOutputPath), defaultOutputBefore);
  assert.deepEqual(listDir(defaultStoreParent), defaultStoreListingBefore);
  // The access-log count in the receipt matches the isolated store's log.
  const logLines = readFileSync(
    path.join(primaryStoreRoot, 'access-log.jsonl'),
    'utf8',
  ).split('\n').filter((line) => line.length > 0);
  assert.equal(receipt.accessLogEntryCount, logLines.length);
});

test.after(() => {
  rmSync(scratchDir, { recursive: true, force: true });
});
