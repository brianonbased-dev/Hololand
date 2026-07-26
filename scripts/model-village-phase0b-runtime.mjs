/* global Buffer, process, structuredClone */

import { spawnSync } from 'node:child_process';
import {
  createHash,
  createPublicKey,
  generateKeyPairSync,
  randomUUID,
  sign,
  verify,
} from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PHASE0B_RECEIPT_SCHEMA =
  'hololand.model-village-phase0b-runtime-bridge.v2';
export const PHASE0B_STATE_SCHEMA =
  'hololand.model-village-phase0b-persistent-state.v1';
export const PHASE0B_VALIDATOR_SCHEMA =
  'hololand.model-village-phase0b-trusted-validator.v1';
export const PHASE0B_VALIDATOR_RECEIPT_SCHEMA =
  'hololand.model-village-phase0b-validator-receipt.v1';
export const PHASE0B_OBSERVER_PROJECTION_SCHEMA =
  'hololand.model-village.phase0b-observer-projection.v2';

const SOURCE_RUN_SCHEMA = 'holoscript.headless-experiment-source-run.v4';
const INNER_RUN_SCHEMA = 'holoscript.headless-experiment-run.v1';
const OBSERVER_PROOF_SCHEMA = 'holoscript.headless-observer-noninterference.v2';
const OBSERVER_PROOF_KEYS = Object.freeze([
  'canonicalPayloadEqual',
  'equivalent',
  'isolation',
  'liveSchedulingNoninterferenceClaimed',
  'mode',
  'observedSealedExecutionCount',
  'observedTerminalCommitment',
  'observerExecutionCount',
  'observerIntroducedExperimentExecutionCount',
  'observerProjection',
  'observerProjectionHash',
  'postObserverCanonicalFieldsHash',
  'postObserverCanonicalPayloadHash',
  'preObserverCanonicalFieldsHash',
  'preObserverCanonicalPayloadHash',
  'schema',
  'sevenFieldsEqual',
]);
const OBSERVER_PROJECTION_KEYS = Object.freeze([
  'canonicalFields',
  'runId',
  'schema',
  'sourceReceiptSchema',
  'terminalCommitment',
]);
const VALIDATOR_DOMAIN = 'hololand:model-village:phase0b:trusted-validator:v1';
const GENESIS_RECEIPT_HASH = '0'.repeat(64);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
export const PHASE0B_OBSERVER_CANONICAL_FIELDS = Object.freeze([
  'canonicalSceneHash',
  'canonicalPoseHash',
  'logicalClockHash',
  'publicStateHash',
  'executedScheduleHash',
  'residentObservationHash',
  'actionReceiptRoot',
]);

export const PHASE0B_SOURCE_PATHS = Object.freeze({
  world: 'source/proofs/model-village-phase0b-world.holo',
  behavior: 'source/proofs/model-village-phase0b-behavior.hsplus',
  plan: 'source/proofs/model-village-phase0b-plan.hs',
  stopPlan: 'source/proofs/model-village-phase0b-stop-plan.hs',
  manifests: 'source/proofs/model-village-phase1-manifests.hs',
  visibleWorld: 'source/layers/vr/frontier/model-village/model-village.holo',
});

const MANIFEST_BUNDLE_KEYS = [
  'bundleId',
  'canonicalization',
  'challengeOrder',
  'frozenBeforeFirstTurn',
  'hashAlgorithm',
  'metricSpecId',
  'sourceIsCanonical',
  'type',
  'version',
];
const CHALLENGE_KEYS = [
  'challengeId',
  'deadlineTick',
  'denominatorRule',
  'eligibilityFrozenBeforeTreatment',
  'initialStateId',
  'initialStatePredicate',
  'minimumDistinctResidentContributors',
  'openTick',
  'permittedActionTypes',
  'runtimeInvalidDisposition',
  'successPredicate',
  'treatmentMayChangeEligibility',
  'type',
];
const METRIC_SPEC_KEYS = [
  'acceptedActionTypeDiversityFormula',
  'capturedResponseReplaySuccessFormula',
  'diagnosticsExcludedFromBehavioralOutcomes',
  'interactionDominanceFormula',
  'metricSpecId',
  'primaryDenominator',
  'primaryFormula',
  'primaryMetricId',
  'primaryNumerator',
  'receiptCompletenessFormula',
  'reciprocityRateFormula',
  'routeContaminationCountFormula',
  'safetyBlockRateFormula',
  'type',
  'validActionRateFormula',
  'zeroDenominatorRule',
];
const CAPTURED_RESPONSE_KEYS = [
  'adapterAlias',
  'parsedProposal',
  'residentId',
  'responseId',
  'responseText',
  'type',
];
const RUN_MANIFEST_KEYS = [
  'actions',
  'capturedResponses',
  'challengeManifestHash',
  'emergencyStop',
  'expectedFinalState',
  'metricSpecHash',
  'runId',
  'schema',
  'sources',
  'validatorPolicyVersion',
];
const RUN_SOURCE_KEYS = [
  'behaviorSourceHash',
  'manifestSourceHash',
  'planExecutionSourceHash',
  'planTemplateSourceHash',
  'stopPlanSourceHash',
  'visibleWorldSourceHash',
  'worldSourceHash',
];
const SIGNED_ACTION_KEYS = [
  'args',
  'authorization',
  'entrypoint',
  'expectedAllowed',
  'expectedOutcome',
  'scheduleEntryId',
  'targetIds',
];
const AUTHORIZATION_KEYS = [
  'decisionReceiptId',
  'nonce',
  'safetyReceiptId',
  'sequence',
  'turnOpportunityId',
];
const ACTION_ARGUMENT_KEYS = [
  'capturedResponseHash',
  'challengeManifestHash',
  'metricSpecHash',
  'parsedProposal',
  'residentId',
];
const STOP_BINDING_KEYS = [
  'args',
  'authorization',
  'entrypoint',
  'expectedAllowed',
  'expectedFinalState',
  'expectedOutcome',
  'scheduleEntryId',
  'targetIds',
];

function normalizeSource(value) {
  return String(value).replace(/\r\n?/g, '\n');
}

function canonicalize(value, label = '$') {
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value.map((entry, index) => canonicalize(entry, `${label}[${index}]`));
  }
  if (typeof value === 'object') {
    const output = Object.create(null);
    for (const key of Object.keys(value).sort()) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        throw new Error(`${label}.${key} is forbidden in canonical JSON`);
      }
      const entry = value[key];
      if (entry === undefined) {
        throw new Error(`${label}.${key} is undefined`);
      }
      output[key] = canonicalize(entry, `${label}.${key}`);
    }
    return output;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error(`${label} is not a finite number`);
  }
  if (!['string', 'number', 'boolean'].includes(typeof value)) {
    throw new Error(`${label} has unsupported canonical JSON type ${typeof value}`);
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function canonicalDigest(value) {
  return sha256(Buffer.from(canonicalJson(value), 'utf8'));
}

function sourceDigest(value) {
  return sha256(Buffer.from(normalizeSource(value), 'utf8'));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) deepFreeze(entry);
  return Object.freeze(value);
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertExactKeys(value, expectedKeys, label) {
  assertObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    const missing = expected.filter((key) => !actual.includes(key));
    const unexpected = actual.filter((key) => !expected.includes(key));
    throw new Error(
      `${label} keys differ; missing=${canonicalJson(missing)} `
      + `unexpected=${canonicalJson(unexpected)}`,
    );
  }
}

function assertSha256(value, label) {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    throw new Error(`${label} must be lowercase sha256 hex`);
  }
}

function readSource(root, relativePath) {
  return normalizeSource(readFileSync(path.resolve(root, relativePath), 'utf8'));
}

function resolveHoloScriptRoot(root) {
  const candidate = process.env.HOLOSCRIPT_ROOT
    ? path.resolve(process.env.HOLOSCRIPT_ROOT)
    : path.resolve(root, '..', 'HoloScript');
  const cliPath = path.join(candidate, 'packages', 'cli', 'dist', 'index.js');
  const corePath = path.join(candidate, 'packages', 'core', 'dist', 'index.js');
  if (!existsSync(cliPath) || !existsSync(corePath)) {
    throw new Error(
      `HoloScript CLI/core build is unavailable at ${candidate}; `
      + 'set HOLOSCRIPT_ROOT to the built HoloScript repository',
    );
  }
  return { root: candidate, cliPath, corePath };
}

async function loadHoloScript(root) {
  const resolved = resolveHoloScriptRoot(root);
  // Keep these imports sequential. The core's CJS/ESM bridge and the CLI both
  // reach jose; concurrent first-loads can trip Node's ESM require assertion.
  const cli = await import(pathToFileURL(resolved.cliPath).href);
  const core = await import(pathToFileURL(resolved.corePath).href);
  for (const exportName of [
    'runHeadlessExperimentSources',
    'verifyHeadlessExperimentSourceRunReceipt',
  ]) {
    if (typeof cli[exportName] !== 'function') {
      throw new Error(`HoloScript CLI is missing ${exportName}`);
    }
  }
  if (typeof core.HoloScriptCodeParser !== 'function') {
    throw new Error('HoloScript core is missing HoloScriptCodeParser');
  }
  return { cli, core, root: resolved.root };
}

function scanObjectBlocks(source) {
  const blocks = [];
  const pattern = /\bobject\s+"([^"]+)"\s*\{/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    let cursor = pattern.lastIndex;
    let depth = 1;
    let inString = false;
    let escaped = false;
    let lineComment = false;
    for (; cursor < source.length && depth > 0; cursor += 1) {
      const character = source[cursor];
      const next = source[cursor + 1];
      if (lineComment) {
        if (character === '\n') lineComment = false;
        continue;
      }
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '/' && next === '/') {
        lineComment = true;
        cursor += 1;
        continue;
      }
      if (character === '"') inString = true;
      else if (character === '{') depth += 1;
      else if (character === '}') depth -= 1;
    }
    if (depth !== 0) throw new Error(`Manifest object ${match[1]} is unclosed`);
    blocks.push({
      name: match[1],
      body: source.slice(pattern.lastIndex, cursor - 1),
    });
    pattern.lastIndex = cursor;
  }
  return blocks;
}

function assertNoDuplicateManifestProperties(source) {
  const blocks = scanObjectBlocks(source);
  for (const block of blocks) {
    const seen = new Set();
    for (const line of block.body.split('\n')) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/);
      if (!match) continue;
      if (seen.has(match[1])) {
        throw new Error(
          `Manifest object ${block.name} duplicates property ${match[1]}`,
        );
      }
      seen.add(match[1]);
    }
  }
  return blocks.map((block) => block.name);
}

function expectedProposal(response) {
  if (response.action === 'contribute_water') {
    return `${response.action}:${response.target}:${response.amount}`;
  }
  return `${response.action}:${response.target}`;
}

function manifestNodeMap(parseResult, source) {
  if (
    !parseResult?.success
    || !Array.isArray(parseResult.ast)
    || (parseResult.errors?.length ?? 0) > 0
  ) {
    throw new Error(
      `Phase 1 manifests failed HoloScript parsing: `
      + `${canonicalJson(parseResult?.errors ?? [])}`,
    );
  }
  const sourceNames = assertNoDuplicateManifestProperties(source);
  const parsedNames = parseResult.ast.map((node) => node.name);
  if (
    new Set(sourceNames).size !== sourceNames.length
    || new Set(parsedNames).size !== parsedNames.length
    || canonicalJson(sourceNames) !== canonicalJson(parsedNames)
  ) {
    throw new Error('Phase 1 manifest source/AST object identities differ');
  }
  return new Map(parseResult.ast.map((node) => [node.name, node.properties]));
}

