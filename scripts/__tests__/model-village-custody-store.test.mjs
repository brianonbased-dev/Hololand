/* global Buffer, process */

/**
 * Offline node --test suite for the MV-B1 sealed custody store
 * (scripts/model-village-custody-store.mjs). No network, no providers, no
 * git — scratch stores live under node:os tmpdir and are removed after each
 * test.
 */

import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  CUSTODY_ACCESS_LOG_ENTRY_SCHEMA,
  CUSTODY_ACCESS_LOG_GENESIS,
  CUSTODY_STORE_CLAIM_BOUNDARY,
  CUSTODY_TOMBSTONE_SCHEMA,
  CustodyDuplicateObjectError,
  CustodyIntegrityError,
  CustodyKeyDestroyedError,
  CustodyLockError,
  CustodyValidationError,
  SEALED_CUSTODY_STORE_SCHEMA,
  createSealedCustodyStore,
  openSealedCustodyStore,
} from '../model-village-custody-store.mjs';
import {
  canonicalDigest,
  canonicalJson,
} from '../model-village-phase0b-runtime.mjs';

const RETENTION_POLICY = Object.freeze({
  description:
    'Engineering certification drill retention policy; frozen before any '
    + 'live run per the sealed-store spec requirement.',
  frozenAt: '2026-07-26T00:00:00.000Z',
  policyId: 'mv-b1-drill-retention-v1',
});

function makeScratchDir(t) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'mv-custody-'));
  t.after(() => {
    rmSync(dir, { force: true, recursive: true });
  });
  return dir;
}

function makeStore(t, overrides = {}) {
  const scratch = makeScratchDir(t);
  const rootDir = path.join(scratch, 'store');
  const store = createSealedCustodyStore({
    operator: 'operator-drill-01',
    retentionPolicy: RETENTION_POLICY,
    rootDir,
    runLabel: 'mv-b1-custody-drill',
    ...overrides,
  });
  return { rootDir, store };
}

function readAccessLogEntries(rootDir) {
  return readFileSync(path.join(rootDir, 'access-log.jsonl'), 'utf8')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));
}

test('seal/read roundtrip is byte-exact for raw bytes and canonical values', (t) => {
  const { store } = makeStore(t);
  const payload = randomBytes(257);
  const sealed = store.sealObject({
    bytes: payload,
    kind: 'raw-model-response',
    label: 'drill-response-01',
  });
  assert.match(sealed.custodyId, /^[a-f0-9]{64}$/);
  assert.equal(sealed.byteLength, 257);
  const read = store.readObject(sealed.custodyId);
  assert.ok(read.bytes.equals(payload), 'plaintext bytes must roundtrip exactly');
  assert.equal(read.kind, 'raw-model-response');
  assert.equal(read.label, 'drill-response-01');

  const valueSealed = store.sealObject({
    kind: 'structured-fixture',
    label: 'drill-value-01',
    value: { alpha: 1, nested: { deep: true } },
  });
  const valueRead = store.readObject(valueSealed.custodyId);
  assert.equal(
    valueRead.bytes.toString('utf8'),
    '{"alpha":1,"nested":{"deep":true}}',
  );
  const verification = store.verifyIntegrity();
  assert.equal(verification.ok, true);
  assert.equal(verification.mode, 'plaintext-decrypt');
  assert.equal(
    verification.claimBoundary.liveStudyRunClaimed,
    false,
    'claim boundary must ride every verification result',
  );
});

test('sealObject(value) custodyId is key-order independent and duplicate-guarded', (t) => {
  const { store } = makeStore(t);
  const first = store.sealObject({
    kind: 'structured-fixture',
    label: 'order-a',
    value: { b: 2, a: 1 },
  });
  assert.equal(
    first.custodyId,
    canonicalDigest({ a: 1, b: 2 }),
    'custodyId must equal the canonical digest of the value',
  );
  let duplicate = null;
  try {
    store.sealObject({
      kind: 'structured-fixture',
      label: 'order-b',
      value: { a: 1, b: 2 },
    });
  } catch (error) {
    duplicate = error;
  }
  assert.ok(duplicate instanceof CustodyDuplicateObjectError);
  assert.equal(
    duplicate.custodyId,
    first.custodyId,
    'reordered keys must address the identical sealed object',
  );
});

