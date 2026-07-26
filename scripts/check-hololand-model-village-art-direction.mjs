#!/usr/bin/env node
/* global console, process */

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCHEMA_VERSION = 'hololand.model-village-art-direction.v1';
const ART_POLICY_SOURCE =
  'source/domains/agents/model-village-art-direction.hsplus';
const RESIDENT_KIT_SOURCE =
  'source/layers/vr/frontier/model-village/model-village-resident-kit.holo';
const APPEARANCE_PROOF_SOURCE =
  'source/proofs/model-village-appearance-invariance.hs';
const WORLD_SOURCE =
  'source/layers/vr/frontier/model-village/model-village.holo';
const OBSERVER_SOURCE =
  'source/layers/vr/frontier/model-village/model-village-observer-projection.holo';
const ART_SPEC_SOURCE =
  'docs/specs/HOLOLAND_MODEL_VILLAGE_ART_DIRECTION.md';
const WORLD_CONCEPT_SOURCE =
  'docs/assets/model-village/model-village-stormglass-commons-concept-2026-07-25.png';
const RESIDENT_CONCEPT_SOURCE =
  'docs/assets/model-village/model-village-stormglass-craftfolk-lineup-2026-07-25.png';
const DEFAULT_OUTPUT =
  path.join('.tmp', 'hololand', 'model-village', 'art-direction-receipt.json');

const EXPECTED_RESIDENTS = [
  {
    ordinal: 1,
    residentId: 'resident-01',
    personaId: 'persona-01',
    seatId: 'seat-01',
    displayName: 'Nera Fen',
    villageRole: 'water_steward',
    silhouetteId: 'willow_crescent',
    glyphId: 'open_droplet',
    accentColor: '#77D4C8',
    roleProp: 'ceramic_water_measure',
    appearanceManifestId: 'stormglass-appearance-01-v1',
  },
  {
    ordinal: 2,
    residentId: 'resident-02',
    personaId: 'persona-02',
    seatId: 'seat-02',
    displayName: 'Calder Voss',
    villageRole: 'repairwright',
    silhouetteId: 'broad_square',
    glyphId: 'bridge_knot',
    accentColor: '#79A8F2',
    roleProp: 'folding_gauge',
    appearanceManifestId: 'stormglass-appearance-02-v1',
  },
  {
    ordinal: 3,
    residentId: 'resident-03',
    personaId: 'persona-03',
    seatId: 'seat-03',
    displayName: 'Tamsin Reed',
    villageRole: 'seedkeeper',
    silhouetteId: 'a_line_seedpod',
    glyphId: 'six_part_seed',
    accentColor: '#C69FF2',
    roleProp: 'seed_archive_case',
    appearanceManifestId: 'stormglass-appearance-03-v1',
  },
  {
    ordinal: 4,
    residentId: 'resident-04',
    personaId: 'persona-04',
    seatId: 'seat-04',
    displayName: 'Orren Lark',
    villageRole: 'commons_host',
    silhouetteId: 'compact_hearth_ring',
    glyphId: 'hearth_ring',
    accentColor: '#F0BB78',
    roleProp: 'shared_serving_bowl',
    appearanceManifestId: 'stormglass-appearance-04-v1',
  },
  {
    ordinal: 5,
    residentId: 'resident-05',
    personaId: 'persona-05',
    seatId: 'seat-05',
    displayName: 'Suri Kest',
    villageRole: 'courier_cartographer',
    silhouetteId: 'lean_kite',
    glyphId: 'path_chevron',
    accentColor: '#E98EAA',
    roleProp: 'rolled_map_case',
    appearanceManifestId: 'stormglass-appearance-05-v1',
  },
  {
    ordinal: 6,
    residentId: 'resident-06',
    personaId: 'persona-06',
    seatId: 'seat-06',
    displayName: 'Vale Rook',
    villageRole: 'ledger_witness',
    silhouetteId: 'tall_angular_column',
    glyphId: 'woven_square',
    accentColor: '#9CCC7B',
    roleProp: 'civic_ledger',
    appearanceManifestId: 'stormglass-appearance-06-v1',
  },
];

const APPEARANCE_DIGEST_FIELDS = [
  'residentId',
  'personaId',
  'seatId',
  'displayName',
  'villageRole',
  'silhouetteId',
  'glyphId',
  'accentColor',
  'roleProp',
  'appearanceManifestId',
];

