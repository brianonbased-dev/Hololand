/* global process */

/**
 * Offline node --test suite for the MV-B5 durability checker
 * (scripts/check-hololand-model-village-durability.mjs). Runs the REAL drill
 * once (spawning + SIGKILLing real child processes, racing real child processes
 * for contention, and re-verifying a real sealed store read-only), then asserts
 * the emitted receipt's shape, schema, drill presence, honest gap surfacing,
 * exact claim-boundary flags, self-hash verification, tamper rejection, and
 * scratch isolation.
 *
 * No network, no providers, no git. Every store lives under an os.tmpdir scratch
 * root the drill creates and removes; the only durable artifact is the receipt
 * written to a temp --output path this suite cleans up.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { clearTimeout, setTimeout } from 'node:timers';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  AUDIT_OPEN_SCHEMA,
} from '../model-village-audit-open.mjs';
import {
  CONTENTION_DRILL_SCHEMA,
} from '../model-village-contention-drill.mjs';
import {
  CRASH_DRILL_SCENARIO_EXPECTATIONS,
  CRASH_DRILL_SCENARIOS,
  CRASH_DRILL_SCHEMA,
} from '../model-village-crash-drill.mjs';
import {
  canonicalDigest,
  releasePersistentStoreLock,
} from '../model-village-phase0b-runtime.mjs';
import {
  DURABILITY_RECEIPT_SCHEMA,
  runDurabilityDrill,
  verifyDurabilityReceipt,
} from '../check-hololand-model-village-durability.mjs';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SUITE_TIMEOUT_MS = 120000;

// The full drill is expensive (spawns + kills many child processes). Run it ONCE
// in a before() hook and share the receipt across the assertion tests.
let SCRATCH_BASE;
let OUTPUT_PATH;
let RECEIPT;

before(async () => {
  SCRATCH_BASE = mkdtempSync(path.join(os.tmpdir(), 'mv-b5-durability-test-'));
  const storeRoot = path.join(SCRATCH_BASE, 'store');
  mkdirSync(storeRoot, { recursive: true });
  OUTPUT_PATH = path.join(SCRATCH_BASE, 'durability-receipt.json');
  const result = await runDurabilityDrill({
    storeRoot,
    output: OUTPUT_PATH,
    root: SCRATCH_BASE,
    // Smaller contention config keeps the suite bounded while still contending.
    contentionWorkerCount: 3,
    contentionOpsPerWorker: 2,
  });
  RECEIPT = result.receipt;
}, { timeout: SUITE_TIMEOUT_MS });

after(() => {
  try {
    rmSync(SCRATCH_BASE, { recursive: true, force: true });
  } catch {
    /* best-effort cleanup */
  }
});

test('receipt has the exact top-level schema shape', { timeout: SUITE_TIMEOUT_MS }, () => {
  assert.equal(RECEIPT.schema, DURABILITY_RECEIPT_SCHEMA);
  assert.ok(SHA256_PATTERN.test(RECEIPT.receiptHash), 'receiptHash is sha256 hex');
  assert.equal(typeof RECEIPT.allInvariantsHeld, 'boolean');
  assert.ok(!Number.isNaN(Date.parse(RECEIPT.generatedAt)), 'generatedAt parses');

  const keys = Object.keys(RECEIPT).sort();
  assert.deepEqual(keys, [
    'allInvariantsHeld',
    'auditOpenDrill',
    'claimBoundary',
    'contentionDrill',
    'crashDrills',
    'gapsObserved',
    'generatedAt',
    'receiptHash',
    'schema',
  ]);
});