test('access-log chain tamper fails verifyIntegrity', (t) => {
  const { rootDir, store } = makeStore(t);
  store.sealObject({
    bytes: Buffer.from('tamper-target', 'utf8'),
    kind: 'raw-model-response',
    label: 'drill-tamper-01',
  });
  const logPath = path.join(rootDir, 'access-log.jsonl');
  const lines = readFileSync(logPath, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0);
  assert.ok(lines.length >= 2, 'expected create + seal entries');
  const tampered = JSON.parse(lines[1]);
  tampered.operator = 'tampered-operator';
  lines[1] = JSON.stringify(tampered);
  writeFileSync(logPath, `${lines.join('\n')}\n`);
  const verification = store.verifyIntegrity();
  assert.equal(verification.ok, false);
  const chainCheck = verification.checks.find(
    (check) => check.name === 'access-log-chain',
  );
  assert.equal(chainCheck.ok, false);
  assert.match(chainCheck.detail, /entryHash|chain/i);
  // Release the exclusive handle lock so the reopen attempt reaches the
  // chain validation (and still fails loud there).
  store.close();
  assert.throws(
    () => openSealedCustodyStore({ operator: 'operator-two', rootDir }),
    CustodyIntegrityError,
    'reopen over a tampered chain must fail loud',
  );
});

test('ciphertext tamper makes readObject throw and verifyIntegrity fail', (t) => {
  const { rootDir, store } = makeStore(t);
  const sealed = store.sealObject({
    bytes: Buffer.from('ciphertext-tamper-target', 'utf8'),
    kind: 'raw-model-response',
    label: 'drill-tamper-02',
  });
  const objectPath = path.join(rootDir, 'objects', `${sealed.custodyId}.enc`);
  const fileBytes = Buffer.from(readFileSync(objectPath));
  fileBytes[fileBytes.length - 1] ^= 0xff;
  writeFileSync(objectPath, fileBytes);
  assert.throws(
    () => store.readObject(sealed.custodyId),
    CustodyIntegrityError,
  );
  const verification = store.verifyIntegrity();
  assert.equal(verification.ok, false);
  const objectsCheck = verification.checks.find(
    (check) => check.name === 'objects-content',
  );
  assert.equal(objectsCheck.ok, false);
});

test('key destruction: tombstone appended, reads blocked, checksum-mode verify ok', (t) => {
  const { rootDir, store } = makeStore(t);
  const sealed = store.sealObject({
    bytes: Buffer.from('to-be-deleted-by-key-destruction', 'utf8'),
    kind: 'raw-model-response',
    label: 'drill-delete-01',
  });
  const tombstone = store.destroyContentKey({
    reason: 'retention window elapsed (engineering drill)',
  });
  assert.equal(tombstone.schema, CUSTODY_TOMBSTONE_SCHEMA);
  assert.equal(tombstone.scope, 'all-objects');
  assert.deepEqual(
    Object.keys(tombstone).sort(),
    ['at', 'keyFingerprint', 'reason', 'schema', 'scope'],
    'tombstone must be nonidentifying: no labels, kinds, or custodyIds',
  );
  assert.equal(
    existsSync(path.join(rootDir, 'key', 'content-key.bin')),
    false,
    'key file must be unlinked after zero-overwrite',
  );
  const tombstoneLines = readFileSync(
    path.join(rootDir, 'tombstones.jsonl'),
    'utf8',
  )
    .split('\n')
    .filter((line) => line.length > 0);
  assert.equal(tombstoneLines.length, 1);
  assert.throws(
    () => store.readObject(sealed.custodyId),
    CustodyKeyDestroyedError,
  );
  assert.throws(
    () => store.sealObject({
      bytes: Buffer.from('late', 'utf8'),
      kind: 'raw-model-response',
      label: 'too-late',
    }),
    CustodyKeyDestroyedError,
  );
  const verification = store.verifyIntegrity();
  assert.equal(verification.mode, 'ciphertext-checksum-only');
  assert.equal(
    verification.ok,
    true,
    'intact chains must still verify after key destruction',
  );

  store.close();
  const reopened = openSealedCustodyStore({
    operator: 'operator-after-destruction',
    rootDir,
  });
  assert.throws(
    () => reopened.readObject(sealed.custodyId),
    CustodyKeyDestroyedError,
    'reopened destroyed store must stay read-blocked',
  );
  const reopenedVerification = reopened.verifyIntegrity();
  assert.equal(reopenedVerification.mode, 'ciphertext-checksum-only');
  assert.equal(reopenedVerification.ok, true);
  const listing = reopened.listObjects();
  assert.equal(listing.length, 1);
  assert.equal(listing[0].metadataAvailable, false);
});

