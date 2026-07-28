#!/usr/bin/env node
/* global document, performance, process, requestAnimationFrame, window */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  compileH3BNativeBundles,
  sha256,
} from './check-hololand-model-village-character-appearance-h3b.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_HOLOSCRIPT_ROOT =
  process.env.HOLOSCRIPT_ROOT || 'C:/Users/josep/Documents/GitHub/HoloScript';
const SOURCE_REL =
  'source/layers/vr/frontier/model-village/model-village-character-appearance-h3d-native-ocular-regions.holo';
const POLICY_REL =
  'source/proofs/model-village-character-appearance-h3d-native-ocular-regions-policy.hsplus';
const SEED_REL =
  'source/proofs/model-village-character-appearance-h3d-native-ocular-regions-seed.hs';
const MANIFEST_REL =
  'source/layers/vr/frontier/model-village/model-village-character-appearance-h3d-native-ocular-regions-manifest.holo';
const HERO_REL =
  'docs/assets/model-village/model-village-character-appearance-h3d-native-ocular-portraits-2026-07-28.png';
const OUTPUT_REL = '.tmp/hololand/model-village/character-appearance-h3d';
const EXPECTED_PERSONAS = ['hearth_keeper', 'path_tender', 'record_steward'];
const EXPECTED_REGIONS = ['sclera', 'iris', 'pupil', 'cornea'];
const HASH_BINDINGS = [
  ['inheritedH3CSource', 'inheritedH3CSourceSha256', 'hololand'],
  ['upstreamOcularBuilderPath', 'upstreamOcularBuilderSha256', 'holoscript'],
  ['upstreamCharacterHostPath', 'upstreamCharacterHostSha256', 'holoscript'],
  ['upstreamCompositionBridgePath', 'upstreamCompositionBridgeSha256', 'holoscript'],
  ['upstreamCharacterRendererPath', 'upstreamCharacterRendererSha256', 'holoscript'],
  ['upstreamDrawSpecPath', 'upstreamDrawSpecSha256', 'holoscript'],
  ['upstreamEyeShaderPath', 'upstreamEyeShaderSha256', 'holoscript'],
  ['upstreamCompilerPath', 'upstreamCompilerSha256', 'holoscript'],
];

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])])
    );
  }
  return value;
}

function properties(node) {
  return Object.fromEntries(
    (node?.properties || []).map((property) => [property.key, property.value])
  );
}

function packedColor(value) {
  return Number.parseInt(String(value).replace('#', ''), 16);
}

async function loadCore(holoScriptRoot) {
  return import(pathToFileURL(path.join(holoScriptRoot, 'packages/core/dist/index.js')).href);
}

export async function parseH3DStack(root = ROOT, holoScriptRoot = DEFAULT_HOLOSCRIPT_ROOT) {
  const core = await loadCore(holoScriptRoot);
  const sourceText = readFileSync(path.join(root, SOURCE_REL), 'utf8');
  const policyText = readFileSync(path.join(root, POLICY_REL), 'utf8');
  const seedText = readFileSync(path.join(root, SEED_REL), 'utf8');
  const source = new core.HoloCompositionParser().parse(sourceText);
  const policy = new core.HoloScriptPlusParser().parse(policyText);
  const seed = new core.HoloScriptCodeParser().parse(seedText);
  for (const [label, parsed] of [
    ['H3D .holo', source],
    ['H3D .hsplus', policy],
    ['H3D .hs', seed],
  ]) {
    if (!parsed.success || parsed.errors.length) {
      throw new Error(`${label} parse failed: ${JSON.stringify(parsed.errors)}`);
    }
  }
  return {
    core,
    source,
    policy,
    seed,
    sourceText,
    policyText,
    seedText,
    contract: {
      metadata: source.ast.metadata,
      state: properties(source.ast.state),
      environment: properties(source.ast.environment),
      objects: (source.ast.objects || []).map((object) => ({
        objectId: object.name,
        ...properties(object),
      })),
    },
  };
}

export function buildH3DPlan(contract) {
  const personas = contract.objects
    .filter((object) => object.type === 'native_ocular_civic_persona')
    .map((persona) => ({
      objectId: persona.objectId,
      personaId: persona.personaId,
      civicRole: persona.civicRole,
      displayLabel: persona.displayLabel,
      irisColor: persona.irisColor,
      scleraColor: persona.scleraColor,
      hairColor: persona.hairColor,
      nativeHairStyleId: persona.nativeHairStyleId,
    }));
  const expressions = contract.objects
    .filter((object) => object.type === 'native_morph_expression_probe')
    .map((expression) => ({
      expressionId: expression.expressionId,
      weights: expression.weights,
    }));
  return {
    milestone: contract.metadata.milestone,
    presentationProfile: contract.state.presentationProfile,
    nativeAdmission: contract.state.nativeAdmission,
    benchmark: contract.state.benchmark,
    goldenTargets: contract.state.goldenTargets,
    personas,
    expressions,
  };
}