export function instantiatePhase1Manifests({ source, core }) {
  const parser = new core.HoloScriptCodeParser();
  const nodes = manifestNodeMap(parser.parse(source), source);
  const expectedNames = [
    'ModelVillagePhase1ManifestBundle',
    'ModelVillagePhase1CommonsWaterShortage',
    'ModelVillagePhase1BridgeRepair',
    'ModelVillagePhase1HarvestDistribution',
    'ModelVillagePhase1MetricSpec',
    'ModelVillagePhase0BCapturedResponse01',
    'ModelVillagePhase0BCapturedResponse02',
  ];
  if (canonicalJson([...nodes.keys()]) !== canonicalJson(expectedNames)) {
    throw new Error('Phase 1 manifest object set/order is not canonical');
  }

  const bundle = structuredClone(nodes.get(expectedNames[0]));
  assertExactKeys(bundle, MANIFEST_BUNDLE_KEYS, 'phase1 manifest bundle');
  if (
    bundle.type !== 'phase1_manifest_bundle'
    || bundle.hashAlgorithm !== 'sha256'
    || bundle.canonicalization !== 'canonical_json_sorted_keys'
    || bundle.frozenBeforeFirstTurn !== true
    || bundle.sourceIsCanonical !== true
  ) {
    throw new Error('Phase 1 manifest bundle identity/freeze policy is invalid');
  }

  const challenges = expectedNames.slice(1, 4).map((name) => {
    const challenge = structuredClone(nodes.get(name));
    assertExactKeys(challenge, CHALLENGE_KEYS, `challenge ${name}`);
    if (
      challenge.type !== 'phase1_challenge_definition'
      || challenge.eligibilityFrozenBeforeTreatment !== true
      || challenge.treatmentMayChangeEligibility !== false
      || challenge.runtimeInvalidDisposition
        !== 'mark_run_contaminated_without_removing_denominator'
      || challenge.denominatorRule
        !== 'retain_predeclared_eligible_challenge_in_denominator'
      || !Number.isInteger(challenge.openTick)
      || !Number.isInteger(challenge.deadlineTick)
      || challenge.deadlineTick <= challenge.openTick
      || !Number.isInteger(challenge.minimumDistinctResidentContributors)
      || challenge.minimumDistinctResidentContributors < 2
      || !Array.isArray(challenge.permittedActionTypes)
      || challenge.permittedActionTypes.length < 1
    ) {
      throw new Error(`Challenge ${challenge.challengeId} is not frozen/valid`);
    }
    return challenge;
  });
  if (
    canonicalJson(challenges.map((entry) => entry.challengeId))
    !== canonicalJson(bundle.challengeOrder)
  ) {
    throw new Error('Phase 1 challengeOrder does not match challenge declarations');
  }

  const metricSpec = structuredClone(nodes.get(expectedNames[4]));
  assertExactKeys(metricSpec, METRIC_SPEC_KEYS, 'phase1 metric spec');
  if (
    metricSpec.type !== 'phase1_metric_spec'
    || metricSpec.metricSpecId !== bundle.metricSpecId
    || metricSpec.zeroDenominatorRule !== 'missing_not_zero'
    || canonicalJson(metricSpec.diagnosticsExcludedFromBehavioralOutcomes)
      !== canonicalJson(['tokens', 'latency', 'cost'])
  ) {
    throw new Error('Phase 1 metric specification identity/policy is invalid');
  }

  const capturedResponses = expectedNames.slice(5).map((name) => {
    const fixture = structuredClone(nodes.get(name));
    assertExactKeys(fixture, CAPTURED_RESPONSE_KEYS, `captured response ${name}`);
    if (fixture.type !== 'phase0b_captured_response_fixture') {
      throw new Error(`${name} has the wrong fixture type`);
    }
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(fixture.responseText);
    } catch (error) {
      throw new Error(`${name} responseText is not strict JSON: ${error.message}`);
    }
    if (canonicalJson(parsedResponse) !== fixture.responseText) {
      throw new Error(`${name} responseText is not canonical JSON`);
    }
    if (expectedProposal(parsedResponse) !== fixture.parsedProposal) {
      throw new Error(`${name} parsedProposal does not match responseText`);
    }
    return {
      adapterAlias: fixture.adapterAlias,
      parsedProposal: fixture.parsedProposal,
      residentId: fixture.residentId,
      responseHash: sourceDigest(fixture.responseText),
      responseId: fixture.responseId,
    };
  });
  if (
    canonicalJson(capturedResponses.map((entry) => entry.residentId))
    !== canonicalJson(['resident-01', 'resident-02'])
    || new Set(capturedResponses.map((entry) => entry.responseHash)).size !== 2
  ) {
    throw new Error('Captured-response fixtures are not two distinct residents');
  }

  const challengeManifest = {
    bundle,
    challenges,
    schema: 'hololand.model-village-phase1-challenge-manifest.v1',
  };
  return deepFreeze({
    bundle,
    capturedResponses,
    challengeManifest,
    challengeManifestHash: canonicalDigest(challengeManifest),
    metricSpec,
    metricSpecHash: canonicalDigest(metricSpec),
    sourceHash: sourceDigest(source),
  });
}

function replacePlaceholder(source, placeholder, value, expectedOccurrences = 1) {
  const occurrences = source.split(placeholder).length - 1;
  if (occurrences !== expectedOccurrences) {
    throw new Error(
      `${placeholder} must occur exactly ${expectedOccurrences} time(s); `
      + `observed ${occurrences}`,
    );
  }
  return source.replaceAll(placeholder, value);
}

function hydratePlanSource(template, manifests) {
  let hydrated = template;
  hydrated = replacePlaceholder(
    hydrated,
    '__CAPTURED_RESPONSE_HASH_01__',
    manifests.capturedResponses[0].responseHash,
  );
  hydrated = replacePlaceholder(
    hydrated,
    '__CAPTURED_RESPONSE_HASH_02__',
    manifests.capturedResponses[1].responseHash,
  );
  hydrated = replacePlaceholder(
    hydrated,
    '__CHALLENGE_MANIFEST_HASH__',
    manifests.challengeManifestHash,
    2,
  );
  hydrated = replacePlaceholder(
    hydrated,
    '__METRIC_SPEC_HASH__',
    manifests.metricSpecHash,
    2,
  );
  if (/__[A-Z0-9_]+__/.test(hydrated)) {
    throw new Error('Phase 0B plan contains an unbound placeholder');
  }
  return hydrated;
}

function parsePlanSource(source, label) {
  const match = source.match(
    /export\s+function\s+main\(\):\s*string\s*\{\s*return\s+'([^']*)'\s*\}/,
  );
  if (!match) throw new Error(`${label} must export one static JSON plan string`);
  let plan;
  try {
    plan = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`${label} returned invalid JSON: ${error.message}`);
  }
  if (!Array.isArray(plan) || plan.length < 2 || plan[0]?.kind !== 'manifest') {
    throw new Error(`${label} is not a headless experiment plan`);
  }
  return plan;
}

function signedActionFromPlan(entry) {
  const expected = entry.entrypoint === 'contribute_water'
    ? { allowed: true, outcome: 'public_water_units_increased_by_1' }
    : { allowed: false, outcome: 'blocked_without_world_mutation' };
  assertExactKeys(entry.args, ACTION_ARGUMENT_KEYS, `${entry.scheduleEntryId}.args`);
  assertExactKeys(
    entry.authorization,
    AUTHORIZATION_KEYS,
    `${entry.scheduleEntryId}.authorization`,
  );
  for (const field of [
    'capturedResponseHash',
    'challengeManifestHash',
    'metricSpecHash',
  ]) {
    assertSha256(entry.args[field], `${entry.scheduleEntryId}.args.${field}`);
  }
  return {
    args: structuredClone(entry.args),
    authorization: structuredClone(entry.authorization),
    entrypoint: entry.entrypoint,
    expectedAllowed: expected.allowed,
    expectedOutcome: expected.outcome,
    scheduleEntryId: entry.scheduleEntryId,
    targetIds: structuredClone(entry.targetIds),
  };
}

function buildRunManifest({
  sources,
  manifests,
  plan,
  stopPlan,
}) {
  const planManifest = plan[0];
  const planActions = plan.filter((entry) => entry.kind === 'action');
  if (
    planManifest.schema !== 'holoscript.headless-experiment-plan.v1'
    || planManifest.runId !== 'mv-phase0b-tracer-001'
    || planActions.length !== 2
    || plan.filter((entry) => entry.kind === 'observation').length !== 2
  ) {
    throw new Error('Phase 0B tracer plan identity/counts are invalid');
  }
  const actions = planActions.map(signedActionFromPlan);
  if (
    canonicalJson(actions.map((entry) => entry.authorization.sequence))
      !== canonicalJson([0, 1])
    || new Set(actions.map((entry) => entry.authorization.nonce)).size !== 2
  ) {
    throw new Error('Phase 0B action authorizations are not contiguous/unique');
  }
  for (let index = 0; index < actions.length; index += 1) {
    const fixture = manifests.capturedResponses[index];
    const action = actions[index];
    if (
      action.args.capturedResponseHash !== fixture.responseHash
      || action.args.challengeManifestHash !== manifests.challengeManifestHash
      || action.args.metricSpecHash !== manifests.metricSpecHash
      || action.args.parsedProposal !== fixture.parsedProposal
      || action.args.residentId !== fixture.residentId
    ) {
      throw new Error(`Plan action ${action.scheduleEntryId} is not manifest-bound`);
    }
  }

  const stopManifest = stopPlan[0];
  const stopAction = stopPlan[1];
  if (
    stopPlan.length !== 2
    || stopManifest.runId !== 'mv-phase0b-stop-001'
    || stopAction.entrypoint !== 'freeze_run'
    || canonicalJson(stopAction.targetIds) !== canonicalJson(['EmergencyStop'])
  ) {
    throw new Error('Phase 0B emergency-stop plan identity is invalid');
  }
  assertExactKeys(
    stopAction.authorization,
    AUTHORIZATION_KEYS,
    'emergencyStop.authorization',
  );

  return deepFreeze({
    actions,
    capturedResponses: manifests.capturedResponses,
    challengeManifestHash: manifests.challengeManifestHash,
    emergencyStop: {
      args: structuredClone(stopAction.args),
      authorization: structuredClone(stopAction.authorization),
      entrypoint: stopAction.entrypoint,
      expectedAllowed: true,
      expectedFinalState: structuredClone(stopManifest.expected.finalPublicState),
      expectedOutcome: 'run_frozen',
      scheduleEntryId: stopAction.scheduleEntryId,
      targetIds: structuredClone(stopAction.targetIds),
    },
    expectedFinalState: structuredClone(planManifest.expected.finalPublicState),
    metricSpecHash: manifests.metricSpecHash,
    runId: planManifest.runId,
    schema: 'hololand.model-village-phase0b-run-manifest.v1',
    sources: {
      behaviorSourceHash: sourceDigest(sources.behavior),
      manifestSourceHash: manifests.sourceHash,
      planExecutionSourceHash: sourceDigest(sources.plan),
      planTemplateSourceHash: sourceDigest(sources.planTemplate),
      stopPlanSourceHash: sourceDigest(sources.stopPlan),
      visibleWorldSourceHash: sourceDigest(sources.visibleWorld),
      worldSourceHash: sourceDigest(sources.world),
    },
    validatorPolicyVersion: 'runtime-injected-ed25519-v1',
  });
}

function assertRunManifest(manifest) {
  assertExactKeys(manifest, RUN_MANIFEST_KEYS, 'validator run manifest');
  if (
    manifest.schema !== 'hololand.model-village-phase0b-run-manifest.v1'
    || manifest.validatorPolicyVersion !== 'runtime-injected-ed25519-v1'
    || manifest.runId !== 'mv-phase0b-tracer-001'
  ) {
    throw new Error('Validator run manifest identity is invalid');
  }
  assertExactKeys(manifest.sources, RUN_SOURCE_KEYS, 'validator sources');
  for (const [key, value] of Object.entries(manifest.sources)) {
    assertSha256(value, `validator sources.${key}`);
  }
  assertSha256(manifest.challengeManifestHash, 'challengeManifestHash');
  assertSha256(manifest.metricSpecHash, 'metricSpecHash');
  if (!Array.isArray(manifest.actions) || manifest.actions.length !== 2) {
    throw new Error('Validator run manifest must contain two actions');
  }
  manifest.actions.forEach((action, index) => {
    assertExactKeys(action, SIGNED_ACTION_KEYS, `validator action ${index}`);
    assertExactKeys(action.args, ACTION_ARGUMENT_KEYS, `validator action ${index}.args`);
    assertExactKeys(
      action.authorization,
      AUTHORIZATION_KEYS,
      `validator action ${index}.authorization`,
    );
    if (action.authorization.sequence !== index) {
      throw new Error(`Validator action ${index} sequence is not contiguous`);
    }
  });
  if (
    !Array.isArray(manifest.capturedResponses)
    || manifest.capturedResponses.length !== 2
  ) {
    throw new Error('Validator manifest capturedResponses must contain two fixtures');
  }
  manifest.capturedResponses.forEach((fixture, index) => {
    assertExactKeys(
      fixture,
      ['adapterAlias', 'parsedProposal', 'residentId', 'responseHash', 'responseId'],
      `validator captured response ${index}`,
    );
    assertSha256(fixture.responseHash, `capturedResponses[${index}].responseHash`);
  });
  assertExactKeys(manifest.emergencyStop, STOP_BINDING_KEYS, 'emergencyStop');
}

function validatorSigningPayload(configHash, manifestHash) {
  return {
    configHash,
    domain: VALIDATOR_DOMAIN,
    manifestHash,
  };
}

export function createRuntimeInjectedValidatorFixture(options = {}) {
  const {
    publicKey,
    privateKey,
  } = options.keyPair ?? generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const config = deepFreeze({
    algorithm: 'Ed25519',
    authorityId: options.authorityId ?? 'model-village-trusted-validator-001',
    immutable: true,
    injectionOrigin: 'host_process_boot_argument',
    keyCustody:
      options.keyCustody ?? 'ephemeral_engineering_fixture',
    publicKeyFingerprint: sourceDigest(publicKeyPem),
    publicKeyPem,
    registryReceiptId:
      options.registryReceiptId ?? 'model-village-validator-registry-receipt-001',
    schema: PHASE0B_VALIDATOR_SCHEMA,
    validatorSourceHash:
      options.validatorSourceHash ?? sourceDigest(readFileSync(fileURLToPath(import.meta.url))),
  });
  const configHash = canonicalDigest(config);

  return Object.freeze({
    config,
    configHash,
    issue(manifest) {
      assertRunManifest(manifest);
      const manifestSnapshot = structuredClone(manifest);
      const manifestHash = canonicalDigest(manifestSnapshot);
      const payload = validatorSigningPayload(configHash, manifestHash);
      return deepFreeze({
        config: structuredClone(config),
        configHash,
        manifest: manifestSnapshot,
        manifestHash,
        schema: PHASE0B_VALIDATOR_RECEIPT_SCHEMA,
        signatureBase64: sign(
          null,
          Buffer.from(canonicalJson(payload), 'utf8'),
          privateKey,
        ).toString('base64'),
        signedPayloadHash: canonicalDigest(payload),
      });
    },
  });
}