test('backup roundtrip verifies, excludes key custody, and detects tamper', (t) => {
  const { rootDir, store } = makeStore(t);
  store.sealObject({
    bytes: Buffer.from('backup-object-one', 'utf8'),
    kind: 'raw-model-response',
    label: 'drill-backup-01',
  });
  const second = store.sealObject({
    bytes: Buffer.from('backup-object-two', 'utf8'),
    kind: 'raw-model-response',
    label: 'drill-backup-02',
  });
  const backup = store.createBackup();
  assert.equal(backup.ok, true);
  assert.equal(
    existsSync(path.join(backup.backupDir, 'key')),
    false,
    'backup must not widen key custody',
  );
  const firstVerify = store.verifyBackup();
  assert.equal(firstVerify.ok, true);
  const fullVerify = store.verifyIntegrity();
  assert.equal(fullVerify.ok, true);
  const backupCheck = fullVerify.checks.find(
    (check) => check.name === 'backup-checksums',
  );
  assert.equal(backupCheck.ok, true);

  const backedUpObject = path.join(
    backup.backupDir,
    'objects',
    `${second.custodyId}.enc`,
  );
  const bytes = Buffer.from(readFileSync(backedUpObject));
  bytes[bytes.length - 1] ^= 0x01;
  writeFileSync(backedUpObject, bytes);
  const tamperedVerify = store.verifyBackup();
  assert.equal(tamperedVerify.ok, false);
  const fileCheck = tamperedVerify.checks.find(
    (check) => check.name === 'backup-file-checksums',
  );
  assert.equal(fileCheck.ok, false);
  assert.match(fileCheck.detail, /sha256 mismatch/);
});

test('missing or empty operator is rejected everywhere', (t) => {
  const scratch = makeScratchDir(t);
  assert.throws(
    () => createSealedCustodyStore({
      operator: '',
      retentionPolicy: RETENTION_POLICY,
      rootDir: path.join(scratch, 'store-a'),
      runLabel: 'mv-b1-custody-drill',
    }),
    CustodyValidationError,
  );
  assert.throws(
    () => createSealedCustodyStore({
      retentionPolicy: RETENTION_POLICY,
      rootDir: path.join(scratch, 'store-b'),
      runLabel: 'mv-b1-custody-drill',
    }),
    CustodyValidationError,
  );
  const { rootDir } = makeStore(t);
  assert.throws(
    () => openSealedCustodyStore({ rootDir }),
    CustodyValidationError,
  );
  assert.throws(
    () => openSealedCustodyStore({ operator: '', rootDir }),
    CustodyValidationError,
  );
});

