# HoloLand Model Village MV-B5: Process-Crash Durability + Multi-Process Contention

**Status:** Bounded engineering witness; real SIGKILL drills executed, two production gaps found and honestly receipted

**Date:** 2026-07-27

**Lane:** MV-B5 (experiment backend), the durability slice over MV-B1..MV-B4.
Board: task_1785113448191_ijwd.

**Gates addressed:** [HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md](../specs/HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md)
row 578 (Atomic admission — remaining: "multi-process CAS, and distributed
locking") and row 581 (File-state fault boundary — remaining: "Process-crash
durability testing, multi-process recovery"). MV-B5 turns the spec's *claimed*
fault-boundary property into an **executed, receipted** drill: a real child
process is `SIGKILL`ed mid-operation and a fresh process recovers the store.

## The headline: two real production durability gaps, found by crashing the code

This slice did what a durability drill is supposed to do — it broke things. Of
seven crash scenarios, five invariants held and **two are genuine HIGH gaps in
shipped production code**, executed and receipted with `invariantHeld: false`
rather than masked to keep the gate green:

- **G1 — `destroyContentKey` is not crash-atomic** (`scripts/model-village-custody-store.mjs:1026-1042`).
  A crash between zeroing+`fsync`ing the content key and appending the
  tombstone leaves the key present-but-zeroed with no tombstone;
  `openSealedCustodyStore` then throws `CustodyIntegrityError` ("content key
  file does not match the manifest keyFingerprint") and **no code path
  recovers** — the store is wedged until a tombstone is hand-written. Minimal
  fix (for the MV-B1 custody-store owner): append the nonidentifying tombstone
  as the *first* durable step, then treat "key absent-or-zeroed AND tombstone
  present" as the accepted destroyed state on open.
- **G2 — `withStoreLock` leaks its lock on crash** (`scripts/model-village-phase0b-runtime.mjs:1577-1593`).
  The persistence-store lock is created with `openSync(..., 'wx')` and only
  unlinked in `finally`; a `SIGKILL`ed writer leaks `state.lock` permanently,
  so every later commit throws "locked by another writer" with no auto-break
  (reads still succeed). Minimal fix (for the phase0b-runtime owner): pid-stamp
  the lock and break it on `EEXIST` when `process.kill(pid, 0)` shows the
  holder is dead — exactly what the MV-B1 custody store already does at
  `custody-store.mjs:567-601`.

Both are filed for their owning lanes; MV-B5 deliberately did **not** edit the
production files (out of bounds — it is the drill, not the owner).

Three lower-severity gaps are documented but not drilled to failure: G-EXPORT
(the `before_rename`/`after_rename` fault seam is module-private, so a new-file
consumer can't drive a true interrupted rename — MV-B5 models the pre-rename
disk state instead), G4/G5 (partial-seal orphan and torn access-log tail are
fail-loud-by-design, manual recovery), and G6 (no directory `fsync` anywhere —
consistency-safe but not power-loss-durable).

## What held (five invariants, proven under real SIGKILL)

| Scenario | Invariant proven |
|---|---|
| `custody-seal-killed-mid-write` | A torn `.enc` is never admitted — recovery rejects it (`CustodyIntegrityError`), it is absent from the seal log, the access-log chain is intact |
| `custody-lock-held-by-killed-pid` | A fresh open reclaims the stale-pid lock — never hangs |
| `persistent-state-killed-after-rename` | Recovery sees the complete new state |
| `persistent-state-killed-before-rename` | Recovery sees the complete old state + ignores the orphan temp — never torn |
| `access-log-torn-append` | A torn trailing log line is detected; the store fails closed |

Every scenario: real `SIGKILL` (worker `exit=null/SIGKILL`), recovery in a
genuinely fresh process (distinct pid), on 100% production recovery code.

**Contention (gate 578, single-host):** 4 concurrent workers, 8 ops committed
under the exclusive lock, 19 cleanly refused, final access-log chain linear and
monotonic; the persistence-store lock serialized the same way; the drill's own
negative control (lock bypassed) produces a forked chain the drill flags — so
the assertion is not vacuous.

**Audit-open (the named MV-B1 follow-up):** `auditOpenCustodyStore` verifies a
preserved/frozen custody copy **read-only** — proven to append no access-log
entry, create/modify no lock file, and leave mtimes unchanged, while still
re-verifying the chain, object checksums, and manifest. This closes the gap
where `verifyIntegrity` can't audit a read-only-media copy because it appends a
`verify` entry.

## New surfaces

| Surface | File |
|---|---|
| Crash-drill harness + worker | `scripts/model-village-crash-drill.mjs`, `scripts/model-village-crash-worker.mjs` |
| Contention drill | `scripts/model-village-contention-drill.mjs` |
| Read-only audit-open | `scripts/model-village-audit-open.mjs` |
| Checker | `scripts/check-hololand-model-village-durability.mjs` (`npm run check:hololand-model-village-durability`) |
| Tests | crash-drill (14), contention (4), audit-open (10), durability integration (10) |

The checker's `allInvariantsHeld` reflects *reality* (false while G1/G2 stand)
and `verifyDurabilityReceipt` rejects any receipt that hides an executed gap —
a green receipt concealing a real gap is impossible by construction, and the
gate regresses to red if a happy-path invariant breaks *or* a gap is fixed
without updating its expectation.

## Adversarial review

Two reviewers (durability lens, engineering lens) returned **only minor
findings**, each confirming the design is sound and *fail-loud*: the one
timing-based kill window (`custody-seal-killed-mid-write`, 40/40 held under
stress) can only ever produce a flaky RED on a pathologically fast disk, never
a false green, because a lost race makes recovery see a valid object →
`invariantHeld:false` → mismatch → the gate throws. The six marker-based
scenarios `SIGKILL` a real child after it establishes the exact modeled crash
state — accurately cited as "a real child was killed after establishing the
crash state and the store recovered in a fresh process," not "killed mid-rename"
(the module-private fault seam, G-EXPORT, prevents a true interrupted rename
from a new-file consumer).

## Claim boundary

Proves **single-host process-crash durability** and **same-host multi-process
contention** only. Pinned false: fleet/multi-host consensus, media-failure
durability, production deployment. `fsyncHonestyAssumed: true` — we trust the
OS's `fsync`; we do not prove the disk didn't lie, and there is no directory
`fsync` (G6), so this is consistency-safe but not power-loss-durable.

## Follow-ups filed for owning lanes

G1 and G2 are HIGH and belong to the MV-B1 custody-store and phase0b-runtime
lanes respectively — board tasks filed with the exact file:line and minimal
fix. G-EXPORT (add a test-only fault-injection seam / export a commit function)
would let a future drill exercise a true interrupted rename.

## Reproduce

```bash
npm run test:hololand-model-village
npm run check:hololand-model-village-durability
node scripts/check-hololand-model-village-durability.mjs --verify .tmp/hololand/model-village/durability-receipt.json
```