function gitHasCommit(root, commit) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', commit, 'HEAD'], {
      cwd: root,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

export function validateH3DContract(stack, root = ROOT, holoScriptRoot = DEFAULT_HOLOSCRIPT_ROOT) {
  const errors = [];
  const expect = (condition, message) => {
    if (!condition) errors.push(message);
  };
  const { metadata, state } = stack.contract;
  expect(
    metadata.milestone === 'MV_CHARACTER_APPEARANCE_H3D_NATIVE_OCULAR_REGIONS',
    'milestone drifted'
  );
  expect(metadata.artStyle === 'hearthlight_biorealism', 'art style drifted');
  for (const [key, expected] of [
    ['nativeOcularProfileClaimed', true],
    ['nativeScleraGeometryClaimed', true],
    ['nativeIrisGeometryClaimed', true],
    ['nativePupilGeometryClaimed', true],
    ['nativeCorneaGeometryClaimed', true],
    ['nativeOcularMaterialRolesSerialized', true],
    ['nativeCorneaTransparentGroupSerialized', true],
    ['presentationShaderOverrideUsed', false],
    ['sourceDrivenProceduralIrisPresentation', false],
    ['nativeIrisMaterialSerialized', true],
    ['productionEyeCompleteClaimed', false],
    ['productionTearFilmClaimed', false],
    ['scleraVascularAtlasClaimed', false],
    ['anatomicalEyeAccuracyClaimed', false],
    ['scanDerivedEyeClaimed', false],
    ['normalsRecomputedAfterMorphClaimed', false],
    ['motionReprojectionClaimed', false],
    ['photorealismClaimed', false],
    ['familyIdentityVisible', false],
    ['adapterFamilyBinding', 'absent'],
    ['researchSeatBinding', 'absent'],
    ['liveResearchJoinAllowed', false],
    ['canonicalWritesAllowed', false],
    ['residentObservationWritesAllowed', false],
    ['modelCallsAllowed', false],
    ['networkFetchesAllowed', false],
    ['biometricPersistenceAllowed', false],
  ]) {
    expect(state[key] === expected, `${key} must equal ${expected}`);
  }
  expect(
    state.ocularFoundation?.profile === 'layered-ocular-v1' &&
      JSON.stringify(state.ocularFoundation?.regions) === JSON.stringify(EXPECTED_REGIONS) &&
      state.ocularFoundation?.regionsPerEye === 4 &&
      state.ocularFoundation?.eyesPerPersona === 2 &&
      state.ocularFoundation?.serializedMaterialGroupCountPerPersona === 8 &&
      state.ocularFoundation?.corneaIor === 1.376 &&
      state.ocularFoundation?.corneaTransparent === true &&
      state.ocularFoundation?.presentationShaderOverride === false &&
      state.ocularFoundation?.wetTearFilm === false &&
      state.ocularFoundation?.vascularAtlas === false,
    'ocular-foundation truth boundary drifted'
  );
  expect(
    state.nativeAdmission?.compilerTarget === 'character-webgpu' &&
      state.nativeAdmission?.fallbackAllowed === false &&
      state.nativeAdmission?.exactEightOcularGroupsPerBundleRequired === true &&
      state.nativeAdmission?.exactTwoGroupsPerOcularRegionRequired === true &&
      state.nativeAdmission?.legacyCompositeEyeGroupAllowed === false,
    'native ocular admission drifted'
  );
  expect(
    state.benchmark?.visualHairLod === 2 &&
      state.benchmark?.visualHairLodReason === 'ocular_region_readability',
    'visual hair LOD boundary drifted'
  );
  const plan = buildH3DPlan(stack.contract);
  expect(
    JSON.stringify(plan.personas.map((persona) => persona.personaId)) ===
      JSON.stringify(EXPECTED_PERSONAS),
    'persona order drifted'
  );
  expect(plan.expressions.length === 3, 'expression probes drifted');
  for (const persona of plan.personas) {
    expect(
      /^#[0-9a-f]{6}$/i.test(persona.irisColor) && /^#[0-9a-f]{6}$/i.test(persona.scleraColor),
      `${persona.personaId} ocular colors missing`
    );
    const object = stack.source.ast.objects?.find(
      (candidate) => candidate.name === persona.objectId
    );
    const face = object?.traits?.find((trait) => trait.name === 'face');
    expect(
      face?.config?.topology === 'neutral_anatomical_v2' &&
        face?.config?.ocular_profile === 'layered_ocular_v1' &&
        face?.config?.iris_color === persona.irisColor &&
        face?.config?.sclera_color === persona.scleraColor &&
        face?.config?.cornea_ior === 1.376,
      `${persona.personaId} source-authored @face ocular contract drifted`
    );
  }
  for (const [pathKey, hashKey, owner] of HASH_BINDINGS) {
    const base = owner === 'hololand' ? root : holoScriptRoot;
    const relative = metadata[pathKey];
    const expectedHash = metadata[hashKey];
    const absolute = path.resolve(base, relative || '');
    expect(Boolean(relative && expectedHash), `${pathKey} binding missing`);
    expect(existsSync(absolute), `${pathKey} file missing`);
    if (existsSync(absolute)) {
      expect(sha256File(absolute) === expectedHash, `${pathKey} hash drifted`);
    }
  }
  expect(
    gitHasCommit(holoScriptRoot, metadata.upstreamHoloScriptCommit),
    'pinned upstream HoloScript commit is not an ancestor of HEAD'
  );
  return { status: errors.length ? 'fail' : 'pass', errors, plan };
}

