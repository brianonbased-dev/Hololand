#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import {
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
  canonicalJson,
  runPhysicsCheck,
} from './check-hololand-model-village-physics.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SCHEMA = 'hololand.model-village.rendering-witness.v0.1.0';
const DEFAULT_OUTPUT_DIR = path.join(
  REPO_ROOT,
  '.tmp',
  'hololand',
  'model-village',
  'rendering-witness',
);
const PROJECTION_SOURCE =
  'source/layers/vr/frontier/model-village/model-village-observer-projection.holo';
const CALIBRATION_SOURCE =
  'source/layers/vr/frontier/model-village/model-village-render-calibration.holo';
const REQUIRED_AUTHORED_MATERIAL_PROPERTIES = Object.freeze([
  'color',
  'metalness',
  'roughness',
]);
const MATERIAL_EFFECTIVE_DEFAULTS = Object.freeze({
  type: 'MeshPhysicalMaterial',
  color: '#8aa0b5',
  metalness: 0,
  roughness: 0.6,
  clearcoat: 0,
  clearcoatRoughness: 0,
  transmission: 0,
  thickness: 0,
  ior: 1.5,
  opacity: 1,
  transparent: false,
  emissive: '#000000',
  emissiveIntensity: 0,
  sheen: 0,
  sheenColor: '#000000',
  anisotropy: 0,
  envMapIntensity: 1,
  side: 0,
  depthWrite: true,
});
const MATERIAL_SOURCE_PROPERTIES = Object.freeze(
  Object.keys(MATERIAL_EFFECTIVE_DEFAULTS).filter(
    (property) => property !== 'type' && property !== 'side' && property !== 'depthWrite',
  ),
);
const ALLOWED_MATERIAL_PRESENTATION_OVERRIDES = Object.freeze({
  AdmittedChuteShell: Object.freeze({
    scene: 'projection',
    sourceBasis: Object.freeze({
      presentationRole: 'admitted_gravity_chute',
      decorativeNonCollider: true,
    }),
    values: Object.freeze({
      transparent: true,
      opacity: 0.34,
      side: 2,
      depthWrite: false,
    }),
    disclosure: 'decorative admitted chute shell presentation',
  }),
  BlockedChuteShell: Object.freeze({
    scene: 'projection',
    sourceBasis: Object.freeze({
      presentationRole: 'blocked_gravity_chute',
      decorativeNonCollider: true,
    }),
    values: Object.freeze({
      transparent: true,
      opacity: 0.34,
      side: 2,
      depthWrite: false,
    }),
    disclosure: 'decorative blocked chute shell presentation',
  }),
});

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sha256File(filePath) {
  return sha256(readFileSync(filePath));
}

function digest(value) {
  return sha256(Buffer.from(canonicalJson(value), 'utf8'));
}

function normalizePath(value) {
  return String(value).replace(/\\/g, '/');
}

