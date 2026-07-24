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
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  compareObserverBoundaryFields,
  executeObserverBoundaryFixture,
  resolveReceiptOutput,
  runModelVillageCheck,
  validateObserverBoundaryFields,
  validateHeadlessReceipt,
  verifyModelVillageReceiptHash,
  verifyObserverBoundaryFixtureReceipt,
} from '../check-hololand-model-village-experiment.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..', '..');
const outputDir = path.join(repoRoot, '.tmp', 'hololand', 'model-village', 'test');
mkdirSync(outputDir, { recursive: true });
const output = path.join(
  outputDir,
  `receipt-${process.pid}-${randomUUID()}.json`,
);

const { receipt } = await runModelVillageCheck({
  root: repoRoot,
  output,
  durationMs: 60,
  tickRate: 10,
});

assert.equal(receipt.schemaVersion, 'hololand.model-village-experiment.v0.2.0');
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
assert.equal(receipt.runtimeEvidence.capturedFixtureScheduleEntriesExecuted, 3);
assert.equal(receipt.runtimeEvidence.capturedFixtureResidentObservationsMaterialized, 6);
assert.equal(receipt.runtimeEvidence.capturedFixtureActionReceiptsSealed, 2);
assert.equal(receipt.runtimeEvidence.nativeHsPipelineExecutionClaimed, false);
assert.equal(receipt.runtimeEvidence.nativeHsplusActionExecutionClaimed, false);
assert.equal(receipt.capabilityStatus.observed.worldMaterialization, true);
assert.equal(receipt.capabilityStatus.observed.canonicalSceneReplay, true);
assert.equal(receipt.capabilityStatus.observed.capturedObserverBoundaryFixtureReplay, true);
assert.equal(receipt.capabilityStatus.targetObserved.liveModelAdapterInvocation, false);
assert.equal(receipt.capabilityStatus.targetObserved.receiptedActionExecution, false);
assert.equal(receipt.experimentDesign.models, 3);
assert.equal(receipt.experimentDesign.residents, 6);
assert.equal(receipt.experimentDesign.conditions.length, 4);
assert.equal(receipt.experimentDesign.seedBlocks, 3);
assert.equal(receipt.experimentDesign.plannedVillageRuns, 12);
assert.equal(receipt.observerBoundaryFixture.status, 'pass');
assert.equal(receipt.observerBoundaryFixture.fieldValidation.passed, true);
assert.equal(receipt.observerBoundaryFixture.adapterAssignmentExclusion.status, 'pass');
assert.equal(
  receipt.observerBoundaryFixture.adapterAssignmentExclusion.assignmentHashes.length,
  3,
);
assert.equal(
  receipt.observerBoundaryFixture.adapterAssignmentExclusion
    .postInferenceOutcomeEquivalenceClaimed,
  false,
);
assert.equal(
  receipt.observerBoundaryFixture.claimBoundary.referencedSafetyDecisionReceiptsValidated,
  false,
);
assert.equal(
  receipt.observerBoundaryFixture.claimBoundary.actionReceiptRootScope,
  'syntactically_chained_action_fixture_receipts_only',
);
assert.equal(receipt.observerBoundaryFixture.executedSchedule.length, 3);
assert.equal(receipt.observerBoundaryFixture.residentObservations.length, 6);
assert.equal(receipt.observerBoundaryFixture.actionReceipts.length, 2);
for (const value of Object.values(receipt.observerBoundaryFixture.canonicalFields)) {
  assert.match(value, /^[a-f0-9]{64}$/);
}
for (const field of Object.keys(receipt.observerBoundaryFixture.canonicalFields)) {
  const tampered = {
    ...receipt.observerBoundaryFixture.canonicalFields,
    [field]: 'f'.repeat(64),
  };
  const comparison = compareObserverBoundaryFields(
    receipt.observerBoundaryFixture.canonicalFields,
    tampered,
  );
  assert.equal(comparison.passed, false);
  assert.deepEqual(comparison.changedFields, [field]);
}
const missingBoundary = { ...receipt.observerBoundaryFixture.canonicalFields };
delete missingBoundary.executedScheduleHash;
assert.equal(
  compareObserverBoundaryFields(
    receipt.observerBoundaryFixture.canonicalFields,
    missingBoundary,
  ).passed,
  false,
);
const invalidBoundary = {
  ...receipt.observerBoundaryFixture.canonicalFields,
  actionReceiptRoot: 'z'.repeat(64),
};
const invalidBoundaryComparison = compareObserverBoundaryFields(
  receipt.observerBoundaryFixture.canonicalFields,
  invalidBoundary,
);
assert.equal(invalidBoundaryComparison.passed, false);
assert.deepEqual(invalidBoundaryComparison.invalidAfter, ['actionReceiptRoot']);
assert.deepEqual(
  validateObserverBoundaryFields(invalidBoundary).invalidFields,
  ['actionReceiptRoot'],
);
assert.equal(verifyObserverBoundaryFixtureReceipt(receipt.observerBoundaryFixture), true);
assert.equal(verifyModelVillageReceiptHash(receipt), true);
const claimMutatedReceipt = structuredClone(receipt);
claimMutatedReceipt.claimBoundary.observed.push('native .hs pipeline execution');
assert.equal(verifyModelVillageReceiptHash(claimMutatedReceipt), false);
const fixtureClaimMutatedReceipt = structuredClone(receipt.observerBoundaryFixture);
fixtureClaimMutatedReceipt.claimBoundary.nativeHsPipelineExecutionClaimed = true;
fixtureClaimMutatedReceipt.claimBoundary.liveModelTurnsClaimed = true;
assert.equal(verifyObserverBoundaryFixtureReceipt(fixtureClaimMutatedReceipt), false);