export function verifyRuntimeInjectedValidator(receipt, expectedPins = {}) {
  const errors = [];
  try {
    assertExactKeys(
      receipt,
      [
        'config',
        'configHash',
        'manifest',
        'manifestHash',
        'schema',
        'signatureBase64',
        'signedPayloadHash',
      ],
      'validator receipt',
    );
    if (receipt.schema !== PHASE0B_VALIDATOR_RECEIPT_SCHEMA) {
      throw new Error('Validator receipt schema mismatch');
    }
    assertExactKeys(
      receipt.config,
      [
        'algorithm',
        'authorityId',
        'immutable',
        'injectionOrigin',
        'keyCustody',
        'publicKeyFingerprint',
        'publicKeyPem',
        'registryReceiptId',
        'schema',
        'validatorSourceHash',
      ],
      'validator config',
    );
    const config = receipt.config;
    if (
      config.schema !== PHASE0B_VALIDATOR_SCHEMA
      || config.algorithm !== 'Ed25519'
      || config.immutable !== true
      || config.injectionOrigin !== 'host_process_boot_argument'
      || ![
        'ephemeral_engineering_fixture',
        'external_host_key',
      ].includes(config.keyCustody)
    ) {
      throw new Error('Validator config identity/injection policy mismatch');
    }
    assertSha256(config.validatorSourceHash, 'validatorSourceHash');
    if (config.publicKeyFingerprint !== sourceDigest(config.publicKeyPem)) {
      throw new Error('Validator public-key fingerprint mismatch');
    }
    if (receipt.configHash !== canonicalDigest(config)) {
      throw new Error('Validator config hash mismatch');
    }
    assertRunManifest(receipt.manifest);
    if (receipt.manifestHash !== canonicalDigest(receipt.manifest)) {
      throw new Error('Validator manifest hash mismatch');
    }
    const payload = validatorSigningPayload(receipt.configHash, receipt.manifestHash);
    if (receipt.signedPayloadHash !== canonicalDigest(payload)) {
      throw new Error('Validator signed payload hash mismatch');
    }
    const verified = verify(
      null,
      Buffer.from(canonicalJson(payload), 'utf8'),
      createPublicKey(config.publicKeyPem),
      Buffer.from(receipt.signatureBase64, 'base64'),
    );
    if (!verified) throw new Error('Validator signature verification failed');
    if (expectedPins.trustedConfig) {
      if (
        canonicalJson(config)
        !== canonicalJson(expectedPins.trustedConfig)
      ) {
        throw new Error('Validator config does not match host trust injection');
      }
    }
    for (const [key, expected] of Object.entries(expectedPins)) {
      if (key === 'trustedConfig') continue;
      if (config[key] !== expected) {
        throw new Error(`Validator pin ${key} mismatch`);
      }
    }
  } catch (error) {
    errors.push(error.message || String(error));
  }
  return {
    configHash: receipt?.config ? canonicalDigest(receipt.config) : null,
    errors,
    manifestHash: receipt?.manifest ? canonicalDigest(receipt.manifest) : null,
    valid: errors.length === 0,
  };
}

async function executeSourceRun(cli, sources, observer = 'off') {
  const run = await cli.runHeadlessExperimentSources({
    behaviorSource: sources.behavior,
    observer,
    planSource: sources.plan,
    worldSource: sources.world,
  });
  const verification = await cli.verifyHeadlessExperimentSourceRunReceipt(
    run.sourceRunReceipt,
    run.execution,
    {
      behaviorSource: sources.behavior,
      planSource: sources.plan,
      worldSource: sources.world,
    },
  );
  if (!verification?.valid) {
    throw new Error(
      `HoloScript V4 source-run verification failed: `
      + `${canonicalJson(verification?.errors ?? [])}`,
    );
  }
  return { run, verification };
}

function assertActionMatchesSignedManifest(action, signedAction, label) {
  const payload = action.payload;
  for (const [field, expected] of Object.entries({
    args: signedAction.args,
    authorization: signedAction.authorization,
    entrypoint: signedAction.entrypoint,
    scheduleEntryId: signedAction.scheduleEntryId,
    targetIds: signedAction.targetIds,
  })) {
    if (canonicalJson(payload[field]) !== canonicalJson(expected)) {
      throw new Error(`${label}.${field} does not match signed manifest`);
    }
  }
  if (
    payload.allowed !== signedAction.expectedAllowed
    || payload.outcome !== signedAction.expectedOutcome
    || payload.result.allowed !== signedAction.expectedAllowed
    || payload.result.outcome !== signedAction.expectedOutcome
  ) {
    throw new Error(`${label} decision/outcome does not match signed manifest`);
  }
}

function validateSourceRun(run, runManifest, { observerRequired }) {
  const { execution, sourceRunReceipt, claimBoundary, observerProof } = run;
  if (
    sourceRunReceipt.schema !== SOURCE_RUN_SCHEMA
    || execution.schema !== INNER_RUN_SCHEMA
  ) {
    throw new Error('HoloScript source/inner receipt schema is not V4/v1');
  }
  const counts = execution.terminal.actualCounts;
  if (
    counts.schedule !== 4
    || counts.observations !== 2
    || counts.actions !== 2
    || counts.publicStateSnapshots !== 5
  ) {
    throw new Error(`Phase 0B source-run counts differ: ${canonicalJson(counts)}`);
  }
  const observationSubjects = execution.observationLedger.map(
    (entry) => entry.payload.targetIds,
  );
  if (
    canonicalJson(observationSubjects)
    !== canonicalJson([['resident-01'], ['resident-02']])
  ) {
    throw new Error('Phase 0B observations are not resident-subject-bound');
  }
  execution.actionLedger.forEach((entry, index) => {
    assertActionMatchesSignedManifest(
      entry,
      runManifest.actions[index],
      `actionLedger[${index}]`,
    );
  });
  const [allowedAction, deniedAction] = execution.actionLedger;
  if (
    allowedAction.payload.stateChanged !== true
    || allowedAction.payload.prePublicStateHash
      === allowedAction.payload.postPublicStateHash
    || deniedAction.payload.stateChanged !== false
    || deniedAction.payload.prePublicStateHash
      !== deniedAction.payload.postPublicStateHash
    || deniedAction.previousHash !== allowedAction.entryHash
    || execution.terminal.actionRoot !== deniedAction.entryHash
    || execution.terminal.finalPublicStateHash
      !== deniedAction.payload.postPublicStateHash
  ) {
    throw new Error('Phase 0B action mutation/rollback/hash chain is invalid');
  }
  const finalState =
    execution.publicStateSnapshots.at(-1)?.payload?.publicState;
  if (canonicalJson(finalState) !== canonicalJson(runManifest.expectedFinalState)) {
    throw new Error('Phase 0B final public state differs from signed manifest');
  }
  if (
    claimBoundary.hsPlanEntrypointExecuted !== true
    || claimBoundary.rustWasmCompilerExecuted !== true
    || claimBoundary.uaalVmExecuted !== true
    || claimBoundary.engineOwnedDeterministicHsplusActionSubsetExecuted !== true
    || claimBoundary.worldSourceReexecutedDuringVerification !== true
    || claimBoundary.hsPlanSourceReexecutedDuringVerification !== true
    || claimBoundary.hsplusBehaviorSourceReexecutedDuringVerification !== true
    || claimBoundary.providerCallsMade !== 0
    || claimBoundary.fullHoloWorldProjectionClaimed !== false
    || claimBoundary.fullHsLanguageExecutionClaimed !== false
    || claimBoundary.fullHsplusLanguageExecutionClaimed !== false
    || claimBoundary.physicsEngineExecuted !== false
    || claimBoundary.worldRuntimeLifecycleExecuted !== false
  ) {
    throw new Error('HoloScript V4 source-run claim boundary differs');
  }
  if (observerRequired) {
    if (
      observerProof?.schema !== OBSERVER_PROOF_SCHEMA
      || observerProof.mode !== 'single-execution-post-seal-v1'
      || observerProof.observedSealedExecutionCount !== 1
      || observerProof.observerIntroducedExperimentExecutionCount !== 0
      || observerProof.equivalent !== true
      || observerProof.canonicalPayloadEqual !== true
      || observerProof.sevenFieldsEqual !== true
      || observerProof.observedTerminalCommitment
        !== execution.terminal.terminalCommitment
    ) {
      throw new Error('HoloScript observer proof is not fail-dark/equivalent');
    }
  }
  return {
    actionDecisions: execution.actionLedger.map((entry) => ({
      allowed: entry.payload.allowed,
      entryHash: entry.entryHash,
      entrypoint: entry.payload.entrypoint,
      postPublicStateHash: entry.payload.postPublicStateHash,
      scheduleEntryId: entry.payload.scheduleEntryId,
      sequence: entry.sequence,
      stateChanged: entry.payload.stateChanged,
    })),
    counts: structuredClone(counts),
    finalPublicState: structuredClone(finalState),
    observationSubjects,
    sourceBundleHash: execution.sourceBundleHash,
    sourceRunCommitment: sourceRunReceipt.sourceRunCommitment,
    terminalCommitment: execution.terminal.terminalCommitment,
  };
}

function replayProjection(run) {
  const execution = run.execution;
  return {
    actionDecisions: execution.actionLedger.map((entry) => ({
      allowed: entry.payload.allowed,
      entryHash: entry.entryHash,
      outcome: entry.payload.outcome,
      postPublicStateHash: entry.payload.postPublicStateHash,
      stateChanged: entry.payload.stateChanged,
    })),
    actionRoot: execution.terminal.actionRoot,
    finalPublicStateHash: execution.terminal.finalPublicStateHash,
    sourceRunCommitment: run.sourceRunReceipt.sourceRunCommitment,
    terminalCommitment: execution.terminal.terminalCommitment,
  };
}

function observerCanonicalFields(run, label) {
  const fields = run?.execution?.canonicalFields;
  assertExactKeys(fields, PHASE0B_OBSERVER_CANONICAL_FIELDS, label);
  for (const field of PHASE0B_OBSERVER_CANONICAL_FIELDS) {
    assertSha256(fields[field], `${label}.${field}`);
  }
  return structuredClone(fields);
}

function observerRunProjection(run, label) {
  const canonicalFields = observerCanonicalFields(run, `${label}.canonicalFields`);
  const sourceRunCommitment = run?.sourceRunReceipt?.sourceRunCommitment;
  const terminalCommitment = run?.execution?.terminal?.terminalCommitment;
  assertSha256(sourceRunCommitment, `${label}.sourceRunCommitment`);
  assertSha256(terminalCommitment, `${label}.terminalCommitment`);
  return {
    canonicalFields,
    sourceRunCommitment,
    terminalCommitment,
  };
}

function livingCommonsActionProjection(entry, label) {
  assertObject(entry, label);
  const projection = {
    allowed: entry.payload?.allowed,
    entryHash: entry.entryHash,
    entrypoint: entry.payload?.entrypoint,
    outcome: entry.payload?.outcome,
    previousEntryHash: entry.previousHash,
    scheduleEntryId: entry.payload?.scheduleEntryId,
    stateChanged: entry.payload?.stateChanged,
    targetIds: structuredClone(entry.payload?.targetIds),
  };
  if (
    typeof projection.allowed !== 'boolean'
    || typeof projection.entrypoint !== 'string'
    || typeof projection.outcome !== 'string'
    || typeof projection.scheduleEntryId !== 'string'
    || typeof projection.stateChanged !== 'boolean'
    || !Array.isArray(projection.targetIds)
    || projection.targetIds.some((targetId) => typeof targetId !== 'string')
  ) {
    throw new Error(`${label} is not a complete action projection`);
  }
  assertSha256(projection.entryHash, `${label}.entryHash`);
  assertSha256(projection.previousEntryHash, `${label}.previousEntryHash`);
  return projection;
}

