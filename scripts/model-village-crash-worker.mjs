/* global Buffer, process */

/**
 * MV-B5 crash-drill child worker (spawned by model-village-crash-drill.mjs).
 *
 * Two roles, selected by --role:
 *   --role=crash   : performs a REAL production sealed-store / persistent-state
 *                    operation (or deterministically establishes the exact
 *                    on-disk state a crash at an un-catchable sub-syscall window
 *                    would produce), signals the parent at the exact moment it
 *                    is safe to kill, then BLOCKS. It installs no signal handler
 *                    — SIGKILL is uncatchable by design, which is the point.
 *   --role=recover : opens/recovers the store in this FRESH process using only
 *                    production recovery code and prints a single verdict line.
 *
 * All stores live under the drill's per-case scratch dir (os.tmpdir-rooted,
 * chosen by the parent). This worker never touches a path outside --case-dir
 * and never kills any process.
 */

import { createHash, randomUUID } from 'node:crypto';
import {
  appendFileSync,
  closeSync,
  existsSync,
  fsyncSync,
  openSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import path from 'node:path';

import {
  createSealedCustodyStore,
  CustodyIntegrityError,
  openSealedCustodyStore,
} from './model-village-custody-store.mjs';
import {
  initializePersistentStore,
  readPersistentState,
} from './model-village-phase0b-runtime.mjs';
import {
  buildDrillPlaintext,
  buildValidatorFixture,
  custodyIdForBytes,
  custodyRootFor,
  DRILL_RUN_LABEL,
  phase0bStoreDirFor,
  retentionPolicyFixture,
} from './model-village-crash-drill.mjs';

const READY_TOKEN = 'MV_CRASH_READY';
const VERDICT_MARKER = 'MV_CRASH_VERDICT ';
const MAX_OUTCOME = 600;

function parseArgs(argv) {
  const out = {};
  for (const entry of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(entry);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function trunc(value, max = 200) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function bound(value) {
  return trunc(value, MAX_OUTCOME);
}

/** Uncatchable block: emits READY, then parks the thread until SIGKILL. */
function signalReadyAndBlock() {
  writeSync(1, `${READY_TOKEN}\n`);
  blockForever();
}

function blockForever() {
  // Atomics.wait on the main thread is permitted in Node and blocks with no
  // CPU and no timeout; only process termination ends it.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
}

function custodyPaths(caseDir) {
  const root = custodyRootFor(caseDir);
  return {
    root,
    accessLog: path.join(root, 'access-log.jsonl'),
    manifest: path.join(root, 'store-manifest.json'),
    keyFile: path.join(root, 'key', 'content-key.bin'),
    objectsDir: path.join(root, 'objects'),
  };
}

function fileSha256(filePath) {
  return existsSync(filePath) ? sha256Hex(readFileSync(filePath)) : null;
}

function accessLogEntries(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));
}

function accessLogTailHash(filePath) {
  try {
    const entries = accessLogEntries(filePath);
    if (entries.length === 0) return fileSha256(filePath);
    const tail = entries[entries.length - 1];
    return typeof tail.entryHash === 'string' ? tail.entryHash : fileSha256(filePath);
  } catch {
    return fileSha256(filePath);
  }
}

function orphanTempFiles(storeDir) {
  if (!existsSync(storeDir)) return [];
  return readdirSync(storeDir).filter(
    (name) => name.startsWith('.state-') && name.endsWith('.tmp'),
  );
}

// ---------------------------------------------------------------------------
// role=crash
// ---------------------------------------------------------------------------

function runCrash(args) {
  const { scenario, operator, seed } = args;
  const size = Number(args.size);
  const caseDir = args['case-dir'];

  switch (scenario) {
    case 'custody-seal-killed-mid-write': {
      // Real mid-write kill: the parent watches for the `.enc` and SIGKILLs the
      // instant it appears, landing inside the large ciphertext writeSync.
      const store = createSealedCustodyStore({
        rootDir: custodyRootFor(caseDir),
        runLabel: DRILL_RUN_LABEL,
        operator,
        retentionPolicy: retentionPolicyFixture(),
      });
      const bytes = buildDrillPlaintext(seed, size);
      // No READY line: the object-file trigger fires from openSync inside seal.
      store.sealObject({
        bytes,
        kind: 'model-response-ciphertext',
        label: 'mv-b5-drill-object',
      });
      // Reached only if the write finished before the kill; block so the
      // parent's fallback still delivers a real SIGKILL.
      blockForever();
      return;
    }

    case 'custody-lock-held-by-killed-pid': {
      // Real live-lock-holder kill: createSealedCustodyStore acquires store.lock
      // recording THIS pid; we block holding it until SIGKILL.
      createSealedCustodyStore({
        rootDir: custodyRootFor(caseDir),
        runLabel: DRILL_RUN_LABEL,
        operator,
        retentionPolicy: retentionPolicyFixture(),
      });
      signalReadyAndBlock();
      return;
    }

    case 'persistent-state-killed-after-rename': {
      // Real completed atomic write (production writeAtomicState), then kill.
      const fixture = buildValidatorFixture();
      initializePersistentStore({
        storeDir: phase0bStoreDirFor(caseDir),
        trustedValidatorConfig: fixture.trustedValidatorConfig,
        validatorReceipt: fixture.validatorReceipt,
        initialWorld: fixture.initialWorld,
      });
      signalReadyAndBlock();
      return;
    }

    case 'persistent-state-killed-before-rename': {
      // Real committed prior state (production writeAtomicState) + a real orphan
      // temp modeling an interrupted next-write that never reached its rename.
      // (The temp→rename window is a synchronous no-yield span an external
      // SIGKILL cannot split; see the harness MECHANISM NOTE + gapsFound.)
      const storeDir = phase0bStoreDirFor(caseDir);
      const fixture = buildValidatorFixture();
      initializePersistentStore({
        storeDir,
        trustedValidatorConfig: fixture.trustedValidatorConfig,
        validatorReceipt: fixture.validatorReceipt,
        initialWorld: fixture.initialWorld,
      });
      const tempPath = path.join(
        storeDir,
        `.state-${process.pid}-${randomUUID()}.tmp`,
      );
      writeFileSync(
        tempPath,
        `${JSON.stringify({ interruptedNextWrite: true, revision: 1 })}\n`,
        'utf8',
      );
      signalReadyAndBlock();
      return;
    }

    case 'access-log-torn-append': {
      // Real store with a clean [create, seal] chain, then a real partial
      // trailing line modeling a torn append that never got its newline.
      const paths = custodyPaths(caseDir);
      const store = createSealedCustodyStore({
        rootDir: paths.root,
        runLabel: DRILL_RUN_LABEL,
        operator,
        retentionPolicy: retentionPolicyFixture(),
      });
      store.sealObject({
        bytes: Buffer.from('mv-b5-access-log-object', 'utf8'),
        kind: 'model-response-ciphertext',
        label: 'mv-b5-drill-object',
      });
      store.close();
      appendFileSync(
        paths.accessLog,
        '{"at":"2026-07-27T00:00:00.000Z","operation":"read","sequen',
        'utf8',
      );
      signalReadyAndBlock();
      return;
    }

    case 'persistent-state-lock-leak-after-kill': {
      // GAP G2: model a persistence lock leaked by a writer killed inside
      // withStoreLock. initializePersistentStore commits + releases its lock, so
      // we re-create the exclusive state.lock exactly as withStoreLock does.
      const storeDir = phase0bStoreDirFor(caseDir);
      const fixture = buildValidatorFixture();
      initializePersistentStore({
        storeDir,
        trustedValidatorConfig: fixture.trustedValidatorConfig,
        validatorReceipt: fixture.validatorReceipt,
        initialWorld: fixture.initialWorld,
      });
      const lockFd = openSync(path.join(storeDir, 'state.lock'), 'wx');
      closeSync(lockFd);
      signalReadyAndBlock();
      return;
    }

    case 'custody-destroy-key-killed-mid-destroy': {
      // GAP G1: model a crash after content-key zeroing+fsync, before
      // unlink+tombstone. Seal a real object, close, then overwrite the key
      // with 32 zero bytes (fsync'd) leaving NO tombstone.
      const paths = custodyPaths(caseDir);
      const store = createSealedCustodyStore({
        rootDir: paths.root,
        runLabel: DRILL_RUN_LABEL,
        operator,
        retentionPolicy: retentionPolicyFixture(),
      });
      store.sealObject({
        bytes: Buffer.from('mv-b5-key-destroy-object', 'utf8'),
        kind: 'model-response-ciphertext',
        label: 'mv-b5-drill-object',
      });
      store.close();
      const keyFd = openSync(paths.keyFile, 'r+');
      try {
        writeSync(keyFd, Buffer.alloc(32), 0, 32, 0);
        fsyncSync(keyFd);
      } finally {
        closeSync(keyFd);
      }
      signalReadyAndBlock();
      return;
    }

    default:
      throw new Error(`unknown crash scenario ${scenario}`);
  }
}

// ---------------------------------------------------------------------------
// role=recover  (fresh process; production recovery code only)
// ---------------------------------------------------------------------------

function emitVerdict(verdict) {
  writeSync(
    1,
    `${VERDICT_MARKER}${JSON.stringify({
      invariantHeld: Boolean(verdict.invariantHeld),
      observedOutcome: bound(verdict.observedOutcome),
      storeStateHashAfterRecovery: verdict.storeStateHashAfterRecovery ?? null,
    })}\n`,
  );
}

function recoverCustodySealMidWrite(args) {
  const { operator, seed } = args;
  const size = Number(args.size);
  const paths = custodyPaths(args['case-dir']);
  try {
    const store = openSealedCustodyStore({ rootDir: paths.root, operator });
    // Opening validated the whole access-log chain; a torn chain would throw.
    const custodyId = custodyIdForBytes(buildDrillPlaintext(seed, size));
    const objectPath = path.join(paths.objectsDir, `${custodyId}.enc`);

    let objectState;
    if (!existsSync(objectPath)) {
      objectState = 'absent';
    } else {
      try {
        store.readObject(custodyId);
        objectState = 'readable';
      } catch (error) {
        objectState = `rejected(${error.name})`;
      }
    }
    const recorded = accessLogEntries(paths.accessLog).some(
      (entry) => entry.operation === 'seal' && entry.custodyId === custodyId,
    );
    const verify = store.verifyIntegrity();
    const tailHash = accessLogTailHash(paths.accessLog);
    store.close();

    // Admitted-as-valid ONLY if the object is readable AND recorded in the seal
    // log AND verifyIntegrity is clean. Any half-write fails at least one.
    const admittedValid = objectState === 'readable' && recorded && verify.ok;
    return {
      invariantHeld: !admittedValid,
      observedOutcome:
        `store opened; access-log chain intact; object=${objectState}; `
        + `recordedInSealLog=${recorded}; verifyIntegrity.ok=${verify.ok}; `
        + 'a half-written object was not admitted as a valid recorded object',
      storeStateHashAfterRecovery: tailHash,
    };
  } catch (error) {
    return {
      invariantHeld: false,
      observedOutcome: `recovery open failed unexpectedly: ${trunc(error.message)}`,
      storeStateHashAfterRecovery: fileSha256(paths.accessLog) ?? fileSha256(paths.manifest),
    };
  }
}

function recoverCustodyLockHeld(args) {
  const { operator } = args;
  const paths = custodyPaths(args['case-dir']);
  try {
    const store = openSealedCustodyStore({ rootDir: paths.root, operator });
    const tailHash = accessLogTailHash(paths.accessLog);
    store.close();
    return {
      invariantHeld: true,
      observedOutcome:
        'stale-pid custody store.lock reclaimed by a fresh open (self-healing '
        + 'stale-lock break); no hang',
      storeStateHashAfterRecovery: tailHash,
    };
  } catch (error) {
    return {
      invariantHeld: false,
      observedOutcome:
        `fresh open did not reclaim the stale-pid lock: ${trunc(error.message)}`,
      storeStateHashAfterRecovery: fileSha256(paths.manifest),
    };
  }
}

function recoverPersistentAfterRename(args) {
  const storeDir = phase0bStoreDirFor(args['case-dir']);
  try {
    const state = readPersistentState(storeDir);
    return {
      invariantHeld: state.revision === 0,
      observedOutcome:
        'fresh process read the complete post-rename state.json; '
        + `validatePersistentState passed; revision=${state.revision}`,
      storeStateHashAfterRecovery: state.stateHash,
    };
  } catch (error) {
    return {
      invariantHeld: false,
      observedOutcome:
        `post-rename state was unreadable or torn: ${trunc(error.message)}`,
      storeStateHashAfterRecovery: fileSha256(path.join(storeDir, 'state.json')),
    };
  }
}

function recoverPersistentBeforeRename(args) {
  const storeDir = phase0bStoreDirFor(args['case-dir']);
  try {
    const state = readPersistentState(storeDir);
    const orphans = orphanTempFiles(storeDir);
    return {
      invariantHeld: state.revision === 0 && orphans.length >= 1,
      observedOutcome:
        'fresh process read the complete prior state.json '
        + `(revision=${state.revision}); validatePersistentState passed; `
        + `${orphans.length} orphan temp ignored; never torn`,
      storeStateHashAfterRecovery: state.stateHash,
    };
  } catch (error) {
    return {
      invariantHeld: false,
      observedOutcome:
        `prior state torn/unreadable after pre-rename interruption: ${trunc(error.message)}`,
      storeStateHashAfterRecovery: fileSha256(path.join(storeDir, 'state.json')),
    };
  }
}

function recoverAccessLogTorn(args) {
  const { operator } = args;
  const paths = custodyPaths(args['case-dir']);
  try {
    const store = openSealedCustodyStore({ rootDir: paths.root, operator });
    store.close();
    return {
      invariantHeld: false,
      observedOutcome:
        'torn access-log tail was silently accepted (open succeeded) — '
        + 'fail-closed invariant VIOLATED',
      storeStateHashAfterRecovery: fileSha256(paths.accessLog),
    };
  } catch (error) {
    const failedClosed =
      error instanceof CustodyIntegrityError
      || error.name === 'CustodyIntegrityError'
      || /valid JSON|corrupt|integrity/i.test(error.message);
    return {
      invariantHeld: failedClosed,
      observedOutcome: failedClosed
        ? `torn access-log tail detected; open failed closed (${error.name}); `
          + 'no auto-truncate; manual repair of the partial line required'
        : `open failed with an unexpected error: ${trunc(error.message)}`,
      storeStateHashAfterRecovery: fileSha256(paths.accessLog),
    };
  }
}

function recoverPersistentLockLeak(args) {
  const storeDir = phase0bStoreDirFor(args['case-dir']);
  let readable = false;
  let stateHash = null;
  try {
    const state = readPersistentState(storeDir);
    readable = true;
    stateHash = state.stateHash;
  } catch {
    /* reads may still fail if state itself is bad; captured in outcome */
  }
  let writerBlocked = false;
  try {
    const fixture = buildValidatorFixture();
    initializePersistentStore({
      storeDir,
      trustedValidatorConfig: fixture.trustedValidatorConfig,
      validatorReceipt: fixture.validatorReceipt,
      initialWorld: fixture.initialWorld,
    });
  } catch (error) {
    writerBlocked = /locked by another writer/.test(error.message);
  }
  // Invariant "a leaked persistence lock is auto-reclaimable" holds ONLY if a
  // fresh writer was NOT blocked. phase0b has no reclamation, so it stays
  // blocked → invariantHeld:false (honest G2 gap receipt).
  return {
    invariantHeld: !writerBlocked,
    observedOutcome: writerBlocked
      ? 'GAP G2: phase0b withStoreLock has no stale reclamation; a state.lock '
        + 'leaked by the killed writer blocks every future writer '
        + `("locked by another writer"); manual unlink required; reads still ok=${readable}`
      : 'unexpected: the leaked state.lock did not block a fresh writer',
    storeStateHashAfterRecovery: stateHash ?? fileSha256(path.join(storeDir, 'state.json')),
  };
}

function recoverCustodyDestroyKey(args) {
  const { operator } = args;
  const paths = custodyPaths(args['case-dir']);
  try {
    const store = openSealedCustodyStore({ rootDir: paths.root, operator });
    store.close();
    return {
      invariantHeld: true,
      observedOutcome:
        'store opened after the mid-destroy crash (no wedge observed)',
      storeStateHashAfterRecovery: accessLogTailHash(paths.accessLog),
    };
  } catch (error) {
    // Expected: key present but zeroed → keyFingerprint mismatch → wedged.
    return {
      invariantHeld: false,
      observedOutcome:
        'GAP G1: crash between content-key zeroing and tombstone-append wedges '
        + `the store; openSealedCustodyStore throws ${error.name} `
        + `("${trunc(error.message, 120)}"); no code path recovers; manual `
        + 'tombstone repair required',
      storeStateHashAfterRecovery: fileSha256(paths.manifest),
    };
  }
}

function runRecover(args) {
  const { scenario } = args;
  switch (scenario) {
    case 'custody-seal-killed-mid-write':
      return recoverCustodySealMidWrite(args);
    case 'custody-lock-held-by-killed-pid':
      return recoverCustodyLockHeld(args);
    case 'persistent-state-killed-after-rename':
      return recoverPersistentAfterRename(args);
    case 'persistent-state-killed-before-rename':
      return recoverPersistentBeforeRename(args);
    case 'access-log-torn-append':
      return recoverAccessLogTorn(args);
    case 'persistent-state-lock-leak-after-kill':
      return recoverPersistentLockLeak(args);
    case 'custody-destroy-key-killed-mid-destroy':
      return recoverCustodyDestroyKey(args);
    default:
      throw new Error(`unknown recover scenario ${scenario}`);
  }
}

// ---------------------------------------------------------------------------
// entrypoint
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.role === 'crash') {
    runCrash(args);
    // runCrash never returns (it blocks until SIGKILL).
    return;
  }
  if (args.role === 'recover') {
    let verdict;
    try {
      verdict = runRecover(args);
    } catch (error) {
      verdict = {
        invariantHeld: false,
        observedOutcome: `recovery worker error: ${trunc(error.message)}`,
        storeStateHashAfterRecovery: null,
      };
    }
    emitVerdict(verdict);
    return;
  }
  writeSync(2, `crash worker: unknown or missing --role (${args.role})\n`);
  process.exitCode = 2;
}

main();