test('every crash scenario ran ONCE and matches its documented expectation', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  const scenarios = RECEIPT.crashDrills.map((drill) => drill.scenario);
  // Full scenario set, each exactly once (not swept).
  assert.deepEqual(
    [...scenarios].sort(),
    [...CRASH_DRILL_SCENARIOS].sort(),
    'all known crash scenarios are present',
  );
  assert.equal(new Set(scenarios).size, scenarios.length, 'no scenario ran twice');

  for (const drill of RECEIPT.crashDrills) {
    assert.equal(drill.schema, CRASH_DRILL_SCHEMA);
    assert.equal(drill.recoveredInFreshProcess, true);
    assert.notEqual(drill.recoveryPid, drill.workerPid, 'recovery ran in a fresh process');
    assert.equal(
      drill.invariantHeld,
      CRASH_DRILL_SCENARIO_EXPECTATIONS[drill.scenario],
      `${drill.scenario} must match its documented expectation`,
    );
  }
});

test('contention drill and audit-open drill are both present and honest', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  assert.equal(RECEIPT.contentionDrill.schema, CONTENTION_DRILL_SCHEMA);
  assert.equal(RECEIPT.contentionDrill.finalChainLinear, true);
  assert.equal(RECEIPT.contentionDrill.persistenceStoreLock.serialized, true);
  assert.equal(RECEIPT.contentionDrill.nonVacuityControl.flaggedByChainCheck, true);
  assert.equal(
    RECEIPT.contentionDrill.opsCommitted,
    RECEIPT.contentionDrill.workerCount * RECEIPT.contentionDrill.opsPerWorker,
  );

  assert.equal(RECEIPT.auditOpenDrill.schema, AUDIT_OPEN_SCHEMA);
  assert.equal(RECEIPT.auditOpenDrill.ok, true);
  assert.equal(RECEIPT.auditOpenDrill.appendedNothing, true);
  assert.equal(RECEIPT.auditOpenDrill.createdNoLock, true);
  assert.equal(RECEIPT.auditOpenDrill.mtimeUnchanged, true);
  assert.ok(SHA256_PATTERN.test(RECEIPT.auditOpenDrill.accessLogTailHash));
  assert.ok(Array.isArray(RECEIPT.auditOpenDrill.checkNames));
  assert.ok(RECEIPT.auditOpenDrill.checkNames.includes('access-log-chain'));
});

test('gaps are surfaced honestly, and the two fixed HIGH gaps stay fixed', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  // G1 (destroyContentKey crash wedge) and G2 (phase0b lock leak) are FIXED, so
  // no crash drill may receipt a gap and allInvariantsHeld must be true. This
  // assertion is the regression tripwire: if either fix regresses, its drill
  // receipts invariantHeld:false and this flips back to false.
  assert.equal(
    RECEIPT.allInvariantsHeld,
    true,
    'both HIGH durability gaps are fixed; a regression must not be hidden',
  );

  const executed = RECEIPT.gapsObserved.filter((gap) => gap.executed === true);
  assert.deepEqual(
    executed.map((gap) => gap.ref).sort(),
    [],
    'no executed gap remains (G1 and G2 are fixed)',
  );

  // The formerly-gapped scenarios must now assert their POSITIVE invariants.
  for (const scenario of [
    'custody-destroy-key-killed-mid-destroy',
    'persistent-state-lock-leak-after-kill',
  ]) {
    const drill = RECEIPT.crashDrills.find((entry) => entry.scenario === scenario);
    assert.ok(drill, `${scenario} still runs`);
    assert.equal(drill.invariantHeld, true, `${scenario} must hold now that it is fixed`);
    assert.equal(drill.gapReference, null, `${scenario} no longer references a gap`);
    assert.doesNotMatch(
      drill.observedOutcome,
      /REGRESSION/,
      `${scenario} must not report a regression`,
    );
  }

  // Documented-only gaps stay catalogued honestly, with file:line + owner.
  for (const gap of RECEIPT.gapsObserved) {
    assert.equal(gap.executed, false, 'every remaining gap is documented-only');
    assert.match(gap.file, /:\d/, 'gap carries a file:line reference');
    assert.ok(gap.minimalFix.length > 0, 'gap names a minimal fix');
    assert.ok(gap.owner.length > 0, 'gap names an owning lane');
  }

  // Anti-hiding invariant retained: any crash drill that DID report a gap must
  // appear as an executed gap.
  for (const drill of RECEIPT.crashDrills) {
    if (drill.invariantHeld === false) {
      const match = RECEIPT.gapsObserved.find(
        (gap) => gap.ref === drill.gapReference && gap.executed === true,
      );
      assert.ok(match, `crash gap ${drill.gapReference} is not hidden`);
    }
  }
});

