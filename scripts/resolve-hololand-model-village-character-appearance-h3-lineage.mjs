#!/usr/bin/env node

/**
 * Resolves the H3A <-> H3B lineage pins in ONE topological pass.
 *
 * This script exists because the pair used to have no fixed point. H3A recorded H3B's
 * source hash (metadata.successorSourceSha256) while H3B recorded H3A's source, policy,
 * seed, manifest and report hashes. Editing either file invalidated the other's record,
 * and re-resolving the other invalidated the first -- a genuine cycle, so a lineage sweep
 * could never terminate.
 *
 * The cycle was removed by deleting successorSourceSha256 and replacing it with an
 * EXECUTED supersession proof (see proveSupersessionBoundary in the H3A checker), which
 * needs no hash of the successor at all. What is left is a strict DAG:
 *
 *     H3A source/policy/seed/checker/test/report
 *                  |
 *                  v
 *          H3A manifest  ------+
 *                              |
 *                              v
 *                        H3B source  ---->  H3B manifest
 *
 * Each stage below depends only on stages above it, so running them in order converges
 * in a single pass. If a second pass would ever change anything, --check says so.
 *
 * SCOPE DISCIPLINE. This refreshes only the LINEAGE pins listed here -- the ones this
 * change is expected to invalidate. Every other pinned artifact (atlases, hero renders,
 * LOD plates) is VERIFIED and reported, never rewritten, so a resolver run cannot quietly
 * paper over real asset drift.
 *
 * Usage:
 *   node scripts/resolve-hololand-model-village-character-appearance-h3-lineage.mjs
 *   node scripts/resolve-hololand-model-village-character-appearance-h3-lineage.mjs --check
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOLOSCRIPT_ROOT =
  process.env.HOLOSCRIPT_ROOT || 'C:/Users/josep/Documents/GitHub/HoloScript';

const MODEL_VILLAGE = 'source/layers/vr/frontier/model-village';
const H3A_MANIFEST = `${MODEL_VILLAGE}/model-village-character-appearance-h3a-neutral-personas-manifest.holo`;
const H3B_SOURCE = `${MODEL_VILLAGE}/model-village-character-appearance-h3b-native-channels.holo`;
const H3B_MANIFEST = `${MODEL_VILLAGE}/model-village-character-appearance-h3b-native-channels-manifest.holo`;
const H3C_SOURCE = `${MODEL_VILLAGE}/model-village-character-appearance-h3c-face-foundation.holo`;
const H3C_MANIFEST = `${MODEL_VILLAGE}/model-village-character-appearance-h3c-face-foundation-manifest.holo`;

/**
 * Blocks whose `sha256:` follows a `path:` naming a file this change can legitimately
 * move. Anything else in the manifest is verified only.
 */
const LINEAGE_BLOCKS = ['source', 'policy', 'seed', 'checker', 'test', 'report'];

