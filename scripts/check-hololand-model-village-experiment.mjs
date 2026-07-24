#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCHEMA_VERSION = 'hololand.model-village-experiment.v0.1.0';
const WORLD_SOURCE = 'source/layers/vr/frontier/model-village/model-village.holo';
const POLICY_SOURCE = 'source/domains/agents/model-village-experiment.hsplus';
const KERNEL_SOURCE = 'source/proofs/model-village-trial-kernel.hs';
const SPEC_SOURCE = 'docs/specs/HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md';
const PACKAGE_JSON = 'package.json';
const DEFAULT_OUTPUT = path.join('.tmp', 'hololand', 'model-village', 'receipt.json');
const CHECKER_PATH = fileURLToPath(import.meta.url);
const EXPECTED_WORLD_OBJECT_IDS = [
  'ResidentSeat01',
  'ResidentSeat02',
  'ResidentSeat03',
  'ResidentSeat04',
  'ResidentSeat05',
  'ResidentSeat06',
  'VillageCommons',
  'PublicStateBoard',
  'ReceiptLedger',
  'ObserverDeck',
  'IsolationBoundary',
  'EmergencyStop',
];

const FORMAT_BY_EXTENSION = {
  '.holo': '.holo',
  '.hsplus': '.hsplus',
  '.hs': '.hs',
};

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    root: process.cwd(),
    output: DEFAULT_OUTPUT,
    durationMs: 200,
    tickRate: 10,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') args.root = argv[++index];
    else if (arg === '--output') args.output = argv[++index];
    else if (arg === '--duration-ms') args.durationMs = Number(argv[++index]);
    else if (arg === '--tick-rate') args.tickRate = Number(argv[++index]);
    else if (arg === '--json') args.json = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`HoloLand Model Village experiment check

Usage:
  node scripts/check-hololand-model-village-experiment.mjs [options]

Options:
  --root <path>         HoloLand repository root
  --output <path>       Receipt output path
  --duration-ms <n>     Native headless materialization duration
  --tick-rate <n>       Native headless tick rate
  --json                Print the bounded receipt as JSON
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(args.durationMs) || args.durationMs < 1) {
    throw new Error('--duration-ms must be a positive number');
  }
  if (!Number.isFinite(args.tickRate) || args.tickRate < 1) {
    throw new Error('--tick-rate must be a positive number');
  }

  return args;
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function repoPath(root, relativePath) {
  return path.resolve(root, relativePath);
}

function read(root, relativePath) {
  return readFileSync(repoPath(root, relativePath), 'utf8');
}

function sha256(value) {
  return createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function normalizeSource(value) {
  return String(value).replace(/\r\n?/g, '\n');
}

function stripLineComments(value) {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const next = value[index + 1];

    if (inString) {
      output += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      output += character;
      continue;
    }

    if (character === '/' && next === '/') {
      while (index < value.length && value[index] !== '\n') index += 1;
      if (index < value.length) output += '\n';
      continue;
    }

    output += character;
  }

  return output;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function includesAll(text, snippets) {
  return snippets.every((snippet) => text.includes(snippet));
}

function uniqueMatches(text, pattern, group = 1) {
  return [...new Set(
    [...text.matchAll(pattern)]
      .map((match) => match[group])
      .filter(Boolean),
  )];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractStringArray(text, key) {
  const pattern = new RegExp(`${escapeRegExp(key)}\\s*:\\s*\\[([\\s\\S]*?)\\]`);
  const match = text.match(pattern);
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

function extractNumber(text, key) {
  const match = text.match(new RegExp(`${escapeRegExp(key)}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`));
  return match ? Number(match[1]) : null;
}

function extractBoolean(text, key) {
  const match = text.match(new RegExp(`${escapeRegExp(key)}\\s*:\\s*(true|false)`));
  return match ? match[1] === 'true' : null;
}

function extractString(text, key) {
  const match = text.match(new RegExp(`${escapeRegExp(key)}\\s*:\\s*"([^"]+)"`));
  return match ? match[1] : null;
}

function commandResult(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    windowsHide: true,
    timeout: options.timeout ?? 120000,
    env: process.env,
  });
}