test('claim-boundary flags are pinned exactly (honest about what is NOT proven)', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  const cb = RECEIPT.claimBoundary;
  assert.equal(cb.fleetOrMultiHostConsensusClaimed, false);
  assert.equal(cb.mediaFailureDurabilityClaimed, false);
  assert.equal(cb.productionDeploymentClaimed, false);
  // fsync is TRUSTED, not proven — pinned true on purpose.
  assert.equal(cb.fsyncHonestyAssumed, true);
  assert.ok(Array.isArray(cb.observed) && cb.observed.length > 0);
  assert.ok(Array.isArray(cb.notObserved) && cb.notObserved.length > 0);
  // The boundary must name the process-crash + contention + audit-open proofs.
  assert.match(cb.observed.join(' '), /process-crash/i);
  assert.match(cb.observed.join(' '), /multi-process/i);
  assert.match(cb.observed.join(' '), /audit-open/i);
});

test('emitted receipt file self-verifies via verifyDurabilityReceipt', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  assert.ok(existsSync(OUTPUT_PATH), 'receipt file was written');
  const onDisk = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  assert.equal(onDisk.receiptHash, RECEIPT.receiptHash, 'on-disk receipt matches the returned one');
  const verification = verifyDurabilityReceipt(onDisk);
  assert.equal(verification.ok, true, `receipt must self-verify: ${verification.failureReason}`);
});

test('verifyDurabilityReceipt rejects a tampered receipt', { timeout: SUITE_TIMEOUT_MS }, () => {
  // Flip allInvariantsHeld away from reality without recomputing the hash —
  // rejected by the self-hash recompute (and, were the hash rebuilt, by the
  // reality check too). Flipping from the ACTUAL value keeps this a real tamper
  // whichever way the drill currently lands.
  const flipped = { ...RECEIPT, allInvariantsHeld: !RECEIPT.allInvariantsHeld };
  assert.equal(
    verifyDurabilityReceipt(flipped).ok,
    false,
    'an allInvariantsHeld value that contradicts the embedded receipts must be rejected',
  );

  // Missing key → rejected by the closed-key assertion.
  const missingKey = { ...RECEIPT };
  delete missingKey.gapsObserved;
  assert.equal(verifyDurabilityReceipt(missingKey).ok, false, 'missing key must be rejected');

  // Extra key → rejected by the closed-key assertion.
  const extraKey = { ...RECEIPT, sneaky: true };
  assert.equal(verifyDurabilityReceipt(extraKey).ok, false, 'extra key must be rejected');
});

test('a laundered regression is rejected by verifyDurabilityReceipt', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  // Now that every scenario is expected to HOLD, a laundered regression is a
  // drill that receipts invariantHeld:false with a re-signed sub-receipt and no
  // matching entry in gapsObserved. Two independent fences reject it: the
  // documented-expectation check fires first, and the anti-hiding rule stands
  // behind it (it has no live executed gap left to catch, by design).
  for (const [index, drill] of RECEIPT.crashDrills.entries()) {
    // Re-sign the mutated drill exactly the way the harness does, so it clears
    // the sub-receipt hash check and a SEMANTIC fence is what rejects it.
    const unsigned = { ...drill };
    delete unsigned.receiptHash;
    const regressed = { ...unsigned, gapReference: 'G1', invariantHeld: false };
    const laundered = {
      ...RECEIPT,
      crashDrills: RECEIPT.crashDrills.map((entry, position) => (
        position === index
          ? { ...regressed, receiptHash: canonicalDigest(regressed) }
          : entry
      )),
    };
    const verification = verifyDurabilityReceipt(laundered);
    assert.equal(
      verification.ok,
      false,
      `a regressed ${drill.scenario} must not verify even with its gap stripped`,
    );
    assert.match(
      verification.failureReason,
      /disagrees with the documented expectation|hidden gap|not surfaced/i,
      `${drill.scenario} must be rejected as a regression, not for an incidental reason`,
    );
  }
});