function relativeTo(root, filePath) {
  return normalizePath(path.relative(root, filePath));
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    root: REPO_ROOT,
    holoScriptRoot: process.env.HOLOSCRIPT_ROOT || '',
    browser: process.env.CHROME_PATH || process.env.EDGE_PATH || '',
    outputDir: DEFAULT_OUTPUT_DIR,
    timeoutMs: 60_000,
    canonicalBoundary: true,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };
    if (arg === '--root') args.root = path.resolve(next());
    else if (arg === '--holoscript-root') args.holoScriptRoot = path.resolve(next());
    else if (arg === '--browser') args.browser = next();
    else if (arg === '--output-dir') args.outputDir = path.resolve(next());
    else if (arg === '--timeout-ms') args.timeoutMs = Number.parseInt(next(), 10);
    else if (arg === '--skip-canonical-boundary') args.canonicalBoundary = false;
    else if (arg === '--json') args.json = true;
    else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`HoloLand Model Village rendering truth gate

Usage:
  node scripts/hololand-model-village-rendering-truth-gate.mjs [options]

Options:
  --root <path>                  HoloLand repository root
  --holoscript-root <path>      Built sibling HoloScript repository
  --browser <path>              Chrome or Edge executable
  --output-dir <path>           Evidence directory
  --timeout-ms <number>         Browser readiness timeout
  --skip-canonical-boundary      Skip the canonical before/after physics check
  --json                         Print the full receipt
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs < 10_000) {
    throw new Error(`Invalid --timeout-ms: ${args.timeoutMs}`);
  }
  return args;
}

function resolveHoloScriptRoot(root, explicitRoot) {
  const candidates = [
    explicitRoot,
    process.env.HOLOSCRIPT_ROOT,
    path.resolve(root, '..', 'HoloScript'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (
      existsSync(path.join(candidate, 'packages', 'core', 'dist', 'index.js'))
      && existsSync(path.join(candidate, 'node_modules', 'three', 'build', 'three.module.js'))
      && existsSync(path.join(candidate, 'node_modules', 'esbuild', 'lib', 'main.js'))
    ) {
      return path.resolve(candidate);
    }
  }
  throw new Error(`Built HoloScript core, Three, and esbuild not found: ${candidates.join(', ')}`);
}

function candidateBrowsers(explicitPath) {
  if (explicitPath) return [explicitPath];
  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env.PROGRAMFILES || '';
  const programFilesX86 = process.env['PROGRAMFILES(X86)'] || '';
  return [
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    'chrome',
    'chrome.exe',
    'msedge',
    'msedge.exe',
    'chromium',
  ].filter(Boolean);
}

function resolveBrowser(explicitPath) {
  const candidates = candidateBrowsers(explicitPath);
  for (const candidate of candidates) {
    if (candidate.includes(path.sep) || candidate.includes('/')) {
      if (existsSync(candidate)) return candidate;
      continue;
    }
    const probe = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', [candidate], {
      stdio: 'ignore',
      windowsHide: true,
    });
    if (probe.status === 0) return candidate;
  }
  throw new Error(`No Chrome/Edge/Chromium executable found. Tried: ${candidates.join(', ')}`);
}

function properties(node) {
  return Object.fromEntries((node?.properties || []).map((entry) => [entry.key, entry.value]));
}

function flattenScene(node) {
  if (!node) return [];
  return [node, ...(node.children || []).flatMap(flattenScene)];
}

async function compileSourceContract(root, holoScriptRoot) {
  const corePath = path.join(holoScriptRoot, 'packages', 'core', 'dist', 'index.js');
  const core = await import(pathToFileURL(corePath).href);
  const sourceEntries = [
    ['projection', PROJECTION_SOURCE],
    ['calibration', CALIBRATION_SOURCE],
  ];
  const result = {};
  for (const [key, relativePath] of sourceEntries) {
    const filePath = path.resolve(root, relativePath);
    const sourceText = readFileSync(filePath, 'utf8');
    const parsed = new core.HoloCompositionParser().parse(sourceText);
    if (!parsed.success) {
      throw new Error(`${relativePath} failed HoloCompositionParser: ${canonicalJson(parsed.errors)}`);
    }
    const sceneIr = new core.SceneIRCompiler({ defaultLighting: false })
      .compileComposition(parsed.ast);
    const flat = flattenScene(sceneIr);
    result[key] = {
      relativePath,
      sourceHash: sha256(Buffer.from(sourceText, 'utf8')),
      sceneIrHash: digest(sceneIr),
      metadata: parsed.ast.metadata,
      environment: properties(parsed.ast.environment),
      state: properties(parsed.ast.state),
      sceneIr,
      nodes: flat
        .filter((node) => node.type !== 'group')
        .map((node) => ({
          id: node.id || null,
          type: node.type,
          props: node.props || {},
        })),
      meshCount: flat.filter((node) => node.type === 'mesh').length,
      lightCount: flat.filter((node) => node.type.endsWith('Light')).length,
    };
  }
  return {
    ...result,
    corePath,
    coreHash: sha256File(corePath),
  };
}

export function pngDimensions(buffer) {
  if (
    buffer.length < 24
    || buffer.toString('ascii', 1, 4) !== 'PNG'
    || buffer.toString('ascii', 12, 16) !== 'IHDR'
  ) {
    throw new Error('Screenshot is not a valid PNG with an IHDR header');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

export function classifySoftwareRenderer(glReceipt) {
  const value = [
    glReceipt.maskedVendor,
    glReceipt.maskedRenderer,
    glReceipt.unmaskedVendor,
    glReceipt.unmaskedRenderer,
  ].join(' ').toLowerCase();
  const indicators = [
    'swiftshader',
    'llvmpipe',
    'softpipe',
    'software rasterizer',
    'microsoft basic render',
  ].filter((indicator) => value.includes(indicator));
  return {
    detected: indicators.length > 0,
    indicators,
    basis: 'browser WebGL masked and WEBGL_debug_renderer_info strings',
  };
}

export function inferGraphicsBackend(glReceipt) {
  const renderer = glReceipt.unmaskedRenderer || glReceipt.maskedRenderer || '';
  if (/direct3d\s*12|d3d12/i.test(renderer)) return 'ANGLE Direct3D 12';
  if (/direct3d\s*11|d3d11/i.test(renderer)) return 'ANGLE Direct3D 11';
  if (/vulkan/i.test(renderer)) return 'ANGLE Vulkan';
  if (/metal/i.test(renderer)) return 'ANGLE Metal';
  if (/opengl/i.test(renderer)) return 'OpenGL';
  return 'unclassified WebGL backend';
}

function materialValueMatches(property, expected, observed) {
  if (property === 'color' || property === 'emissive' || property === 'sheenColor') {
    return typeof expected === 'string'
      && typeof observed === 'string'
      && expected.toLowerCase() === observed.toLowerCase();
  }
  if (typeof expected === 'number' && typeof observed === 'number') {
    return Math.abs(expected - observed) <= 1e-12;
  }
  return Object.is(expected, observed);
}

function materialOverrideDisclosures(source, rule) {
  return Object.entries(rule.values).map(([property, effectiveValue]) => ({
    scope: 'presentation',
    property,
    sourceBasis: rule.sourceBasis,
    authoredValue: Object.hasOwn(source, property) ? source[property] : null,
    baselineValue: Object.hasOwn(source, property)
      ? source[property]
      : MATERIAL_EFFECTIVE_DEFAULTS[property],
    effectiveValue,
    disclosure: rule.disclosure,
  }));
}

function materialSourceBasisMatches(node, rule) {
  const sourceProperties = node.props?.properties || {};
  return Object.entries(rule.sourceBasis).every(
    ([property, expected]) => Object.is(sourceProperties[property], expected),
  );
}

export function evaluateMaterialTruth(contracts, materials) {
  const errors = [];
  const expectedMeshes = [];
  for (const scene of ['projection', 'calibration']) {
    for (const node of contracts?.[scene]?.nodes || []) {
      if (node.type === 'mesh') expectedMeshes.push({ scene, node });
    }
  }

  const expectedById = new Map();
  for (const entry of expectedMeshes) {
    const id = entry.node.id;
    if (!id) {
      errors.push(`${entry.scene} contains a mesh without an object id`);
    } else if (expectedById.has(id)) {
      errors.push(`duplicate source mesh id: ${id}`);
    } else {
      expectedById.set(id, entry);
    }
  }

  const observedById = new Map();
  for (const material of Array.isArray(materials) ? materials : []) {
    if (!material?.objectId) {
      errors.push('observed material is missing objectId');
    } else if (observedById.has(material.objectId)) {
      errors.push(`duplicate observed material id: ${material.objectId}`);
    } else {
      observedById.set(material.objectId, material);
    }
  }

  for (const id of observedById.keys()) {
    if (!expectedById.has(id)) errors.push(`material has no source mesh: ${id}`);
  }

  const meshTruth = [];
  for (const [objectId, { scene, node }] of expectedById) {
    const authored = node.props?.materialProps || {};
    const observed = observedById.get(objectId);
    const meshErrors = [];
    if (!observed) {
      meshErrors.push(`material was not observed`);
      errors.push(`${objectId}: material was not observed`);
      meshTruth.push({
        objectId,
        scene,
        status: 'fail',
        authoredProperties: Object.keys(authored).sort(),
        overriddenProperties: [],
        errors: meshErrors,
      });
      continue;
    }

    for (const requiredProperty of REQUIRED_AUTHORED_MATERIAL_PROPERTIES) {
      if (!Object.hasOwn(authored, requiredProperty)) {
        meshErrors.push(`required source property is absent: ${requiredProperty}`);
      }
    }
    for (const property of Object.keys(authored)) {
      if (!MATERIAL_SOURCE_PROPERTIES.includes(property)) {
        meshErrors.push(`unsupported authored material property: ${property}`);
      }
    }

    const observedSourceKeys = Object.keys(observed.source || {}).sort();
    const authoredKeys = Object.keys(authored).sort();
    if (canonicalJson(observedSourceKeys) !== canonicalJson(authoredKeys)) {
      meshErrors.push(
        `receipted source property set mismatch: expected ${authoredKeys.join(',')}; observed ${observedSourceKeys.join(',')}`,
      );
    }
    for (const property of authoredKeys) {
      if (!materialValueMatches(property, authored[property], observed.source?.[property])) {
        meshErrors.push(
          `receipted source mismatch for ${property}: expected ${canonicalJson(authored[property])}; observed ${canonicalJson(observed.source?.[property])}`,
        );
      }
    }

    const overrideRule = ALLOWED_MATERIAL_PRESENTATION_OVERRIDES[objectId] || null;
    let expectedOverrides = [];
    if (overrideRule) {
      if (overrideRule.scene !== scene) {
        meshErrors.push(
          `presentation override is scoped to ${overrideRule.scene}, not ${scene}`,
        );
      }
      if (!materialSourceBasisMatches(node, overrideRule)) {
        meshErrors.push(
          `presentation override source basis is not satisfied: ${canonicalJson(overrideRule.sourceBasis)}`,
        );
      }
      expectedOverrides = materialOverrideDisclosures(authored, overrideRule);
    }
    if (canonicalJson(observed.overrides || []) !== canonicalJson(expectedOverrides)) {
      meshErrors.push(
        `presentation override disclosure mismatch: expected ${canonicalJson(expectedOverrides)}; observed ${canonicalJson(observed.overrides || [])}`,
      );
    }

    const expectedEffective = {
      ...MATERIAL_EFFECTIVE_DEFAULTS,
      ...authored,
      ...(overrideRule?.values || {}),
    };
    for (const [property, expectedValue] of Object.entries(expectedEffective)) {
      if (!materialValueMatches(property, expectedValue, observed.effective?.[property])) {
        meshErrors.push(
          `source-to-effective mismatch for ${property}: expected ${canonicalJson(expectedValue)}; observed ${canonicalJson(observed.effective?.[property])}`,
        );
      }
    }

    for (const error of meshErrors) errors.push(`${objectId}: ${error}`);
    meshTruth.push({
      objectId,
      scene,
      status: meshErrors.length === 0 ? 'pass' : 'fail',
      authoredProperties: authoredKeys,
      overriddenProperties: expectedOverrides.map((entry) => entry.property),
      errors: meshErrors,
    });
  }

  for (const [objectId] of Object.entries(ALLOWED_MATERIAL_PRESENTATION_OVERRIDES)) {
    if (!expectedById.has(objectId)) {
      errors.push(`disclosed presentation override has no source mesh: ${objectId}`);
    }
  }

  return {
    schema: 'hololand.model-village.material-truth.v0.1.0',
    status: errors.length === 0 ? 'pass' : 'fail',
    requiredAuthoredProperties: [...REQUIRED_AUTHORED_MATERIAL_PROPERTIES],
    sourceMaterialProperties: [...MATERIAL_SOURCE_PROPERTIES],
    expectedMeshCount: expectedMeshes.length,
    observedMaterialCount: Array.isArray(materials) ? materials.length : 0,
    allowedPresentationOverrides: ALLOWED_MATERIAL_PRESENTATION_OVERRIDES,
    meshes: meshTruth,
    errors,
  };
}

function browserApplication(THREE, RoomEnvironment, payload) {
  const witness = {
    schema: 'hololand.model-village.browser-render-state.v0.1.0',
    ready: false,
    status: 'booting',
    error: null,
  };
  window.__MODEL_VILLAGE_WITNESS__ = witness;

  try {
    document.documentElement.style.background = '#060b13';
    document.body.innerHTML = `
      <main id="witness-root">
        <canvas id="world-canvas" aria-label="Model Village receipt loom"></canvas>
        <div class="grain"></div>
        <header class="masthead">
          <div class="eyebrow">HOLOLAND // MODEL VILLAGE</div>
          <h1 id="view-title">The Receipt Loom</h1>
          <p id="view-subtitle">A read-only observer projection driven by sealed HoloScript evidence.</p>
        </header>
        <aside class="evidence-card">
          <div class="evidence-kicker">LIVE WITNESS</div>
          <div class="evidence-row"><span>Language</span><strong>.holo + .hsplus + .hs</strong></div>
          <div class="evidence-row"><span>Physics</span><strong>CPU sphere colliders</strong></div>
          <div class="evidence-row"><span>Replay</span><strong id="physics-step">step ${payload.heroFrameStep} / ${payload.physics.fixedSteps}</strong></div>
          <div class="evidence-row"><span>Root</span><strong>${payload.physics.physicsStateHash.slice(0, 12)}</strong></div>
          <div class="truth-chip">OBSERVER ONLY · NO WORLD WRITE</div>
        </aside>
        <footer class="footer">
          <span><i class="dot admitted"></i> admitted route</span>
          <span><i class="dot blocked"></i> blocked route</span>
          <span id="backend-label">probing browser backend…</span>
        </footer>
      </main>
    `;
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
      body {
        color: #edf6ff;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #060b13;
      }
      #witness-root { position: relative; width: 100%; height: 100%; isolation: isolate; }
      #world-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
      .grain {
        position: absolute; inset: 0; pointer-events: none; opacity: .055; z-index: 2;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.75'/%3E%3C/svg%3E");
        mix-blend-mode: soft-light;
      }
      .masthead { position: absolute; z-index: 3; top: 44px; left: 52px; max-width: 620px; text-shadow: 0 2px 24px #020812; }
      .eyebrow { color: #83dff2; font: 700 12px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .18em; }
      h1 { margin: 10px 0 8px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(40px, 5vw, 76px); font-weight: 500; letter-spacing: -.035em; line-height: .98; }
      .masthead p { margin: 0; max-width: 520px; color: #b8c7d9; font-size: 15px; line-height: 1.5; }
      .evidence-card {
        position: absolute; z-index: 3; right: 42px; top: 42px; width: 292px;
        padding: 19px 20px 17px; border: 1px solid rgba(151, 204, 228, .24);
        background: linear-gradient(145deg, rgba(8, 18, 31, .82), rgba(10, 22, 36, .58));
        box-shadow: 0 20px 70px rgba(0, 0, 0, .25), inset 0 1px rgba(255,255,255,.05);
        backdrop-filter: blur(14px); border-radius: 4px;
      }
      .evidence-kicker { color: #f1ad68; font: 700 11px/1 ui-monospace, monospace; letter-spacing: .19em; margin-bottom: 13px; }
      .evidence-row { display: flex; justify-content: space-between; gap: 14px; padding: 8px 0; border-top: 1px solid rgba(255,255,255,.07); font-size: 11px; }
      .evidence-row span { color: #7790a6; text-transform: uppercase; letter-spacing: .09em; }
      .evidence-row strong { color: #dce9f5; font-weight: 600; text-align: right; }
      .truth-chip { margin-top: 13px; padding: 8px 10px; color: #8de0c4; background: rgba(35, 119, 91, .14); border: 1px solid rgba(83, 206, 163, .2); font: 700 10px/1 ui-monospace, monospace; letter-spacing: .08em; text-align: center; }
      .footer {
        position: absolute; z-index: 3; left: 52px; right: 42px; bottom: 29px;
        display: flex; gap: 24px; align-items: center; color: #90a8bb;
        font: 600 10px/1 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase;
      }
      .footer span:last-child { margin-left: auto; color: #b8d4e4; }
      .dot { display: inline-block; width: 7px; height: 7px; margin-right: 7px; border-radius: 50%; box-shadow: 0 0 12px currentColor; }
      .dot.admitted { color: #f3aa59; background: currentColor; }
      .dot.blocked { color: #8b82ff; background: currentColor; }
      @media (max-width: 600px) {
        .masthead { top: 28px; left: 24px; right: 20px; }
        h1 { font-size: 46px; max-width: 290px; }
        .masthead p { max-width: 300px; font-size: 12px; }
        .evidence-card { top: auto; bottom: 62px; left: 20px; right: 20px; width: auto; padding: 14px 15px 12px; }
        .evidence-row { padding: 6px 0; }
        .truth-chip { margin-top: 9px; }
        .footer { left: 22px; right: 22px; bottom: 24px; gap: 14px; }
        .footer span:nth-child(2) { display: none; }
        .footer span:last-child { max-width: 160px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
      }
    `;
    document.head.append(style);

    THREE.ColorManagement.enabled = true;
    const canvas = document.querySelector('#world-canvas');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = payload.rendererContract.exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const glReceipt = {
      contextType: typeof WebGL2RenderingContext !== 'undefined'
        && gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl1',
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      maskedVendor: gl.getParameter(gl.VENDOR),
      maskedRenderer: gl.getParameter(gl.RENDERER),
      unmaskedVendor: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : null,
      unmaskedRenderer: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : null,
      debugRendererInfoAvailable: Boolean(debugInfo),
      contextAttributes: gl.getContextAttributes(),
      capabilities: {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      },
    };
    document.querySelector('#backend-label').textContent =
      `${glReceipt.contextType} · ${glReceipt.unmaskedRenderer || glReceipt.maskedRenderer}`;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 120);
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const roomEnvironment = new RoomEnvironment();
    const environmentTarget = pmrem.fromScene(roomEnvironment, 0.04);
    scene.environment = environmentTarget.texture;
    roomEnvironment.dispose();
    pmrem.dispose();

    const materialCatalog = [];
    const adapterMappings = [];
    const roots = {};
    const meshById = new Map();

    function materialReceipt(id, source, material, overrides) {
      const color = (value) => value && typeof value.getHexString === 'function'
        ? `#${value.getHexString()}`
        : null;
      return {
        objectId: id,
        source,
        effective: {
          type: material.type,
          color: color(material.color),
          metalness: material.metalness,
          roughness: material.roughness,
          clearcoat: material.clearcoat,
          clearcoatRoughness: material.clearcoatRoughness,
          transmission: material.transmission,
          thickness: material.thickness,
          ior: material.ior,
          opacity: material.opacity,
          transparent: material.transparent,
          emissive: color(material.emissive),
          emissiveIntensity: material.emissiveIntensity,
          sheen: material.sheen,
          sheenColor: color(material.sheenColor),
          anisotropy: material.anisotropy,
          envMapIntensity: material.envMapIntensity,
          side: material.side,
          depthWrite: material.depthWrite,
        },
        overrides,
      };
    }

    function makeMaterial(node, sourceScene) {
      const source = node.props.materialProps || {};
      const parameters = {
        color: source.color || '#8aa0b5',
        metalness: source.metalness ?? 0,
        roughness: source.roughness ?? 0.6,
        clearcoat: source.clearcoat ?? 0,
        clearcoatRoughness: source.clearcoatRoughness ?? 0,
        transmission: source.transmission ?? 0,
        thickness: source.thickness ?? 0,
        ior: source.ior ?? 1.5,
        opacity: source.opacity ?? 1,
        transparent: source.transparent ?? false,
        emissive: source.emissive || '#000000',
        emissiveIntensity: source.emissiveIntensity ?? 0,
        sheen: source.sheen ?? 0,
        sheenColor: source.sheenColor || '#000000',
        anisotropy: source.anisotropy ?? 0,
        envMapIntensity: source.envMapIntensity ?? 1,
      };
      const overrideRule = payload.materialContract.allowedPresentationOverrides[node.id];
      const overrideBasisMatches = overrideRule
        && overrideRule.scene === sourceScene
        && Object.entries(overrideRule.sourceBasis).every(
          ([property, expected]) => Object.is(node.props.properties?.[property], expected),
        );
      if (overrideBasisMatches) {
        for (const [property, value] of Object.entries(overrideRule.values)) {
          if (property !== 'side' && property !== 'depthWrite') parameters[property] = value;
        }
      }
      const material = new THREE.MeshPhysicalMaterial(parameters);
      if (overrideBasisMatches) {
        material.side = overrideRule.values.side;
        material.depthWrite = overrideRule.values.depthWrite;
      }
      const overrides = overrideBasisMatches
        ? Object.entries(overrideRule.values).map(([property, effectiveValue]) => ({
          scope: 'presentation',
          property,
          sourceBasis: overrideRule.sourceBasis,
          authoredValue: Object.hasOwn(source, property) ? source[property] : null,
          baselineValue: Object.hasOwn(source, property)
            ? source[property]
            : payload.materialContract.effectiveDefaults[property],
          effectiveValue,
          disclosure: overrideRule.disclosure,
        }))
        : [];
      materialCatalog.push(materialReceipt(node.id, source, material, overrides));
      return material;
    }

    function makeGeometry(node) {
      const args = node.props.args || [];
      const hsType = node.props.hsType || 'box';
      const visualGeometry = node.props.properties?.visualGeometry;
      if (visualGeometry === 'faceted_crystal') {
        adapterMappings.push({
          objectId: node.id,
          sourceGeometry: hsType,
          effectiveGeometry: 'OctahedronGeometry',
          reason: 'source visualGeometry=faceted_crystal',
        });
        return new THREE.OctahedronGeometry(args[0] || 0.5, 0);
      }
      if (hsType === 'sphere') {
        return new THREE.SphereGeometry(args[0] || 0.5, 48, 24);
      }
      if (hsType === 'cylinder') {
        const role = node.props.properties?.presentationRole;
        const openEnded = role === 'admitted_gravity_chute'
          || role === 'blocked_gravity_chute';
        return new THREE.CylinderGeometry(
          args[0] ?? 0.5,
          args[1] ?? 0.5,
          args[2] ?? 1,
          Math.max(args[3] || 32, 32),
          1,
          openEnded,
        );
      }
      if (hsType === 'torus') {
        const majorRadius = node.props.properties?.visualMajorRadius ?? args[0] ?? 0.5;
        const tubeRadius = node.props.properties?.visualTubeRadius ?? args[1] ?? 0.15;
        if (
          node.props.properties?.visualMajorRadius !== undefined
          || node.props.properties?.visualTubeRadius !== undefined
        ) {
          adapterMappings.push({
            objectId: node.id,
            sourceGeometry: hsType,
            effectiveGeometry: 'TorusGeometry',
            reason: 'source visualMajorRadius/visualTubeRadius presentation properties',
            majorRadius,
            tubeRadius,
          });
        }
        return new THREE.TorusGeometry(
          majorRadius,
          tubeRadius,
          Math.max(args[2] || 16, 16),
          Math.max(args[3] || 32, 48),
        );
      }
      if (hsType === 'capsule') {
        return new THREE.CapsuleGeometry(
          args[0] ?? 0.3,
          args[1] ?? 0.5,
          Math.max(args[2] || 8, 8),
          Math.max(args[3] || 16, 16),
        );
      }
      return new THREE.BoxGeometry(1, 1, 1);
    }

    function addLight(root, node) {
      let light;
      if (node.type === 'ambientLight') {
        light = new THREE.AmbientLight(node.props.color || '#ffffff', node.props.intensity ?? 1);
      } else if (node.type === 'directionalLight') {
        light = new THREE.DirectionalLight(node.props.color || '#ffffff', node.props.intensity ?? 1);
        light.position.fromArray(node.props.position || [0, 5, 5]);
        light.castShadow = Boolean(node.props.castShadow || node.props.cast_shadow);
        if (light.castShadow) {
          light.shadow.mapSize.set(2048, 2048);
          light.shadow.camera.left = -12;
          light.shadow.camera.right = 12;
          light.shadow.camera.top = 12;
          light.shadow.camera.bottom = -12;
          light.shadow.camera.near = 0.1;
          light.shadow.camera.far = 40;
          light.shadow.bias = -0.0002;
          light.shadow.normalBias = 0.025;
        }
        light.target.position.set(0, 1.5, 0);
        root.add(light.target);
      } else if (node.type === 'pointLight') {
        light = new THREE.PointLight(
          node.props.color || '#ffffff',
          node.props.intensity ?? 1,
          node.props.range || 0,
          2,
        );
        light.position.fromArray(node.props.position || [0, 5, 0]);
      }
      if (light) {
        light.name = node.id || node.type;
        root.add(light);
      }
    }

    function addTrajectory(root, bodyId, color) {
      const points = [];
      for (let index = 0; index < payload.physics.frames.length; index += 8) {
        const frame = payload.physics.frames[index];
        const body = frame.bodies.find((candidate) => candidate.bodyId === bodyId);
        if (!body) continue;
        points.push(new THREE.Vector3(...body.position));
        if (body.sleeping) break;
      }
      if (points.length < 2) return;
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, Math.max(points.length * 2, 12), 0.028, 6, false),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        }),
      );
      tube.name = `sealed-trajectory-${bodyId}`;
      root.add(tube);
    }

    function buildRoot(contract, rootName, sourceScene) {
      const root = new THREE.Group();
      root.name = rootName;
      for (const node of contract.nodes) {
        if (node.type.endsWith('Light')) {
          addLight(root, node);
          continue;
        }
        if (node.type !== 'mesh') continue;
        const mesh = new THREE.Mesh(makeGeometry(node), makeMaterial(node, sourceScene));
        mesh.name = node.id;
        mesh.position.fromArray(node.props.position || [0, 0, 0]);
        mesh.rotation.fromArray(node.props.rotation || [0, 0, 0]);
        mesh.scale.fromArray(node.props.scale || [1, 1, 1]);
        const nested = node.props.properties || {};
        mesh.castShadow = Boolean(node.props.castShadow ?? nested.castShadow ?? true);
        mesh.receiveShadow = Boolean(node.props.receiveShadow ?? nested.receiveShadow ?? true);
        mesh.userData.sourceNode = node;
        mesh.userData.physicsBodyId = nested.physicsBody?.bodyId || null;
        if (nested.visualGlowColor) {
          const glow = new THREE.PointLight(
            nested.visualGlowColor,
            nested.visualGlowIntensity || 1,
            nested.visualGlowRange || 2,
            2,
          );
          glow.name = `${node.id}-source-authored-glow`;
          mesh.add(glow);
          adapterMappings.push({
            objectId: node.id,
            sourceProperty: 'visualGlowColor/visualGlowIntensity/visualGlowRange',
            effectivePresentation: 'Three PointLight attached to visual token',
          });
        }
        root.add(mesh);
        meshById.set(node.id, mesh);
      }
      return root;
    }

    roots.hero = buildRoot(
      payload.projection,
      'model-village-observer-projection',
      'projection',
    );
    roots.calibration = buildRoot(
      payload.calibration,
      'model-village-render-calibration',
      'calibration',
    );
    scene.add(roots.hero, roots.calibration);
    addTrajectory(roots.hero, 'token-mv-p10-admitted-001', '#ffae57');
    addTrajectory(roots.hero, 'token-mv-p10-blocked-001', '#877dff');

    let activePhysicsFrameStep = payload.heroFrameStep;
    function applyPhysicsFrame(step) {
      const frame = payload.physics.frames.find((candidate) => candidate.step === step);
      if (!frame) throw new Error(`Physics frame ${step} is unavailable`);
      activePhysicsFrameStep = step;
      for (const body of frame.bodies) {
        const mesh = [...meshById.values()].find(
          (candidate) => candidate.userData.physicsBodyId === body.bodyId,
        );
        if (!mesh) continue;
        mesh.position.fromArray(body.position);
        mesh.quaternion.fromArray(body.rotation);
      }
    }
    applyPhysicsFrame(payload.heroFrameStep);

    function percentile(values, quantile) {
      if (values.length === 0) return null;
      const sorted = [...values].sort((a, b) => a - b);
      const index = Math.min(
        sorted.length - 1,
        Math.max(0, Math.ceil(quantile * sorted.length) - 1),
      );
      return sorted[index];
    }

    function summarize(values) {
      return {
        samples: values.length,
        p50Ms: percentile(values, 0.5),
        p95Ms: percentile(values, 0.95),
        p99Ms: percentile(values, 0.99),
        maxMs: values.length ? Math.max(...values) : null,
      };
    }

    function rendererState() {
      return {
        threeRevision: THREE.REVISION,
        outputColorSpace: renderer.outputColorSpace,
        workingColorSpace: THREE.ColorManagement.workingColorSpace,
        toneMapping: renderer.toneMapping === THREE.ACESFilmicToneMapping
          ? 'ACESFilmicToneMapping'
          : String(renderer.toneMapping),
        toneMappingExposure: renderer.toneMappingExposure,
        shadowMapEnabled: renderer.shadowMap.enabled,
        shadowMapType: renderer.shadowMap.type === THREE.PCFSoftShadowMap
          ? 'PCFSoftShadowMap'
          : String(renderer.shadowMap.type),
        pixelRatio: renderer.getPixelRatio(),
        info: {
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          points: renderer.info.render.points,
          lines: renderer.info.render.lines,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          programs: renderer.info.programs?.length ?? null,
        },
      };
    }

    function sceneState(root) {
      let meshes = 0;
      let lights = 0;
      let shadowCasters = 0;
      let shadowReceivers = 0;
      let shadowMapsAllocated = 0;
      root.traverse((object) => {
        if (object.isMesh) {
          meshes += 1;
          if (object.castShadow) shadowCasters += 1;
          if (object.receiveShadow) shadowReceivers += 1;
        }
        if (object.isLight) {
          lights += 1;
          if (object.shadow?.map) shadowMapsAllocated += 1;
        }
      });
      return { meshes, lights, shadowCasters, shadowReceivers, shadowMapsAllocated };
    }

    let activeView = 'hero';
    let activeProfile = 'desktop';
    function applyView(view, profile, physicsFrameStep = payload.heroFrameStep) {
      activeView = view;
      activeProfile = profile;
      roots.hero.visible = view === 'hero';
      roots.calibration.visible = view === 'calibration';
      const contract = view === 'hero' ? payload.projection : payload.calibration;
      const capture = contract.captureViews[profile];
      camera.fov = capture.fov;
      camera.position.fromArray(capture.cameraPosition);
      camera.lookAt(new THREE.Vector3(...capture.cameraTarget));
      camera.updateProjectionMatrix();
      scene.background = new THREE.Color(contract.backgroundColor);
      scene.fog = view === 'hero'
        ? new THREE.FogExp2(contract.backgroundColor, 0.018)
        : new THREE.FogExp2(contract.backgroundColor, 0.012);
      document.querySelector('#view-title').textContent =
        view === 'hero' ? 'The Receipt Loom' : 'Material Truth Lab';
      document.querySelector('#view-subtitle').textContent =
        view === 'hero'
          ? 'A read-only observer projection driven by sealed HoloScript evidence.'
          : 'Neutral WebGL material calibration under a locally bundled procedural environment.';
      document.querySelector('#physics-step').textContent =
        view === 'hero'
          ? `step ${physicsFrameStep} / ${payload.physics.fixedSteps}`
          : `${payload.calibration.expectedSamples.length} source-authored samples`;
      if (view === 'hero') applyPhysicsFrame(physicsFrameStep);
    }

    function resize() {
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();
    applyView('hero', 'desktop');

    const frameIntervals = [];
    const renderSubmitTimes = [];
    let warmupFrames = 0;
    let measuredFrames = 0;
    let lastFrameTime = null;
    const requiredWarmupFrames = 60;
    const requiredMeasuredFrames = 180;

    function snapshot() {
      const currentRoot = activeView === 'hero' ? roots.hero : roots.calibration;
      const sampleIds = materialCatalog
        .filter((entry) => {
          const mesh = meshById.get(entry.objectId);
          return Boolean(mesh?.userData.sourceNode?.props?.properties?.calibrationId);
        })
        .map((entry) => meshById.get(entry.objectId).userData.sourceNode.props.properties.calibrationId);
      return {
        schema: witness.schema,
        ready: witness.ready,
        status: witness.status,
        activeView,
        activeProfile,
        viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
        camera: {
          position: camera.position.toArray(),
          target: (activeView === 'hero' ? payload.projection : payload.calibration)
            .captureViews[activeProfile].cameraTarget,
          fov: camera.fov,
          aspect: camera.aspect,
        },
        gl: glReceipt,
        renderer: rendererState(),
        environment: {
          kind: payload.environment.kind,
          hdri: false,
          localModuleSha256: payload.environment.roomEnvironmentModuleSha256,
          pmremGenerated: Boolean(scene.environment),
          sourceMapping: 'HoloScript metadata -> HoloLand presentation adapter',
        },
        materials: materialCatalog,
        calibrationSampleIds: sampleIds,
        scene: {
          active: sceneState(currentRoot),
          hero: sceneState(roots.hero),
          calibration: sceneState(roots.calibration),
        },
        timings: {
          warmupFrames,
          measuredFrames,
          frameCadence: summarize(frameIntervals),
          cpuRenderSubmit: summarize(renderSubmitTimes),
        },
        physics: {
          physicsStateHash: payload.physics.physicsStateHash,
          replayRoots: payload.physics.replayRoots,
          frameTraceHash: payload.physics.frameTraceHash,
          visualFrameHash: payload.physics.visualFrameHashes[activePhysicsFrameStep],
          visualFrameStep: activePhysicsFrameStep,
          boundBodyIds: [...meshById.values()]
            .map((mesh) => mesh.userData.physicsBodyId)
            .filter(Boolean)
            .sort(),
          framesAvailable: payload.physics.frames.length,
        },
        adapterMappings,
      };
    }

    window.__MODEL_VILLAGE_SET_VIEW__ = async (view, profile, physicsFrameStep) => {
      applyView(view, profile, physicsFrameStep);
      resize();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return snapshot();
    };
    window.__MODEL_VILLAGE_SNAPSHOT__ = snapshot;

    function renderLoop(time) {
      if (lastFrameTime !== null && warmupFrames >= requiredWarmupFrames
          && measuredFrames < requiredMeasuredFrames) {
        frameIntervals.push(time - lastFrameTime);
      }
      lastFrameTime = time;
      const start = performance.now();
      renderer.render(scene, camera);
      const submitTime = performance.now() - start;
      if (warmupFrames < requiredWarmupFrames) {
        warmupFrames += 1;
      } else if (measuredFrames < requiredMeasuredFrames) {
        renderSubmitTimes.push(submitTime);
        measuredFrames += 1;
      }
      if (measuredFrames >= requiredMeasuredFrames && !witness.ready) {
        witness.ready = true;
        witness.status = 'pass';
        witness.snapshot = snapshot();
      }
      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
  } catch (error) {
    witness.ready = true;
    witness.status = 'fail';
    witness.error = error?.stack || error?.message || String(error);
    console.error(witness.error);
  }
}

