#!/usr/bin/env node
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifySoftwareRenderer,
  createObserverBoundaryEnvelope,
  evaluateMaterialTruth,
  inferGraphicsBackend,
  pngDimensions,
  runRenderingGate,
  verifyObserverBoundaryEnvelope,
} from '../hololand-model-village-rendering-truth-gate.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..', '..');
const holoScriptRoot = path.resolve(repoRoot, '..', 'HoloScript');
const outputDir = path.join(
  repoRoot,
  '.tmp',
  'hololand',
  'model-village',
  'test',
  `rendering-${process.pid}-${randomUUID()}`,
);

const effectiveDefaults = {
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
};
const chuteOverrideValues = {
  transparent: true,
  opacity: 0.34,
  side: 2,
  depthWrite: false,
};

function meshNode(id, materialProps, properties = {}) {
  return {
    id,
    type: 'mesh',
    props: {
      materialProps,
      properties,
    },
  };
}

function chuteDisclosures(source, sourceBasis, disclosure) {
  return Object.entries(chuteOverrideValues).map(([property, effectiveValue]) => ({
    scope: 'presentation',
    property,
    sourceBasis,
    authoredValue: Object.hasOwn(source, property) ? source[property] : null,
    baselineValue: Object.hasOwn(source, property)
      ? source[property]
      : effectiveDefaults[property],
    effectiveValue,
    disclosure,
  }));
}

function observedMaterial(node, override = null) {
  const source = structuredClone(node.props.materialProps);
  return {
    objectId: node.id,
    source,
    effective: {
      ...effectiveDefaults,
      ...source,
      ...(override?.values || {}),
    },
    overrides: override
      ? chuteDisclosures(source, override.sourceBasis, override.disclosure)
      : [],
  };
}