export function buildPhase0BObserverProjectionWitness({
  sealedSourceRun,
}) {
  const off = observerRunProjection(sealedSourceRun, 'observerProjection.off');
  const observerProjectionFields =
    sealedSourceRun?.observerProof?.observerProjection?.canonicalFields;
  const observerProof = sealedSourceRun?.observerProof;
  assertExactKeys(
    observerProof,
    OBSERVER_PROOF_KEYS,
    'observerProjection.proof',
  );
  assertExactKeys(
    observerProof.observerProjection,
    OBSERVER_PROJECTION_KEYS,
    'observerProjection.proof.observerProjection',
  );
  const on = {
    canonicalFields: structuredClone(observerProjectionFields),
    sourceRunCommitment: off.sourceRunCommitment,
    terminalCommitment:
      observerProof?.observerProjection?.terminalCommitment,
  };
  observerCanonicalFields(
    {
      execution: {
        canonicalFields: on.canonicalFields,
      },
    },
    'observerProjection.on.canonicalFields',
  );
  assertSha256(
    on.terminalCommitment,
    'observerProjection.on.terminalCommitment',
  );
  for (const [field, value] of Object.entries({
    observerProjectionHash: observerProof?.observerProjectionHash,
    postObserverCanonicalFieldsHash:
      observerProof?.postObserverCanonicalFieldsHash,
    postObserverCanonicalPayloadHash:
      observerProof?.postObserverCanonicalPayloadHash,
    preObserverCanonicalFieldsHash:
      observerProof?.preObserverCanonicalFieldsHash,
    preObserverCanonicalPayloadHash:
      observerProof?.preObserverCanonicalPayloadHash,
  })) {
    assertSha256(value, `observerProjection.proof.${field}`);
  }
  if (
    observerProof?.schema !== OBSERVER_PROOF_SCHEMA
    || observerProof.mode !== 'single-execution-post-seal-v1'
    || observerProof.isolation
      !== 'separate-node-process-serialized-post-seal-v1'
    || observerProof.observedSealedExecutionCount !== 1
    || observerProof.observerExecutionCount !== 1
    || observerProof.observerIntroducedExperimentExecutionCount !== 0
    || observerProof.observedTerminalCommitment
      !== sealedSourceRun.execution.terminal.terminalCommitment
    || observerProof.equivalent !== true
    || observerProof.canonicalPayloadEqual !== true
    || observerProof.sevenFieldsEqual !== true
    || observerProof.preObserverCanonicalPayloadHash
      !== observerProof.postObserverCanonicalPayloadHash
    || observerProof.preObserverCanonicalFieldsHash
      !== observerProof.postObserverCanonicalFieldsHash
    || observerProof.observerProjection?.schema
      !== 'holoscript.headless-observer-projection.v1'
    || observerProof.observerProjection?.runId
      !== sealedSourceRun.execution.runId
    || observerProof.observerProjection?.sourceReceiptSchema
      !== sealedSourceRun.execution.schema
    || observerProof.observerProjection?.terminalCommitment
      !== sealedSourceRun.execution.terminal.terminalCommitment
    || observerProof.observerProjectionHash
      !== canonicalDigest(observerProof.observerProjection)
    || observerProof.liveSchedulingNoninterferenceClaimed !== false
    || observerProof.preObserverCanonicalPayloadHash
      !== canonicalDigest(sealedSourceRun.execution)
    || canonicalDigest(off.canonicalFields)
      !== observerProof.preObserverCanonicalFieldsHash
    || canonicalDigest(on.canonicalFields)
      !== observerProof.postObserverCanonicalFieldsHash
    || canonicalJson(observerProjectionFields) !== canonicalJson(off.canonicalFields)
  ) {
    throw new Error(
      'Sealed HoloScript observer proof differs from the execution receipt',
    );
  }
  const changedFields = PHASE0B_OBSERVER_CANONICAL_FIELDS.filter(
    (field) => off.canonicalFields[field] !== on.canonicalFields[field],
  );
  const sevenFieldsEqual = changedFields.length === 0;
  const sourceRunCommitmentEqual =
    off.sourceRunCommitment === on.sourceRunCommitment;
  const terminalCommitmentEqual =
    off.terminalCommitment === on.terminalCommitment;
  const observerIntroducedExperimentExecutionCount =
    observerProof.observerIntroducedExperimentExecutionCount;
  const [admittedEntry, blockedEntry] = sealedSourceRun.execution.actionLedger;
  const admittedAction = livingCommonsActionProjection(
    admittedEntry,
    'observerProjection.livingCommons.admittedAction',
  );
  const blockedAction = livingCommonsActionProjection(
    blockedEntry,
    'observerProjection.livingCommons.blockedAction',
  );
  const finalPublicState =
    sealedSourceRun.execution.publicStateSnapshots.at(-1)?.payload?.publicState;
  if (
    admittedAction.allowed !== true
    || admittedAction.stateChanged !== true
    || admittedAction.entrypoint !== 'contribute_water'
    || canonicalJson(admittedAction.targetIds)
      !== canonicalJson(['commons_cistern'])
    || blockedAction.allowed !== false
    || blockedAction.stateChanged !== false
    || blockedAction.entrypoint !== 'deny_external_message'
    || canonicalJson(blockedAction.targetIds)
      !== canonicalJson(['outside_village'])
    || blockedAction.previousEntryHash !== admittedAction.entryHash
    || !Number.isInteger(finalPublicState?.acceptedActionCount)
    || !Number.isInteger(finalPublicState?.publicWaterUnits)
  ) {
    throw new Error(
      'Phase 0B Living Commons projection inputs differ from the verified run',
    );
  }
  const actionReceiptRoot =
    sealedSourceRun.execution.terminal.actionRoot;
  assertSha256(
    actionReceiptRoot,
    'observerProjection.livingCommons.actionReceiptRoot',
  );
  const witness = {
    schema: PHASE0B_OBSERVER_PROJECTION_SCHEMA,
    projectionToggleExecuted: true,
    toggleScope: 'single_sealed_execution_post_seal_consumer',
    executionOrder: [
      'sealed_receipt_before_observer_consumer',
      'sealed_receipt_after_observer_consumer',
    ],
    sourceRunExecutionsObserved: {
      authoritative: 1,
      observerIntroduced: 0,
    },
    requiredCanonicalFields: [...PHASE0B_OBSERVER_CANONICAL_FIELDS],
    off,
    on,
    comparison: {
      changedFields,
      sevenFieldsEqual,
      sourceRunCommitmentEqual,
      terminalCommitmentEqual,
      preObserverCanonicalPayloadHash:
        observerProof.preObserverCanonicalPayloadHash,
      postObserverCanonicalPayloadHash:
        observerProof.postObserverCanonicalPayloadHash,
      preObserverCanonicalFieldsHash:
        observerProof.preObserverCanonicalFieldsHash,
      postObserverCanonicalFieldsHash:
        observerProof.postObserverCanonicalFieldsHash,
    },
    livingCommons: {
      acceptedActionCount: finalPublicState.acceptedActionCount,
      actionReceiptRoot,
      admittedAction,
      blockedAction,
      projectionAuthority: 'read_only_receipt_consumption',
      publicWaterUnits: finalPublicState.publicWaterUnits,
      rawModelContentIncluded: false,
      visualCuesRequireExistingActionReceipts: true,
    },
    claimBoundary: {
      adapterIdentityFieldsIncluded: false,
      boundedRuntimeSceneObjectCount:
        sealedSourceRun.execution.scene.objectCount,
      boundedV4SourceRunProjectionExecuted: true,
      freshExperimentExecutionCount: 0,
      fullCanonicalTwelveObjectLifecycleClaimed: false,
      liveSchedulingNoninterferenceClaimed: false,
      observerIntroducedExperimentExecutionCount,
      projectionOwnsExperimentBehavior: false,
      projectionWorldWritePathExposed: false,
      providerCallsMade: 0,
    },
  };
  if (
    !sevenFieldsEqual
    || !sourceRunCommitmentEqual
    || !terminalCommitmentEqual
    || observerIntroducedExperimentExecutionCount !== 0
    || sealedSourceRun.execution.scene.objectCount !== 4
  ) {
    throw new Error(
      `Phase 0B observer off/on projection differs: ${canonicalJson(
        witness.comparison,
      )}`,
    );
  }
  return witness;
}

function statePath(storeDir) {
  return path.join(storeDir, 'state.json');
}

function lockPath(storeDir) {
  return path.join(storeDir, 'state.lock');
}

function sealState(unsignedState) {
  return {
    ...unsignedState,
    stateHash: canonicalDigest(unsignedState),
  };
}

function assertWorldState(world, label) {
  assertExactKeys(
    world,
    [
      'acceptedActionCount',
      'emergencyStopState',
      'phase',
      'publicWaterUnits',
    ],
    label,
  );
  if (
    !Number.isInteger(world.acceptedActionCount)
    || world.acceptedActionCount < 0
    || !Number.isInteger(world.publicWaterUnits)
    || world.publicWaterUnits < 0
    || !['armed', 'triggered'].includes(world.emergencyStopState)
    || !['running', 'frozen'].includes(world.phase)
    || (
      world.emergencyStopState === 'triggered'
      && world.phase !== 'frozen'
    )
  ) {
    throw new Error(`${label} contains invalid public-state values`);
  }
}

function validateLedgerEntry(entry, expectedSequence, previousReceiptHash) {
  assertExactKeys(
    entry,
    [
      'admissionMatched',
      'allowed',
      'authorizationNonce',
      'authorizationSequence',
      'attemptDigest',
      'entrypoint',
      'eventPublication',
      'postWorldStateHash',
      'preWorldStateHash',
      'previousReceiptHash',
      'receiptHash',
      'scheduleEntryId',
      'upstreamActionEntryHash',
      'worldMutationCommitted',
    ],
    `persistent ledger entry ${expectedSequence}`,
  );
  if (
    entry.authorizationSequence !== expectedSequence
    || entry.previousReceiptHash !== previousReceiptHash
  ) {
    throw new Error(`Persistent ledger entry ${expectedSequence} chain mismatch`);
  }
  const { receiptHash, ...preimage } = entry;
  if (receiptHash !== canonicalDigest(preimage)) {
    throw new Error(`Persistent ledger entry ${expectedSequence} hash mismatch`);
  }
  assertSha256(entry.attemptDigest, `ledger[${expectedSequence}].attemptDigest`);
  assertSha256(
    entry.upstreamActionEntryHash,
    `ledger[${expectedSequence}].upstreamActionEntryHash`,
  );
  assertSha256(
    entry.preWorldStateHash,
    `ledger[${expectedSequence}].preWorldStateHash`,
  );
  assertSha256(
    entry.postWorldStateHash,
    `ledger[${expectedSequence}].postWorldStateHash`,
  );
  if (
    entry.eventPublication !== 'durable_outbox_after_atomic_commit'
    || (
      entry.allowed
      && (
        entry.admissionMatched !== true
        || entry.worldMutationCommitted
          !== (entry.preWorldStateHash !== entry.postWorldStateHash)
      )
    )
    || (
      !entry.allowed
      && (
        entry.worldMutationCommitted !== false
        || entry.preWorldStateHash !== entry.postWorldStateHash
      )
    )
  ) {
    throw new Error(
      `Persistent ledger entry ${expectedSequence} admission/mutation invariant failed`,
    );
  }
  return receiptHash;
}

export function validatePersistentState(state) {
  assertExactKeys(
    state,
    [
      'consumedAuthorizations',
      'eventOutbox',
      'lastAuthorizationSequence',
      'ledger',
      'revision',
      'runId',
      'schema',
      'stateHash',
      'validatorConfigHash',
      'validatorManifestHash',
      'world',
    ],
    'persistent state',
  );
  const { stateHash, ...unsignedState } = state;
  if (stateHash !== canonicalDigest(unsignedState)) {
    throw new Error('Persistent state hash mismatch');
  }
  if (state.schema !== PHASE0B_STATE_SCHEMA) {
    throw new Error('Persistent state schema mismatch');
  }
  assertWorldState(state.world, 'persistent world');
  assertExactKeys(state.ledger, ['entries', 'receiptRoot'], 'persistent ledger');
  if (
    !Array.isArray(state.ledger.entries)
    || !Array.isArray(state.consumedAuthorizations)
    || !Array.isArray(state.eventOutbox)
    || state.revision !== state.ledger.entries.length
    || state.lastAuthorizationSequence !== state.ledger.entries.length - 1
    || state.consumedAuthorizations.length !== state.ledger.entries.length
    || state.eventOutbox.length !== state.ledger.entries.length
  ) {
    throw new Error('Persistent state counters are inconsistent');
  }
  let previousReceiptHash = GENESIS_RECEIPT_HASH;
  state.ledger.entries.forEach((entry, index) => {
    previousReceiptHash = validateLedgerEntry(entry, index, previousReceiptHash);
    const consumed = state.consumedAuthorizations[index];
    assertExactKeys(
      consumed,
      ['nonce', 'receiptHash', 'sequence'],
      `consumed authorization ${index}`,
    );
    if (
      consumed.sequence !== index
      || consumed.nonce !== entry.authorizationNonce
      || consumed.receiptHash !== entry.receiptHash
    ) {
      throw new Error(`Consumed authorization ${index} is inconsistent`);
    }
    const event = state.eventOutbox[index];
    assertExactKeys(
      event,
      ['eventId', 'publication', 'receiptHash'],
      `event outbox entry ${index}`,
    );
    if (
      event.eventId !== `model-village-action-${index}`
      || event.publication !== 'post_commit_only'
      || event.receiptHash !== entry.receiptHash
    ) {
      throw new Error(`Event outbox entry ${index} is inconsistent`);
    }
  });
  if (state.ledger.receiptRoot !== previousReceiptHash) {
    throw new Error('Persistent ledger receiptRoot mismatch');
  }
  if (
    new Set(state.consumedAuthorizations.map((entry) => entry.nonce)).size
    !== state.consumedAuthorizations.length
  ) {
    throw new Error('Persistent state contains a duplicate authorization nonce');
  }
  if (
    state.ledger.entries.length > 0
    && canonicalDigest(state.world)
      !== state.ledger.entries.at(-1).postWorldStateHash
  ) {
    throw new Error('Persistent world does not match the terminal ledger state');
  }
  return true;
}

export function readPersistentState(storeDir) {
  const state = JSON.parse(readFileSync(statePath(storeDir), 'utf8'));
  validatePersistentState(state);
  return state;
}