const holoScriptCore = await import(pathToFileURL(path.join(
  repoRoot,
  '..',
  'HoloScript',
  'packages',
  'core',
  'dist',
  'index.js',
)).href);
const kernelSource = readFileSync(
  path.join(repoRoot, 'source/proofs/model-village-trial-kernel.hs'),
  'utf8',
);
const policySource = readFileSync(
  path.join(repoRoot, 'source/domains/agents/model-village-experiment.hsplus'),
  'utf8',
);
const headlessFixture = {
  scene: { schema: 'test-scene', objectCount: 12 },
  posePhysics: { schema: 'test-pose', objectCount: 12 },
};
const executeFixture = (source) => executeObserverBoundaryFixture({
  core: holoScriptCore,
  kernelSource: source,
  policySource,
  headlessReceipt: headlessFixture,
});
assert.throws(
  () => executeObserverBoundaryFixture({
    core: holoScriptCore,
    kernelSource,
    policySource,
    headlessReceipt: null,
  }),
  /requires available native headless scene and posePhysics receipts/,
);
assert.throws(
  () => executeFixture(
    kernelSource.replace(
      'residentId: "resident-01"\n  location: "VillageCommons"',
      'residentId: "resident-01"\n  adapterAlias: "adapter_a"\n  location: "VillageCommons"',
    ),
  ),
  /unexpected=\["adapterAlias"\]/,
);
assert.throws(
  () => executeFixture(
    kernelSource.replace(
      'scheduleOrder: ["mv-p0-schedule-observe", "mv-p0-schedule-admit-01", "mv-p0-schedule-admit-02"]',
      'scheduleOrder: ["mv-p0-schedule-admit-01", "mv-p0-schedule-observe", "mv-p0-schedule-admit-02"]',
    ),
  ),
  /Schedule cannot seal action receipt|Schedule entry .* is malformed/,
);
assert.throws(
  () => executeFixture(kernelSource.replace(
    'rollbackReference: "mv-p0-public-state-before"',
    'rollbackReference: "does-not-exist"',
  )),
  /Action receipt fixture .* is malformed/,
);
assert.throws(
  () => executeFixture(kernelSource.replace(
    'authorizationNonce: "mv-p0-auth-02"',
    'authorizationNonce: "mv-p0-auth-01"',
  )),
  /duplicates or omits authorizationNonce/,
);
assert.throws(
  () => executeFixture(kernelSource.replace(
    'block2: ["adapter_b", "adapter_b", "adapter_c", "adapter_c", "adapter_a", "adapter_a"]',
    'block2: ["adapter_a", "adapter_a", "adapter_b", "adapter_b", "adapter_c", "adapter_c"]',
  )),
  /distinct assignment vectors/,
);
assert.throws(
  () => executeFixture(kernelSource.replace(
    'outcome: "blocked_without_world_mutation"',
    'outcome: "world_mutated_anyway"',
  )),
  /Action receipt fixture .* is malformed/,
);
assert.throws(
  () => executeFixture(kernelSource.replace(
    'rollbackReference: "mv-p0-public-state-after"\n  playerVisibleImpact: false\n  allowed: false',
    'rollbackReference: "mv-p0-public-state-after"\n  playerVisibleImpact: true\n  allowed: false',
  )),
  /Action receipt fixture .* is malformed/,
);
assert.throws(
  () => executeFixture(kernelSource.replace(
    'phase: "observation_barrier"',
    'phase: "action_admission"',
  )),
  /Schedule entry .* is malformed/,
);
assert.throws(
  () => executeFixture(kernelSource.replace(
    'logicalClockEndTick: 1',
    'logicalClockEndTick: 2',
  )),
  /initial\/final public-state sequence and clock do not match|executed clock coverage/,
);
assert.throws(
  () => executeFixture(kernelSource.replace(
    'logicalTick: 1\n  location: "VillageCommons"',
    'logicalTick: 99\n  location: "VillageCommons"',
  )),
  /initial\/final public-state sequence and clock do not match/,
);
assert.throws(
  () => executeFixture(kernelSource.replace(
    'parser: "HoloScriptCodeParser"',
    'parser: "NativeHsPipelineExecutor"',
  )),
  /manifest exceeds the bounded fixture claim/,
);
assert.throws(
  () => executeFixture(kernelSource
    .replace(
      'scheduleEntryId: "mv-p0-schedule-observe"\n  order: 1\n  tick: 0',
      'scheduleEntryId: "mv-p0-schedule-observe"\n  order: 1\n  tick: 1',
    )
    .replace(
      'scheduleEntryId: "mv-p0-schedule-admit-01"\n  order: 2\n  tick: 1',
      'scheduleEntryId: "mv-p0-schedule-admit-01"\n  order: 2\n  tick: 0',
    )),
  /Schedule entry .* is malformed/,
);
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
  'source/layers/vr/frontier/model-village/model-village-observer-projection.holo',
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
  await assert.rejects(
    runModelVillageCheck({
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
assert.equal(verifyModelVillageReceiptHash(negativeReceipt), true);

writeFileSync(
  negativeKernel,
  kernelSource.replace(
    'rollbackReference: "mv-p0-public-state-before"',
    'rollbackReference: "does-not-exist"',
  ),
  'utf8',
);
const malformedFixtureOutput = path.join(
  negativeRoot,
  '.tmp',
  'malformed-fixture-receipt.json',
);
process.env.HOLOSCRIPT_ROOT = path.resolve(repoRoot, '..', 'HoloScript');
try {
  await assert.rejects(
    runModelVillageCheck({
      root: negativeRoot,
      output: malformedFixtureOutput,
      durationMs: 20,
      tickRate: 10,
    }),
    /capturedObserverBoundaryFixturePasses/,
  );
} finally {
  if (previousHoloScriptRoot === undefined) delete process.env.HOLOSCRIPT_ROOT;
  else process.env.HOLOSCRIPT_ROOT = previousHoloScriptRoot;
}
const malformedFixtureReceipt = JSON.parse(
  readFileSync(malformedFixtureOutput, 'utf8'),
);
assert.equal(malformedFixtureReceipt.status, 'fail');
assert.equal(malformedFixtureReceipt.observerBoundaryFixture.status, 'fail');
assert.match(
  malformedFixtureReceipt.observerBoundaryFixture.error.message,
  /Action receipt fixture .* is malformed/,
);
assert.equal(
  verifyObserverBoundaryFixtureReceipt(
    malformedFixtureReceipt.observerBoundaryFixture,
  ),
  true,
);
assert.equal(verifyModelVillageReceiptHash(malformedFixtureReceipt), true);

rmSync(negativeRoot, { recursive: true, force: true });
rmSync(output, { force: true });
console.log('PASS HoloLand model village experiment');