function runMaterialTruthUnitTest() {
  const materialLab = meshNode('MaterialLab', {
    color: '#123456',
    metalness: 0.21,
    roughness: 0.37,
    clearcoat: 0.42,
    clearcoatRoughness: 0.16,
    transmission: 0.63,
    thickness: 0.71,
    ior: 1.41,
    opacity: 0.81,
    transparent: true,
    emissive: '#654321',
    emissiveIntensity: 0.28,
    sheen: 0.19,
    sheenColor: '#abcdef',
    anisotropy: 0.57,
    envMapIntensity: 0.91,
  });
  const admittedChute = meshNode(
    'AdmittedChuteShell',
    {
      color: '#4d2d16',
      metalness: 0.72,
      roughness: 0.31,
      emissive: '#f4a64e',
      emissiveIntensity: 0.16,
    },
    {
      presentationRole: 'admitted_gravity_chute',
      decorativeNonCollider: true,
    },
  );
  const blockedChute = meshNode(
    'BlockedChuteShell',
    {
      color: '#252348',
      metalness: 0.72,
      roughness: 0.31,
      emissive: '#7469ff',
      emissiveIntensity: 0.18,
    },
    {
      presentationRole: 'blocked_gravity_chute',
      decorativeNonCollider: true,
    },
  );
  const contracts = {
    projection: {
      nodes: [admittedChute, blockedChute],
    },
    calibration: {
      nodes: [materialLab],
    },
  };
  const admittedOverride = {
    values: chuteOverrideValues,
    sourceBasis: {
      presentationRole: 'admitted_gravity_chute',
      decorativeNonCollider: true,
    },
    disclosure: 'decorative admitted chute shell presentation',
  };
  const blockedOverride = {
    values: chuteOverrideValues,
    sourceBasis: {
      presentationRole: 'blocked_gravity_chute',
      decorativeNonCollider: true,
    },
    disclosure: 'decorative blocked chute shell presentation',
  };
  const materials = [
    observedMaterial(admittedChute, admittedOverride),
    observedMaterial(blockedChute, blockedOverride),
    observedMaterial(materialLab),
  ];

  const passing = evaluateMaterialTruth(contracts, materials);
  assert.equal(passing.status, 'pass', passing.errors.join('\n'));
  assert.equal(passing.expectedMeshCount, 3);
  assert.equal(passing.observedMaterialCount, 3);
  assert.ok(passing.meshes.every((mesh) => mesh.status === 'pass'));
  assert.deepEqual(
    passing.meshes.find((mesh) => mesh.objectId === 'AdmittedChuteShell')
      .overriddenProperties,
    ['transparent', 'opacity', 'side', 'depthWrite'],
  );

  for (const property of Object.keys(materialLab.props.materialProps)) {
    const tampered = structuredClone(materials);
    const effective = tampered.find((entry) => entry.objectId === 'MaterialLab').effective;
    const value = effective[property];
    if (typeof value === 'boolean') effective[property] = !value;
    else if (typeof value === 'number') effective[property] = value + 0.01;
    else effective[property] = '#ffffff';
    const failed = evaluateMaterialTruth(contracts, tampered);
    assert.equal(failed.status, 'fail', `tampered ${property} should fail`);
    assert.match(
      failed.errors.join('\n'),
      new RegExp(`MaterialLab: source-to-effective mismatch for ${property}`),
    );
  }

  for (const property of Object.keys(chuteOverrideValues)) {
    const tampered = structuredClone(materials);
    const effective = tampered.find(
      (entry) => entry.objectId === 'AdmittedChuteShell',
    ).effective;
    const value = effective[property];
    effective[property] = typeof value === 'boolean' ? !value : value + 0.01;
    const failed = evaluateMaterialTruth(contracts, tampered);
    assert.equal(failed.status, 'fail', `tampered override ${property} should fail`);
    assert.match(
      failed.errors.join('\n'),
      new RegExp(`AdmittedChuteShell: source-to-effective mismatch for ${property}`),
    );
  }

  const unauthorizedOverride = structuredClone(materials);
  unauthorizedOverride.find((entry) => entry.objectId === 'MaterialLab').overrides.push({
    scope: 'presentation',
    property: 'opacity',
    effectiveValue: 0.5,
    disclosure: 'undisclosed generic override',
  });
  const unauthorized = evaluateMaterialTruth(contracts, unauthorizedOverride);
  assert.equal(unauthorized.status, 'fail');
  assert.match(
    unauthorized.errors.join('\n'),
    /MaterialLab: presentation override disclosure mismatch/,
  );

  const tamperedSourceReceipt = structuredClone(materials);
  tamperedSourceReceipt.find((entry) => entry.objectId === 'MaterialLab').source.color =
    '#ffffff';
  const sourceMismatch = evaluateMaterialTruth(contracts, tamperedSourceReceipt);
  assert.equal(sourceMismatch.status, 'fail');
  assert.match(
    sourceMismatch.errors.join('\n'),
    /MaterialLab: receipted source mismatch for color/,
  );

  const invalidBasisContracts = structuredClone(contracts);
  invalidBasisContracts.projection.nodes.find(
    (node) => node.id === 'AdmittedChuteShell',
  ).props.properties.decorativeNonCollider = false;
  const invalidBasis = evaluateMaterialTruth(invalidBasisContracts, materials);
  assert.equal(invalidBasis.status, 'fail');
  assert.match(
    invalidBasis.errors.join('\n'),
    /AdmittedChuteShell: presentation override source basis is not satisfied/,
  );

  const missing = evaluateMaterialTruth(contracts, materials.slice(1));
  assert.equal(missing.status, 'fail');
  assert.match(missing.errors.join('\n'), /AdmittedChuteShell: material was not observed/);

  const duplicate = evaluateMaterialTruth(contracts, [...materials, materials[0]]);
  assert.equal(duplicate.status, 'fail');
  assert.match(duplicate.errors.join('\n'), /duplicate observed material id/);
}

runMaterialTruthUnitTest();

