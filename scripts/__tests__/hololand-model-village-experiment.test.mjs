#!/usr/bin/env node
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveReceiptOutput,
  runModelVillageCheck,
  validateHeadlessReceipt,
} from '../check-hololand-model-village-experiment.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..', '..');
const outputDir = path.join(repoRoot, '.tmp', 'hololand', 'model-village', 'test');
mkdirSync(outputDir, { recursive: true });
const output = path.join(
  outputDir,
  `receipt-${process.pid}-${randomUUID()}.json`,
);

const { receipt } = runModelVillageCheck({
  root: repoRoot,
  output,
  durationMs: 60,
  tickRate: 10,
});

assert.equal(receipt.schemaVersion, 'hololand.model-village-experiment.v0.1.0');
assert.equal(receipt.status, 'pass');
assert.equal(receipt.sourceContract.threeFormat, true);
assert.deepEqual(
  receipt.parsers.map((entry) => [entry.format, entry.passed]),
  [
    ['.holo', true],
    ['.hsplus', true],
    ['.hs', true],
  ],
);
assert.equal(receipt.headlessReplay.canonicalMatch, true);
assert.equal(receipt.headlessReplay.objectCount, 12);
assert.equal(receipt.headlessReplay.objectIds.length, 12);
assert.equal(receipt.runtimeEvidence.modelTurnsExecuted, null);
assert.equal(receipt.runtimeEvidence.agentActionsExecuted, null);
assert.equal(receipt.runtimeEvidence.executionCountsAvailable, false);
assert.equal(receipt.runtimeEvidence.scientificOutcomeClaimed, false);
assert.equal(receipt.runtimeEvidence.providerCallsMadeByChecker, 0);
assert.equal(receipt.capabilityStatus.observed.worldMaterialization, true);
assert.equal(receipt.capabilityStatus.observed.canonicalSceneReplay, true);
assert.equal(receipt.capabilityStatus.targetObserved.liveModelAdapterInvocation, false);
assert.equal(receipt.capabilityStatus.targetObserved.receiptedActionExecution, false);
assert.equal(receipt.experimentDesign.models, 3);
assert.equal(receipt.experimentDesign.residents, 6);
assert.equal(receipt.experimentDesign.conditions.length, 4);
assert.equal(receipt.experimentDesign.seedBlocks, 3);
assert.equal(receipt.experimentDesign.plannedVillageRuns, 12);
assert.ok(receipt.receipt.receiptHash);
assert.ok(receipt.toolchain.holoScriptCliSha256);
assert.ok(receipt.toolchain.checkerSha256);
assert.equal(receipt.toolchain.durationMs, 60);
assert.equal(receipt.toolchain.tickRate, 10);
assert.equal(existsSync(output), true);

const emptyHeadlessValidation = validateHeadlessReceipt({});
assert.equal(emptyHeadlessValidation.passed, false);
assert.ok(emptyHeadlessValidation.errors.length > 0);
assert.throws(
  () => resolveReceiptOutput(repoRoot, 'package.json'),
  /must be a \.json file inside/,
);

const persisted = JSON.parse(readFileSync(output, 'utf8'));
assert.equal(persisted.receipt.receiptHash, receipt.receipt.receiptHash);

const negativeRoot = mkdtempSync(path.join(tmpdir(), 'hololand-model-village-negative-'));
const negativeFiles = [
  'source/layers/vr/frontier/model-village/model-village.holo',
  'source/domains/agents/model-village-experiment.hsplus',
  'source/proofs/model-village-trial-kernel.hs',
  'docs/specs/HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md',
  'package.json',
];

for (const relativePath of negativeFiles) {
  const destination = path.join(negativeRoot, relativePath);
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(path.join(repoRoot, relativePath), destination);
}

const negativeKernel = path.join(
  negativeRoot,
  'source/proofs/model-village-trial-kernel.hs',
);
writeFileSync(
  negativeKernel,
  readFileSync(negativeKernel, 'utf8')
    .replace(
      'bridgeMayOwnVillageBehavior: false',
      'bridgeMayOwnVillageBehavior: true\n  // bridgeMayOwnVillageBehavior: false',
    ),
  'utf8',
);

const negativeOutput = path.join(negativeRoot, '.tmp', 'receipt.json');
const previousHoloScriptRoot = process.env.HOLOSCRIPT_ROOT;
process.env.HOLOSCRIPT_ROOT = path.resolve(repoRoot, '..', 'HoloScript');
try {
  assert.throws(
    () => runModelVillageCheck({
      root: negativeRoot,
      output: negativeOutput,
      durationMs: 20,
      tickRate: 10,
    }),
    /kernelKeepsBehaviorInHoloScript/,
  );
} finally {
  if (previousHoloScriptRoot === undefined) delete process.env.HOLOSCRIPT_ROOT;
  else process.env.HOLOSCRIPT_ROOT = previousHoloScriptRoot;
}

const negativeReceipt = JSON.parse(readFileSync(negativeOutput, 'utf8'));
assert.equal(negativeReceipt.status, 'fail');
assert.equal(negativeReceipt.assertions.kernelKeepsBehaviorInHoloScript, false);

rmSync(output, { force: true });
console.log('PASS HoloLand model village experiment');