async function exportBundle(core, ast, objectId, lodLevel) {
  return new core.ExportManager({
    useCircuitBreaker: false,
    useFallback: false,
    useMemoryMonitoring: false,
  }).export('character-webgpu', ast, {
    compilerOptions: {
      objectId,
      entityId: `model-village-h3d-${objectId.toLowerCase()}`,
      lodLevel,
    },
  });
}

function withoutLayeredOcularProfile(ast) {
  const copy = structuredClone(ast);
  for (const object of copy.objects || []) {
    const face = object.traits?.find((trait) => trait.name === 'face');
    if (!face) continue;
    for (const key of [
      'ocular_profile',
      'iris_color',
      'sclera_color',
      'iris_scale',
      'pupil_scale',
      'cornea_ior',
    ]) {
      delete face.config[key];
    }
  }
  return copy;
}

function ocularGroups(bundle) {
  return bundle.materialGroups.filter((group) => group.material.shadingModel === 'refractive-eye');
}

export async function compileH3DOcularBundles(stack, plan) {
  const native = await compileH3BNativeBundles(stack.core, stack.source.ast, plan);
  for (const record of native.records) {
    for (const tier of record.tiers) {
      const { bundle } = tier;
      const groups = ocularGroups(bundle);
      const regionCounts = Object.fromEntries(
        EXPECTED_REGIONS.map((region) => [
          region,
          groups.filter((group) => group.material.eyeRegion === region).length,
        ])
      );
      const iris = groups.filter((group) => group.material.eyeRegion === 'iris');
      const sclera = groups.filter((group) => group.material.eyeRegion === 'sclera');
      const cornea = groups.filter((group) => group.material.eyeRegion === 'cornea');
      if (
        bundle.face?.topology !== 'neutral-anatomical-v2' ||
        bundle.face?.ocularProfile !== 'layered-ocular-v1' ||
        bundle.face?.irisColor !== packedColor(record.irisColor) ||
        bundle.face?.scleraColor !== packedColor(record.scleraColor) ||
        groups.length !== 8 ||
        !EXPECTED_REGIONS.every((region) => regionCounts[region] === 2) ||
        groups.some(
          (group) => !group.material.eyeRegion || group.material.eyeRegion === 'composite'
        ) ||
        groups.some((group) => group.indexCount <= 0) ||
        iris.some((group) => group.material.color !== packedColor(record.irisColor)) ||
        sclera.some((group) => group.material.color !== packedColor(record.scleraColor)) ||
        cornea.some(
          (group) =>
            group.transparent !== true ||
            group.material.ior !== 1.376 ||
            group.material.opacity <= 0 ||
            group.material.opacity >= 1
        ) ||
        !bundle.report?.mapped?.includes('@face(ocular_profile=layered-ocular-v1)') ||
        bundle.report?.stubbed?.length !== 0
      ) {
        throw new Error(`${record.personaId} LOD${tier.level} native ocular contract drifted`);
      }
      tier.ocularGroupCount = groups.length;
      tier.ocularTriangleCount = groups.reduce((sum, group) => sum + group.indexCount, 0) / 3;
      tier.ocularRegions = regionCounts;
    }
  }

  const legacy = await exportBundle(
    stack.core,
    withoutLayeredOcularProfile(stack.source.ast),
    plan.personas[0].objectId,
    0
  );
  if (!legacy.success || legacy.usedFallback) {
    throw new Error('legacy composite eye comparison compile failed');
  }
  const legacyBundle = JSON.parse(legacy.output);
  const nativeBundle = native.records[0].tiers[0].bundle;
  const ocularVertexDelta = nativeBundle.vertexCount - legacyBundle.vertexCount;
  const ocularTriangleDelta =
    nativeBundle.mesh.indices.length / 3 - legacyBundle.mesh.indices.length / 3;
  if (ocularVertexDelta < 400 || ocularTriangleDelta < 400) {
    throw new Error(
      `layered ocular topology delta too small: vertices=${ocularVertexDelta} triangles=${ocularTriangleDelta}`
    );
  }
  return {
    native,
    ocularVertexDelta,
    ocularTriangleDelta,
    legacyVertexCount: legacyBundle.vertexCount,
  };
}