test('drill scratch is isolated and removed (no lingering store dirs)', {
  timeout: SUITE_TIMEOUT_MS,
}, () => {
  // The drill created its own scratch subtree under storeRoot and removed it in
  // its finally. The only thing left under SCRATCH_BASE is the receipt file (and
  // the now-empty storeRoot). No crash/contention case dirs may remain.
  const storeRoot = path.join(SCRATCH_BASE, 'store');
  const leftovers = existsSync(storeRoot) ? readdirSync(storeRoot) : [];
  assert.equal(leftovers.length, 0, `store scratch must be empty: ${leftovers.join(',')}`);
});

test('a second isolated run reproduces the verdicts and a self-verifying receipt', {
  timeout: SUITE_TIMEOUT_MS,
}, async () => {
  // Point the drill at a brand-new isolated store root and confirm it produces
  // a self-verifying receipt again with the same verdicts — the harness
  // contract is deterministic across fresh scratch roots.
  const isolated = path.join(SCRATCH_BASE, `isolated-${randomUUID()}`);
  mkdirSync(isolated, { recursive: true });
  const output = path.join(isolated, 'receipt.json');
  const { receipt } = await runDurabilityDrill({
    storeRoot: isolated,
    output,
    root: isolated,
    contentionWorkerCount: 2,
    contentionOpsPerWorker: 1,
  });
  assert.equal(receipt.schema, DURABILITY_RECEIPT_SCHEMA);
  assert.equal(verifyDurabilityReceipt(receipt).ok, true);
  assert.equal(receipt.allInvariantsHeld, true, 'the verdicts are reproducible across runs');
  const executedRefs = receipt.gapsObserved
    .filter((gap) => gap.executed === true)
    .map((gap) => gap.ref)
    .sort();
  assert.deepEqual(executedRefs, []);
});

// ---------------------------------------------------------------------------
// MV-B5 gap G2 regression: the phase0b persistence lock is pid-stamped and
// reclaimable. These are DIRECT behavioral proofs against the production lock
// (not the drill): a real second live process is spawned so "a live holder is
// never stolen from" is proven against an actually-running holder rather than a
// simulated one.
// ---------------------------------------------------------------------------

const PHASE0B_URL = pathToFileURL(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'model-village-phase0b-runtime.mjs'),
).href;

const G2_SCRATCH_DIRS = [];

function g2Scratch() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'mv-b5-g2-lock-'));
  G2_SCRATCH_DIRS.push(dir);
  return dir;
}

after(() => {
  for (const dir of G2_SCRATCH_DIRS) rmSync(dir, { force: true, recursive: true });
});

/** Spawns a REAL child that takes the production lock and blocks holding it. */
function spawnLiveLockHolder(storeDir) {
  // No backslash escapes in the generated source: String.fromCharCode(10) is
  // the newline, so nothing here depends on nested escaping surviving.
  const source = [
    `const m = await import(${JSON.stringify(PHASE0B_URL)});`,
    `m.acquirePersistentStoreLock(${JSON.stringify(storeDir)});`,
    "process.stdout.write('HOLDING' + String.fromCharCode(10));",
    'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);',
  ].join('\n');
  const child = spawn(process.execPath, ['--input-type=module', '-e', source], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((resolve, reject) => {
    let out = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('live lock holder never signalled HOLDING'));
    }, 20000);
    child.stdout.on('data', (chunk) => {
      out += String(chunk);
      if (out.includes('HOLDING')) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    let err = '';
    child.stderr.on('data', (chunk) => {
      err += String(chunk);
    });
    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      reject(new Error(`live lock holder exited early (${code}/${signal}): ${err.trim()}`));
    });
  });
}

