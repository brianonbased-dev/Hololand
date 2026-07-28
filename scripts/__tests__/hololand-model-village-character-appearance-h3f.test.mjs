import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  compileH3FGroomBundles,
  parseH3FStack,
  validateH3FContract,
} from '../check-hololand-model-village-character-appearance-h3f.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const HOLOSCRIPT_ROOT = process.env.HOLOSCRIPT_ROOT || 'C:/Users/josep/Documents/GitHub/HoloScript';

test('H3F parses all three formats and binds source-authored scalp-flow controls', async () => {
  const stack = await parseH3FStack(ROOT, HOLOSCRIPT_ROOT);
  const validation = validateH3FContract(stack, ROOT, HOLOSCRIPT_ROOT);
  assert.equal(validation.status, 'pass', validation.errors.join('\n'));
  assert.equal(stack.contract.state.groomFoundation.profile, 'scalp-flow-v1');
  assert.equal(
    stack.contract.metadata.upstreamHoloScriptCommit,
    '1203b06bd0e857b26c874479ea9e6b6cdc521896'
  );
  assert.deepEqual(
    validation.plan.personas.map((persona) => persona.personaId),
    ['hearth_keeper', 'path_tender', 'record_steward']
  );
  assert.deepEqual(
    validation.plan.personas.map(({ cardWidth, rootLift, tipTaper, hairlineBias }) => [
      cardWidth,
      rootLift,
      tipTaper,
      hairlineBias,
    ]),
    [
      [0.0052, 0.0025, 0.08, 0.17],
      [0.0058, 0.002, 0.14, 0.18],
      [0.0052, 0.0025, 0.08, 0.15],
    ]
  );
});

test('H3F emits nine deterministic groom receipts that beat the legacy radial baseline', async () => {
  const stack = await parseH3FStack(ROOT, HOLOSCRIPT_ROOT);
  const validation = validateH3FContract(stack, ROOT, HOLOSCRIPT_ROOT);
  assert.equal(validation.status, 'pass', validation.errors.join('\n'));
  const groom = await compileH3FGroomBundles(stack, validation.plan);
  const tiers = groom.native.records.flatMap((record) => record.tiers);
  assert.equal(groom.native.records.length, 3);
  assert.equal(tiers.length, 9);
  assert.equal(groom.comparisons.length, 9);
  for (const tier of tiers) {
    assert.equal(tier.bundle.groom.profile, 'scalp-flow-v1');
    assert.equal(tier.bundle.groom.scalpSurface, 'neutral-anatomical-ellipsoid');
    assert.equal(tier.bundle.groom.schemaVersion, 'holoscript.agent-avatar-groom-geometry.v1');
    assert.ok(tier.bundle.groom.rootTangentRadialDotP95 <= 0.01);
    assert.equal(tier.ocularGroupCount, 8);
    assert.equal(
      tier.bundle.report.mapped.some((entry) =>
        entry.startsWith('@hair(groom_profile=scalp-flow-v1')
      ),
      true
    );
  }
  for (const comparison of groom.comparisons) {
    assert.equal(comparison.legacyRadial.profile, 'radial-cards-v1');
    assert.ok(
      comparison.scalpFlow.rootTangentRadialDotP95 < comparison.legacyRadial.rootTangentRadialDotP95
    );
    assert.ok(
      comparison.scalpFlow.frontalOcclusionVertexCount <
        comparison.legacyRadial.frontalOcclusionVertexCount
    );
  }
});

test('H3F fails closed on alpha, strand, scan, and realism overclaims', async () => {
  const stack = await parseH3FStack(ROOT, HOLOSCRIPT_ROOT);
  stack.contract.state.hairAlphaMaskUsed = true;
  stack.contract.state.strandHairClaimed = true;
  stack.contract.state.scanDerivedGroomClaimed = true;
  stack.contract.state.photorealismClaimed = true;
  const validation = validateH3FContract(stack, ROOT, HOLOSCRIPT_ROOT);
  assert.equal(validation.status, 'fail');
  const errors = validation.errors.join('\n');
  assert.match(errors, /hairAlphaMaskUsed/);
  assert.match(errors, /strandHairClaimed/);
  assert.match(errors, /scanDerivedGroomClaimed/);
  assert.match(errors, /photorealismClaimed/);
});