function tail(value, count = 8) {
  return String(value || '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-count);
}

function findHoloScriptCli(root) {
  const candidates = [
    process.env.HOLOSCRIPT_ROOT,
    path.resolve(root, '..', 'HoloScript'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const cli = path.join(candidate, 'packages', 'cli', 'dist', 'cli.js');
    if (existsSync(cli)) {
      return {
        root: candidate,
        cli,
        cliSha256: sha256(readFileSync(cli)),
        version: (() => {
          try {
            return JSON.parse(readFileSync(path.join(candidate, 'package.json'), 'utf8')).version ?? null;
          } catch {
            return null;
          }
        })(),
      };
    }
  }

  return null;
}

export function validateHeadlessReceipt(receipt) {
  const errors = [];
  if (receipt?.schema !== 'holoscript-headless-run-receipt-v1') {
    errors.push('unexpected headless receipt schema');
  }
  if (normalizePath(receipt?.input || '') !== WORLD_SOURCE) {
    errors.push('headless receipt input does not identify the Model Village world');
  }
  if (receipt?.scene?.schema !== 'holoscript-headless-scene-receipt-v1') {
    errors.push('missing native scene receipt');
  }
  if (receipt?.posePhysics?.schema !== 'holoscript-headless-pose-physics-receipt-v1') {
    errors.push('missing native pose/physics receipt');
  }

  const sceneObjects = Array.isArray(receipt?.scene?.objects) ? receipt.scene.objects : [];
  const poseBodies = Array.isArray(receipt?.posePhysics?.bodies) ? receipt.posePhysics.bodies : [];
  const sceneIds = sceneObjects.map((object) => object?.id).filter(Boolean);
  const poseIds = poseBodies.map((body) => body?.id).filter(Boolean);
  const expectedIds = [...EXPECTED_WORLD_OBJECT_IDS].sort();
  const sortedSceneIds = [...sceneIds].sort();
  const sortedPoseIds = [...poseIds].sort();

  if (sceneObjects.length !== EXPECTED_WORLD_OBJECT_IDS.length) {
    errors.push(`scene array must contain exactly ${EXPECTED_WORLD_OBJECT_IDS.length} objects`);
  }
  if (poseBodies.length !== EXPECTED_WORLD_OBJECT_IDS.length) {
    errors.push(`pose/physics array must contain exactly ${EXPECTED_WORLD_OBJECT_IDS.length} bodies`);
  }
  if (new Set(sceneIds).size !== sceneIds.length) {
    errors.push('scene object IDs must be unique');
  }
  if (new Set(poseIds).size !== poseIds.length) {
    errors.push('pose/physics body IDs must be unique');
  }
  if (JSON.stringify(sortedSceneIds) !== JSON.stringify(expectedIds)) {
    errors.push('scene object IDs must exactly match the Model Village contract');
  }
  if (JSON.stringify(sortedPoseIds) !== JSON.stringify(expectedIds)) {
    errors.push('pose/physics body IDs must exactly match the Model Village contract');
  }
  if (JSON.stringify(sortedSceneIds) !== JSON.stringify(sortedPoseIds)) {
    errors.push('scene and pose/physics ID sets differ');
  }
  if (receipt?.scene?.objectCount !== sceneObjects.length) {
    errors.push(`expected ${EXPECTED_WORLD_OBJECT_IDS.length} scene objects`);
  }
  if (receipt?.posePhysics?.objectCount !== poseBodies.length) {
    errors.push(`expected ${EXPECTED_WORLD_OBJECT_IDS.length} pose/physics bodies`);
  }
  for (const objectId of EXPECTED_WORLD_OBJECT_IDS) {
    if (!sceneIds.includes(objectId)) errors.push(`scene missing ${objectId}`);
    if (!poseIds.includes(objectId)) errors.push(`pose/physics missing ${objectId}`);
  }

  return {
    passed: errors.length === 0,
    errors,
    sceneIds,
    poseIds,
  };
}

function parseSource(root, cli, relativePath) {
  const extension = path.extname(relativePath).toLowerCase();
  const result = commandResult(
    process.execPath,
    [cli, 'parse', normalizePath(relativePath)],
    { cwd: root },
  );

  return {
    source: relativePath,
    format: FORMAT_BY_EXTENSION[extension] || extension,
    passed: result.status === 0,
    kind: 'holoscript_cli_parse',
    status: result.status,
    stdoutTail: result.status === 0 ? [] : tail(result.stdout, 4),
    stderrTail: tail(result.stderr || result.error?.message, 8),
  };
}

function parseJsonOutput(value) {
  const text = String(value || '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error('HoloScript headless output did not contain a JSON object');
  }
  return JSON.parse(text.slice(start, end + 1));
}

function runHeadless(root, cli, options) {
  const result = commandResult(
    process.execPath,
    [
      cli,
      'headless',
      normalizePath(WORLD_SOURCE),
      '--duration',
      String(options.durationMs),
      '--tick-rate',
      String(options.tickRate),
      '--json',
    ],
    { cwd: root },
  );

  if (result.status !== 0) {
    return {
      passed: false,
      status: result.status,
      stdoutTail: tail(result.stdout),
      stderrTail: tail(result.stderr || result.error?.message),
      receipt: null,
    };
  }

  try {
    const receipt = parseJsonOutput(result.stdout);
    const validation = validateHeadlessReceipt(receipt);
    return {
      passed: validation.passed,
      status: result.status,
      stdoutTail: [],
      stderrTail: validation.errors,
      receipt,
      validation,
    };
  } catch (error) {
    return {
      passed: false,
      status: result.status,
      stdoutTail: tail(result.stdout),
      stderrTail: [error.message],
      receipt: null,
    };
  }
}

function canonicalHeadlessProjection(run) {
  if (!run?.passed || !run.receipt) return null;
  return canonicalize({
    scene: run.receipt.scene,
    posePhysics: run.receipt.posePhysics,
  });
}

function buildSemanticIr(texts) {
  return {
    world: {
      source: WORLD_SOURCE,
      composition: uniqueMatches(texts.worldCode, /composition\s+"([^"]+)"/g)[0] || '',
      templates: uniqueMatches(texts.worldCode, /template\s+"([^"]+)"/g),
      objects: uniqueMatches(texts.worldCode, /object\s+"([^"]+)"/g),
      groups: uniqueMatches(texts.worldCode, /spatial_group\s+"([^"]+)"/g),
      actions: uniqueMatches(texts.worldCode, /^\s*action\s+([A-Za-z0-9_]+)/gm),
      emits: uniqueMatches(texts.worldCode, /emit\("([^"]+)"/g),
      sourceHash: sha256(normalizeSource(texts.world)),
    },
    policy: {
      source: POLICY_SOURCE,
      composition: uniqueMatches(texts.policyCode, /composition\s+"([^"]+)"/g)[0] || '',
      templates: uniqueMatches(texts.policyCode, /template\s+"([^"]+)"/g),
      policies: uniqueMatches(texts.policyCode, /policy\s+"([^"]+)"/g),
      actions: uniqueMatches(texts.policyCode, /^\s*action\s+([A-Za-z0-9_]+)/gm),
      emits: uniqueMatches(texts.policyCode, /emit\("([^"]+)"/g),
      sourceHash: sha256(normalizeSource(texts.policy)),
    },
    kernel: {
      source: KERNEL_SOURCE,
      objects: uniqueMatches(texts.kernelCode, /object\s+"([^"]+)"/g),
      sourceHash: sha256(normalizeSource(texts.kernel)),
    },
    spec: {
      source: SPEC_SOURCE,
      sourceHash: sha256(normalizeSource(texts.spec)),
    },
  };
}