test('G2: a LIVE holder is never stolen from (real second process)', {
  timeout: SUITE_TIMEOUT_MS,
}, async () => {
  const { acquirePersistentStoreLock } = await import(PHASE0B_URL);
  const storeDir = path.join(g2Scratch(), 'phase0b');
  mkdirSync(storeDir, { recursive: true });

  const holder = await spawnLiveLockHolder(storeDir);
  const lockFile = path.join(storeDir, 'state.lock');
  try {
    const bytesBefore = readFileSync(lockFile, 'utf8');
    assert.equal(
      JSON.parse(bytesBefore).pid,
      holder.pid,
      'the production lock records the holding process pid',
    );
    // A contender must refuse — and must not have touched the lock at all.
    assert.throws(
      () => acquirePersistentStoreLock(storeDir),
      /Persistent authorization store is locked by another writer/,
      "a live holder's lock must never be stolen",
    );
    assert.equal(existsSync(lockFile), true, 'the refused contender left the lock in place');
    assert.equal(
      readFileSync(lockFile, 'utf8'),
      bytesBefore,
      'the refused contender did not rewrite the live holder record',
    );
  } finally {
    holder.kill('SIGKILL');
    await new Promise((resolve) => holder.on('exit', resolve));
  }

  // Now that the holder is genuinely dead, the SAME leaked lock is reclaimable.
  const descriptor = acquirePersistentStoreLock(storeDir);
  assert.equal(
    JSON.parse(readFileSync(lockFile, 'utf8')).pid,
    process.pid,
    'the reclaimed lock is re-stamped with the new holder pid (broken and retaken once)',
  );
  closeSync(descriptor);
  releasePersistentStoreLock(storeDir);
  assert.equal(existsSync(lockFile), false, 'release removes the lock');
});

test('G2: a dead-pid lock is broken exactly once and the store becomes writable', {
  timeout: SUITE_TIMEOUT_MS,
}, async () => {
  const { acquirePersistentStoreLock } = await import(PHASE0B_URL);
  const storeDir = path.join(g2Scratch(), 'phase0b');
  mkdirSync(storeDir, { recursive: true });
  const lockFile = path.join(storeDir, 'state.lock');

  // A pid that has certainly exited: spawn a real child and wait for its exit.
  const corpse = spawn(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'ignore' });
  const deadPid = corpse.pid;
  await new Promise((resolve) => corpse.on('exit', resolve));

  const stale = `{"acquiredAt":"2026-07-27T00:00:00.000Z","pid":${deadPid}}\n`;
  writeFileSync(lockFile, stale, 'utf8');

  const descriptor = acquirePersistentStoreLock(storeDir);
  const reclaimed = JSON.parse(readFileSync(lockFile, 'utf8'));
  assert.equal(reclaimed.pid, process.pid, 'the stale lock was broken and retaken');
  assert.notEqual(readFileSync(lockFile, 'utf8'), stale, 'the stale record is gone');
  closeSync(descriptor);
  releasePersistentStoreLock(storeDir);

  // Second acquire on a now-clean dir still works: breaking is per-acquire, not
  // a mode the lock gets stuck in.
  const second = acquirePersistentStoreLock(storeDir);
  closeSync(second);
  releasePersistentStoreLock(storeDir);
  assert.equal(existsSync(lockFile), false);
});