test('createSealedCustodyStore refuses a non-empty rootDir', (t) => {
  const scratch = makeScratchDir(t);
  const rootDir = path.join(scratch, 'occupied');
  mkdirSync(rootDir, { recursive: true });
  writeFileSync(path.join(rootDir, 'stray.txt'), 'occupied');
  assert.throws(
    () => createSealedCustodyStore({
      operator: 'operator-drill-01',
      retentionPolicy: RETENTION_POLICY,
      rootDir,
      runLabel: 'mv-b1-custody-drill',
    }),
    /not empty/,
  );
});

test('reopen preserves the chain, appends an open entry, and keeps sequence monotonic', (t) => {
  const { rootDir, store } = makeStore(t);
  const sealed = store.sealObject({
    bytes: Buffer.from('reopen-roundtrip', 'utf8'),
    kind: 'raw-model-response',
    label: 'drill-reopen-01',
  });
  store.close();
  const reopened = openSealedCustodyStore({
    operator: 'operator-two',
    rootDir,
  });
  const manifest = reopened.getManifest();
  assert.equal(manifest.schema, SEALED_CUSTODY_STORE_SCHEMA);
  assert.equal(
    manifest.operator,
    'operator-drill-01',
    'manifest records the creating operator',
  );
  const read = reopened.readObject(sealed.custodyId);
  assert.equal(read.bytes.toString('utf8'), 'reopen-roundtrip');

  const entries = readAccessLogEntries(rootDir);
  assert.deepEqual(
    entries.map((entry) => entry.operation),
    ['create', 'seal', 'open', 'read'],
  );
  assert.deepEqual(
    entries.map((entry) => entry.sequence),
    [1, 2, 3, 4],
  );
  assert.equal(entries[0].prevEntryHash, CUSTODY_ACCESS_LOG_GENESIS);
  for (const entry of entries) {
    assert.equal(entry.schema, CUSTODY_ACCESS_LOG_ENTRY_SCHEMA);
  }
  for (let index = 1; index < entries.length; index += 1) {
    assert.equal(
      entries[index].prevEntryHash,
      entries[index - 1].entryHash,
      'each entry must chain from its predecessor',
    );
  }
  assert.equal(entries[2].operator, 'operator-two');
  const verification = reopened.verifyIntegrity();
  assert.equal(verification.ok, true);
});

test('a second live handle is refused; close() releases the exclusive lock', (t) => {
  const { rootDir, store } = makeStore(t);
  // Two live handles would share one in-memory chain tail and write
  // duplicate sequence numbers — the historical no-recovery corruption.
  assert.throws(
    () => openSealedCustodyStore({ operator: 'operator-two', rootDir }),
    CustodyLockError,
    'a concurrent second handle must be refused while the first is live',
  );
  store.sealObject({
    bytes: Buffer.from('written-under-lock', 'utf8'),
    kind: 'raw-model-response',
    label: 'drill-lock-01',
  });
  store.close();
  store.close(); // idempotent
  assert.throws(
    () => store.sealObject({
      bytes: Buffer.from('after-close', 'utf8'),
      kind: 'raw-model-response',
      label: 'drill-lock-refused',
    }),
    CustodyValidationError,
    'a closed handle must refuse operations',
  );
  assert.equal(
    existsSync(path.join(rootDir, 'store.lock')),
    false,
    'close() must release the lock file',
  );
  const reopened = openSealedCustodyStore({ operator: 'operator-two', rootDir });
  const sealed = reopened.sealObject({
    bytes: Buffer.from('post-reopen-append', 'utf8'),
    kind: 'raw-model-response',
    label: 'drill-lock-02',
  });
  assert.match(sealed.custodyId, /^[a-f0-9]{64}$/);
  const verification = reopened.verifyIntegrity();
  assert.equal(verification.ok, true, 'sequenced handoff keeps the chain valid');
  reopened.close();
});