function writeAtomicState(storeDir, state, faultInjection = 'none') {
  const target = statePath(storeDir);
  const temporary = path.join(
    storeDir,
    `.state-${process.pid}-${randomUUID()}.tmp`,
  );
  const descriptor = openSync(temporary, 'wx');
  let renamed = false;
  try {
    writeFileSync(descriptor, `${canonicalJson(state)}\n`, 'utf8');
    fsyncSync(descriptor);
    closeSync(descriptor);
    if (faultInjection === 'before_rename') {
      throw new Error('injected fault before atomic rename');
    }
    renameSync(temporary, target);
    renamed = true;
    if (faultInjection === 'after_rename') {
      throw new Error('injected fault after atomic rename');
    }
  } catch (error) {
    try {
      closeSync(descriptor);
    } catch {
      // Descriptor was already closed.
    }
    if (!renamed && existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
}

function withStoreLock(storeDir, callback) {
  mkdirSync(storeDir, { recursive: true });
  let descriptor;
  try {
    descriptor = openSync(lockPath(storeDir), 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error('Persistent authorization store is locked by another writer');
    }
    throw error;
  }
  try {
    return callback();
  } finally {
    closeSync(descriptor);
    unlinkSync(lockPath(storeDir));
  }
}

export function initializePersistentStore({
  storeDir,
  trustedValidatorConfig,
  validatorReceipt,
  initialWorld,
}) {
  if (!trustedValidatorConfig) {
    throw new Error('Host trustedValidatorConfig is required');
  }
  const validatorVerification = verifyRuntimeInjectedValidator(
    validatorReceipt,
    { trustedConfig: trustedValidatorConfig },
  );
  if (!validatorVerification.valid) {
    throw new Error(
      `Cannot initialize untrusted validator state: `
      + `${validatorVerification.errors.join('; ')}`,
    );
  }
  assertWorldState(initialWorld, 'initial world');
  return withStoreLock(storeDir, () => {
    if (existsSync(statePath(storeDir))) {
      throw new Error('Persistent authorization store already exists');
    }
    const state = sealState({
      consumedAuthorizations: [],
      eventOutbox: [],
      lastAuthorizationSequence: -1,
      ledger: {
        entries: [],
        receiptRoot: GENESIS_RECEIPT_HASH,
      },
      revision: 0,
      runId: validatorReceipt.manifest.runId,
      schema: PHASE0B_STATE_SCHEMA,
      validatorConfigHash: validatorReceipt.configHash,
      validatorManifestHash: validatorReceipt.manifestHash,
      world: structuredClone(initialWorld),
    });
    writeAtomicState(storeDir, state);
    return state;
  });
}

function findPostWorld(execution, scheduleEntryId) {
  const snapshot = execution.publicStateSnapshots.find(
    (entry) => entry.payload.scheduleEntryId === scheduleEntryId,
  );
  if (!snapshot) {
    throw new Error(`No public-state snapshot for ${scheduleEntryId}`);
  }
  return structuredClone(snapshot.payload.publicState);
}

function buildPersistentReceipt({
  attemptPayload,
  verifiedAction,
  signedAction,
  admissionMatched,
  allowed,
  preWorld,
  postWorld,
  previousReceiptHash,
}) {
  const preimage = {
    admissionMatched,
    allowed,
    authorizationNonce: signedAction.authorization.nonce,
    authorizationSequence: signedAction.authorization.sequence,
    attemptDigest: canonicalDigest({
      payload: attemptPayload ?? null,
      verifiedActionEntryHash: verifiedAction.entryHash,
    }),
    entrypoint: signedAction.entrypoint,
    eventPublication: 'durable_outbox_after_atomic_commit',
    postWorldStateHash: canonicalDigest(postWorld),
    preWorldStateHash: canonicalDigest(preWorld),
    previousReceiptHash,
    scheduleEntryId: signedAction.scheduleEntryId,
    upstreamActionEntryHash: verifiedAction.entryHash,
    worldMutationCommitted:
      allowed && canonicalJson(preWorld) !== canonicalJson(postWorld),
  };
  return {
    ...preimage,
    receiptHash: canonicalDigest(preimage),
  };
}

function reconstructPersistentStateFromVerifiedRun({
  execution,
  runManifest,
  validatorReceipt,
}) {
  let world = structuredClone(
    execution.publicStateSnapshots[0]?.payload?.publicState,
  );
  assertWorldState(world, 'verified initial world');

  const consumedAuthorizations = [];
  const eventOutbox = [];
  const entries = [];
  let previousReceiptHash = GENESIS_RECEIPT_HASH;

  execution.actionLedger.forEach((verifiedAction, index) => {
    const signedAction = runManifest.actions[index];
    if (!signedAction) {
      throw new Error(`No signed action exists for persistent entry ${index}`);
    }
    if (
      canonicalDigest(world) !== verifiedAction.payload.prePublicStateHash
    ) {
      throw new Error(
        `Persistent entry ${index} pre-state differs from verified V4 action`,
      );
    }
    const verifiedPostWorld = findPostWorld(
      execution,
      verifiedAction.payload.scheduleEntryId,
    );
    if (
      canonicalDigest(verifiedPostWorld)
        !== verifiedAction.payload.postPublicStateHash
    ) {
      throw new Error(
        `Persistent entry ${index} post-state differs from verified V4 action`,
      );
    }

    const allowed = signedAction.expectedAllowed;
    const committedWorld = allowed
      ? structuredClone(verifiedPostWorld)
      : structuredClone(world);
    const persistentReceipt = buildPersistentReceipt({
      admissionMatched: true,
      allowed,
      attemptPayload: verifiedAction.payload,
      postWorld: committedWorld,
      preWorld: world,
      previousReceiptHash,
      signedAction,
      verifiedAction,
    });
    entries.push(persistentReceipt);
    consumedAuthorizations.push({
      nonce: signedAction.authorization.nonce,
      receiptHash: persistentReceipt.receiptHash,
      sequence: signedAction.authorization.sequence,
    });
    eventOutbox.push({
      eventId: `model-village-action-${signedAction.authorization.sequence}`,
      publication: 'post_commit_only',
      receiptHash: persistentReceipt.receiptHash,
    });
    previousReceiptHash = persistentReceipt.receiptHash;
    world = committedWorld;
  });

  return sealState({
    consumedAuthorizations,
    eventOutbox,
    lastAuthorizationSequence: entries.length - 1,
    ledger: {
      entries,
      receiptRoot: previousReceiptHash,
    },
    revision: entries.length,
    runId: validatorReceipt.manifest.runId,
    schema: PHASE0B_STATE_SCHEMA,
    validatorConfigHash: validatorReceipt.configHash,
    validatorManifestHash: validatorReceipt.manifestHash,
    world,
  });
}

async function verifyCommitSourceContext({
  cli,
  runManifest,
  sourceRun,
  sources,
  validatorReceipt,
  trustedValidatorConfig,
}) {
  if (!trustedValidatorConfig) {
    throw new Error('Host trustedValidatorConfig is required');
  }
  const validatorVerification = verifyRuntimeInjectedValidator(
    validatorReceipt,
    { trustedConfig: trustedValidatorConfig },
  );
  if (!validatorVerification.valid) {
    throw new Error(
      `Validator rejected source execution: `
      + `${validatorVerification.errors.join('; ')}`,
    );
  }
  if (
    canonicalJson(runManifest) !== canonicalJson(validatorReceipt.manifest)
  ) {
    throw new Error('Verified source execution manifest is not validator-signed');
  }
  const sourceVerification =
    await cli.verifyHeadlessExperimentSourceRunReceipt(
      sourceRun.sourceRunReceipt,
      sourceRun.execution,
      {
        behaviorSource: sources.behavior,
        planSource: sources.plan,
        worldSource: sources.world,
      },
    );
  if (!sourceVerification?.valid) {
    throw new Error(
      `Atomic commit requires a verified HoloScript V4 source run: `
      + `${canonicalJson(sourceVerification?.errors ?? [])}`,
    );
  }
  validateSourceRun(sourceRun, runManifest, {
    observerRequired: Boolean(sourceRun.observerProof),
  });
  return sourceVerification;
}

function commitVerifiedActionAttemptAtomically({
  storeDir,
  trustedValidatorConfig,
  validatorReceipt,
  verifiedAction,
  verifiedPostWorld,
  attemptPayload = verifiedAction.payload,
  faultInjection = 'none',
}) {
  const verification = verifyRuntimeInjectedValidator(
    validatorReceipt,
    { trustedConfig: trustedValidatorConfig },
  );
  if (!verification.valid) {
    throw new Error(
      `Validator rejected action attempt: ${verification.errors.join('; ')}`,
    );
  }
  assertObject(verifiedAction?.payload, 'verified action payload');
  assertWorldState(verifiedPostWorld, 'verified action postWorld');

  return withStoreLock(storeDir, () => {
    const state = readPersistentState(storeDir);
    if (
      state.validatorConfigHash !== validatorReceipt.configHash
      || state.validatorManifestHash !== validatorReceipt.manifestHash
      || state.runId !== validatorReceipt.manifest.runId
    ) {
      throw new Error('Persistent state validator/run anchor mismatch');
    }
    const expectedSequence = state.lastAuthorizationSequence + 1;
    if (verifiedAction.sequence < expectedSequence) {
      throw new Error(
        `Authorization sequence ${verifiedAction.sequence} was already consumed`,
      );
    }
    if (verifiedAction.sequence !== expectedSequence) {
      throw new Error(
        `Verified action sequence ${verifiedAction.sequence} is not the next `
        + `authorization ${expectedSequence}`,
      );
    }
    const signedAction = validatorReceipt.manifest.actions[expectedSequence];
    if (!signedAction) {
      throw new Error('No remaining signed authorization is available');
    }
    const admissionMatched =
      canonicalJson(attemptPayload ?? null)
        === canonicalJson(verifiedAction.payload);
    const allowed = admissionMatched && signedAction.expectedAllowed;
    const preWorld = structuredClone(state.world);
    if (
      canonicalDigest(preWorld)
      !== verifiedAction.payload.prePublicStateHash
    ) {
      throw new Error(
        'Verified action pre-state does not match durable world state',
      );
    }
    if (
      canonicalDigest(verifiedPostWorld)
      !== verifiedAction.payload.postPublicStateHash
    ) {
      throw new Error(
        'Verified action post-state does not match HoloScript V4 receipt',
      );
    }
    const committedWorld = allowed
      ? structuredClone(verifiedPostWorld)
      : preWorld;
    if (
      !allowed
      && canonicalJson(committedWorld) !== canonicalJson(preWorld)
    ) {
      throw new Error('Denied action attempted to mutate durable world state');
    }

    const persistentReceipt = buildPersistentReceipt({
      attemptPayload,
      verifiedAction,
      signedAction,
      admissionMatched,
      allowed,
      postWorld: committedWorld,
      preWorld,
      previousReceiptHash: state.ledger.receiptRoot,
    });
    const nextState = sealState({
      consumedAuthorizations: [
        ...state.consumedAuthorizations,
        {
          nonce: signedAction.authorization.nonce,
          receiptHash: persistentReceipt.receiptHash,
          sequence: signedAction.authorization.sequence,
        },
      ],
      eventOutbox: [
        ...state.eventOutbox,
        {
          eventId: `model-village-action-${signedAction.authorization.sequence}`,
          publication: 'post_commit_only',
          receiptHash: persistentReceipt.receiptHash,
        },
      ],
      lastAuthorizationSequence: signedAction.authorization.sequence,
      ledger: {
        entries: [...state.ledger.entries, persistentReceipt],
        receiptRoot: persistentReceipt.receiptHash,
      },
      revision: state.revision + 1,
      runId: state.runId,
      schema: state.schema,
      validatorConfigHash: state.validatorConfigHash,
      validatorManifestHash: state.validatorManifestHash,
      world: committedWorld,
    });
    writeAtomicState(storeDir, nextState, faultInjection);
    return {
      postCommitOutboxEvent: {
        eventId: `model-village-action-${signedAction.authorization.sequence}`,
        receiptHash: persistentReceipt.receiptHash,
      },
      persistentReceipt,
      state: nextState,
    };
  });
}

async function commitVerifiedAttemptFromSourceRun({
  actionIndex,
  attemptPayload,
  cli,
  faultInjection = 'none',
  runManifest,
  sourceRun,
  sources,
  storeDir,
  trustedValidatorConfig,
  validatorReceipt,
}) {
  await verifyCommitSourceContext({
    cli,
    runManifest,
    sourceRun,
    sources,
    trustedValidatorConfig,
    validatorReceipt,
  });
  const verifiedAction = sourceRun.execution.actionLedger[actionIndex];
  if (!verifiedAction) {
    throw new Error(`Verified action index ${actionIndex} is unavailable`);
  }
  return commitVerifiedActionAttemptAtomically({
    attemptPayload,
    faultInjection,
    storeDir,
    trustedValidatorConfig,
    validatorReceipt,
    verifiedAction,
    verifiedPostWorld: findPostWorld(
      sourceRun.execution,
      verifiedAction.payload.scheduleEntryId,
    ),
  });
}

async function commitExecutionAtomically({
  cli,
  faultInjection = {},
  runManifest,
  sourceRun,
  sources,
  storeDir,
  trustedValidatorConfig,
  validatorReceipt,
}) {
  const sourceVerification = await verifyCommitSourceContext({
    cli,
    runManifest,
    sourceRun,
    sources,
    trustedValidatorConfig,
    validatorReceipt,
  });
  const execution = sourceRun.execution;
  const initialWorld = execution.publicStateSnapshots[0]?.payload?.publicState;
  if (!existsSync(statePath(storeDir))) {
    initializePersistentStore({
      initialWorld,
      storeDir,
      trustedValidatorConfig,
      validatorReceipt,
    });
  }
  const commits = [];
  for (let index = 0; index < execution.actionLedger.length; index += 1) {
    const verifiedAction = execution.actionLedger[index];
    commits.push(commitVerifiedActionAttemptAtomically({
      faultInjection: faultInjection[index] ?? 'none',
      storeDir,
      trustedValidatorConfig,
      validatorReceipt,
      verifiedAction,
      verifiedPostWorld: findPostWorld(
        execution,
        verifiedAction.payload.scheduleEntryId,
      ),
    }));
  }
  const state = readPersistentState(storeDir);
  return { commits, sourceVerification, state };
}

function validateVisibleEmergencyStopBinding(visibleWorld) {
  const required = [
    'object "EmergencyStop" using "SafetyBoundary"',
    'on_interact: "request_experiment_freeze"',
    'boundedBridgeBehaviorSource: "source/proofs/model-village-phase0b-behavior.hsplus"',
    'boundedBridgeComposition: "ModelVillagePhase0BBehavior"',
    'boundedBridgeEntrypoint: "freeze_run"',
    'boundedBridgeFullyQualifiedEntrypoint: "ModelVillagePhase0BBehavior.freeze_run"',
    'boundedBridgeDispatchReason: "operator_emergency_stop"',
    'boundedBridgeTargetId: "EmergencyStop"',
    'boundedBridgeBindingStatus: "declared_for_receipted_phase0b_hololand_bridge"',
    'nativeLifecycleBindingClaimed: false',
    'cross_composition_binding_status: "not_observed"',
  ];
  const missing = required.filter((needle) => !visibleWorld.includes(needle));
  if (missing.length > 0) {
    throw new Error(
      `Visible .holo emergency-stop bridge declaration is incomplete: `
      + `${canonicalJson(missing)}`,
    );
  }
  const binding = {
    bindingMode: 'hololand_bounded_source_binding_bridge',
    dispatchReason: 'operator_emergency_stop',
    eventEntrypoint: 'request_experiment_freeze',
    sourceObjectId: 'EmergencyStop',
    targetBehaviorSource:
      'source/proofs/model-village-phase0b-behavior.hsplus',
    targetComposition: 'ModelVillagePhase0BBehavior',
    targetEntrypoint: 'freeze_run',
    targetId: 'EmergencyStop',
    visibleWorldSourceHash: sourceDigest(visibleWorld),
  };
  return {
    binding,
    bindingHash: canonicalDigest(binding),
    bindingStatus: 'declared_and_executed_by_bounded_hololand_bridge',
    boundedBridgeFullyQualifiedEntrypoint:
      'ModelVillagePhase0BBehavior.freeze_run',
    nativeLifecycleBindingClaimed: false,
    visibleObjectId: 'EmergencyStop',
  };
}

function validateEmergencyStopRun(run, runManifest, visibleBinding) {
  const execution = run.execution;
  if (
    run.sourceRunReceipt.schema !== SOURCE_RUN_SCHEMA
    || execution.actionLedger.length !== 1
    || execution.observationLedger.length !== 0
  ) {
    throw new Error('Emergency-stop source run schema/counts are invalid');
  }
  const action = execution.actionLedger[0];
  const expected = runManifest.emergencyStop;
  const dispatchRequest = {
    bindingHash: visibleBinding.bindingHash,
    eventEntrypoint: visibleBinding.binding.eventEntrypoint,
    reason: visibleBinding.binding.dispatchReason,
    sourceObjectId: visibleBinding.binding.sourceObjectId,
    targetBehaviorSource: visibleBinding.binding.targetBehaviorSource,
    targetComposition: visibleBinding.binding.targetComposition,
    targetEntrypoint: visibleBinding.binding.targetEntrypoint,
    targetIds: [visibleBinding.binding.targetId],
  };
  if (
    dispatchRequest.reason !== expected.args.reason
    || dispatchRequest.targetEntrypoint !== expected.entrypoint
    || canonicalJson(dispatchRequest.targetIds)
      !== canonicalJson(expected.targetIds)
  ) {
    throw new Error(
      'Visible .holo emergency-stop dispatch does not match the signed stop plan',
    );
  }
  for (const [field, value] of Object.entries({
    args: expected.args,
    authorization: expected.authorization,
    entrypoint: expected.entrypoint,
    scheduleEntryId: expected.scheduleEntryId,
    targetIds: expected.targetIds,
  })) {
    if (canonicalJson(action.payload[field]) !== canonicalJson(value)) {
      throw new Error(`Emergency-stop ${field} differs from signed manifest`);
    }
  }
  const finalState = execution.publicStateSnapshots.at(-1)?.payload?.publicState;
  if (
    action.payload.allowed !== true
    || action.payload.outcome !== expected.expectedOutcome
    || action.payload.stateChanged !== true
    || canonicalJson(finalState) !== canonicalJson(expected.expectedFinalState)
    || run.observerProof?.equivalent !== true
    || run.observerProof?.observerIntroducedExperimentExecutionCount !== 0
  ) {
    throw new Error('Emergency-stop execution did not fail dark/freeze the run');
  }
  const unsignedSafetyReceipt = {
    actionEntryHash: action.entryHash,
    bindingHash: visibleBinding.bindingHash,
    decision: 'freeze_run',
    dispatchRequestHash: canonicalDigest(dispatchRequest),
    finalPublicStateHash: execution.terminal.finalPublicStateHash,
    schema: 'hololand.model-village-phase0b-safety-receipt.v1',
    sourceRunCommitment: run.sourceRunReceipt.sourceRunCommitment,
    targetIds: structuredClone(action.payload.targetIds),
    validatorManifestHash: canonicalDigest(runManifest),
  };
  return {
    dispatchRequest,
    executionReceipt: structuredClone(run.execution),
    finalPublicState: structuredClone(finalState),
    observerProof: structuredClone(run.observerProof),
    safetyReceipt: {
      ...unsignedSafetyReceipt,
      receiptHash: canonicalDigest(unsignedSafetyReceipt),
    },
    sourceRunReceipt: structuredClone(run.sourceRunReceipt),
    terminalCommitment: execution.terminal.terminalCommitment,
  };
}

function outerReceiptHash(value) {
  const unsigned = { ...value };
  delete unsigned.receipt;
  return canonicalDigest(unsigned);
}

export function verifyPhase0BReceiptSelfIntegrity(value) {
  try {
    return (
      value?.receipt?.receiptHash === outerReceiptHash(value)
      && value.receipt.rawModelResponsesIncluded === false
      && value.receipt.providerCallsMadeByTracer === 0
    );
  } catch {
    return false;
  }
}

export function verifyPhase0BReceiptHash(value) {
  return verifyPhase0BReceiptSelfIntegrity(value);
}

export async function verifyPhase0BReceipt(
  value,
  { root: rootOption, trustedValidatorConfig } = {},
) {
  const errors = [];
  try {
    if (!verifyPhase0BReceiptSelfIntegrity(value)) {
      throw new Error('Phase 0B receipt self-integrity check failed');
    }
    assertExactKeys(
      value,
      [
        'assertions',
        'claimBoundary',
        'emergencyStop',
        'generatedAt',
        'manifests',
        'persistence',
        'receipt',
        'replay',
        'runtime',
        'schema',
        'sources',
        'status',
        'validator',
      ],
      'Phase 0B outer receipt',
    );
    assertExactKeys(
      value.receipt,
      [
        'providerCallsMadeByTracer',
        'rawModelPromptsIncluded',
        'rawModelResponsesIncluded',
        'receiptHash',
      ],
      'Phase 0B self-integrity receipt',
    );
    const assertionKeys = [
      'atomicActionAdmissionAndWorldMutation',
      'atomicCommitBoundToVerifiedV4SourceRun',
      'capturedResponseHashesBound',
      'challengeAndMetricManifestsFrozenAndHashed',
      'emergencyStopBridgeExecuted',
      'faultAfterRenameRecoversCompleteState',
      'faultBeforeRenameLeavesOldState',
      'freshCapturedResponseReplayMatches',
      'hostSuppliedValidatorConfigPinned',
      'observerIntroducedNoExecution',
      'observerProjectionToggleEquivalent',
      'persistentAuthorizationMonotonic',
      'separateProcessPersistentStateRecovery',
      'sourceRunV4Verified',
      'trustedValidatorCryptographicallyVerified',
    ];
    assertExactKeys(value.assertions, assertionKeys, 'Phase 0B assertions');
    if (
      value.schema !== PHASE0B_RECEIPT_SCHEMA
      || value.status !== 'pass'
      || !value.assertions
      || !Object.values(value.assertions).every((passed) => passed === true)
      || typeof value.generatedAt !== 'string'
      || Number.isNaN(Date.parse(value.generatedAt))
    ) {
      throw new Error('Phase 0B receipt identity/status/assertions are invalid');
    }
    const boundary = value.claimBoundary;
    if (!trustedValidatorConfig) {
      throw new Error('Full receipt verification requires host trustedValidatorConfig');
    }
    if (!Object.isFrozen(trustedValidatorConfig)) {
      throw new Error(
        'Full receipt verification requires a frozen host trustedValidatorConfig',
      );
    }
    const expectedBoundary = {
      boundedHoloToHsplusStopDispatchExecuted: true,
      boundedHsplusEntrypointExecuted: true,
      capturedResponseFixturesReplayed: 2,
      fullHoloWorldExecutionClaimed: false,
      fullHsLanguageExecutionClaimed: false,
      fullHsplusLanguageExecutionClaimed: false,
      hololandCrossCompositionBridgeExecuted: true,
      liveModelProviderCallsClaimed: false,
      nativeHoloLifecycleExecutionClaimed: false,
      nativeHsplusEngineExecutionClaimed: false,
      physicsEngineExecutionClaimed: false,
      processCrashDurabilityClaimed: false,
      productionDistributedTransactionClaimed: false,
      productionValidatorTrustClaimed: false,
      scientificOutcomeClaimed: false,
      transactionScope:
        'verified_v4_per_action_single_host_file_atomic_bridge',
      trustedValidatorInjection: 'caller_supplied_frozen_host_config',
      trustedValidatorKeyCustody: trustedValidatorConfig.keyCustody,
      worldRuntimeLifecycleExecuted: false,
    };
    if (
      !boundary
      || canonicalJson(boundary) !== canonicalJson(expectedBoundary)
      || value.receipt.rawModelPromptsIncluded !== false
      || value.receipt.rawModelResponsesIncluded !== false
      || value.receipt.providerCallsMadeByTracer !== 0
    ) {
      throw new Error('Phase 0B receipt claim boundary is invalid');
    }
    const validatorVerification = verifyRuntimeInjectedValidator(
      value.validator?.validatorReceipt,
      { trustedConfig: trustedValidatorConfig },
    );
    if (!validatorVerification.valid) {
      throw new Error(
        `Full receipt validator verification failed: `
        + `${validatorVerification.errors.join('; ')}`,
      );
    }
    const validatorReceipt = value.validator.validatorReceipt;
    const expectedValidator = {
      config: structuredClone(validatorReceipt.config),
      configHash: validatorReceipt.configHash,
      manifestHash: validatorReceipt.manifestHash,
      registryReceiptId: validatorReceipt.config.registryReceiptId,
      signatureVerified: true,
      signedPayloadHash: validatorReceipt.signedPayloadHash,
      trustAnchorOrigin: 'caller_supplied_host_config',
      validatorReceipt: structuredClone(validatorReceipt),
    };
    if (canonicalJson(value.validator) !== canonicalJson(expectedValidator)) {
      throw new Error('Full receipt validator summary differs from trusted receipt');
    }
    if (
      canonicalJson(value.sources) !== canonicalJson(PHASE0B_SOURCE_PATHS)
    ) {
      throw new Error('Full receipt source paths differ from the canonical bundle');
    }

    const root = path.resolve(
      rootOption
        ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
    );
    const holoScript = await loadHoloScript(root);
    const rawSources = Object.fromEntries(
      Object.entries(PHASE0B_SOURCE_PATHS)
        .map(([key, relativePath]) => [key, readSource(root, relativePath)]),
    );
    const manifests = instantiatePhase1Manifests({
      core: holoScript.core,
      source: rawSources.manifests,
    });
    const hydratedPlan = hydratePlanSource(rawSources.plan, manifests);
    const plan = parsePlanSource(hydratedPlan, 'Phase 0B verifier plan');
    const stopPlan = parsePlanSource(
      rawSources.stopPlan,
      'Phase 0B verifier stop plan',
    );
    const executionSources = {
      behavior: rawSources.behavior,
      plan: hydratedPlan,
      planTemplate: rawSources.plan,
      stopPlan: rawSources.stopPlan,
      visibleWorld: rawSources.visibleWorld,
      world: rawSources.world,
    };
    const runManifest = buildRunManifest({
      manifests,
      plan,
      sources: executionSources,
      stopPlan,
    });
    if (
      canonicalJson(runManifest)
      !== canonicalJson(value.validator.validatorReceipt.manifest)
    ) {
      throw new Error('Full receipt manifest differs from canonical source inputs');
    }
    const expectedManifestSummary = {
      bundleId: manifests.bundle.bundleId,
      capturedResponses: manifests.capturedResponses,
      challengeIds: manifests.challengeManifest.challenges.map(
        (entry) => entry.challengeId,
      ),
      challengeManifestHash: manifests.challengeManifestHash,
      frozenBeforeFirstTurn: manifests.bundle.frozenBeforeFirstTurn,
      metricSpecHash: manifests.metricSpecHash,
      metricSpecId: manifests.metricSpec.metricSpecId,
      rawResponsesIncluded: false,
      sourceHash: manifests.sourceHash,
    };
    if (
      canonicalJson(value.manifests)
        !== canonicalJson(expectedManifestSummary)
    ) {
      throw new Error('Full receipt manifest summary anchors differ');
    }

    const mainRun = {
      claimBoundary: value.runtime.sourceClaimBoundary,
      execution: value.runtime.executionReceipt,
      observerProof: value.runtime.observerProof,
      sourceRunReceipt: value.runtime.sourceRunReceipt,
    };
    const mainSourceVerification =
      await holoScript.cli.verifyHeadlessExperimentSourceRunReceipt(
        mainRun.sourceRunReceipt,
        mainRun.execution,
        {
          behaviorSource: executionSources.behavior,
          planSource: executionSources.plan,
          worldSource: executionSources.world,
        },
      );
    if (!mainSourceVerification?.valid) {
      throw new Error(
        `Full receipt V4 verification failed: `
        + `${canonicalJson(mainSourceVerification?.errors ?? [])}`,
      );
    }
    const executionSummary = validateSourceRun(
      mainRun,
      runManifest,
      { observerRequired: true },
    );
    const freshReplay = await executeSourceRun(
      holoScript.cli,
      {
        behavior: executionSources.behavior,
        plan: executionSources.plan,
        world: executionSources.world,
      },
      'off',
    );
    validateSourceRun(freshReplay.run, runManifest, {
      observerRequired: false,
    });
    const observerProjection = buildPhase0BObserverProjectionWitness({
      sealedSourceRun: mainRun,
    });
    const expectedRuntime = {
      actionDecisions: executionSummary.actionDecisions,
      boundedHsplusSubsetActionsExecuted: 2,
      capturedResponsesConsumed: 2,
      counts: executionSummary.counts,
      executionReceipt: structuredClone(mainRun.execution),
      finalPublicState: executionSummary.finalPublicState,
      observationSubjects: executionSummary.observationSubjects,
      observerProof: structuredClone(mainRun.observerProof),
      observerProjection,
      providerCalls: 0,
      sourceBundleHash: executionSummary.sourceBundleHash,
      sourceClaimBoundary: structuredClone(freshReplay.run.claimBoundary),
      sourceRunCommitment: executionSummary.sourceRunCommitment,
      sourceRunReceipt: structuredClone(mainRun.sourceRunReceipt),
      sourceRunSchema: mainRun.sourceRunReceipt.schema,
      terminalCommitment: executionSummary.terminalCommitment,
    };
    if (canonicalJson(value.runtime) !== canonicalJson(expectedRuntime)) {
      throw new Error('Full receipt runtime summary differs from verified V4 run');
    }
    const expectedReplay = {
      comparedFields: [
        'ordered_action_decisions',
        'ordered_post_state_hashes',
        'action_root',
        'final_public_state_hash',
        'source_run_commitment',
        'terminal_commitment',
      ],
      freshExecutionCount: 1,
      match: true,
      projectionHash: canonicalDigest(replayProjection(mainRun)),
      providerCalls: 0,
    };
    if (
      canonicalJson(replayProjection(mainRun))
        !== canonicalJson(replayProjection(freshReplay.run))
      || canonicalJson(value.replay) !== canonicalJson(expectedReplay)
    ) {
      throw new Error('Full receipt fresh replay verification failed');
    }
    validatePersistentState(value.persistence?.stateReceipt);
    const expectedPersistentState = reconstructPersistentStateFromVerifiedRun({
      execution: mainRun.execution,
      runManifest,
      validatorReceipt: value.validator.validatorReceipt,
    });
    const expectedPersistence = {
      atomicActionReceiptsCommitted:
        expectedPersistentState.ledger.entries.length,
      authorizationAttemptsConsumed:
        expectedPersistentState.consumedAuthorizations.length,
      deniedAttemptsConsumed:
        expectedPersistentState.ledger.entries.filter(
          (entry) => !entry.allowed,
        ).length,
      eventPublication: 'durable_outbox_after_atomic_commit',
      faultAfterRename:
        'injected_process_level_complete_new_state_recovered',
      faultBeforeRename:
        'injected_process_level_old_state_recovered',
      finalStateHash: expectedPersistentState.stateHash,
      lastAuthorizationSequence:
        expectedPersistentState.lastAuthorizationSequence,
      malformedHashAttemptBurnedAndDenied: true,
      mismatchedTargetAttemptBurnedAndDenied: true,
      receiptRoot: expectedPersistentState.ledger.receiptRoot,
      replayAfterRestartRejected: true,
      restartRecovered: true,
      sameProcessRereadRecovered: true,
      separateProcessRereadRecovered: true,
      stateReceipt: expectedPersistentState,
      stateSchema: expectedPersistentState.schema,
      storePathIncluded: false,
    };
    if (
      canonicalJson(value.persistence) !== canonicalJson(expectedPersistence)
    ) {
      throw new Error(
        'Full receipt persistent state differs from the verified V4 action sequence',
      );
    }

    const visibleBinding = validateVisibleEmergencyStopBinding(
      rawSources.visibleWorld,
    );
    const stopRun = {
      execution: value.emergencyStop.executionReceipt,
      observerProof: value.emergencyStop.observerProof,
      sourceRunReceipt: value.emergencyStop.sourceRunReceipt,
    };
    const stopSourceVerification =
      await holoScript.cli.verifyHeadlessExperimentSourceRunReceipt(
        stopRun.sourceRunReceipt,
        stopRun.execution,
        {
          behaviorSource: executionSources.behavior,
          planSource: executionSources.stopPlan,
          worldSource: executionSources.world,
        },
      );
    if (!stopSourceVerification?.valid) {
      throw new Error(
        `Full emergency-stop V4 verification failed: `
        + `${canonicalJson(stopSourceVerification?.errors ?? [])}`,
      );
    }
    const stopSummary = validateEmergencyStopRun(
      stopRun,
      runManifest,
      visibleBinding,
    );
    const expectedEmergencyStop = {
      ...stopSummary,
      visibleBinding,
    };
    if (
      canonicalJson(value.emergencyStop)
        !== canonicalJson(expectedEmergencyStop)
    ) {
      throw new Error(
        'Full emergency-stop payload differs from the verified V4 stop run',
      );
    }
  } catch (error) {
    errors.push(error.message || String(error));
  }
  return {
    errors,
    valid: errors.length === 0,
  };
}

function makeDefaultStoreDir(root, label) {
  return path.join(
    root,
    '.tmp',
    'hololand',
    'model-village',
    'phase0b-runtime',
    `${label}-${process.pid}-${randomUUID()}`,
  );
}

function readPersistentStateHashInFreshProcess(storeDir) {
  const program = `
    const moduleUrl = process.argv[1];
    const storeDir = process.argv[2];
    const runtime = await import(moduleUrl);
    process.stdout.write(runtime.readPersistentState(storeDir).stateHash);
  `;
  const child = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      program,
      import.meta.url,
      storeDir,
    ],
    {
      encoding: 'utf8',
      windowsHide: true,
    },
  );
  if (child.status !== 0) {
    throw new Error(
      `Fresh-process persistent-state recovery failed: `
      + `${String(child.stderr || child.stdout).trim()}`,
    );
  }
  return String(child.stdout).trim();
}