function createBrowserPayload(contracts, physicsReceipt, environmentProvenance) {
  const project = (contract) => ({
    nodes: contract.nodes,
    backgroundColor: contract.environment.backgroundColor,
    captureViews: contract.state.captureViews,
    expectedSamples: contract.state.expectedSamples || [],
  });
  const heroFrameStep = 42;
  const settledFrameStep = physicsReceipt.physics.fixedSteps - 1;
  const visualFrameHashes = Object.fromEntries(
    [heroFrameStep, settledFrameStep].map((step) => [
      step,
      digest(physicsReceipt.physics.firstRun.frames.find(
        (frame) => frame.step === step,
      )),
    ]),
  );
  return {
    schema: 'hololand.model-village.render-payload.v0.1.0',
    projection: project(contracts.projection),
    calibration: project(contracts.calibration),
    physics: {
      fixedSteps: physicsReceipt.physics.fixedSteps,
      physicsStateHash: physicsReceipt.physics.firstRun.physicsStateHash,
      replayRoots: physicsReceipt.physics.replayRoots,
      frames: physicsReceipt.physics.firstRun.frames,
      frameTraceHash: physicsReceipt.physics.firstRun.digests.frameTrace,
      visualFrameHashes,
    },
    heroFrameStep,
    settledFrameStep,
    rendererContract: {
      outputColorSpace: contracts.calibration.metadata.outputColorSpaceTarget,
      toneMapping: contracts.calibration.metadata.toneMappingTarget,
      exposure: contracts.calibration.metadata.exposureTarget,
      shadowMap: contracts.calibration.metadata.shadowMapTarget,
    },
    materialContract: {
      effectiveDefaults: MATERIAL_EFFECTIVE_DEFAULTS,
      allowedPresentationOverrides: ALLOWED_MATERIAL_PRESENTATION_OVERRIDES,
    },
    environment: environmentProvenance,
  };
}