test('a moved on-disk tail refuses the append instead of forking the chain', (t) => {
  const { rootDir, store } = makeStore(t);
  store.sealObject({
    bytes: Buffer.from('fork-fence-target', 'utf8'),
    kind: 'raw-model-response',
    label: 'drill-fork-01',
  });
  const logPath = path.join(rootDir, 'access-log.jsonl');
  const lines = readFileSync(logPath, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0);
  // Simulate a foreign writer appending behind this handle's back.
  writeFileSync(logPath, `${[...lines, lines[lines.length - 1]].join('\n')}\n`);
  const logAfterForeignAppend = readFileSync(logPath, 'utf8');
  assert.throws(
    () => store.sealObject({
      bytes: Buffer.from('would-fork-the-chain', 'utf8'),
      kind: 'raw-model-response',
      label: 'drill-fork-02',
    }),
    CustodyIntegrityError,
    'a stale handle must fail loud on its own write',
  );
  assert.equal(
    readFileSync(logPath, 'utf8'),
    logAfterForeignAppend,
    'the refused append must not extend the log',
  );
});

/**
 * Reseal an access-log chain so every prevEntryHash links from genesis and every
 * entryHash recomputes — WITHOUT renumbering `sequence`. This is what a
 * competent tamperer does after removing a line: repair the hashes so the chain
 * is internally consistent again. Only the monotonic-sequence check can see
 * through it.
 */
function resealAccessLog(entries) {
  let prevHash = CUSTODY_ACCESS_LOG_GENESIS;
  return entries.map((entry) => {
    const { entryHash, ...unsigned } = entry;
    void entryHash;
    const rechained = { ...unsigned, prevEntryHash: prevHash };
    const resealedHash = canonicalDigest(rechained);
    prevHash = resealedHash;
    return { ...rechained, entryHash: resealedHash };
  });
}

function writeAccessLogEntries(rootDir, entries) {
  writeFileSync(
    path.join(rootDir, 'access-log.jsonl'),
    `${entries.map((entry) => canonicalJson(entry)).join('\n')}\n`,
  );
}

/**
 * The custody store's sequence-monotonicity guard is a SEPARATE defense from the
 * hash chain, and it is the only one that survives a competent reseal. Without
 * this test the guard could be deleted outright and the whole 15-suite Model
 * Village chain would still exit 0 — a silently erased custody access record
 * would pass every gate. (The twin guard in model-village-trust-registry.mjs has
 * had its own test since day one; this module's copy did not.)
 */
test('access-log sequence monotonicity survives a fully resealed chain', (t) => {
  const { rootDir, store } = makeStore(t);
  const sealed = store.sealObject({
    bytes: Buffer.from('monotonicity-target', 'utf8'),
    kind: 'raw-model-response',
    label: 'drill-monotonic-01',
  });
  // create, seal, read, list, read — a middle READ entry can be removed without
  // disturbing the objects-vs-seal-log cross reference, which isolates this test
  // to the sequence guard alone.
  store.readObject(sealed.custodyId);
  store.listObjects();
  store.readObject(sealed.custodyId);

  store.close();

  const entries = readAccessLogEntries(rootDir);
  assert.deepEqual(
    entries.map((entry) => entry.operation),
    ['create', 'seal', 'read', 'list', 'read'],
  );

  // Control: resealing WITHOUT dropping anything must leave a store that still
  // opens and verifies. If this fails, the helper below is not a faithful
  // reseal and the negative case would prove nothing.
  writeAccessLogEntries(rootDir, resealAccessLog(entries));
  const reopened = openSealedCustodyStore({ operator: 'operator-two', rootDir });
  assert.equal(
    reopened.verifyIntegrity().ok,
    true,
    'the reseal helper must reproduce a valid chain, or the tamper case is unsound',
  );
  reopened.close();

  // Erase a middle read and reseal every remaining hash.
  const live = readAccessLogEntries(rootDir);
  const dropIndex = live.findIndex(
    (entry, index) => index > 0 && index < live.length - 1 && entry.operation === 'read',
  );
  assert.ok(dropIndex > 0, 'expected a middle read entry to erase');
  const dropped = resealAccessLog(live.filter((_, index) => index !== dropIndex));

  // The tampered log is hash-perfect: genesis link, forward chain, and every
  // entryHash recompute all hold. Sequence numbering is the ONLY residue.
  assert.equal(dropped[0].prevEntryHash, CUSTODY_ACCESS_LOG_GENESIS);
  for (let index = 1; index < dropped.length; index += 1) {
    assert.equal(dropped[index].prevEntryHash, dropped[index - 1].entryHash);
  }
  for (const entry of dropped) {
    const { entryHash, ...unsigned } = entry;
    assert.equal(canonicalDigest(unsigned), entryHash);
  }
  const expectedSequences = live
    .filter((_, index) => index !== dropIndex)
    .map((entry) => entry.sequence);
  assert.deepEqual(
    dropped.map((entry) => entry.sequence),
    expectedSequences,
    'the removed entry must leave a hole in the sequence and nothing else',
  );
  assert.equal(
    dropped[dropIndex].sequence - dropped[dropIndex - 1].sequence,
    2,
    'the hole must be exactly one erased entry',
  );

  writeAccessLogEntries(rootDir, dropped);
  assert.throws(
    () => openSealedCustodyStore({ operator: 'operator-three', rootDir }),
    (error) => error instanceof CustodyIntegrityError
      && /breaks monotonic order/.test(error.message),
    'an erased access-log entry must be rejected by the sequence guard — the '
    + 'hash chain alone cannot see it',
  );
});