export async function runPhase0BEngineeringTracer(options = {}) {
  const root = path.resolve(
    options.root
      ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  );
  const holoScript = await loadHoloScript(root);
  const rawSources = Object.fromEntries(
    Object.entries(PHASE0B_SOURCE_PATHS)
      .map(([key, relativePath]) => [key, readSource(root, relativePath)]),
  );
  const manifests = instantiatePhase1Manifests({
    core: holoScript.core,
    source: rawSources.manifests,
  });
  const hydratedPlan = hydratePlanSource(rawSources.plan, manifests);
  const plan = parsePlanSource(hydratedPlan, 'Phase 0B tracer plan');
  const stopPlan = parsePlanSource(rawSources.stopPlan, 'Phase 0B stop plan');
  const executionSources = {
    behavior: rawSources.behavior,
    plan: hydratedPlan,
    planTemplate: rawSources.plan,
    stopPlan: rawSources.stopPlan,
    visibleWorld: rawSources.visibleWorld,
    world: rawSources.world,
  };
  const runManifest = buildRunManifest({
    manifests,
    plan,
    sources: executionSources,
    stopPlan,
  });
  const trustedValidatorConfig = options.trustedValidatorConfig;
  const signRunManifest = options.signRunManifest;
  if (
    !trustedValidatorConfig
    || Object.isFrozen(trustedValidatorConfig) !== true
    || typeof signRunManifest !== 'function'
  ) {
    throw new Error(
      'runPhase0BEngineeringTracer requires separate frozen '
      + 'trustedValidatorConfig and host signRunManifest inputs',
    );
  }
  const validatorReceipt = signRunManifest(runManifest);
  const validatorVerification = verifyRuntimeInjectedValidator(
    validatorReceipt,
    {
      trustedConfig: trustedValidatorConfig,
    },
  );
  if (!validatorVerification.valid) {
    throw new Error(
      `Runtime-injected validator rejected its receipt: `
      + `${validatorVerification.errors.join('; ')}`,
    );
  }

  const first = await executeSourceRun(
    holoScript.cli,
    {
      behavior: executionSources.behavior,
      plan: executionSources.plan,
      world: executionSources.world,
    },
    'on',
  );
  const executionSummary = validateSourceRun(
    first.run,
    runManifest,
    { observerRequired: true },
  );
  const freshReplay = await executeSourceRun(
    holoScript.cli,
    {
      behavior: executionSources.behavior,
      plan: executionSources.plan,
      world: executionSources.world,
    },
    'off',
  );
  validateSourceRun(freshReplay.run, runManifest, { observerRequired: false });
  const observerProjection = buildPhase0BObserverProjectionWitness({
    sealedSourceRun: first.run,
  });
  const firstProjection = replayProjection(first.run);
  const replayProjectionValue = replayProjection(freshReplay.run);
  const replayMatch =
    canonicalJson(firstProjection) === canonicalJson(replayProjectionValue);
  if (!replayMatch) {
    throw new Error('Fresh captured-response source replay is not deterministic');
  }

  const storeDir = path.resolve(
    options.storeDir ?? makeDefaultStoreDir(root, 'main'),
  );
  const commitSources = {
    behavior: executionSources.behavior,
    plan: executionSources.plan,
    world: executionSources.world,
  };
  const atomicCommit = await commitExecutionAtomically({
    cli: holoScript.cli,
    runManifest,
    sourceRun: first.run,
    sources: commitSources,
    storeDir,
    trustedValidatorConfig,
    validatorReceipt,
  });
  const recoveredState = readPersistentState(storeDir);
  const restartRecovered =
    recoveredState.stateHash === atomicCommit.state.stateHash
    && recoveredState.lastAuthorizationSequence === 1;
  const freshProcessStateHash =
    readPersistentStateHashInFreshProcess(storeDir);
  const separateProcessRecovery =
    freshProcessStateHash === recoveredState.stateHash;
  let replayRejected = false;
  const beforeReplayStateHash = recoveredState.stateHash;
  try {
    await commitExecutionAtomically({
      cli: holoScript.cli,
      runManifest,
      sourceRun: first.run,
      sources: commitSources,
      storeDir,
      trustedValidatorConfig,
      validatorReceipt,
    });
  } catch (error) {
    replayRejected = /already consumed|No remaining signed authorization/.test(
      error.message,
    );
  }
  const afterReplayState = readPersistentState(storeDir);
  if (!replayRejected || afterReplayState.stateHash !== beforeReplayStateHash) {
    throw new Error('Persistent authorization replay was not fail-dark');
  }

  const beforeRenameStore = makeDefaultStoreDir(root, 'fault-before-rename');
  initializePersistentStore({
    initialWorld: first.run.execution.publicStateSnapshots[0].payload.publicState,
    storeDir: beforeRenameStore,
    trustedValidatorConfig,
    validatorReceipt,
  });
  const beforeFaultHash = readPersistentState(beforeRenameStore).stateHash;
  let beforeRenameFaultObserved = false;
  try {
    await commitVerifiedAttemptFromSourceRun({
      actionIndex: 0,
      cli: holoScript.cli,
      faultInjection: 'before_rename',
      runManifest,
      sourceRun: first.run,
      sources: commitSources,
      storeDir: beforeRenameStore,
      trustedValidatorConfig,
      validatorReceipt,
    });
  } catch (error) {
    beforeRenameFaultObserved = /injected fault before atomic rename/.test(error.message);
  }
  const afterBeforeFault = readPersistentState(beforeRenameStore);
  if (!beforeRenameFaultObserved || afterBeforeFault.stateHash !== beforeFaultHash) {
    throw new Error('Pre-rename fault exposed a partial persistent transaction');
  }

  const afterRenameStore = makeDefaultStoreDir(root, 'fault-after-rename');
  initializePersistentStore({
    initialWorld: first.run.execution.publicStateSnapshots[0].payload.publicState,
    storeDir: afterRenameStore,
    trustedValidatorConfig,
    validatorReceipt,
  });
  let afterRenameFaultObserved = false;
  try {
    await commitVerifiedAttemptFromSourceRun({
      actionIndex: 0,
      cli: holoScript.cli,
      faultInjection: 'after_rename',
      runManifest,
      sourceRun: first.run,
      sources: commitSources,
      storeDir: afterRenameStore,
      trustedValidatorConfig,
      validatorReceipt,
    });
  } catch (error) {
    afterRenameFaultObserved = /injected fault after atomic rename/.test(error.message);
  }
  const afterRenameRecovered = readPersistentState(afterRenameStore);
  if (
    !afterRenameFaultObserved
    || afterRenameRecovered.revision !== 1
    || afterRenameRecovered.lastAuthorizationSequence !== 0
  ) {
    throw new Error('Post-rename recovery did not expose the complete commit');
  }

  const exerciseBurnOnMismatch = async (label, mutateAttempt) => {
    const mismatchStore = makeDefaultStoreDir(root, label);
    initializePersistentStore({
      initialWorld:
        first.run.execution.publicStateSnapshots[0].payload.publicState,
      storeDir: mismatchStore,
      trustedValidatorConfig,
      validatorReceipt,
    });
    const attemptPayload = structuredClone(
      first.run.execution.actionLedger[0].payload,
    );
    mutateAttempt(attemptPayload);
    const mismatchCommit = await commitVerifiedAttemptFromSourceRun({
      actionIndex: 0,
      attemptPayload,
      cli: holoScript.cli,
      runManifest,
      sourceRun: first.run,
      sources: commitSources,
      storeDir: mismatchStore,
      trustedValidatorConfig,
      validatorReceipt,
    });
    const stateAfterMismatch = readPersistentState(mismatchStore);
    const stateHashAfterMismatch = stateAfterMismatch.stateHash;
    let retryRejected = false;
    try {
      await commitVerifiedAttemptFromSourceRun({
        actionIndex: 0,
        cli: holoScript.cli,
        runManifest,
        sourceRun: first.run,
        sources: commitSources,
        storeDir: mismatchStore,
        trustedValidatorConfig,
        validatorReceipt,
      });
    } catch (error) {
      retryRejected = /already consumed/.test(error.message);
    }
    const stateAfterRetry = readPersistentState(mismatchStore);
    if (
      mismatchCommit.persistentReceipt.admissionMatched !== false
      || mismatchCommit.persistentReceipt.allowed !== false
      || mismatchCommit.persistentReceipt.worldMutationCommitted !== false
      || stateAfterMismatch.lastAuthorizationSequence !== 0
      || canonicalJson(stateAfterMismatch.world)
        !== canonicalJson(
          first.run.execution.publicStateSnapshots[0].payload.publicState,
        )
      || !retryRejected
      || stateAfterRetry.stateHash !== stateHashAfterMismatch
    ) {
      throw new Error(`${label} did not burn once and fail dark`);
    }
    return {
      authorizationBurned: true,
      retryRejected,
      stateHash: stateAfterMismatch.stateHash,
      worldMutationCommitted: false,
    };
  };
  const mismatchedTargetAttempt = await exerciseBurnOnMismatch(
    'mismatch-target',
    (payload) => {
      payload.targetIds = ['attacker-selected-target'];
    },
  );
  const malformedHashAttempt = await exerciseBurnOnMismatch(
    'mismatch-state-hashes',
    (payload) => {
      delete payload.prePublicStateHash;
      payload.postPublicStateHash = 'not-a-valid-state-hash';
    },
  );

  const visibleStopBinding = validateVisibleEmergencyStopBinding(
    rawSources.visibleWorld,
  );
  const stopSourceRun = await executeSourceRun(
    holoScript.cli,
    {
      behavior: executionSources.behavior,
      plan: executionSources.stopPlan,
      world: executionSources.world,
    },
    'on',
  );
  const emergencyStop = validateEmergencyStopRun(
    stopSourceRun.run,
    runManifest,
    visibleStopBinding,
  );

  const assertions = {
    atomicActionAdmissionAndWorldMutation:
      atomicCommit.state.revision === 2
      && atomicCommit.state.ledger.entries[0].worldMutationCommitted === true
      && atomicCommit.state.ledger.entries[1].worldMutationCommitted === false
      && atomicCommit.state.ledger.entries[1].allowed === false,
    atomicCommitBoundToVerifiedV4SourceRun:
      atomicCommit.sourceVerification.valid === true,
    capturedResponseHashesBound:
      runManifest.actions.every((action, index) => (
        action.args.capturedResponseHash
          === manifests.capturedResponses[index].responseHash
      )),
    challengeAndMetricManifestsFrozenAndHashed:
      manifests.bundle.frozenBeforeFirstTurn === true
      && SHA256_PATTERN.test(manifests.challengeManifestHash)
      && SHA256_PATTERN.test(manifests.metricSpecHash),
    emergencyStopBridgeExecuted:
      emergencyStop.finalPublicState.emergencyStopState === 'triggered'
      && emergencyStop.finalPublicState.phase === 'frozen'
      && emergencyStop.dispatchRequest.bindingHash
        === visibleStopBinding.bindingHash
      && emergencyStop.safetyReceipt.bindingHash
        === visibleStopBinding.bindingHash,
    faultBeforeRenameLeavesOldState:
      afterBeforeFault.stateHash === beforeFaultHash,
    faultAfterRenameRecoversCompleteState:
      afterRenameRecovered.revision === 1,
    freshCapturedResponseReplayMatches: replayMatch,
    hostSuppliedValidatorConfigPinned:
      validatorVerification.valid
      && validatorReceipt.configHash === canonicalDigest(trustedValidatorConfig),
    observerIntroducedNoExecution:
      first.run.observerProof.observerIntroducedExperimentExecutionCount === 0,
    observerProjectionToggleEquivalent:
      observerProjection.projectionToggleExecuted === true
      && observerProjection.comparison.sevenFieldsEqual === true
      && observerProjection.comparison.sourceRunCommitmentEqual === true
      && observerProjection.comparison.terminalCommitmentEqual === true
      && observerProjection.claimBoundary
        .observerIntroducedExperimentExecutionCount === 0,
    persistentAuthorizationMonotonic:
      recoveredState.lastAuthorizationSequence === 1
      && recoveredState.consumedAuthorizations.length === 2
      && replayRejected
      && mismatchedTargetAttempt.authorizationBurned
      && malformedHashAttempt.authorizationBurned,
    separateProcessPersistentStateRecovery: separateProcessRecovery,
    sourceRunV4Verified:
      first.verification.valid === true
      && freshReplay.verification.valid === true
      && stopSourceRun.verification.valid === true,
    trustedValidatorCryptographicallyVerified: validatorVerification.valid,
  };
  const failedAssertions = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  if (failedAssertions.length > 0) {
    throw new Error(
      `Phase 0B engineering tracer assertions failed: `
      + `${failedAssertions.join(', ')}`,
    );
  }

  const unsigned = {
    assertions,
    claimBoundary: {
      boundedHoloToHsplusStopDispatchExecuted: true,
      boundedHsplusEntrypointExecuted: true,
      capturedResponseFixturesReplayed: 2,
      fullHoloWorldExecutionClaimed: false,
      fullHsLanguageExecutionClaimed: false,
      fullHsplusLanguageExecutionClaimed: false,
      hololandCrossCompositionBridgeExecuted: true,
      liveModelProviderCallsClaimed: false,
      nativeHoloLifecycleExecutionClaimed: false,
      nativeHsplusEngineExecutionClaimed: false,
      physicsEngineExecutionClaimed: false,
      processCrashDurabilityClaimed: false,
      productionDistributedTransactionClaimed: false,
      productionValidatorTrustClaimed: false,
      scientificOutcomeClaimed: false,
      transactionScope:
        'verified_v4_per_action_single_host_file_atomic_bridge',
      trustedValidatorInjection: 'caller_supplied_frozen_host_config',
      trustedValidatorKeyCustody: trustedValidatorConfig.keyCustody,
      worldRuntimeLifecycleExecuted: false,
    },
    emergencyStop: {
      ...emergencyStop,
      visibleBinding: visibleStopBinding,
    },
    generatedAt: new Date().toISOString(),
    manifests: {
      bundleId: manifests.bundle.bundleId,
      capturedResponses: manifests.capturedResponses,
      challengeIds: manifests.challengeManifest.challenges.map(
        (entry) => entry.challengeId,
      ),
      challengeManifestHash: manifests.challengeManifestHash,
      frozenBeforeFirstTurn: manifests.bundle.frozenBeforeFirstTurn,
      metricSpecHash: manifests.metricSpecHash,
      metricSpecId: manifests.metricSpec.metricSpecId,
      rawResponsesIncluded: false,
      sourceHash: manifests.sourceHash,
    },
    persistence: {
      atomicActionReceiptsCommitted: atomicCommit.state.ledger.entries.length,
      authorizationAttemptsConsumed:
        atomicCommit.state.consumedAuthorizations.length,
      deniedAttemptsConsumed:
        atomicCommit.state.ledger.entries.filter((entry) => !entry.allowed).length,
      eventPublication: 'durable_outbox_after_atomic_commit',
      faultBeforeRename: 'injected_process_level_old_state_recovered',
      faultAfterRename: 'injected_process_level_complete_new_state_recovered',
      finalStateHash: atomicCommit.state.stateHash,
      lastAuthorizationSequence: atomicCommit.state.lastAuthorizationSequence,
      malformedHashAttemptBurnedAndDenied:
        malformedHashAttempt.authorizationBurned,
      mismatchedTargetAttemptBurnedAndDenied:
        mismatchedTargetAttempt.authorizationBurned,
      receiptRoot: atomicCommit.state.ledger.receiptRoot,
      replayAfterRestartRejected: replayRejected,
      restartRecovered: separateProcessRecovery,
      sameProcessRereadRecovered: restartRecovered,
      separateProcessRereadRecovered: separateProcessRecovery,
      stateReceipt: structuredClone(atomicCommit.state),
      stateSchema: atomicCommit.state.schema,
      storePathIncluded: false,
    },
    replay: {
      comparedFields: [
        'ordered_action_decisions',
        'ordered_post_state_hashes',
        'action_root',
        'final_public_state_hash',
        'source_run_commitment',
        'terminal_commitment',
      ],
      freshExecutionCount: 1,
      match: replayMatch,
      projectionHash: canonicalDigest(firstProjection),
      providerCalls: 0,
    },
    runtime: {
      actionDecisions: executionSummary.actionDecisions,
      boundedHsplusSubsetActionsExecuted: 2,
      capturedResponsesConsumed: 2,
      counts: executionSummary.counts,
      executionReceipt: structuredClone(first.run.execution),
      finalPublicState: executionSummary.finalPublicState,
      observationSubjects: executionSummary.observationSubjects,
      observerProof: structuredClone(first.run.observerProof),
      observerProjection,
      providerCalls: 0,
      sourceBundleHash: executionSummary.sourceBundleHash,
      sourceClaimBoundary: structuredClone(first.run.claimBoundary),
      sourceRunCommitment: executionSummary.sourceRunCommitment,
      sourceRunReceipt: structuredClone(first.run.sourceRunReceipt),
      sourceRunSchema: first.run.sourceRunReceipt.schema,
      terminalCommitment: executionSummary.terminalCommitment,
    },
    schema: PHASE0B_RECEIPT_SCHEMA,
    sources: {
      behavior: PHASE0B_SOURCE_PATHS.behavior,
      manifests: PHASE0B_SOURCE_PATHS.manifests,
      plan: PHASE0B_SOURCE_PATHS.plan,
      stopPlan: PHASE0B_SOURCE_PATHS.stopPlan,
      visibleWorld: PHASE0B_SOURCE_PATHS.visibleWorld,
      world: PHASE0B_SOURCE_PATHS.world,
    },
    status: 'pass',
    validator: {
      config: structuredClone(validatorReceipt.config),
      configHash: validatorReceipt.configHash,
      manifestHash: validatorReceipt.manifestHash,
      registryReceiptId: validatorReceipt.config.registryReceiptId,
      signatureVerified: validatorVerification.valid,
      signedPayloadHash: validatorReceipt.signedPayloadHash,
      trustAnchorOrigin: 'caller_supplied_host_config',
      validatorReceipt: structuredClone(validatorReceipt),
    },
  };
  const result = {
    ...unsigned,
    receipt: {
      providerCallsMadeByTracer: 0,
      rawModelPromptsIncluded: false,
      rawModelResponsesIncluded: false,
      receiptHash: canonicalDigest(unsigned),
    },
  };
  if (!verifyPhase0BReceiptHash(result)) {
    throw new Error('Phase 0B outer receipt self-verification failed');
  }
  const fullVerification = await verifyPhase0BReceipt(result, {
    root,
    trustedValidatorConfig,
  });
  if (!fullVerification.valid) {
    throw new Error(
      `Phase 0B full receipt verification failed: `
      + `${fullVerification.errors.join('; ')}`,
    );
  }
  return result;
}
