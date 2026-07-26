#!/usr/bin/env node
/* global console, process */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runModelVillageArtDirectionCheck,
  verifyModelVillageArtDirectionReceipt,
} from '../check-hololand-model-village-art-direction.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..', '..');
const outputDir = path.join(
  repoRoot,
  '.tmp',
  'hololand',
  'model-village',
  'art-direction-test',
);
mkdirSync(outputDir, { recursive: true });
const output = path.join(
  outputDir,
  `receipt-${process.pid}-${randomUUID()}.json`,
);

try {
  const { receipt } = await runModelVillageArtDirectionCheck({
    root: repoRoot,
    output,
  });

  assert.equal(receipt.schemaVersion, 'hololand.model-village-art-direction.v1');
  assert.equal(receipt.status, 'pass');
  assert.equal(receipt.world.name, 'Stormglass Commons');
  assert.equal(receipt.world.artStyle, 'hearthlight_biorealism');
  assert.equal(receipt.world.residentDesignSystem, 'stormglass_craftfolk');
  assert.equal(receipt.residents.length, 6);
  assert.deepEqual(
    receipt.residents.map((resident) => resident.displayName),
    [
      'Nera Fen',
      'Calder Voss',
      'Tamsin Reed',
      'Orren Lark',
      'Suri Kest',
      'Vale Rook',
    ],
  );
  assert.equal(
    new Set(receipt.residents.map((resident) => resident.silhouetteId)).size,
    6,
  );
  assert.equal(
    new Set(receipt.residents.map((resident) => resident.glyphId)).size,
    6,
  );
  assert.equal(
    new Set(receipt.residents.map((resident) => resident.accentColor)).size,
    6,
  );
  assert.equal(
    receipt.residents.every(
      (resident) => /^[a-f0-9]{64}$/.test(resident.appearanceDigest),
    ),
    true,
  );
  assert.equal(receipt.imageEvidence.length, 2);
  assert.equal(
    receipt.imageEvidence.every(
      (entry) => (
        entry.dimensions.aspectRatioClass === '16:9'
        && entry.evidenceClass === 'concept_target_not_runtime_proof'
      ),
    ),
    true,
  );
  assert.equal(
    Object.values(receipt.assertions).every((passed) => passed === true),
    true,
  );
  assert.deepEqual(receipt.failures, []);
  assert.equal(verifyModelVillageArtDirectionReceipt(receipt), true);

  console.log(
    `PASS hololand-model-village-art-direction (${receipt.receiptHash})`,
  );
} finally {
  rmSync(output, { force: true });
}