function buildExperimentDesign(kernel) {
  const modelAdapters = extractStringArray(kernel, 'modelAdapters');
  const conditions = extractStringArray(kernel, 'conditions');
  const seedBlocks = extractStringArray(kernel, 'seedBlocks');
  const numericSeedBlocks = seedBlocks.length || (() => {
    const match = kernel.match(/seedBlocks\s*:\s*\[([^\]]+)\]/);
    return match ? (match[1].match(/\d+/g) || []).length : 0;
  })();

  return {
    models: modelAdapters.length,
    modelAdapters,
    residents: extractNumber(kernel, 'residentsPerVillage'),
    conditions,
    seedBlocks: numericSeedBlocks,
    plannedVillageRuns: extractNumber(kernel, 'plannedVillageRuns'),
    unitOfAnalysis: extractString(kernel, 'unitOfAnalysis'),
    primaryOutcome: extractString(kernel, 'primaryOutcome'),
    primaryContrast: extractString(kernel, 'primaryContrast'),
    estimandScope: extractString(kernel, 'estimandScope'),
    blockContrast: extractString(kernel, 'blockContrast'),
    studyClass: extractString(kernel, 'claimClass'),
  };
}

function buildAssertions({
  texts,
  semanticIr,
  parsers,
  headlessRuns,
  headlessReplay,
  experimentDesign,
}) {
  const residentSeats = Array.from(
    { length: 6 },
    (_, index) => `ResidentSeat${String(index + 1).padStart(2, '0')}`,
  );
  const requiredPolicyTemplates = [
    'ModelVillageStudyDesign',
    'ModelResidentSeat',
    'LockedModelAdapterManifest',
    'EqualAffordanceEnvelope',
    'RunManifestReceipt',
    'RunManifestValidationReceipt',
    'ObservationEnvelope',
    'ModelTurnReceipt',
    'ModelVillageActionReceipt',
    'RunSummaryReceipt',
    'SafetyCheckReceipt',
    'ActionDecisionReceipt',
  ];
  const requiredPolicies = [
    'EqualAffordanceRequired',
    'LockedModelRouteRequired',
    'WorldAndModelDeterminismSeparated',
    'ExperimentIsolationRequired',
    'ReceiptedMutationRequired',
    'BlindedAnalysisRequired',
    'PilotClaimBoundary',
    'HumanObserverConsentBoundary',
    'OutcomeDefinitionsFrozenBeforeFirstTurn',
    'NoSilentRunReplacement',
  ];
  const requiredKernelSteps = [
    'ValidateSourcesStep',
    'FreezeRunManifestStep',
    'CloneWorldStep',
    'AssignResidentSeatsStep',
    'BuildTurnScheduleStep',
    'ObservePublicWorldStep',
    'InvokeLockedModelAdapterStep',
    'ValidateActionProposalStep',
    'ApplyReceiptedMutationStep',
    'ReplayCapturedResponsesStep',
    'SummarizeVillageRunStep',
    'SealClaimBoundaryStep',
    'ModelVillageMixedAssignmentMatrix',
    'ModelVillageConditionOrder',
    'ModelVillageChallengeManifestSchema',
    'ModelVillageAnalysisSet',
    'ModelVillageEmergencyStopBinding',
    'ModelVillagePhase1TrustBindings',
  ];

  return {
    threeCanonicalSourcesExist: [WORLD_SOURCE, POLICY_SOURCE, KERNEL_SOURCE, SPEC_SOURCE]
      .every((source) => existsSync(repoPath(texts.root, source))),
    threeFormatsParse: parsers.length === 3 && parsers.every((parser) => parser.passed),
    nativeHeadlessRunsPass: headlessRuns.length === 2 && headlessRuns.every((run) => run.passed),
    headlessReceiptsIdentifyExactModelVillage: headlessRuns.every((run) => (
      run.validation?.passed
      && run.validation.sceneIds.length === EXPECTED_WORLD_OBJECT_IDS.length
      && run.validation.poseIds.length === EXPECTED_WORLD_OBJECT_IDS.length
      && new Set(run.validation.sceneIds).size === EXPECTED_WORLD_OBJECT_IDS.length
      && new Set(run.validation.poseIds).size === EXPECTED_WORLD_OBJECT_IDS.length
    )),
    canonicalSceneReplayMatches: headlessReplay.canonicalMatch,
    worldDefinesSixBlindedResidentSeats: residentSeats
      .every((name) => semanticIr.world.objects.includes(name))
      && includesAll(texts.worldCode, [
        'residentCapacity: 6',
        'modelIdentityVisibleToResidents: false',
        'privatePeerMemoryVisible: false',
      ]),
    worldDefinesVisibleExperimentControls: [
      'VillageCommons',
      'PublicStateBoard',
      'ReceiptLedger',
      'ObserverDeck',
      'IsolationBoundary',
      'EmergencyStop',
    ].every((name) => semanticIr.world.objects.includes(name)),
    worldDeclaresBoundedFreezeAndReceiptGap: includesAll(texts.worldCode, [
      'mutationWithoutReceipt: "deny"',
      'failClosedBehavior: "deny_mutation_and_request_freeze_when_runtime_gate_is_available"',
      'emit("receipt_written"',
      'receipt_status: "event_only_not_persisted_or_hash_chained"',
      'on_interact: "request_experiment_freeze"',
      'state.emergencyStopRequestState = "triggered"',
      'targetPolicyEntrypoint: "ModelVillageExperimentRuntime.freeze_run"',
      'bindingStatus: "blocked_until_cross_composition_action_binding"',
      'cross_composition_binding_status: "not_observed"',
      'run_manifest_receipt_emitted: false',
    ]),
    worldStartupDoesNotForgeRunManifestReceipt: includesAll(texts.worldCode, [
      'emit("model_village_world_ready"',
      'run_manifest_receipt_emitted: false',
    ]) && !texts.worldCode.includes('emit_receipt_written_event("run_manifest"'),
    policyDefinesStudyAndReceiptEnvelopes: requiredPolicyTemplates
      .every((name) => semanticIr.policy.templates.includes(name)),
    policyDefinesEqualAffordanceSafetyAndClaims: requiredPolicies
      .every((name) => semanticIr.policy.policies.includes(name)),
    policySeparatesWorldAndModelDeterminism: includesAll(texts.policyCode, [
      'samplingSeedRequestedFieldRequired: true',
      'samplingSeedAcceptedFieldRequired: true',
      'temperatureZeroIsNotDeterminismProof: true',
      'capturedResponseReplayRequired: true',
    ]),
    policyLocksRoutesAndHiddenContext: includesAll(texts.policyCode, [
      'forceProviderRequired: true',
      'fallbackAllowed: false',
      'promptEnhancementAllowed: false',
      'hiddenContextAllowed: false',
    ]),
    policyDeniesExternalCapabilities: includesAll(texts.policyCode, [
      '"filesystem"',
      '"browser"',
      '"payments"',
      '"wallets"',
      '"external_messages"',
      '"physical_actuation"',
      'crossRunMemoryAllowed: false',
      'crossVillageCommunicationAllowed: false',
    ]),
    policyReceiptActionsUseDeclaredSnakeCaseFields: includesAll(texts.policyCode, [
      'manifest.run_id',
      'manifest.seed_block',
      'seat.resident_id',
      'seat.adapter_alias',
      'turnReceipt.receipt_id',
      'turnReceipt.response_hash',
      'actionReceipt.receipt_id',
      'actionReceipt.rollback_reference',
      'actionReceipt.prior_receipt_hash',
      'summaryReceipt.receipt_chain_root',
    ]),
    policyRequiresTrustedManifestValidationReceipt: includesAll(texts.policyCode, [
      'template "RunManifestValidationReceipt"',
      'action register_run(manifest, validationReceipt)',
      'trustedValidatorRuntimeBindingStatus: "target_not_observed_phase_1_blocker"',
      'ModelVillageExperimentRuntime.phase == "idle"',
      'ModelVillageExperimentRuntime.trustedManifestValidatorConfigured',
      'validationReceipt.run_id == manifest.run_id',
      'validationReceipt.manifest_hash == manifest.manifest_hash',
      'validationReceipt.validator_authority_id == ModelVillageExperimentRuntime.trustedManifestValidatorAuthorityId',
      'validationReceipt.validator_source_hash == ModelVillageExperimentRuntime.trustedManifestValidatorSourceHash',
      'validationReceipt.validator_registry_receipt_id == ModelVillageExperimentRuntime.trustedManifestValidatorRegistryReceiptId',
      'validationReceipt.validation_sequence > ModelVillageExperimentRuntime.lastManifestValidationSequence',
      'validationReceipt.signature_verified',
      'ModelVillageExperimentRuntime.manifestValidationReceiptId = validationReceipt.receipt_id',
    ]),
    policyRequiresSixUniqueStagedSeatsAndClosedLifecycle: includesAll(texts.policyCode, [
      'ModelVillageExperimentRuntime.stagedResidentIds.includes(seat.resident_id)',
      'ModelVillageExperimentRuntime.stagedSeatIds.includes(seat.seat_id)',
      'ModelVillageExperimentRuntime.stagedResidentCount < ModelVillageExperimentRuntime.residentCount',
      'ModelVillageExperimentRuntime.stagedResidentCount == ModelVillageExperimentRuntime.residentCount',
      'ModelVillageExperimentRuntime.phase == "resident_staged"',
      'ModelVillageExperimentRuntime.residentStagingOpen = false',
      'ModelVillageExperimentRuntime.manifestValidated = false',
    ]),
    policyMutationAuthorizationIsCorrelatedAndSingleUse: includesAll(texts.policyCode, [
      'ModelVillageExperimentRuntime.manifestValidated',
      'ModelVillageExperimentRuntime.emergencyStopState == "armed"',
      'ModelVillageExperimentRuntime.phase == "running"',
      'ModelVillageExperimentRuntime.safetyDecision == "allow"',
      'safetyReceipt.proposal_hash == actionDecisionReceipt.proposal_hash',
      'safetyReceipt.turn_opportunity_id == actionDecisionReceipt.turn_opportunity_id',
      'safetyReceipt.authorization_nonce == actionDecisionReceipt.authorization_nonce',
      'safetyReceipt.authorization_sequence == ModelVillageExperimentRuntime.lastConsumedAuthorizationSequence + 1',
      'actionReceipt.run_id == ModelVillageExperimentRuntime.pendingRunId',
      'actionReceipt.tick == ModelVillageExperimentRuntime.pendingTick',
      'actionReceipt.resident_id == ModelVillageExperimentRuntime.pendingResidentId',
      'actionReceipt.proposal_hash == ModelVillageExperimentRuntime.pendingProposalHash',
      'actionReceipt.turn_opportunity_id == ModelVillageExperimentRuntime.pendingTurnOpportunityId',
      'actionReceipt.authorization_nonce == ModelVillageExperimentRuntime.pendingAuthorizationNonce',
      'actionReceipt.authorization_sequence == ModelVillageExperimentRuntime.pendingAuthorizationSequence',
      'actionReceipt.safety_receipt_id == ModelVillageExperimentRuntime.pendingSafetyReceiptId',
      'actionReceipt.action_decision_receipt_id == ModelVillageExperimentRuntime.pendingActionDecisionReceiptId',
      'ModelVillageExperimentRuntime.lastConsumedAuthorizationSequence = ModelVillageExperimentRuntime.pendingAuthorizationSequence',
      'emit("model_village_action_authorization_consumed"',
      'authorization_scope: "this_entrypoint_only"',
      'mutation_transaction_binding_status: "target_not_observed"',
      'ModelVillageExperimentRuntime.worldMutationAllowed = false',
      'action freeze_run(reason)',
    ]),
    policyPreservesFallbackAsContamination: includesAll(texts.policyCode, [
      'if (turnReceipt.fallback_used)',
      'ModelVillageExperimentRuntime.runContaminated = true',
      'ModelVillageExperimentRuntime.contaminationReason = "fallback_used"',
      'preserved_for_disposition: true',
    ]),
    kernelDefinesMatchedVillageDesign: experimentDesign.models === 3
      && experimentDesign.residents === 6
      && experimentDesign.conditions.length === 4
      && experimentDesign.seedBlocks === 3
      && experimentDesign.plannedVillageRuns === 12
      && experimentDesign.unitOfAnalysis === 'village_run'
      && experimentDesign.primaryOutcome === 'cooperative_event_completion_rate'
      && experimentDesign.estimandScope === 'exact_locked_adapter_triplet_persona_protocol_and_challenge_distribution'
      && experimentDesign.blockContrast === 'D_s_equals_Y_mixed_s_minus_mean_Y_a_Y_b_Y_c_within_seed_s'
      && experimentDesign.studyClass === 'mechanism_pilot_not_confirmatory',
    kernelDefinesCompleteTrialPipeline: requiredKernelSteps
      .every((name) => semanticIr.kernel.objects.includes(name)),
    kernelKeepsBehaviorInHoloScript: includesAll(texts.kernelCode, [
      'sourceIsCanonical: true',
      'bridgeMayValidateAndReceipt: true',
      'bridgeMayOwnVillageBehavior: false',
    ]),
    kernelReportsRuntimeGapsHonestly: includesAll(texts.kernelCode, [
      'runtimeStatus: "declarative_pipeline_not_yet_executed_by_headless_runtime"',
      'currentModelTurnExecutionTrace: "unavailable"',
      'currentAgentActionExecutionTrace: "unavailable"',
      'scientificOutcomeClaimed: false',
      '"live_model_turns"',
      '"action_entrypoint_execution"',
      '"trusted_manifest_validator_binding"',
      '"receipted_mutation_transaction"',
      '"cross_composition_emergency_stop_binding"',
      '"state_snapshot_replay"',
    ]),
    specSeparatesObservedTargetGapAndForbiddenClaims: includesAll(texts.spec, [
      '## Claim register',
      '| Observed |',
      '| Target |',
      '| Gap |',
      '| Forbidden claim |',
      'No model-turn or agent-action execution count is available',
    ]),
    packageExposesChecker: texts.packageJson.includes(
      '"check:hololand-model-village": "node scripts/check-hololand-model-village-experiment.mjs"',
    ),
  };
}