const materialsOnly = process.argv.includes('--materials-only');
if (!materialsOnly) {
try {
  const { receipt, receiptPath, screenshots } = await runRenderingGate({
    root: repoRoot,
    holoScriptRoot,
    outputDir,
    canonicalBoundary: true,
    timeoutMs: 60_000,
  });

  assert.equal(receipt.schema, 'hololand.model-village.rendering-witness.v0.3.0');
  assert.equal(receipt.status, 'pass');
  assert.ok(Object.values(receipt.assertions).every(Boolean));
  assert.equal(receipt.source.parser, 'HoloCompositionParser');
  assert.equal(receipt.source.compiler, 'SceneIRCompiler');
  assert.equal(receipt.source.projection.meshCount, 29);
  assert.equal(receipt.source.calibration.meshCount, 10);
  assert.equal(receipt.source.sourceSemanticsRewritten, false);
  assert.equal(receipt.physics.canonicalBoundary.enabled, true);
  assert.equal(receipt.physics.canonicalBoundary.observedBoundaryMatch, true);
  assert.equal(receipt.physics.canonicalBoundary.projectionToggleExecuted, true);
  assert.equal(receipt.observerBoundary.consumerExecuted, true);
  assert.equal(receipt.observerBoundary.isolatedProjectionToggleExecuted, true);
  assert.equal(receipt.observerBoundary.canonicalAuthoritativeMutationDelta, 0);
  assert.equal(receipt.observerBoundary.off.payload.consumerEnabled, false);
  assert.deepEqual(
    Object.keys(receipt.observerBoundary.off.payload).sort(),
    [
      'canonicalPayload',
      'consumerEnabled',
      'payloadDigest',
      'schema',
      'source',
      'trustedActionBinding',
    ],
  );
  assert.equal(
    receipt.observerBoundary.off.browserObserved.consumerAcknowledgement.status,
    'withheld',
  );
  assert.equal(receipt.observerBoundary.on.payload.consumerEnabled, true);
  const trustedActionBinding =
    receipt.physics.canonicalBoundary.after.boundedRuntimeObserver
      .trustedActionBinding;
  const observerEnvelopeVerification = verifyObserverBoundaryEnvelope(
    receipt.observerBoundary.on.payload,
    { trustedActionBinding },
  );
  assert.equal(
    observerEnvelopeVerification.valid,
    true,
    observerEnvelopeVerification.errors.join('\n'),
  );
  assert.equal(observerEnvelopeVerification.core.available, true);
  assert.equal(
    observerEnvelopeVerification.core.boundedRuntimeSceneObjectCount,
    4,
  );
  assert.equal(
    observerEnvelopeVerification.core.canonicalVisibleWorld.objectCount,
    12,
  );
  assert.equal(
    trustedActionBinding.blockedPreviousEntryHash,
    trustedActionBinding.admittedActionEntryHash,
  );
  assert.equal(
    trustedActionBinding.actionReceiptRoot,
    trustedActionBinding.blockedActionEntryHash,
  );
  assert.equal(
    receipt.observerBoundary.on.browserObserved.consumerAcknowledgement.status,
    'pass',
  );
  assert.equal(
    receipt.observerBoundary.on.browserObserved.consumerAcknowledgement
      .computedPayloadDigest,
    receipt.observerBoundary.on.payload.payloadDigest,
  );
  assert.equal(
    Object.keys(
      receipt.observerBoundary.on.browserObserved.canonicalFields,
    ).length,
    7,
  );
  assert.equal(receipt.observerBoundary.off.heroPresentation.verified, false);
  assert.match(
    receipt.observerBoundary.off.heroPresentation.subtitle,
    /withheld/i,
  );
  assert.doesNotMatch(
    JSON.stringify(receipt.observerBoundary.off.heroPresentation),
    /one verified water contribution|verified v4 receipts/i,
  );
  assert.equal(receipt.observerBoundary.on.heroPresentation.verified, true);
  assert.match(
    receipt.observerBoundary.on.heroPresentation.truthChip,
    /verified v4 receipts/i,
  );
  assert.ok(
    receipt.claimBoundary.observed.some(
      (claim) => /canonical payload withheld.*sha-256 acknowledged/i.test(claim),
    ),
  );
  assert.ok(
    receipt.claimBoundary.notObserved.every(
      (claim) => claim !== 'isolated observer projection off/on consumer toggle',
    ),
  );
  const detachedSiblingTamper = {
    ...structuredClone(receipt.observerBoundary.on.payload),
    livingCommons: { publicWaterUnits: 999 },
  };
  assert.equal(
    verifyObserverBoundaryEnvelope(detachedSiblingTamper, {
      trustedActionBinding,
    }).valid,
    false,
  );
  const digestMismatchTamper =
    structuredClone(receipt.observerBoundary.on.payload);
  digestMismatchTamper.canonicalPayload += ' ';
  assert.equal(
    verifyObserverBoundaryEnvelope(digestMismatchTamper, {
      trustedActionBinding,
    }).valid,
    false,
  );
  const sourceLabelTamper =
    structuredClone(receipt.observerBoundary.on.payload);
  sourceLabelTamper.source = 'attacker_supplied_payload';
  assert.equal(
    verifyObserverBoundaryEnvelope(sourceLabelTamper, {
      trustedActionBinding,
    }).valid,
    false,
  );
  const coordinatedChainTamper =
    structuredClone(observerEnvelopeVerification.core);
  coordinatedChainTamper.livingCommons.admittedAction.entryHash =
    'a'.repeat(64);
  coordinatedChainTamper.livingCommons.blockedAction.previousEntryHash =
    'a'.repeat(64);
  coordinatedChainTamper.livingCommons.blockedAction.entryHash =
    'b'.repeat(64);
  coordinatedChainTamper.livingCommons.actionReceiptRoot = 'b'.repeat(64);
  coordinatedChainTamper.canonicalFields.actionReceiptRoot = 'b'.repeat(64);
  assert.throws(
    () => createObserverBoundaryEnvelope(coordinatedChainTamper, {
      trustedActionBinding,
    }),
    /trusted execution binding/i,
  );
  for (const mutate of [
    (core) => {
      core.livingCommons.publicWaterUnits = 4;
    },
    (core) => {
      core.livingCommons.actionReceiptRoot = '7'.repeat(64);
    },
    (core) => {
      core.livingCommons.blockedAction.entryHash = '8'.repeat(64);
    },
    (core) => {
      core.livingCommons.blockedAction.previousEntryHash = '9'.repeat(64);
    },
    (core) => {
      core.verifiedReceiptHash = null;
    },
    (core) => {
      core.boundedRuntimeSceneObjectCount = 12;
    },
  ]) {
    const tamperedCore = structuredClone(observerEnvelopeVerification.core);
    mutate(tamperedCore);
    assert.throws(
      () => createObserverBoundaryEnvelope(tamperedCore, {
        trustedActionBinding,
      }),
      /observer boundary core is invalid/i,
    );
  }
  assert.match(
    receipt.source.observerPolicy.browserRenderEvidenceEnforcement,
    /browser_payload_sha256_acknowledged/,
  );
  assert.ok(receipt.physics.frameTraceSha256);
  assert.ok(receipt.physics.visualFrameSha256);
  assert.ok(receipt.physics.settledFrameSha256);
  assert.equal(receipt.renderer.existingReactThreeAdapterUsed, false);
  assert.equal(receipt.renderer.environment.hdri, false);
  assert.equal(receipt.renderer.environment.networkAssetFetches, 0);
  assert.equal(receipt.renderer.effective.outputColorSpace, 'srgb');
  assert.equal(receipt.renderer.effective.toneMapping, 'ACESFilmicToneMapping');
  assert.equal(receipt.renderer.effective.shadowMapType, 'PCFSoftShadowMap');
  assert.equal(receipt.renderer.materials.length, 39);
  assert.ok(receipt.renderer.materials.every((entry) => entry.effective.type === 'MeshPhysicalMaterial'));
  assert.equal(receipt.assertions.sourceMaterialsMatchEffective, true);
  assert.equal(receipt.renderer.materialTruth.status, 'pass');
  assert.equal(receipt.renderer.materialTruth.expectedMeshCount, 39);
  assert.equal(receipt.renderer.materialTruth.observedMaterialCount, 39);
  assert.ok(receipt.renderer.materialTruth.meshes.every((entry) => entry.status === 'pass'));
  assert.equal(
    receipt.renderer.livingCommonsPresentation.status,
    'receipts_consumed',
  );
  assert.equal(
    receipt.renderer.livingCommonsPresentation.referencedActionReceipts.length,
    2,
  );
  assert.equal(receipt.renderer.portraitUiChrome.status, 'pass');
  assert.ok(Object.values(receipt.renderer.portraitUiChrome.checks).every(Boolean));
  assert.ok(receipt.renderer.portraitUiChrome.cardFooterGap >= 8);
  assert.match(
    receipt.renderer.portraitUiChrome.uiChrome.admittedLegend.text,
    /admitted route/i,
  );
  assert.match(
    receipt.renderer.portraitUiChrome.uiChrome.blockedLegend.text,
    /blocked route/i,
  );
  assert.notEqual(
    receipt.renderer.portraitUiChrome.uiChrome.backendProvenance.textOverflow,
    'ellipsis',
  );
  assert.ok(
    receipt.renderer.portraitUiChrome.uiChrome.backendProvenance.scrollWidth
      <= receipt.renderer.portraitUiChrome.uiChrome.backendProvenance.clientWidth + 1,
  );
  assert.ok(
    receipt.renderer.portraitUiChrome.uiChrome.backendProvenance.scrollHeight
      <= receipt.renderer.portraitUiChrome.uiChrome.backendProvenance.clientHeight + 1,
  );
  assert.equal(receipt.browser.gl.contextType, 'webgl2');
  assert.equal(receipt.browser.softwareFallback.detected, false);
  assert.notEqual(receipt.browser.backendObserved, 'unclassified WebGL backend');
  assert.equal(receipt.browser.externalNetworkRequests.length, 0);
  assert.equal(receipt.browser.exceptions.length, 0);
  assert.ok(receipt.browser.timings.frameCadence.samples >= 170);
  assert.ok(receipt.browser.timings.cpuRenderSubmit.samples >= 170);
  assert.deepEqual(
    receipt.screenshots.map((capture) => [
      capture.id,
      capture.dimensions.width,
      capture.dimensions.height,
    ]),
    [
      ['hero-desktop', 1600, 900],
      ['hero-portrait', 390, 844],
      ['hero-settled', 1600, 900],
      ['calibration-desktop', 1600, 900],
    ],
  );
  assert.ok(receipt.screenshots.every((capture) => capture.sha256 && capture.bytes > 25_000));
  assert.equal(
    receipt.screenshots.find((capture) => capture.id === 'hero-portrait')
      .uiChrome.blockedLegend.visible,
    true,
  );
  assert.equal(screenshots.length, 4);
  assert.ok(screenshots.every((filePath) => existsSync(filePath)));
  assert.equal(existsSync(receiptPath), true);

  const persisted = JSON.parse(readFileSync(receiptPath, 'utf8'));
  assert.equal(persisted.receipt.receiptHash, receipt.receipt.receiptHash);

  assert.deepEqual(
    classifySoftwareRenderer({
      maskedVendor: 'Google Inc.',
      maskedRenderer: 'WebKit WebGL',
      unmaskedVendor: 'Google Inc.',
      unmaskedRenderer: 'ANGLE (Google, Vulkan 1.3 SwiftShader Device)',
    }),
    {
      detected: true,
      indicators: ['swiftshader'],
      basis: 'browser WebGL masked and WEBGL_debug_renderer_info strings',
    },
  );
  assert.equal(
    inferGraphicsBackend({
      unmaskedRenderer: 'ANGLE (NVIDIA, GeForce RTX, D3D11)',
    }),
    'ANGLE Direct3D 11',
  );
  assert.throws(() => pngDimensions(Buffer.alloc(24)), /valid PNG/);

  const skippedBoundary = await runRenderingGate({
    root: repoRoot,
    holoScriptRoot,
    outputDir: path.join(outputDir, 'skip-boundary'),
    canonicalBoundary: false,
    timeoutMs: 60_000,
  });
  assert.equal(skippedBoundary.receipt.status, 'pass');
  assert.equal(
    skippedBoundary.receipt.observerBoundary.consumerExecuted,
    false,
  );
  assert.equal(
    skippedBoundary.receipt.observerBoundary.isolatedProjectionToggleExecuted,
    false,
  );
  assert.equal(
    skippedBoundary.receipt.observerBoundary.on.payload.consumerEnabled,
    false,
  );
  assert.ok(
    skippedBoundary.receipt.claimBoundary.notObserved.includes(
      'browser observer projection off/on consumer toggle',
    ),
  );
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
}

console.log(
  materialsOnly
    ? 'PASS HoloLand Model Village source-to-effective material truth unit gate'
    : 'PASS HoloLand Model Village rendering truth gate',
);