test(
  'content key file and key/ directory are owner-only on POSIX hosts',
  { skip: process.platform === 'win32' },
  (t) => {
    const { rootDir, store } = makeStore(t);
    const keyMode = statSync(
      path.join(rootDir, 'key', 'content-key.bin'),
    ).mode & 0o777;
    assert.equal(
      keyMode & 0o077,
      0,
      `key file mode 0${keyMode.toString(8)} must not be group/world accessible`,
    );
    const dirMode = statSync(path.join(rootDir, 'key')).mode & 0o777;
    assert.equal(
      dirMode & 0o077,
      0,
      `key directory mode 0${dirMode.toString(8)} must be owner-only`,
    );
    const verification = store.verifyIntegrity();
    const keyCheck = verification.checks.find(
      (check) => check.name === 'key-custody',
    );
    assert.equal(keyCheck.ok, true);
  },
);

test('claim boundary pins every never-claim flag false', () => {
  assert.equal(CUSTODY_STORE_CLAIM_BOUNDARY.liveStudyRunClaimed, false);
  assert.equal(CUSTODY_STORE_CLAIM_BOUNDARY.phase1AdmissionClaimed, false);
  assert.equal(CUSTODY_STORE_CLAIM_BOUNDARY.phase1ReadinessClaimed, false);
  assert.equal(CUSTODY_STORE_CLAIM_BOUNDARY.sixResidentLiveTurnsClaimed, false);
  assert.equal(
    CUSTODY_STORE_CLAIM_BOUNDARY.blindedAliasAssignmentClaimed,
    false,
  );
  assert.equal(
    CUSTODY_STORE_CLAIM_BOUNDARY.sealedAdapterAliasRouteAssignmentIncluded,
    false,
    'adapter_a/b/c alias-to-route assignment is out of scope for this lane',
  );
  assert.equal(
    CUSTODY_STORE_CLAIM_BOUNDARY.productionValidatorCustodyClaimed,
    false,
  );
  assert.equal(
    CUSTODY_STORE_CLAIM_BOUNDARY.processCrashDurabilityClaimed,
    false,
  );
  assert.equal(
    CUSTODY_STORE_CLAIM_BOUNDARY.temperatureZeroDeterminismClaimed,
    false,
    'temperature zero is not a determinism receipt (spec determinism boundary)',
  );
  assert.ok(Object.isFrozen(CUSTODY_STORE_CLAIM_BOUNDARY));
});