const STAGES = [
  {
    name: 'H3A manifest records the H3A authored triad, checker, test and report',
    file: H3A_MANIFEST,
    kind: 'manifest',
  },
  {
    name: 'H3B source inherits H3A and pins the upstream character-render surface',
    file: H3B_SOURCE,
    kind: 'metadata',
    pins: [
      ['inheritedH3ASource', 'inheritedH3ASourceSha256', ROOT],
      ['inheritedH3APolicy', 'inheritedH3APolicySha256', ROOT],
      ['inheritedH3ASeed', 'inheritedH3ASeedSha256', ROOT],
      ['inheritedH3AManifest', 'inheritedH3AManifestSha256', ROOT],
      ['inheritedH3AReport', 'inheritedH3AReportSha256', ROOT],
      ['appearancePlan', 'appearancePlanSha256', ROOT],
      ['upstreamCharacterHostPath', 'upstreamCharacterHostSha256', HOLOSCRIPT_ROOT],
      [
        'upstreamCompositionBridgePath',
        'upstreamCompositionBridgeSha256',
        HOLOSCRIPT_ROOT,
      ],
      ['upstreamHairBuilderPath', 'upstreamHairBuilderSha256', HOLOSCRIPT_ROOT],
      ['upstreamMorphBuilderPath', 'upstreamMorphBuilderSha256', HOLOSCRIPT_ROOT],
      ['upstreamCompilerPath', 'upstreamCompilerSha256', HOLOSCRIPT_ROOT],
      ['upstreamLodManagerPath', 'upstreamLodManagerSha256', HOLOSCRIPT_ROOT],
      ['temporalPassPath', 'temporalPassSha256', HOLOSCRIPT_ROOT],
    ],
    // The commit that last moved the pinned upstream surface. Must be an ancestor of
    // upstream HEAD; H3B's checker enforces that.
    upstreamCommitKey: 'upstreamHoloScriptCommit',
    upstreamCommitFor: [
      'upstreamCharacterHostPath',
      'upstreamCompositionBridgePath',
      'upstreamHairBuilderPath',
      'upstreamMorphBuilderPath',
      'upstreamCompilerPath',
      'upstreamLodManagerPath',
    ],
  },
  {
    name: 'H3B manifest records the H3B authored triad, checker, test and report',
    file: H3B_MANIFEST,
    kind: 'manifest',
  },
  // The forward chain. H3C pins H3B's source, H3D pins H3C's, and so on down to H3U, so
  // any edit to H3B ripples forward. It is carried EXACTLY ONE HOP and then stopped.
  //
  // Stopping is deliberate, not laziness. Propagating further would rewrite H3D's, H3E's
  // and H3F's sources, and H3G -- which is green today -- pins H3F's source, so a full
  // sweep would turn a passing gate red to tidy up gates that are already red for
  // unrelated upstream drift. H3D is the only gate left holding a stale pin here, it was
  // already failing before this change, and its own source is untouched, so the ripple
  // dies at H3D instead of reaching H3G.
  {
    name: 'H3C inherits H3B (one hop; the chain is deliberately stopped here)',
    file: H3C_SOURCE,
    kind: 'metadata',
    pins: [['inheritedH3BSource', 'inheritedH3BSourceSha256', ROOT]],
  },
];

// Deliberately NOT a stage: H3C's manifest. Its source, checker, test and report pins
// were already stale before this change and H3C passes anyway, which means H3C's gate
// does not read them. Refreshing them here would rewrite records of pre-existing drift
// that nothing verifies -- laundering, not resolving -- so they are left exactly as
// found and reported instead. H3C's SOURCE pin on H3B is a different matter: its gate
// does check that one, so it is resolved above.
void H3C_MANIFEST;

function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function readValue(text, key) {
  const match = text.match(new RegExp(`^\\s*${key}:\\s*"([^"]*)"`, 'm'));
  return match ? match[1] : null;
}

/** Replaces the quoted value of `key`, requiring exactly one occurrence. */
function writeValue(text, key, value, label) {
  const pattern = new RegExp(`(^\\s*${key}:\\s*")([^"]*)(")`, 'gm');
  const hits = text.match(pattern) || [];
  if (hits.length !== 1) {
    throw new Error(`${label}: expected 1 occurrence of ${key}, found ${hits.length}`);
  }
  return text.replace(pattern, `$1${value}$3`);
}

/**
 * In a manifest, finds the hash that belongs to the block named `block`.
 *
 * The series does not use one spelling: H3A and H3B write `sha256:` inside each block,
 * while H3C writes `sourceSha256:` / `policySha256:`. Both are accepted rather than
 * normalised, because reformatting sibling gates' manifests is not this change's business.
 */
function manifestBlock(text, block) {
  const start = text.search(new RegExp(`^\\s*${block}:\\s*\\{`, 'm'));
  if (start < 0) return null;
  const slice = text.slice(start);
  const end = slice.indexOf('\n    }');
  const body = end < 0 ? slice : slice.slice(0, end);
  const pathValue = body.match(/^\s*path:\s*"([^"]*)"/m);
  const hashValue = body.match(
    new RegExp(`^\\s*(?:sha256|${block}Sha256):\\s*"([0-9a-f]{64})"`, 'm'),
  );
  if (!pathValue || !hashValue) return null;
  return {
    start,
    body,
    path: pathValue[1],
    sha256: hashValue[1],
  };
}

function lastCommitTouching(files) {
  let newest = null;
  for (const file of files) {
    const commit = execFileSync(
      'git',
      ['log', '-1', '--format=%H', '--', file],
      { cwd: HOLOSCRIPT_ROOT, encoding: 'utf8' },
    ).trim();
    if (!commit) continue;
    if (
      newest === null ||
      isAncestor(newest, commit)
    ) {
      newest = commit;
    }
  }
  return newest;
}