function browserBundle(bundle) {
  return {
    vertexCount: bundle.vertexCount,
    mesh: bundle.mesh,
    jointMatrices: bundle.jointMatrices,
    materialGroups: bundle.materialGroups,
    face: bundle.face,
  };
}

function h3dBrowserApplication(THREE, RoomEnvironment, payload) {
  const host = document.getElementById('portraits');
  const renderers = [];
  const gpu = {};

  function geometryFromBundle(bundle) {
    const positions = new Float32Array(bundle.mesh.positions);
    const normals = new Float32Array(bundle.mesh.normals);
    for (let vertex = 0; vertex < bundle.vertexCount; vertex += 1) {
      const joint = bundle.mesh.jointIndices[vertex];
      const weight = bundle.mesh.jointWeights[vertex];
      const offset = joint * 16;
      const position = vertex * 3;
      const x = positions[position];
      const y = positions[position + 1];
      const z = positions[position + 2];
      positions[position] =
        (bundle.jointMatrices[offset] * x +
          bundle.jointMatrices[offset + 4] * y +
          bundle.jointMatrices[offset + 8] * z +
          bundle.jointMatrices[offset + 12]) *
        weight;
      positions[position + 1] =
        (bundle.jointMatrices[offset + 1] * x +
          bundle.jointMatrices[offset + 5] * y +
          bundle.jointMatrices[offset + 9] * z +
          bundle.jointMatrices[offset + 13]) *
        weight;
      positions[position + 2] =
        (bundle.jointMatrices[offset + 2] * x +
          bundle.jointMatrices[offset + 6] * y +
          bundle.jointMatrices[offset + 10] * z +
          bundle.jointMatrices[offset + 14]) *
        weight;
      const nx = normals[position];
      const ny = normals[position + 1];
      const nz = normals[position + 2];
      const tx =
        bundle.jointMatrices[offset] * nx +
        bundle.jointMatrices[offset + 4] * ny +
        bundle.jointMatrices[offset + 8] * nz;
      const ty =
        bundle.jointMatrices[offset + 1] * nx +
        bundle.jointMatrices[offset + 5] * ny +
        bundle.jointMatrices[offset + 9] * nz;
      const tz =
        bundle.jointMatrices[offset + 2] * nx +
        bundle.jointMatrices[offset + 6] * ny +
        bundle.jointMatrices[offset + 10] * nz;
      const length = Math.hypot(tx, ty, tz) || 1;
      normals[position] = tx / length;
      normals[position + 1] = ty / length;
      normals[position + 2] = tz / length;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    if (bundle.mesh.uvs) {
      geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(bundle.mesh.uvs), 2));
    }
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(bundle.mesh.indices), 1));
    bundle.materialGroups.forEach((group, index) => {
      geometry.addGroup(group.indexStart, group.indexCount, index);
    });
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function materialFor(group, record) {
    const material = group.material;
    if (material.shadingModel === 'marschner-hair') {
      return new THREE.MeshStandardMaterial({
        color: record.hairColor,
        roughness: 0.66,
        metalness: 0,
        side: THREE.DoubleSide,
        envMapIntensity: 0.62,
      });
    }
    if (material.shadingModel === 'refractive-eye') {
      if (material.eyeRegion === 'cornea') {
        return new THREE.MeshPhysicalMaterial({
          color: material.color,
          roughness: 0.07,
          metalness: 0,
          transparent: true,
          opacity: 0.09,
          ior: material.ior,
          clearcoat: 0.86,
          clearcoatRoughness: 0.05,
          envMapIntensity: 0.82,
          depthWrite: false,
        });
      }
      if (material.eyeRegion === 'iris') {
        return new THREE.MeshPhysicalMaterial({
          color: material.color,
          roughness: 0.28,
          metalness: 0,
          clearcoat: 0.34,
          clearcoatRoughness: 0.16,
          envMapIntensity: 0.88,
        });
      }
      if (material.eyeRegion === 'pupil') {
        return new THREE.MeshPhysicalMaterial({
          color: material.color,
          roughness: 0.15,
          metalness: 0,
          clearcoat: 0.72,
          clearcoatRoughness: 0.08,
          envMapIntensity: 0.8,
        });
      }
      return new THREE.MeshPhysicalMaterial({
        color: material.color,
        roughness: 0.34,
        metalness: 0,
        clearcoat: 0.2,
        clearcoatRoughness: 0.22,
        envMapIntensity: 0.72,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: material.color,
      roughness: 0.56,
      metalness: 0,
      clearcoat: 0.05,
      clearcoatRoughness: 0.38,
      sheen: 0.1,
      sheenColor: 0xffd7c4,
      envMapIntensity: 0.66,
    });
  }

  function eyeHeight(bundle, geometry) {
    const positions = geometry.getAttribute('position');
    const groups = bundle.materialGroups.filter(
      (group) =>
        group.material.shadingModel === 'refractive-eye' && group.material.eyeRegion === 'sclera'
    );
    let sum = 0;
    let samples = 0;
    for (const group of groups) {
      for (
        let offset = group.indexStart;
        offset < group.indexStart + group.indexCount;
        offset += 1
      ) {
        sum += positions.getY(bundle.mesh.indices[offset]);
        samples += 1;
      }
    }
    return samples ? sum / samples : geometry.boundingBox.max.y * 0.82;
  }

  function buildPortrait(record) {
    const card = document.createElement('section');
    card.className = 'portrait';
    const canvas = document.createElement('canvas');
    const label = document.createElement('div');
    label.className = 'portrait-label';
    label.innerHTML = `<div><strong>${record.displayLabel}</strong><span>${record.civicRole} · ${record.nativeHairStyleId}</span></div><div class="regions"><i class="sclera"></i><i class="iris" style="--iris:${record.irisColor}"></i><i class="pupil"></i><i class="cornea"></i><b>8 NATIVE GROUPS</b></div>`;
    card.append(canvas, label);
    host.append(card);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(548, 554, false);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;

    if (!gpu.renderer) {
      const gl = renderer.getContext();
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      gpu.renderer = debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER);
      gpu.vendor = debug
        ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
        : gl.getParameter(gl.VENDOR);
      gpu.version = gl.getParameter(gl.VERSION);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050e17);
    scene.fog = new THREE.FogExp2(0x050e17, 0.36);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xa5d7e5, 0x170d0a, 1.42));
    const key = new THREE.DirectionalLight(0xffd7c1, 4.25);
    key.position.set(1.5, 2.4, 2.3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x54c4dd, 2.05);
    fill.position.set(-2.2, 1.75, 1.2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff9862, 3.1);
    rim.position.set(0.5, 2.1, -1.8);
    scene.add(rim);

    const bundle = record.tiers[2].bundle;
    const geometry = geometryFromBundle(bundle);
    const materials = bundle.materialGroups.map((group) => materialFor(group, record));
    const mesh = new THREE.Mesh(geometry, materials);
    scene.add(mesh);
    const eyeY = eyeHeight(bundle, geometry);
    const camera = new THREE.PerspectiveCamera(27, 548 / 554, 0.05, 20);
    camera.position.set(0, eyeY - 0.014, 0.64);
    camera.lookAt(0, eyeY - 0.026, 0.018);
    renderer.render(scene, camera);
    renderers.push({ renderer, scene, camera });
  }

  async function run() {
    payload.records.forEach(buildPortrait);
    const frameTimes = [];
    const submitTimes = [];
    let last = performance.now();
    for (let frame = 0; frame < 105; frame += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const start = performance.now();
      renderers.forEach(({ renderer, scene, camera }) => renderer.render(scene, camera));
      const now = performance.now();
      if (frame >= 20) {
        frameTimes.push(now - last);
        submitTimes.push(now - start);
      }
      last = now;
    }
    window.__H3D_RESULT__ = {
      gpu,
      frameP95Milliseconds: payload.percentile(frameTimes, 0.95),
      renderSubmitP95Milliseconds: payload.percentile(submitTimes, 0.95),
      rendererCount: renderers.length,
      ocularProfile: payload.records[0].tiers[2].bundle.face.ocularProfile,
      ocularMaterialGroupCount: payload.records[0].tiers[2].bundle.materialGroups.filter(
        (group) => group.material.shadingModel === 'refractive-eye'
      ).length,
      presentationShaderOverrideUsed: false,
      visualHairLod: 2,
      sourceCommit: payload.sourceCommit,
    };
    window.__H3D_READY__ = true;
  }

  run().catch((error) => {
    window.__H3D_ERROR__ = error?.stack || error?.message || String(error);
  });
}