async function buildBrowserSurface(outputDir, holoScriptRoot, payload) {
  const esbuildPath = path.join(holoScriptRoot, 'node_modules', 'esbuild', 'lib', 'main.js');
  const esbuild = await import(pathToFileURL(esbuildPath).href);
  const bundlePath = path.join(outputDir, 'model-village-render-bundle.js');
  const htmlPath = path.join(outputDir, 'model-village-render-witness.html');
  const appSource = [
    "import * as THREE from 'three';",
    "import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';",
    `const PAYLOAD = ${JSON.stringify(payload)};`,
    `(${browserApplication.toString()})(THREE, RoomEnvironment, PAYLOAD);`,
  ].join('\n');
  await esbuild.build({
    stdin: {
      contents: appSource,
      resolveDir: holoScriptRoot,
      sourcefile: 'model-village-render-entry.js',
      loader: 'js',
    },
    outfile: bundlePath,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome120'],
    sourcemap: false,
    minify: false,
    nodePaths: [path.join(holoScriptRoot, 'node_modules')],
    logLevel: 'silent',
  });
  writeFileSync(
    htmlPath,
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HoloLand Model Village Rendering Witness</title>
</head>
<body>
  <script src="./model-village-render-bundle.js"></script>
</body>
</html>
`,
    'utf8',
  );
  return {
    bundlePath,
    bundleHash: sha256File(bundlePath),
    htmlPath,
    htmlHash: sha256File(htmlPath),
    appSourceHash: sha256(Buffer.from(appSource, 'utf8')),
    esbuildPath,
    esbuildHash: sha256File(esbuildPath),
  };
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchJson(url, timeoutMs = 2_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForDebuggerTarget(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
      const target = targets.find((candidate) => (
        candidate.type === 'page' && candidate.webSocketDebuggerUrl
      ));
      if (target) return target;
    } catch (error) {
      lastError = error;
    }
    await delay(200);
  }
  throw new Error(`Timed out waiting for browser debugger target: ${lastError?.message || 'none'}`);
}

function waitForEvent(client, method, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${method}`));
    }, timeoutMs);
    const cleanup = client.onEvent((message) => {
      if (message.method === method) {
        clearTimeout(timeout);
        cleanup();
        resolve(message.params || {});
      }
    });
  });
}

