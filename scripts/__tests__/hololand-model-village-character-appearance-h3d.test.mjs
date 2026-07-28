import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  compileH3DOcularBundles,
  parseH3DStack,
  validateH3DContract,
} from '../check-hololand-model-village-character-appearance-h3d.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const HOLOSCRIPT_ROOT = process.env.HOLOSCRIPT_ROOT || 'C:/Users/josep/Documents/GitHub/HoloScript';

test('H3D parses all three formats and binds the source-authored ocular contract', async () => {
  const stack = await parseH3DStack(ROOT, HOLOSCRIPT_ROOT);
  const validation = validateH3DContract(stack, ROOT, HOLOSCRIPT_ROOT);
  assert.equal(validation.status, 'pass', validation.errors.join('\n'));
  assert.equal(stack.contract.state.ocularFoundation.profile, 'layered-ocular-v1');
  assert.equal(
    stack.contract.metadata.upstreamHoloScriptCommit,
    'ac44ce5fbdb93c4a78e17a3c535138de49978bbd'
  );
  assert.deepEqual(
    validation.plan.personas.map((persona) => persona.personaId),
    ['hearth_keeper', 'path_tender', 'record_steward']
  );
  assert.deepEqual(
    validation.plan.personas.map((persona) => persona.irisColor),
    ['#6B8C82', '#A58B52', '#526D91']
  );
});

test('H3D emits nine deterministic bundles with eight native ocular groups each', async () => {
  const stack = await parseH3DStack(ROOT, HOLOSCRIPT_ROOT);
  const validation = validateH3DContract(stack, ROOT, HOLOSCRIPT_ROOT);
  assert.equal(validation.status, 'pass', validation.errors.join('\n'));
  const ocular = await compileH3DOcularBundles(stack, validation.plan);
  const tiers = ocular.native.records.flatMap((record) => record.tiers);
  assert.equal(ocular.native.records.length, 3);
  assert.equal(tiers.length, 9);
  assert.ok(ocular.ocularVertexDelta >= 400);
  assert.ok(ocular.ocularTriangleDelta >= 400);
  for (const tier of tiers) {
    assert.equal(tier.bundle.face.ocularProfile, 'layered-ocular-v1');
    assert.equal(tier.ocularGroupCount, 8);
    assert.deepEqual(tier.ocularRegions, {
      sclera: 2,
      iris: 2,
      pupil: 2,
      cornea: 2,
    });
    const eyeGroups = tier.bundle.materialGroups.filter(
      (group) => group.material.shadingModel === 'refractive-eye'
    );
    assert.equal(
      eyeGroups.some((group) => !group.material.eyeRegion),
      false
    );
    assert.equal(
      eyeGroups
        .filter((group) => group.material.eyeRegion === 'cornea')
        .every((group) => group.transparent === true),
      true
    );
  }
});

test('H3D fails closed on presentation shaders, tear film, and photoreal overclaims', async () => {
  const stack = await parseH3DStack(ROOT, HOLOSCRIPT_ROOT);
  stack.contract.state.presentationShaderOverrideUsed = true;
  stack.contract.state.productionTearFilmClaimed = true;
  stack.contract.state.photorealismClaimed = true;
  const validation = validateH3DContract(stack, ROOT, HOLOSCRIPT_ROOT);
  assert.equal(validation.status, 'fail');
  const errors = validation.errors.join('\n');
  assert.match(errors, /presentationShaderOverrideUsed/);
  assert.match(errors, /productionTearFilmClaimed/);
  assert.match(errors, /photorealismClaimed/);
});