async function loadWorkspaceModules(holoScriptRoot) {
  const workspaceRequire = createRequire(path.join(holoScriptRoot, 'package.json'));
  const importResolved = async (name) => import(pathToFileURL(workspaceRequire.resolve(name)).href);
  const playwrightModule = await importResolved('playwright');
  return {
    esbuild: await importResolved('esbuild'),
    chromium: (playwrightModule.default || playwrightModule).chromium,
  };
}

async function buildBrowserSurface(compiled, options, modules) {
  mkdirSync(options.outputDir, { recursive: true });
  const bundlePath = path.join(options.outputDir, 'h3d-ocular.bundle.js');
  const htmlPath = path.join(options.outputDir, 'h3d-ocular.html');
  const payload = {
    sourceCommit: compiled.stack.contract.metadata.upstreamHoloScriptCommit,
    records: compiled.ocular.native.records.map((record) => ({
      ...record,
      tiers: record.tiers.map((tier) => ({
        ...tier,
        bundle: browserBundle(tier.bundle),
      })),
    })),
  };
  const appSource = [
    "import * as THREE from 'three';",
    "import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';",
    `const PAYLOAD = ${JSON.stringify(payload)};`,
    `PAYLOAD.percentile = (values, quantile) => {
      const sorted = [...values].sort((a,b)=>a-b);
      return sorted.length ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))] : 0;
    };`,
    `(${h3dBrowserApplication.toString()})(THREE, RoomEnvironment, PAYLOAD);`,
  ].join('\n');
  try {
    await modules.esbuild.build({
      stdin: {
        contents: appSource,
        resolveDir: options.holoScriptRoot,
        sourcefile: 'h3d-ocular.entry.js',
        loader: 'js',
      },
      outfile: bundlePath,
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['chrome120'],
      minify: false,
      sourcemap: false,
      nodePaths: [path.join(options.holoScriptRoot, 'node_modules')],
      logLevel: 'silent',
    });
  } finally {
    modules.esbuild.stop?.();
  }
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="data:,">
  <title>Stormglass Character Appearance H3D</title>
  <style>
    *{box-sizing:border-box}
    html,body{margin:0;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at 50% -12%,#1a4352 0,#07131d 43%,#02070c 100%);color:#eef8fa;font-family:Inter,Segoe UI,sans-serif}
    header{height:108px;padding:21px 38px 12px;border-bottom:1px solid rgba(126,207,220,.2)}
    .eyebrow{color:#79d6e3;font:700 11px/1.2 ui-monospace,monospace;letter-spacing:.22em}
    h1{margin:7px 0 0;font:500 34px/1 Georgia,serif}
    .sub{position:absolute;right:40px;top:24px;color:#99b8c1;font:600 11px/1.65 ui-monospace,monospace;text-align:right}
    #portraits{display:flex;gap:18px;padding:16px 36px 0;justify-content:center}
    .portrait{position:relative;width:548px;height:566px;overflow:hidden;border:1px solid rgba(118,205,220,.24);border-radius:20px;background:rgba(5,15,24,.78);box-shadow:0 28px 70px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.03)}
    canvas{display:block;width:548px;height:554px}
    .portrait-label{position:absolute;left:16px;right:16px;bottom:14px;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid rgba(125,205,219,.22);border-radius:12px;background:rgba(3,10,16,.86);backdrop-filter:blur(9px)}
    .portrait-label strong{display:block;font:600 18px/1.15 Georgia,serif}
    .portrait-label span{display:block;margin-top:4px;color:#8cb2be;font:700 9px/1.2 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase}
    .regions{display:flex;align-items:center;gap:5px}
    .regions i{display:block;width:13px;height:13px;border-radius:50%;border:1px solid rgba(255,255,255,.34)}
    .regions .sclera{background:#eee9df}.regions .iris{background:var(--iris)}.regions .pupil{background:#030405}.regions .cornea{background:linear-gradient(135deg,rgba(255,255,255,.8),rgba(93,199,222,.08))}
    .regions b{margin-left:6px;color:#78cedb;font:700 8px/1 ui-monospace,monospace;letter-spacing:.08em}
    footer{position:absolute;left:40px;right:40px;bottom:10px;display:flex;justify-content:space-between;color:#74929d;font:600 9px/1.4 ui-monospace,monospace;letter-spacing:.09em}
    .truth{color:#e9aa72;text-align:right}
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">STORMGLASS COMMONS // NATIVE CHARACTER H3D</div>
    <h1>Layered Ocular Material Regions</h1>
    <div class="sub">@face(ocular_profile: layered_ocular_v1)<br>SCLERA · IRIS · PUPIL · TRANSPARENT CORNEA</div>
  </header>
  <main id="portraits"></main>
  <footer>
    <div>HEARTHLIGHT BIOREALISM · CHARACTER-WEBGPU SOURCE BUNDLES</div>
    <div class="truth">NO PRESENTATION SHADER · NO WET TEAR FILM · NOT A PRODUCTION EYE</div>
  </footer>
  <script src="${path.basename(bundlePath)}"></script>
</body>
</html>`;
  writeFileSync(htmlPath, html, 'utf8');
  return {
    bundlePath,
    htmlPath,
    bundleSha256: sha256File(bundlePath),
    htmlSha256: sha256(html),
  };
}

async function startServer(root) {
  const server = createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const absolute = path.resolve(root, pathname.replace(/^\/+/, ''));
      if (!absolute.startsWith(path.resolve(root)) || !existsSync(absolute)) {
        response.writeHead(404).end();
        return;
      }
      const content = readFileSync(absolute);
      response.writeHead(200, {
        'Content-Type': absolute.endsWith('.html')
          ? 'text/html; charset=utf-8'
          : 'text/javascript; charset=utf-8',
        'Content-Length': content.length,
      });
      response.end(content);
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return { server, url: `http://127.0.0.1:${address.port}` };
}

async function captureBrowser(surface, options, modules) {
  const { server, url } = await startServer(options.outputDir);
  const externalRequests = [];
  const pageErrors = [];
  let browser;
  try {
    browser = await modules.chromium.launch({
      executablePath: options.browser,
      headless: true,
      args: [
        '--use-angle=d3d11',
        '--ignore-gpu-blocklist',
        '--enable-gpu',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });
    const page = await browser.newPage({
      viewport: { width: 1800, height: 720 },
      deviceScaleFactor: 1,
    });
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('request', (request) => {
      const requestUrl = new URL(request.url());
      if (requestUrl.hostname !== '127.0.0.1') {
        externalRequests.push(request.url());
      }
    });
    await page.goto(`${url}/${path.basename(surface.htmlPath)}`, {
      waitUntil: 'load',
      timeout: 60_000,
    });
    await page.waitForFunction(() => window.__H3D_READY__ || window.__H3D_ERROR__, null, {
      timeout: 60_000,
    });
    const browserError = await page.evaluate(() => window.__H3D_ERROR__ || null);
    if (browserError) throw new Error(browserError);
    const result = await page.evaluate(() => window.__H3D_RESULT__);
    if (!/NVIDIA/i.test(result.gpu.renderer) || !/(Direct3D11|D3D11)/i.test(result.gpu.renderer)) {
      throw new Error(`hardware D3D11 renderer required, received ${result.gpu.renderer}`);
    }
    if (
      result.ocularProfile !== 'layered-ocular-v1' ||
      result.ocularMaterialGroupCount !== 8 ||
      result.presentationShaderOverrideUsed !== false
    ) {
      throw new Error('browser ocular material contract drifted');
    }
    if (externalRequests.length || pageErrors.length) {
      throw new Error(
        `browser purity failure: external=${externalRequests.length} pageErrors=${pageErrors.length}`
      );
    }
    mkdirSync(path.dirname(options.heroOutput), { recursive: true });
    await page.screenshot({
      path: options.heroOutput,
      type: 'png',
      fullPage: false,
    });
    return {
      ...result,
      browserVersion: browser.version(),
      externalRequests,
      pageErrors,
      screenshot: {
        path: path.relative(options.root, options.heroOutput).replaceAll('\\', '/'),
        sha256: sha256File(options.heroOutput),
        bytes: statSync(options.heroOutput).size,
        width: 1800,
        height: 720,
      },
    };
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    root: ROOT,
    holoScriptRoot: DEFAULT_HOLOSCRIPT_ROOT,
    outputDir: path.join(ROOT, OUTPUT_REL),
    heroOutput: path.join(ROOT, HERO_REL),
    browser: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    compileOnly: false,
    requireManifest: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--compile-only') options.compileOnly = true;
    else if (arg === '--require-manifest') options.requireManifest = true;
    else if (arg === '--browser') options.browser = argv[++index];
    else if (arg === '--output-dir') {
      options.outputDir = path.resolve(argv[++index]);
    } else if (arg === '--hero-output') {
      options.heroOutput = path.resolve(argv[++index]);
    }
  }
  return options;
}

function validateManifest(root) {
  const manifestPath = path.join(root, MANIFEST_REL);
  if (!existsSync(manifestPath)) {
    return { status: 'missing', errors: ['manifest missing'] };
  }
  const text = readFileSync(manifestPath, 'utf8');
  const bindings = [
    [SOURCE_REL, /sourceSha256:\s*"([0-9a-f]{64})"/],
    [POLICY_REL, /policySha256:\s*"([0-9a-f]{64})"/],
    [SEED_REL, /seedSha256:\s*"([0-9a-f]{64})"/],
    [
      'scripts/check-hololand-model-village-character-appearance-h3d.mjs',
      /checkerSha256:\s*"([0-9a-f]{64})"/,
    ],
    [HERO_REL, /heroSha256:\s*"([0-9a-f]{64})"/],
  ];
  const errors = [];
  for (const [relative, pattern] of bindings) {
    const match = text.match(pattern);
    const absolute = path.join(root, relative);
    if (!match || !existsSync(absolute) || match[1] !== sha256File(absolute)) {
      errors.push(`${relative} manifest binding drifted`);
    }
  }
  return { status: errors.length ? 'fail' : 'pass', errors };
}

export async function runCharacterAppearanceH3D(options = parseArgs([])) {
  const stack = await parseH3DStack(options.root, options.holoScriptRoot);
  const validation = validateH3DContract(stack, options.root, options.holoScriptRoot);
  if (validation.status !== 'pass') {
    throw new Error(validation.errors.join('\n'));
  }
  const ocular = await compileH3DOcularBundles(stack, validation.plan);
  let visual = null;
  let surface = null;
  if (!options.compileOnly) {
    const modules = await loadWorkspaceModules(options.holoScriptRoot);
    surface = await buildBrowserSurface({ stack, ocular }, options, modules);
    visual = await captureBrowser(surface, options, modules);
  }
  const manifest = options.requireManifest
    ? validateManifest(options.root)
    : { status: 'not-required', errors: [] };
  if (manifest.status === 'fail' || manifest.status === 'missing') {
    throw new Error(manifest.errors.join('\n'));
  }
  const receipt = {
    schema: 'hololand.model-village.character-appearance-h3d-witness.v1',
    status: 'pass',
    generatedAt: new Date().toISOString(),
    source: {
      path: SOURCE_REL,
      sha256: sha256(stack.sourceText),
      upstreamHoloScriptCommit: stack.contract.metadata.upstreamHoloScriptCommit,
    },
    policy: { path: POLICY_REL, sha256: sha256(stack.policyText) },
    seed: { path: SEED_REL, sha256: sha256(stack.seedText) },
    native: {
      bundleCount: ocular.native.records.flatMap((record) => record.tiers).length,
      expressionReceiptCount: ocular.native.expressionBundles.length,
      topology: 'neutral-anatomical-v2',
      ocularProfile: 'layered-ocular-v1',
      ocularRegions: EXPECTED_REGIONS,
      ocularGroupsPerBundle: 8,
      groupsPerRegion: 2,
      visualHairLod: 2,
      ocularVertexDelta: ocular.ocularVertexDelta,
      ocularTriangleDelta: ocular.ocularTriangleDelta,
      legacyVertexCount: ocular.legacyVertexCount,
      bundles: ocular.native.records.map((record) => ({
        personaId: record.personaId,
        tiers: record.tiers.map(({ bundle, ...tier }) => tier),
      })),
    },
    visual,
    surface,
    manifest,
    boundaries: {
      presentationShaderOverrideUsed: false,
      productionEyeCompleteClaimed: false,
      productionTearFilmClaimed: false,
      scleraVascularAtlasClaimed: false,
      anatomicalEyeAccuracyClaimed: false,
      scanDerivedEyeClaimed: false,
      photorealismClaimed: false,
      biometricLikenessClaimed: false,
      canonicalWrites: 0,
      residentObservationWrites: 0,
      modelCalls: 0,
      externalNetworkRequests: visual?.externalRequests.length || 0,
    },
  };
  receipt.receiptSha256 = sha256(JSON.stringify(canonical(receipt)));
  mkdirSync(options.outputDir, { recursive: true });
  const receiptPath = path.join(options.outputDir, 'character-appearance-h3d-witness.json');
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return { receipt, receiptPath };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runCharacterAppearanceH3D(parseArgs())
    .then(({ receipt, receiptPath }) => {
      console.error(`[H3D] PASS ${receipt.receiptSha256}`);
      console.error(`[H3D] receipt ${receiptPath}`);
    })
    .catch((error) => {
      console.error(`[H3D] FAIL ${error?.stack || error}`);
      process.exitCode = 1;
    });
}