test('G2: a lock with garbage or missing pid FAILS CLOSED and is left untouched', {
  timeout: SUITE_TIMEOUT_MS,
}, async () => {
  const { acquirePersistentStoreLock } = await import(PHASE0B_URL);
  const storeDir = path.join(g2Scratch(), 'phase0b');
  mkdirSync(storeDir, { recursive: true });
  const lockFile = path.join(storeDir, 'state.lock');

  // An unknown holder is NOT a dead holder: none of these may be broken.
  const unknownHolders = [
    ['empty file (the pre-fix lock shape)', ''],
    ['non-JSON garbage', 'held-by-adversarial-test\n'],
    ['JSON without a pid', '{"acquiredAt":"2026-07-27T00:00:00.000Z"}\n'],
    ['non-integer pid', '{"pid":"not-a-pid"}\n'],
    ['nonsense pid value', '{"pid":-1}\n'],
    ['truncated JSON', '{"acquiredAt":"2026-07-2'],
  ];
  for (const [label, content] of unknownHolders) {
    writeFileSync(lockFile, content, 'utf8');
    assert.throws(
      () => acquirePersistentStoreLock(storeDir),
      /Persistent authorization store is locked by another writer/,
      `${label}: an unidentifiable holder must fail closed, never be broken`,
    );
    assert.equal(existsSync(lockFile), true, `${label}: the lock file must survive the refusal`);
    assert.equal(
      readFileSync(lockFile, 'utf8'),
      content,
      `${label}: the lock file must be left byte-identical`,
    );
  }
  rmSync(lockFile, { force: true });
});

// ---------------------------------------------------------------------------
// MV-B5 gap G2, review round 2: MUTUAL EXCLUSION under a stale lock.
//
// The first G2 fix reclaimed the leaked lock but broke it with a path-bound
// `unlinkSync(target)`: every contender that had read the same dead pid removed
// whatever happened to be at that path, so N contenders became N winners (2-8
// per trial, 12/12 trials) and a LIVE holder's lock could be deleted. The break
// is now identity-bound and only its winner may retry. These tests race REAL OS
// processes — a unit assertion cannot see this class of defect.
// ---------------------------------------------------------------------------

/** Source for a child that waits on a barrier, then races for the REAL lock. */
function contenderSource(storeDir, barrier, resultFile) {
  return [
    `const m = await import(${JSON.stringify(PHASE0B_URL)});`,
    "const fs = await import('node:fs');",
    `const barrier = ${JSON.stringify(barrier)};`,
    'const deadline = Date.now() + 20000;',
    'while (!fs.existsSync(barrier) && Date.now() < deadline) { /* spin */ }',
    'let row;',
    'try {',
    `  m.acquirePersistentStoreLock(${JSON.stringify(storeDir)});`,
    '  const until = Date.now() + 40; while (Date.now() < until) { /* hold */ }',
    `  const raw = fs.readFileSync(${JSON.stringify(path.join(storeDir, 'state.lock'))}, 'utf8');`,
    '  row = { pid: process.pid, won: true, recordedPid: JSON.parse(raw).pid };',
    '} catch (error) { row = { pid: process.pid, won: false }; }',
    `fs.appendFileSync(${JSON.stringify(resultFile)}, JSON.stringify(row) + String.fromCharCode(10));`,
  ].join('\n');
}

async function deadPid() {
  const corpse = spawn(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'ignore' });
  const pid = corpse.pid;
  await new Promise((resolve) => corpse.on('exit', resolve));
  return pid;
}