const PERMUTATION_FIELDS = [
  'mixedBlock1Appearance',
  'mixedBlock2Appearance',
  'mixedBlock3Appearance',
  'adapterAOnlyAppearance',
  'adapterBOnlyAppearance',
  'adapterCOnlyAppearance',
];

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    root: process.cwd(),
    output: DEFAULT_OUTPUT,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') args.root = argv[++index];
    else if (arg === '--output') args.output = argv[++index];
    else if (arg === '--json') args.json = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`HoloLand Model Village art-direction check

Usage:
  node scripts/check-hololand-model-village-art-direction.mjs [options]

Options:
  --root <path>       HoloLand repository root
  --output <path>     Receipt output path
  --json              Print the complete receipt
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function fileHash(filePath) {
  return sha256(readFileSync(filePath));
}

function repoPath(root, relativePath) {
  return path.resolve(root, relativePath);
}

function read(root, relativePath) {
  return readFileSync(repoPath(root, relativePath), 'utf8');
}

function propertyMap(node) {
  return Object.fromEntries(
    (node?.properties || []).map((entry) => [entry.key, entry.value]),
  );
}

function holoObjects(ast) {
  return [
    ...(ast?.objects || []),
    ...(ast?.spatialGroups || []).flatMap((group) => group.objects || []),
  ];
}

function holoObjectRecord(node) {
  const direct = propertyMap(node);
  return {
    objectId: node.name,
    label: direct.label,
    position: direct.position,
    scale: direct.scale,
    material: direct.material,
    ...(direct.properties || {}),
  };
}

function indexBy(values, key) {
  return new Map(values.map((value) => [value[key], value]));
}

function pngDimensions(filePath) {
  const bytes = readFileSync(filePath);
  if (
    bytes.length < 24
    || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a'
  ) {
    throw new Error(`${filePath} is not a PNG`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  return {
    width,
    height,
    aspectRatio: Number((width / height).toFixed(6)),
    aspectRatioClass:
      Math.abs(width / height - 16 / 9) <= 0.02 ? '16:9' : 'other',
  };
}

function findHoloScriptRoot(root) {
  const candidates = [
    process.env.HOLOSCRIPT_ROOT,
    path.resolve(root, '..', 'HoloScript'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    const corePath = path.join(candidate, 'packages', 'core', 'dist', 'index.js');
    if (existsSync(corePath)) return { root: candidate, corePath };
  }
  throw new Error(
    'Built HoloScript core not found. Set HOLOSCRIPT_ROOT or place HoloScript beside HoloLand.',
  );
}

function requireNode(nodes, predicate, message) {
  const matching = nodes.filter(predicate);
  if (matching.length !== 1) {
    throw new Error(`${message}; expected 1, observed ${matching.length}`);
  }
  return matching[0];
}

function normalizeResident(record) {
  return Object.fromEntries(
    APPEARANCE_DIGEST_FIELDS.map((field) => [field, record[field]]),
  );
}

function receiptHash(receipt) {
  const { receiptHash: _ignored, ...unsigned } = receipt;
  return sha256(canonicalJson(unsigned));
}

export function verifyModelVillageArtDirectionReceipt(receipt) {
  return Boolean(
    receipt
    && receipt.schemaVersion === SCHEMA_VERSION
    && typeof receipt.receiptHash === 'string'
    && receipt.receiptHash === receiptHash(receipt),
  );
}

export async function runModelVillageArtDirectionCheck(options = {}) {
  const root = path.resolve(options.root ?? process.cwd());
  const output = path.resolve(root, options.output ?? DEFAULT_OUTPUT);
  const holoScript = findHoloScriptRoot(root);
  const core = await import(pathToFileURL(holoScript.corePath).href);

  const sourcePaths = [
    ART_POLICY_SOURCE,
    RESIDENT_KIT_SOURCE,
    APPEARANCE_PROOF_SOURCE,
    WORLD_SOURCE,
    OBSERVER_SOURCE,
    ART_SPEC_SOURCE,
    WORLD_CONCEPT_SOURCE,
    RESIDENT_CONCEPT_SOURCE,
  ];
  const missingSources = sourcePaths.filter(
    (relativePath) => !existsSync(repoPath(root, relativePath)),
  );
  if (missingSources.length > 0) {
    throw new Error(`Missing art-direction sources: ${missingSources.join(', ')}`);
  }

  const texts = {
    policy: read(root, ART_POLICY_SOURCE),
    kit: read(root, RESIDENT_KIT_SOURCE),
    proof: read(root, APPEARANCE_PROOF_SOURCE),
    world: read(root, WORLD_SOURCE),
    observer: read(root, OBSERVER_SOURCE),
    spec: read(root, ART_SPEC_SOURCE),
  };

  const parsed = {
    policy: new core.HoloScriptPlusParser().parse(texts.policy),
    kit: new core.HoloCompositionParser().parse(texts.kit),
    proof: new core.HoloScriptCodeParser().parse(texts.proof),
    world: new core.HoloCompositionParser().parse(texts.world),
    observer: new core.HoloCompositionParser().parse(texts.observer),
  };

  const parserFailures = Object.entries(parsed)
    .filter(([, result]) => !result.success)
    .map(([name, result]) => ({
      name,
      errors: result.errors || [],
    }));
  if (parserFailures.length > 0) {
    throw new Error(
      `HoloScript parsing failed: ${canonicalJson(parserFailures)}`,
    );
  }

  const failures = [];
  const assertions = {};
  function assert(name, condition, detail) {
    assertions[name] = Boolean(condition);
    if (!condition) failures.push({ name, detail });
  }

  const policyComposition = requireNode(
    parsed.policy.ast.children || [],
    (node) => node.type === 'composition',
    'Art-direction .hsplus composition is missing',
  );
  const policyConfig = requireNode(
    policyComposition.children || [],
    (node) => node.type === 'config',
    'Art-direction config is missing',
  ).properties;
  const policyTemplates = policyComposition.children || [];
  const presentationPolicy = requireNode(
    policyTemplates,
    (node) => (
      node.type === 'template'
      && node.name === 'ResidentPresentationInvariance'
    ),
    'ResidentPresentationInvariance is missing',
  ).properties;
  const residentBudgetPolicy = requireNode(
    policyTemplates,
    (node) => (
      node.type === 'template'
      && node.name === 'ResidentPlatformBudgets'
    ),
    'ResidentPlatformBudgets is missing',
  ).properties;

  const worldObjects = holoObjects(parsed.world.ast).map(holoObjectRecord);
  const observerObjects = holoObjects(parsed.observer.ast).map(holoObjectRecord);
  const kitObjects = holoObjects(parsed.kit.ast).map(holoObjectRecord);
  const worldResidents = worldObjects.filter((entry) => (
    /^ResidentSeat0[1-6]$/.test(entry.objectId)
  ));
  const observerResidents = observerObjects.filter((entry) => (
    /^ObserverResident0[1-6]$/.test(entry.objectId)
  ));
  const kitResidents = kitObjects.filter((entry) => (
    /^StormglassResident0[1-6]$/.test(entry.objectId)
  ));
  const worldByResident = indexBy(worldResidents, 'residentId');
  const observerByResident = indexBy(observerResidents, 'residentId');
  const kitByResident = indexBy(kitResidents, 'residentId');

  const proofNodes = Array.isArray(parsed.proof.ast) ? parsed.proof.ast : [];
  const proofGate = requireNode(
    proofNodes,
    (node) => node.properties?.type === 'model_village_appearance_invariance_gate',
    'Appearance-invariance gate is missing',
  ).properties;
  const proofResidents = proofNodes
    .filter((node) => node.properties?.type === 'resident_appearance_invariant')
    .map((node) => node.properties);
  const proofByResident = indexBy(proofResidents, 'residentId');

  assert(
    'lockedWorldIdentity',
    policyConfig.worldName === 'Stormglass Commons'
      && policyConfig.artStyle === 'hearthlight_biorealism'
      && policyConfig.residentDesignSystem === 'stormglass_craftfolk'
      && policyConfig.status === 'locked_production_direction',
    policyConfig,
  );
  assert(
    'conceptArtNotRuntimeClaim',
    policyConfig.authoredProductionAssetsObserved === false
      && policyConfig.photorealisticClaimed === false
      && policyConfig.nativeWebGPUClaimed === false,
    policyConfig,
  );
  assert(
    'canonicalWorldObjectCountPreserved',
    worldObjects.length === 12,
    { observed: worldObjects.length, expected: 12 },
  );
  assert(
    'sixResidentsOnEverySurface',
    worldResidents.length === 6
      && observerResidents.length === 6
      && kitResidents.length === 6
      && proofResidents.length === 6,
    {
      world: worldResidents.length,
      observer: observerResidents.length,
      kit: kitResidents.length,
      proof: proofResidents.length,
    },
  );
  assert(
    'appearanceDigestFieldsLocked',
    canonicalJson(proofGate.appearanceDigestFields)
      === canonicalJson(APPEARANCE_DIGEST_FIELDS),
    {
      observed: proofGate.appearanceDigestFields,
      expected: APPEARANCE_DIGEST_FIELDS,
    },
  );
  assert(
    'forbiddenIdentityFieldsExcluded',
    [
      'adapterAlias',
      'provider',
      'modelFamily',
      'modelRevision',
      'condition',
      'performance',
      'outcome',
    ].every((field) => proofGate.forbiddenDigestFields?.includes(field))
      && presentationPolicy.appearanceMustIgnore?.includes('adapter_alias')
      && presentationPolicy.appearanceMustIgnore?.includes('provider')
      && presentationPolicy.appearanceMustIgnore?.includes('condition'),
    {
      proof: proofGate.forbiddenDigestFields,
      policy: presentationPolicy.appearanceMustIgnore,
    },
  );
  assert(
    'lockedResidentBudgets',
    residentBudgetPolicy.desktopLod0TrianglesPerResidentMaximum === 15000
      && residentBudgetPolicy.midLod1TrianglesPerResidentMaximum === 6000
      && residentBudgetPolicy.farLod2TrianglesPerResidentMaximum === 2000
      && residentBudgetPolicy.materialsPerResidentMaximum === 2,
    residentBudgetPolicy,
  );

  const residentEvidence = [];
  for (const expected of EXPECTED_RESIDENTS) {
    const worldResident = worldByResident.get(expected.residentId);
    const observerResident = observerByResident.get(expected.residentId);
    const kitResident = kitByResident.get(expected.residentId);
    const proofResident = proofByResident.get(expected.residentId);
    const surfaceMatches = [worldResident, observerResident, kitResident].every(
      (record) => (
        record
        && [
          'residentId',
          'personaId',
          'seatId',
          'displayName',
          'villageRole',
          'silhouetteId',
          'glyphId',
          'accentColor',
          'appearanceManifestId',
        ].every((field) => record[field] === expected[field])
      ),
    );
    assert(
      `resident${expected.ordinal}SurfaceIdentity`,
      surfaceMatches,
      { expected, worldResident, observerResident, kitResident },
    );
    assert(
      `resident${expected.ordinal}ProxyIntegrity`,
      observerResident?.assignmentInvariant === true
        && observerResident?.adapterIdentity === 'absent'
        && observerResident?.causalEffect === false
        && kitResident?.assignmentInvariant === true
        && kitResident?.adapterIdentity === 'absent',
      { observerResident, kitResident },
    );
    assert(
      `resident${expected.ordinal}PermutationInvariant`,
      proofResident
        && proofResident.personaId === expected.personaId
        && proofResident.seatId === expected.seatId
        && proofResident.appearanceManifestId === expected.appearanceManifestId
        && PERMUTATION_FIELDS.every(
          (field) => proofResident[field] === expected.appearanceManifestId,
        ),
      proofResident,
    );

    const appearanceProjection = normalizeResident({
      ...kitResident,
      roleProp: expected.roleProp,
    });
    residentEvidence.push({
      ...expected,
      appearanceDigest: sha256(canonicalJson(appearanceProjection)),
      observerScale: observerResident?.scale,
      proxyAssetStatus: observerResident?.assetStatus,
    });
  }

  assert(
    'uniqueSilhouettes',
    new Set(residentEvidence.map((entry) => entry.silhouetteId)).size === 6,
    residentEvidence.map((entry) => entry.silhouetteId),
  );
  assert(
    'uniqueGlyphs',
    new Set(residentEvidence.map((entry) => entry.glyphId)).size === 6,
    residentEvidence.map((entry) => entry.glyphId),
  );
  assert(
    'uniqueAccentColors',
    new Set(residentEvidence.map((entry) => entry.accentColor)).size === 6,
    residentEvidence.map((entry) => entry.accentColor),
  );
  assert(
    'distinctProxySilhouettes',
    new Set(
      residentEvidence.map((entry) => canonicalJson(entry.observerScale)),
    ).size === 6,
    residentEvidence.map((entry) => entry.observerScale),
  );
  assert(
    'identityDoesNotDependOnColorAlone',
    proofGate.colorAloneSufficient === false
      && presentationPolicy.colorAloneSufficient === false
      && presentationPolicy.redundantIdentityChannels?.length >= 4,
    presentationPolicy,
  );

  const imageEvidence = [
    WORLD_CONCEPT_SOURCE,
    RESIDENT_CONCEPT_SOURCE,
  ].map((relativePath) => {
    const filePath = repoPath(root, relativePath);
    return {
      source: relativePath,
      sha256: fileHash(filePath),
      bytes: readFileSync(filePath).length,
      dimensions: pngDimensions(filePath),
      evidenceClass: 'concept_target_not_runtime_proof',
    };
  });
  assert(
    'conceptImagesAreWideTargets',
    imageEvidence.every(
      (entry) => (
        entry.dimensions.aspectRatioClass === '16:9'
        && entry.dimensions.width >= 1600
        && entry.dimensions.height >= 900
      ),
    ),
    imageEvidence,
  );
  assert(
    'artSpecNamesLockedDirection',
    texts.spec.includes('**World:** Stormglass Commons')
      && texts.spec.includes('**Style:** Hearthlight Biorealism')
      && texts.spec.includes('Stormglass Craftfolk'),
    ART_SPEC_SOURCE,
  );

  const sourceEvidence = Object.fromEntries(
    sourcePaths.map((relativePath) => [
      relativePath,
      {
        sha256: fileHash(repoPath(root, relativePath)),
        bytes: readFileSync(repoPath(root, relativePath)).length,
      },
    ]),
  );

  const receipt = {
    schemaVersion: SCHEMA_VERSION,
    status: failures.length === 0 ? 'pass' : 'fail',
    generatedAt: new Date().toISOString(),
    world: {
      name: 'Stormglass Commons',
      artStyle: 'hearthlight_biorealism',
      residentDesignSystem: 'stormglass_craftfolk',
      directionStatus: 'locked',
    },
    parserEvidence: {
      preferredSurface: 'mcp__holoscript_local',
      executedFallback: 'local_built_holoscript_core',
      corePath: path.relative(root, holoScript.corePath).replaceAll('\\', '/'),
      coreSha256: fileHash(holoScript.corePath),
      parsers: {
        holo: 'HoloCompositionParser',
        hsplus: 'HoloScriptPlusParser',
        hs: 'HoloScriptCodeParser',
      },
      parsedSources: [
        RESIDENT_KIT_SOURCE,
        ART_POLICY_SOURCE,
        APPEARANCE_PROOF_SOURCE,
        WORLD_SOURCE,
        OBSERVER_SOURCE,
      ],
    },
    residents: residentEvidence,
    imageEvidence,
    sourceEvidence,
    assertions,
    failures,
    claimBoundary: {
      observed: [
        'locked_three_format_art_direction_source',
        'six_cross_surface_identity_manifests',
        'adapter_and_condition_appearance_invariance_manifest',
        'distinct_q0_capsule_proxy_scales',
        'locally_custodied_concept_targets',
      ],
      targetNotObserved: [
        'authored_resident_glb_or_vrm',
        'facial_rig',
        'production_character_animation',
        'production_texture_atlas',
        'production_audio',
        'dynamic_weather',
        'advanced_physics_visual_adapters',
        'native_webgpu_feature_parity',
        'photorealism',
      ],
    },
  };
  receipt.receiptHash = receiptHash(receipt);

  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);

  return {
    receipt,
    output,
  };
}

async function main() {
  const args = parseArgs();
  const result = await runModelVillageArtDirectionCheck(args);
  if (args.json) {
    console.log(JSON.stringify(result.receipt, null, 2));
  } else {
    console.log(
      `Model Village art direction: ${result.receipt.status.toUpperCase()}`,
    );
    console.log(`World: ${result.receipt.world.name}`);
    console.log(`Style: ${result.receipt.world.artStyle}`);
    console.log(`Residents: ${result.receipt.residents.length}`);
    console.log(`Receipt: ${result.receipt.receiptHash}`);
    console.log(`Output: ${result.output}`);
    if (result.receipt.failures.length > 0) {
      console.error(JSON.stringify(result.receipt.failures, null, 2));
    }
  }
  if (result.receipt.status !== 'pass') process.exitCode = 1;
}

const isMain = Boolean(
  process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url),
);
if (isMain) {
  main().catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
}