export function resolveReceiptOutput(root, output) {
  const resolved = path.isAbsolute(output) ? output : repoPath(root, output);
  const allowedRoot = repoPath(root, '.tmp');
  const relative = path.relative(allowedRoot, resolved);
  const withinAllowedRoot = relative !== ''
    && !relative.startsWith(`..${path.sep}`)
    && relative !== '..'
    && !path.isAbsolute(relative);
  if (!withinAllowedRoot || path.extname(resolved).toLowerCase() !== '.json') {
    throw new Error(
      `Receipt output must be a .json file inside ${allowedRoot}`,
    );
  }
  return resolved;
}

function writeReceipt(root, output, receipt) {
  const resolved = resolveReceiptOutput(root, output);
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return resolved;
}

function assertionFailures(assertions) {
  return Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
}

function gitProvenance(root) {
  const commit = commandResult('git', ['rev-parse', 'HEAD'], { cwd: root });
  const status = commandResult(
    'git',
    [
      'status',
      '--porcelain',
      '--',
      WORLD_SOURCE,
      POLICY_SOURCE,
      KERNEL_SOURCE,
      SPEC_SOURCE,
      'scripts/check-hololand-model-village-experiment.mjs',
      'scripts/__tests__/hololand-model-village-experiment.test.mjs',
      PACKAGE_JSON,
    ],
    { cwd: root },
  );
  const scopedStatus = String(status.stdout || '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => normalizePath(line));

  return {
    commit: commit.status === 0 ? String(commit.stdout).trim() : null,
    scopedDirty: scopedStatus.length > 0,
    scopedStatus,
  };
}

export function runModelVillageCheck(options = {}) {
  const root = path.resolve(options.root ?? process.cwd());
  const output = options.output ?? DEFAULT_OUTPUT;
  const durationMs = options.durationMs ?? 200;
  const tickRate = options.tickRate ?? 10;
  const holoScript = findHoloScriptCli(root);

  if (!holoScript) {
    throw new Error(
      'Local HoloScript CLI not found. Set HOLOSCRIPT_ROOT or place HoloScript beside HoloLand.',
    );
  }

  const texts = {
    root,
    world: read(root, WORLD_SOURCE),
    policy: read(root, POLICY_SOURCE),
    kernel: read(root, KERNEL_SOURCE),
    spec: read(root, SPEC_SOURCE),
    packageJson: read(root, PACKAGE_JSON),
  };
  texts.worldCode = stripLineComments(texts.world);
  texts.policyCode = stripLineComments(texts.policy);
  texts.kernelCode = stripLineComments(texts.kernel);
  const parsers = [WORLD_SOURCE, POLICY_SOURCE, KERNEL_SOURCE]
    .map((source) => parseSource(root, holoScript.cli, source));
  const headlessRuns = [
    runHeadless(root, holoScript.cli, { durationMs, tickRate }),
    runHeadless(root, holoScript.cli, { durationMs, tickRate }),
  ];
  const canonicalRuns = headlessRuns.map(canonicalHeadlessProjection);
  const canonicalDigests = canonicalRuns.map((projection) => (
    projection ? sha256(canonicalJson(projection)) : null
  ));
  const firstHeadlessReceipt = headlessRuns[0]?.receipt;
  const rawHeadlessReceiptHashes = headlessRuns.map((run) => (
    run.receipt ? sha256(canonicalJson(run.receipt)) : null
  ));
  const headlessReplay = {
    runtimeSchema: firstHeadlessReceipt?.schema ?? null,
    runs: 2,
    canonicalMatch: Boolean(
      canonicalDigests[0]
      && canonicalDigests[1]
      && canonicalDigests[0] === canonicalDigests[1],
    ),
    canonicalDigests,
    canonicalProjection: ['scene', 'posePhysics'],
    fieldsOutsideCanonicalProjection: ['stats'],
    rawHeadlessReceiptHashes,
    runStats: headlessRuns.map((run) => run.receipt?.stats ?? null),
    objectCount: firstHeadlessReceipt?.scene?.objectCount ?? 0,
    objectIds: (firstHeadlessReceipt?.scene?.objects ?? []).map((object) => object.id),
    baselineEventCount: firstHeadlessReceipt?.stats?.eventCount ?? 0,
    eventCountUsedAsExperimentEvidence: false,
    orderedEventPayloadTraceAvailable: false,
  };
  const semanticIr = buildSemanticIr(texts);
  const experimentDesign = buildExperimentDesign(texts.kernelCode);
  const assertions = buildAssertions({
    texts,
    semanticIr,
    parsers,
    headlessRuns,
    headlessReplay,
    experimentDesign,
  });
  const failures = assertionFailures(assertions);
  const capabilityStatus = {
    observed: {
      sourceParsing: parsers.every((parser) => parser.passed),
      worldMaterialization: headlessRuns.every((run) => run.passed),
      canonicalSceneReplay: headlessReplay.canonicalMatch,
    },
    targetObserved: {
      liveModelAdapterInvocation: false,
      receiptedActionExecution: false,
      perStepStateSnapshots: false,
      capturedResponseActionReplay: false,
      deterministicModelSampling: false,
      scientificOutcomeEvidence: false,
    },
  };
  const runtimeEvidence = {
    modelTurnsExecuted: null,
    agentActionsExecuted: null,
    executionCountsAvailable: false,
    scientificOutcomeClaimed: extractBoolean(texts.kernelCode, 'scientificOutcomeClaimed') ?? false,
    worldObjectsMaterialized: headlessReplay.objectCount,
    baselineEventsCountedWithoutPayloadTrace: headlessReplay.baselineEventCount,
    providerCallsMadeByChecker: 0,
  };
  const sourceContract = {
    threeFormat: parsers.map((parser) => parser.format).join(',') === '.holo,.hsplus,.hs',
    formats: {
      '.holo': 'spatial village and visible experiment controls',
      '.hsplus': 'resident, adapter, policy, safety, and receipt contracts',
      '.hs': 'trial pipeline, matched conditions, metrics, and closure gates',
    },
    sourceIsCanonical: true,
    checkerOwnsBehavior: false,
  };
  const toolchain = {
    holoScriptVersion: holoScript.version,
    holoScriptCliSha256: holoScript.cliSha256,
    checkerSha256: sha256(normalizeSource(readFileSync(CHECKER_PATH, 'utf8'))),
    nodeVersion: process.version,
    durationMs,
    tickRate,
  };
  const git = gitProvenance(root);
  const receiptInput = {
    schemaVersion: SCHEMA_VERSION,
    sourceHashes: {
      world: semanticIr.world.sourceHash,
      policy: semanticIr.policy.sourceHash,
      kernel: semanticIr.kernel.sourceHash,
      spec: semanticIr.spec.sourceHash,
    },
    parsers: parsers.map(({ stdoutTail: _stdout, stderrTail: _stderr, ...parser }) => parser),
    headlessReplay: {
      canonicalMatch: headlessReplay.canonicalMatch,
      canonicalDigests: headlessReplay.canonicalDigests,
      rawHeadlessReceiptHashes: headlessReplay.rawHeadlessReceiptHashes,
      runStats: headlessReplay.runStats,
      objectCount: headlessReplay.objectCount,
      objectIds: headlessReplay.objectIds,
    },
    toolchain,
    git,
    assertions,
    capabilityStatus,
    runtimeEvidence,
    experimentDesign,
  };
  const receipt = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? 'pass' : 'fail',
    studyPhase: 'source_contract_pilot',
    sources: {
      world: WORLD_SOURCE,
      policy: POLICY_SOURCE,
      kernel: KERNEL_SOURCE,
      spec: SPEC_SOURCE,
    },
    sourceContract,
    parsers,
    semanticIr,
    assertions,
    headlessReplay,
    runtimeEvidence,
    capabilityStatus,
    experimentDesign,
    toolchain,
    git,
    claimBoundary: {
      observed: [
        'three source formats parse',
        'native headless world materialization',
        'canonical scene and pose replay',
      ],
      targetNotObserved: [
        'live model turns',
        'receipted action entrypoint execution',
        'per-step state replay',
        'scientific outcomes',
      ],
      pilotIsConfirmatory: false,
    },
    receipt: {
      receiptHash: sha256(canonicalJson(receiptInput)),
      rawSourceIncluded: false,
      rawModelPromptsIncluded: false,
      rawModelResponsesIncluded: false,
      providerCallsMadeByChecker: 0,
      output: normalizePath(output),
    },
  };

  const resolvedOutput = writeReceipt(root, output, receipt);
  if (failures.length > 0) {
    throw new Error(
      `Model Village source-contract check failed: ${failures.join(', ')}. Receipt: ${resolvedOutput}`,
    );
  }

  return {
    receipt,
    output: resolvedOutput,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs();
    const { receipt, output } = runModelVillageCheck(args);
    if (args.json) {
      console.log(JSON.stringify(receipt, null, 2));
    } else {
      console.log('[hololand-model-village] ok');
      console.log(`receipt: ${output}`);
      console.log(`world objects: ${receipt.headlessReplay.objectCount}`);
      console.log(`canonical replay: ${receipt.headlessReplay.canonicalMatch}`);
      console.log('model-turn execution trace: unavailable');
      console.log('agent-action execution trace: unavailable');
    }
  } catch (error) {
    console.error('[hololand-model-village] failed');
    console.error(error.message || error);
    process.exit(1);
  }
}
