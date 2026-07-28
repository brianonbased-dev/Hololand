import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  compileH3CFaceBundles,
  parseH3CStack,
  validateH3CContract,
} from '../check-hololand-model-village-character-appearance-h3c.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const HOLOSCRIPT_ROOT =
  process.env.HOLOSCRIPT_ROOT ||
  'C:/Users/josep/Documents/GitHub/HoloScript';

test('H3C parses all three formats and binds the source-authored face contract', async () => {
  const stack = await parseH3CStack(ROOT, HOLOSCRIPT_ROOT);
  const validation = validateH3CContract(
    stack,
    ROOT,
    HOLOSCRIPT_ROOT,
  );
  assert.equal(validation.status, 'pass', validation.errors.join('\n'));
  assert.equal(
    stack.contract.state.faceFoundation.topology,
    'neutral-anatomical-v2',
  );
  assert.equal(
    stack.contract.metadata.upstreamHoloScriptCommit,
    'faf90ec8cbac992c6ca0ed9ffafb9033fa9bd127',
  );
  assert.deepEqual(
    validation.plan.expressions.map(
      (expression) => expression.expressionId,
    ),
    ['neutral', 'soft_smile', 'viseme_oh'],
  );
  assert.deepEqual(
    validation.plan.personas.map(
      (persona) => persona.nativeHairStyleId,
    ),
    ['cropped_coils', 'short', 'medium_wavy'],
  );
});

test('H3C emits nine deterministic native bundles with a real topology delta', async () => {
  const stack = await parseH3CStack(ROOT, HOLOSCRIPT_ROOT);
  const validation = validateH3CContract(
    stack,
    ROOT,
    HOLOSCRIPT_ROOT,
  );
  assert.equal(validation.status, 'pass', validation.errors.join('\n'));
  const face = await compileH3CFaceBundles(
    stack,
    validation.plan,
  );
  const tiers = face.native.records.flatMap((record) => record.tiers);
  assert.equal(face.native.records.length, 3);
  assert.equal(tiers.length, 9);
  assert.ok(face.topologyVertexDelta >= 250);
  for (const tier of tiers) {
    assert.equal(
      tier.bundle.face.topology,
      'neutral-anatomical-v2',
    );
    assert.equal(tier.bundle.face.radialSegments, 22);
    assert.equal(tier.bundle.face.verticalSegments, 16);
    assert.equal(tier.bundle.face.tearline, true);
    assert.equal(
      tier.bundle.morph.topology,
      'neutral-anatomical-v2',
    );
    assert.deepEqual(tier.bundle.report.stubbed, []);
  }
  assert.equal(face.native.expressionBundles.length, 3);
  for (const expression of face.native.expressionBundles) {
    assert.equal(
      expression.morph.topology,
      'neutral-anatomical-v2',
    );
    assert.equal(expression.morph.normalsRecomputed, false);
  }
});

test('H3C fails closed on production, photoreal, and biometric overclaims', async () => {
  const stack = await parseH3CStack(ROOT, HOLOSCRIPT_ROOT);
  stack.contract.state.productionFaceCompleteClaimed = true;
  stack.contract.state.photorealismClaimed = true;
  stack.contract.state.biometricPersistenceAllowed = true;
  const validation = validateH3CContract(
    stack,
    ROOT,
    HOLOSCRIPT_ROOT,
  );
  assert.equal(validation.status, 'fail');
  const errors = validation.errors.join('\n');
  assert.match(errors, /productionFaceCompleteClaimed/);
  assert.match(errors, /photorealismClaimed/);
  assert.match(errors, /biometricPersistenceAllowed/);
});