test('G2: N real processes racing ONE stale lock produce exactly one winner', {
  timeout: SUITE_TIMEOUT_MS,
}, async () => {
  const storeDir = path.join(g2Scratch(), 'phase0b');
  mkdirSync(storeDir, { recursive: true });
  const lockFile = path.join(storeDir, 'state.lock');
  const barrier = path.join(storeDir, '..', 'barrier');
  const resultFile = path.join(storeDir, '..', 'results.jsonl');
  const stalePid = await deadPid();
  const source = contenderSource(storeDir, barrier, resultFile);

  const winCounts = [];
  for (let trial = 0; trial < 6; trial += 1) {
    writeFileSync(resultFile, '', 'utf8');
    rmSync(barrier, { force: true });
    writeFileSync(
      lockFile,
      `{"acquiredAt":"2026-07-27T00:00:00.000Z","pid":${stalePid}}\n`,
      'utf8',
    );
    const kids = [];
    for (let index = 0; index < 8; index += 1) {
      kids.push(spawn(process.execPath, ['--input-type=module', '-e', source], { stdio: 'ignore' }));
    }
    await new Promise((resolve) => { setTimeout(resolve, 250); });
    writeFileSync(barrier, 'go', 'utf8');
    await Promise.all(kids.map((kid) => new Promise((resolve) => kid.on('exit', resolve))));
    const rows = readFileSync(resultFile, 'utf8')
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line));
    const winners = rows.filter((row) => row.won);
    assert.equal(
      winners.length,
      1,
      `trial ${trial}: a stale lock must admit exactly ONE writer, got `
      + `${winners.length}: ${JSON.stringify(winners)}`,
    );
    assert.equal(
      winners[0].recordedPid,
      winners[0].pid,
      'the single winner is the pid recorded in the lock it holds',
    );
    winCounts.push(winners.length);
    rmSync(lockFile, { force: true });
  }
  assert.deepEqual(winCounts, [1, 1, 1, 1, 1, 1]);
});

test('G2: a contender holding a STALE decision refuses rather than stealing a live lock', {
  timeout: SUITE_TIMEOUT_MS,
}, async () => {
  const { acquirePersistentStoreLock, breakStaleLockFile } = await import(PHASE0B_URL);
  const storeDir = path.join(g2Scratch(), 'phase0b');
  mkdirSync(storeDir, { recursive: true });
  const lockFile = path.join(storeDir, 'state.lock');
  const stalePid = await deadPid();
  writeFileSync(
    lockFile,
    `{"acquiredAt":"2026-07-27T00:00:00.000Z","pid":${stalePid}}\n`,
    'utf8',
  );

  // Contender B, step 1: it has read the stale holder and DECIDED to break.
  const observed = readFileSync(lockFile);

  // Meanwhile a real live holder takes the lock through the real function.
  const holder = await spawnLiveLockHolder(storeDir);
  const liveBytes = readFileSync(lockFile, 'utf8');
  assert.equal(JSON.parse(liveBytes).pid, holder.pid);

  try {
    // Contender B, step 2 — the literal post-fix source step.
    const outcome = breakStaleLockFile(lockFile, observed);
    assert.notEqual(outcome, 'broke', "a live holder's lock must never be broken");
    assert.equal(existsSync(lockFile), true, 'the live lock is still there');
    assert.equal(
      readFileSync(lockFile, 'utf8'),
      liveBytes,
      'the live holder record is byte-identical after the refused break',
    );
    assert.throws(
      () => acquirePersistentStoreLock(storeDir),
      /Persistent authorization store is locked by another writer/,
      'and the whole acquire still refuses',
    );
  } finally {
    holder.kill('SIGKILL');
    await new Promise((resolve) => holder.on('exit', resolve));
  }
});

test('G2: release is ownership-verified — it never removes a successor lock', {
  timeout: SUITE_TIMEOUT_MS,
}, async () => {
  const { acquirePersistentStoreLock } = await import(PHASE0B_URL);
  const storeDir = path.join(g2Scratch(), 'phase0b');
  mkdirSync(storeDir, { recursive: true });
  const lockFile = path.join(storeDir, 'state.lock');

  const descriptor = acquirePersistentStoreLock(storeDir);
  // Model the residual case the break can still produce: this holder's lock is
  // removed and a SUCCESSOR takes the path.
  rmSync(lockFile, { force: true });
  const successor = `{"acquiredAt":"2026-07-27T00:00:00.000Z","pid":${process.pid + 1}}\n`;
  writeFileSync(lockFile, successor, 'utf8');

  closeSync(descriptor);
  releasePersistentStoreLock(storeDir);
  assert.equal(
    existsSync(lockFile),
    true,
    "a stale holder's release must not delete the successor's lock",
  );
  assert.equal(readFileSync(lockFile, 'utf8'), successor, 'left byte-identical');
  rmSync(lockFile, { force: true });
});