async function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const eventHandlers = new Set();
  let nextId = 1;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out opening CDP socket')), 10_000);
    socket.addEventListener('open', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
    socket.addEventListener('error', (event) => {
      clearTimeout(timeout);
      reject(new Error(`CDP socket error: ${event.message || 'unknown'}`));
    }, { once: true });
  });
  socket.addEventListener('message', (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(item.timeout);
      if (message.error) item.reject(new Error(`${item.method}: ${message.error.message}`));
      else item.resolve(message.result || {});
      return;
    }
    for (const handler of eventHandlers) handler(message);
  });
  socket.addEventListener('close', () => {
    for (const item of pending.values()) {
      clearTimeout(item.timeout);
      item.reject(new Error('CDP socket closed'));
    }
    pending.clear();
  });
  return {
    send(method, params = {}, timeoutMs = 30_000) {
      const id = nextId;
      nextId += 1;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`${method} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        pending.set(id, { method, resolve, reject, timeout });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    onEvent(handler) {
      eventHandlers.add(handler);
      return () => eventHandlers.delete(handler);
    },
    close() {
      if (socket.readyState === WebSocket.OPEN) socket.close();
    },
  };
}

async function evaluate(client, expression, timeoutMs = 30_000) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }, timeoutMs);
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description
      || result.exceptionDetails.text;
    throw new Error(`Browser evaluation failed: ${description}`);
  }
  return result.result?.value;
}

async function waitForExpression(client, expression, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastValue = null;
  while (Date.now() < deadline) {
    lastValue = await evaluate(client, expression, 5_000).catch(() => null);
    if (lastValue) return lastValue;
    await delay(200);
  }
  throw new Error(`Timed out waiting for browser expression. Last value: ${JSON.stringify(lastValue)}`);
}

async function waitForExit(child, timeoutMs = 2_000) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function removeDirectoryBestEffort(directory) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      rmSync(directory, { recursive: true, force: true });
      return;
    } catch {
      await delay(150 * (attempt + 1));
    }
  }
}

async function captureView(client, outputDir, capture) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: capture.width,
    height: capture.height,
    deviceScaleFactor: 1,
    mobile: capture.mobile,
    screenWidth: capture.width,
    screenHeight: capture.height,
  });
  const state = await evaluate(
    client,
    `window.__MODEL_VILLAGE_SET_VIEW__(${JSON.stringify(capture.view)}, ${JSON.stringify(capture.profile)}, ${JSON.stringify(capture.frameStep)})`,
    20_000,
  );
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
    clip: {
      x: 0,
      y: 0,
      width: capture.width,
      height: capture.height,
      scale: 1,
    },
  }, 30_000);
  const buffer = Buffer.from(screenshot.data, 'base64');
  const filePath = path.join(outputDir, capture.fileName);
  writeFileSync(filePath, buffer);
  return {
    id: capture.id,
    view: capture.view,
    profile: capture.profile,
    filePath,
    sha256: sha256(buffer),
    bytes: buffer.length,
    dimensions: pngDimensions(buffer),
    browserState: state,
  };
}

async function runBrowserWitness({
  browserPath,
  htmlPath,
  outputDir,
  timeoutMs,
  heroFrameStep,
  settledFrameStep,
}) {
  const profileDir = mkdtempSync(path.join(tmpdir(), 'hololand-model-village-render-'));
  const port = 21_000 + Math.floor(Math.random() * 20_000);
  const launchFlags = [
    '--headless=new',
    '--use-angle=d3d11',
    '--ignore-gpu-blocklist',
    '--enable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--window-size=1600,900',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-dev-shm-usage',
    '--disable-features=Translate,MediaRouter',
    '--allow-file-access-from-files',
    'about:blank',
  ];
  const browser = spawn(browserPath, launchFlags, {
    cwd: path.dirname(htmlPath),
    stdio: 'ignore',
    windowsHide: true,
  });
  const consoleMessages = [];
  const exceptions = [];
  const networkRequests = [];
  let client;
  try {
    const target = await waitForDebuggerTarget(port, 15_000);
    client = await createCdpClient(target.webSocketDebuggerUrl);
    client.onEvent((message) => {
      if (message.method === 'Runtime.consoleAPICalled') {
        consoleMessages.push({
          level: message.params.type,
          text: (message.params.args || [])
            .map((arg) => arg.value ?? arg.description ?? '')
            .join(' '),
        });
      } else if (message.method === 'Runtime.exceptionThrown') {
        exceptions.push({
          text: message.params.exceptionDetails?.text || '',
          description: message.params.exceptionDetails?.exception?.description || '',
        });
      } else if (message.method === 'Network.requestWillBeSent') {
        networkRequests.push({
          url: message.params.request?.url || '',
          type: message.params.type || '',
        });
      }
    });
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await client.send('Network.enable');
    const version = await client.send('Browser.getVersion');
    const loaded = waitForEvent(client, 'Page.loadEventFired', timeoutMs);
    await client.send('Page.navigate', { url: pathToFileURL(htmlPath).href });
    await loaded;
    await waitForExpression(
      client,
      'window.__MODEL_VILLAGE_WITNESS__?.ready === true',
      timeoutMs,
    );
    const boot = await evaluate(client, 'window.__MODEL_VILLAGE_WITNESS__');
    if (boot.status !== 'pass') {
      throw new Error(`Browser render witness failed during boot: ${boot.error || boot.status}`);
    }
    const captures = [];
    for (const capture of [
      {
        id: 'hero-desktop',
        view: 'hero',
        profile: 'desktop',
        width: 1600,
        height: 900,
        mobile: false,
        frameStep: heroFrameStep,
        fileName: 'model-village-hero-1600x900.png',
      },
      {
        id: 'hero-portrait',
        view: 'hero',
        profile: 'portrait',
        width: 390,
        height: 844,
        mobile: true,
        frameStep: heroFrameStep,
        fileName: 'model-village-hero-390x844.png',
      },
      {
        id: 'hero-settled',
        view: 'hero',
        profile: 'desktop',
        width: 1600,
        height: 900,
        mobile: false,
        frameStep: settledFrameStep,
        fileName: 'model-village-hero-settled-1600x900.png',
      },
      {
        id: 'calibration-desktop',
        view: 'calibration',
        profile: 'desktop',
        width: 1600,
        height: 900,
        mobile: false,
        fileName: 'model-village-calibration-1600x900.png',
      },
    ]) {
      captures.push(await captureView(client, outputDir, capture));
    }
    const state = await evaluate(client, 'window.__MODEL_VILLAGE_SNAPSHOT__()');
    return {
      version,
      launchFlags,
      state,
      captures,
      consoleMessages,
      exceptions,
      networkRequests,
    };
  } finally {
    if (client) client.close();
    if (!browser.killed) browser.kill();
    await waitForExit(browser);
    await removeDirectoryBestEffort(profileDir);
  }
}

function allTrue(value) {
  return Object.values(value).every(Boolean);
}

export async function runRenderingGate(options = {}) {
  const root = path.resolve(options.root || REPO_ROOT);
  const outputDir = path.resolve(options.outputDir || DEFAULT_OUTPUT_DIR);
  const holoScriptRoot = resolveHoloScriptRoot(root, options.holoScriptRoot);
  const browserPath = resolveBrowser(options.browser);
  const timeoutMs = options.timeoutMs || 60_000;
  const canonicalBoundary = options.canonicalBoundary !== false;
  mkdirSync(outputDir, { recursive: true });

  const physicsOutput = path.join(outputDir, 'physics-witness.json');
  const { receipt: physicsReceipt } = await runPhysicsCheck({
    root,
    holoScriptRoot,
    output: physicsOutput,
    canonicalBoundary,
  });
  const contracts = await compileSourceContract(root, holoScriptRoot);
  const threePath = path.join(holoScriptRoot, 'node_modules', 'three', 'build', 'three.module.js');
  const threePackagePath = path.join(holoScriptRoot, 'node_modules', 'three', 'package.json');
  const roomEnvironmentPath = path.join(
    holoScriptRoot,
    'node_modules',
    'three',
    'examples',
    'jsm',
    'environments',
    'RoomEnvironment.js',
  );
  const threePackage = JSON.parse(readFileSync(threePackagePath, 'utf8'));
  const environmentProvenance = {
    kind: contracts.calibration.metadata.environmentKind,
    hdri: false,
    roomEnvironmentModule: relativeTo(holoScriptRoot, roomEnvironmentPath),
    roomEnvironmentModuleSha256: sha256File(roomEnvironmentPath),
    threeModuleSha256: sha256File(threePath),
    threeVersion: threePackage.version,
    networkAssetFetches: 0,
  };
  const payload = createBrowserPayload(contracts, physicsReceipt, environmentProvenance);
  const build = await buildBrowserSurface(outputDir, holoScriptRoot, payload);
  const browser = await runBrowserWitness({
    browserPath,
    htmlPath: build.htmlPath,
    outputDir,
    timeoutMs,
    heroFrameStep: payload.heroFrameStep,
    settledFrameStep: payload.settledFrameStep,
  });
  const softwareFallback = classifySoftwareRenderer(browser.state.gl);
  const backendObserved = inferGraphicsBackend(browser.state.gl);
  const materialTruth = evaluateMaterialTruth(contracts, browser.state.materials);
  const externalNetworkRequests = browser.networkRequests.filter(
    (request) => /^https?:/i.test(request.url),
  );
  const screenshotEvidence = browser.captures.map((capture) => ({
    id: capture.id,
    view: capture.view,
    profile: capture.profile,
    path: relativeTo(root, capture.filePath),
    sha256: capture.sha256,
    bytes: capture.bytes,
    dimensions: capture.dimensions,
    camera: capture.browserState.camera,
    viewport: capture.browserState.viewport,
    visualFrameSha256: capture.view === 'hero'
      ? capture.browserState.physics.visualFrameHash
      : null,
  }));
  const expectedCalibrationSamples = contracts.calibration.state.expectedSamples;
  const calibrationSamples = [...browser.state.calibrationSampleIds].sort();
  const assertions = {
    holoSourcesParsedAndCompiled:
      contracts.projection.meshCount === 16
      && contracts.calibration.meshCount === 10,
    sourceHashesMatchPhysicsReceipt:
      contracts.projection.sourceHash === physicsReceipt.sourceHashes.projection
      && contracts.calibration.sourceHash === physicsReceipt.sourceHashes.calibration,
    sceneIrAndAdapterAreReceipted:
      Boolean(contracts.projection.sceneIrHash)
      && Boolean(contracts.calibration.sceneIrHash)
      && Boolean(build.bundleHash),
    physicsReceiptPassed: physicsReceipt.status === 'pass',
    canonicalBoundaryPreservedWhenEnabled:
      !canonicalBoundary
      || physicsReceipt.canonicalBoundary.observedBoundaryMatch === true,
    physicsFramesBoundToBothTokens:
      browser.state.physics.framesAvailable === physicsReceipt.physics.fixedSteps
      && canonicalJson(browser.state.physics.boundBodyIds)
        === canonicalJson([
          'admitted-catch-floor',
          'blocked-catch-floor',
          'token-mv-p10-admitted-001',
          'token-mv-p10-blocked-001',
        ]),
    physicsFrameTraceBound:
      browser.state.physics.frameTraceHash
        === physicsReceipt.physics.firstRun.digests.frameTrace
      && Object.values(payload.physics.visualFrameHashes)
        .includes(browser.state.physics.visualFrameHash)
      && browser.captures
        .filter((capture) => capture.view === 'hero')
        .every((capture) => (
          capture.browserState.physics.visualFrameHash
            === payload.physics.visualFrameHashes[
              capture.browserState.physics.visualFrameStep
            ]
        )),
    actualWebgl2Context:
      browser.state.gl.contextType === 'webgl2'
      && /WebGL 2\.0/i.test(browser.state.gl.version),
    unmaskedRendererObserved: Boolean(browser.state.gl.unmaskedRenderer),
    noKnownSoftwareFallback: softwareFallback.detected === false,
    srgbOutputApplied:
      browser.state.renderer.outputColorSpace === 'srgb'
      && /srgb/i.test(browser.state.renderer.workingColorSpace),
    acesToneMappingApplied:
      browser.state.renderer.toneMapping === 'ACESFilmicToneMapping'
      && browser.state.renderer.toneMappingExposure
        === contracts.calibration.metadata.exposureTarget,
    pcfSoftShadowsApplied:
      browser.state.renderer.shadowMapEnabled === true
      && browser.state.renderer.shadowMapType === 'PCFSoftShadowMap'
      && browser.state.scene.hero.shadowCasters > 0
      && browser.state.scene.hero.shadowReceivers > 0
      && browser.state.scene.hero.shadowMapsAllocated > 0,
    localProceduralEnvironmentApplied:
      browser.state.environment.hdri === false
      && browser.state.environment.pmremGenerated === true
      && browser.state.environment.localModuleSha256
        === environmentProvenance.roomEnvironmentModuleSha256,
    calibrationSamplesComplete:
      canonicalJson(calibrationSamples)
        === canonicalJson([...expectedCalibrationSamples].sort()),
    effectiveMaterialsRecorded:
      browser.state.materials.length
        === contracts.projection.meshCount + contracts.calibration.meshCount
      && browser.state.materials.every((entry) => entry.effective.type === 'MeshPhysicalMaterial'),
    sourceMaterialsMatchEffective:
      materialTruth.status === 'pass'
      && materialTruth.expectedMeshCount
        === contracts.projection.meshCount + contracts.calibration.meshCount
      && materialTruth.observedMaterialCount === materialTruth.expectedMeshCount,
    frameCadencePercentilesRecorded:
      browser.state.timings.frameCadence.samples >= 170
      && Number.isFinite(browser.state.timings.frameCadence.p95Ms)
      && Number.isFinite(browser.state.timings.frameCadence.p99Ms),
    renderSubmitPercentilesRecorded:
      browser.state.timings.cpuRenderSubmit.samples >= 170
      && Number.isFinite(browser.state.timings.cpuRenderSubmit.p50Ms)
      && Number.isFinite(browser.state.timings.cpuRenderSubmit.p95Ms),
    exactDesktopAndPortraitCaptures:
      screenshotEvidence.some((capture) => (
        capture.id === 'hero-desktop'
        && capture.dimensions.width === 1600
        && capture.dimensions.height === 900
      ))
      && screenshotEvidence.some((capture) => (
        capture.id === 'hero-portrait'
        && capture.dimensions.width === 390
        && capture.dimensions.height === 844
      )),
    calibrationCapturePresent:
      screenshotEvidence.some((capture) => (
        capture.id === 'calibration-desktop'
        && capture.dimensions.width === 1600
        && capture.dimensions.height === 900
      )),
    settledContactCapturePresent:
      screenshotEvidence.some((capture) => (
        capture.id === 'hero-settled'
        && capture.dimensions.width === 1600
        && capture.dimensions.height === 900
        && capture.visualFrameSha256
          === payload.physics.visualFrameHashes[payload.settledFrameStep]
      )),
    screenshotsContainPixels:
      screenshotEvidence.every((capture) => capture.bytes > 25_000),
    noExternalNetworkAssetsFetched: externalNetworkRequests.length === 0,
    browserConsoleHasNoErrors:
      browser.exceptions.length === 0
      && browser.consoleMessages.every((message) => message.level !== 'error'),
  };
  const receiptCore = {
    schema: SCHEMA,
    source: {
      parser: 'HoloCompositionParser',
      compiler: 'SceneIRCompiler',
      projection: {
        path: contracts.projection.relativePath,
        sha256: contracts.projection.sourceHash,
        sceneIrSha256: contracts.projection.sceneIrHash,
        meshCount: contracts.projection.meshCount,
        lightCount: contracts.projection.lightCount,
      },
      calibration: {
        path: contracts.calibration.relativePath,
        sha256: contracts.calibration.sourceHash,
        sceneIrSha256: contracts.calibration.sceneIrHash,
        meshCount: contracts.calibration.meshCount,
        lightCount: contracts.calibration.lightCount,
      },
      sourceSemanticsRewritten: false,
      presentationAdapterOwns: [
        'Three object construction from SceneIR',
        'camera application from parsed HoloScript state',
        'procedural local environment and PMREM',
        'source-declared faceted token geometry',
        'decorative chute transparency',
        'sealed-physics trajectory visualization',
        'observer-only HTML evidence chrome',
      ],
    },
    physics: {
      receipt: relativeTo(root, physicsOutput),
      receiptHash: physicsReceipt.receipt.receiptHash,
      physicsStateHash: physicsReceipt.physics.firstRun.physicsStateHash,
      replayRoots: physicsReceipt.physics.replayRoots,
      frameTraceSha256: physicsReceipt.physics.firstRun.digests.frameTrace,
      visualFrameSha256: payload.physics.visualFrameHashes[payload.heroFrameStep],
      settledFrameSha256: payload.physics.visualFrameHashes[payload.settledFrameStep],
      visualFrameStep: payload.heroFrameStep,
      colliderDisclosure: 'faceted visual meshes bound to sphere colliders',
      canonicalBoundary: physicsReceipt.canonicalBoundary,
    },
    renderer: {
      route: 'HoloScript sources -> HoloCompositionParser -> SceneIRCompiler -> dedicated HoloLand Three/WebGL adapter',
      existingReactThreeAdapterUsed: false,
      threeVersion: environmentProvenance.threeVersion,
      threeModuleSha256: environmentProvenance.threeModuleSha256,
      environment: {
        ...environmentProvenance,
        pmremGenerated: browser.state.environment.pmremGenerated,
      },
      effective: browser.state.renderer,
      materials: browser.state.materials,
      materialTruth,
      scene: browser.state.scene,
      adapterMappings: browser.state.adapterMappings,
      generatedSurface: {
        html: relativeTo(root, build.htmlPath),
        htmlSha256: build.htmlHash,
        bundle: relativeTo(root, build.bundlePath),
        bundleSha256: build.bundleHash,
        appSourceSha256: build.appSourceHash,
      },
    },
    browser: {
      executable: normalizePath(browserPath),
      product: browser.version.product,
      userAgent: browser.version.userAgent,
      protocolVersion: browser.version.protocolVersion,
      jsVersion: browser.version.jsVersion,
      launchFlags: browser.launchFlags,
      gl: browser.state.gl,
      backendObserved,
      softwareFallback,
      timings: browser.state.timings,
      consoleMessages: browser.consoleMessages,
      exceptions: browser.exceptions,
      networkRequests: browser.networkRequests,
      externalNetworkRequests,
    },
    screenshots: screenshotEvidence,
    assertions,
    toolchain: {
      nodeVersion: process.version,
      holoScriptRoot: relativeTo(root, holoScriptRoot),
      holoScriptCoreSha256: contracts.coreHash,
      esbuildSha256: build.esbuildHash,
      checkerSha256: sha256File(SCRIPT_PATH),
    },
    claimBoundary: {
      observed: [
        'local HoloScript .holo sources parsed and compiled to SceneIR',
        'sealed HoloScript CPU physics frames projected into faceted visual tokens',
        'hardware-backed WebGL2 browser strings with no known software-renderer indicator',
        'source-to-effective Three MeshPhysicalMaterial values with explicitly disclosed presentation-only chute overrides, sRGB output, ACES filmic tone mapping, PCF soft shadows, and a local procedural RoomEnvironment/PMREM',
        'desktop, portrait, and calibration screenshots with frame-cadence and CPU render-submit percentiles',
      ],
      notObserved: [
        'HDRI asset use',
        'WebGPU rendering',
        'native HoloLand BrowserRuntime or React Three adapter execution',
        'ray tracing, path tracing, global illumination, or photorealism',
        'physically accurate materials, fluids, friction, stacking, or continuous collision detection',
        'cross-hardware deterministic pixels or physics',
        'headset performance',
      ],
      allowedPhrase:
        'HoloScript-authored Model Village rendered through a receipted HoloLand Three/WebGL2 witness with deterministic local CPU sphere-collider replay.',
    },
  };
  const status = allTrue(assertions) ? 'pass' : 'fail';
  const receipt = {
    ...receiptCore,
    status,
    generatedAt: new Date().toISOString(),
    receipt: {
      receiptHash: digest(receiptCore),
      output: relativeTo(root, path.join(outputDir, 'rendering-witness.json')),
      providerCallsMade: 0,
      networkAssetsFetched: externalNetworkRequests.length,
    },
  };
  const receiptPath = path.join(outputDir, 'rendering-witness.json');
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  if (status !== 'pass') {
    const failures = Object.entries(assertions)
      .filter(([, passed]) => !passed)
      .map(([name]) => name);
    throw new Error(
      `Model Village rendering witness failed: ${failures.join(', ')}. Receipt: ${receiptPath}`,
    );
  }
  return {
    receipt,
    receiptPath,
    screenshots: browser.captures.map((capture) => capture.filePath),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs();
    const { receipt, receiptPath } = await runRenderingGate(args);
    if (args.json) {
      process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    } else {
      process.stdout.write(
        [
          '[hololand-model-village-rendering] ok',
          `receipt: ${receiptPath}`,
          `backend: ${receipt.browser.gl.unmaskedRenderer || receipt.browser.gl.maskedRenderer}`,
          `frame p95: ${receipt.browser.timings.frameCadence.p95Ms.toFixed(2)} ms`,
          `render-submit p95: ${receipt.browser.timings.cpuRenderSubmit.p95Ms.toFixed(2)} ms`,
          `claim: ${receipt.claimBoundary.allowedPhrase}`,
        ].join('\n') + '\n',
      );
    }
  } catch (error) {
    process.stderr.write(`[hololand-model-village-rendering] failed\n${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