function isAncestor(candidate, of) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', candidate, of], {
      cwd: HOLOSCRIPT_ROOT,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function run({ check }) {
  const changed = [];
  const verified = [];
  const stale = [];

  for (const stage of STAGES) {
    const file = path.join(ROOT, stage.file);
    const raw = readFileSync(file, 'utf8');
    const wasCRLF = raw.includes('\r\n');
    let text = raw.split('\r\n').join('\n');

    if (stage.kind === 'manifest') {
      // Refresh only the lineage blocks; verify everything else.
      let cursor = text;
      for (const block of LINEAGE_BLOCKS) {
        const found = manifestBlock(cursor, block);
        if (!found) throw new Error(`${stage.file}: block ${block} not found`);
        const target = path.resolve(ROOT, found.path);
        if (!existsSync(target)) throw new Error(`${stage.file}: missing ${found.path}`);
        const actual = sha256File(target);
        if (actual === found.sha256) {
          verified.push(`${stage.file} :: ${block}`);
          continue;
        }
        const before = cursor;
        cursor =
          cursor.slice(0, found.start) +
          cursor
            .slice(found.start)
            .replace(found.sha256, actual);
        if (cursor === before) throw new Error(`${stage.file}: ${block} rewrite missed`);
        changed.push(`${stage.file} :: ${block} -> ${actual.slice(0, 12)}`);
      }
      // Verify-only pass over every other pinned artifact.
      for (const blockMatch of cursor.matchAll(
        /^\s*(\w+):\s*\{[\s\S]*?^\s*path:\s*"([^"]*)"[\s\S]*?^\s*\w*[sS]ha256:\s*"([0-9a-f]{64})"/gm,
      )) {
        const [, block, rel, recorded] = blockMatch;
        if (LINEAGE_BLOCKS.includes(block)) continue;
        const target = path.resolve(ROOT, rel);
        if (!existsSync(target)) {
          stale.push(`${stage.file} :: ${block} -> missing ${rel}`);
          continue;
        }
        if (sha256File(target) !== recorded) {
          stale.push(`${stage.file} :: ${block} -> ${rel} drifted (NOT rewritten)`);
        } else {
          verified.push(`${stage.file} :: ${block} (verify-only)`);
        }
      }
      text = cursor;
    } else {
      for (const [pathKey, hashKey, base] of stage.pins) {
        const rel = readValue(text, pathKey);
        if (!rel) throw new Error(`${stage.file}: ${pathKey} missing`);
        const target = path.resolve(base, rel);
        if (!existsSync(target)) throw new Error(`${stage.file}: missing ${rel}`);
        const actual = sha256File(target);
        if (readValue(text, hashKey) === actual) {
          verified.push(`${stage.file} :: ${hashKey}`);
          continue;
        }
        text = writeValue(text, hashKey, actual, stage.file);
        changed.push(`${stage.file} :: ${hashKey} -> ${actual.slice(0, 12)}`);
      }
      if (stage.upstreamCommitKey) {
        const files = stage.upstreamCommitFor.map((key) => readValue(text, key));
        const commit = lastCommitTouching(files);
        if (commit && readValue(text, stage.upstreamCommitKey) !== commit) {
          text = writeValue(text, stage.upstreamCommitKey, commit, stage.file);
          changed.push(
            `${stage.file} :: ${stage.upstreamCommitKey} -> ${commit.slice(0, 12)}`,
          );
        } else {
          verified.push(`${stage.file} :: ${stage.upstreamCommitKey}`);
        }
      }
    }

    const next = wasCRLF ? text.split('\n').join('\r\n') : text;
    if (next !== raw && !check) writeFileSync(file, next, 'utf8');
    if (next !== raw && check) {
      // recorded in `changed`; nothing written
    }
  }

  return { changed, verified, stale };
}

const check = process.argv.includes('--check');
const result = run({ check });
console.log(
  JSON.stringify(
    {
      mode: check ? 'check' : 'resolve',
      converged: result.changed.length === 0,
      rewritten: result.changed,
      verified: result.verified.length,
      staleNotRewritten: result.stale,
    },
    null,
    2,
  ),
);
if (check && (result.changed.length || result.stale.length)) process.exit(1);
if (!check && result.stale.length) process.exit(1);
