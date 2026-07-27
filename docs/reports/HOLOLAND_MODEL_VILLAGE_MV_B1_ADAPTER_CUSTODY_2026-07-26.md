# HoloLand Model Village MV-B1: Locked-Adapter Seam and Sealed Custody Store

**Status:** Bounded engineering-certification witness; executed and receipted

**Date:** 2026-07-26

**Lane:** MV-B1 (experiment backend). Complements the MV-V*/MV-S* visual lanes;
first executable cut against the Phase 1 backend blockers in
[HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md](../specs/HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md)
(lines 616-621: "locked live adapters and provider receipts, sealed response
custody").

**Board:** task_1785108990597_bqss (claimed by claude5)

**Production plan hooks:** run-day lifecycle steps 1-2 and 7, and the T-3
"Certify adapters" calendar gate in
[HOLOLAND_MODEL_VILLAGE_PRODUCTION_PLAN.md](../specs/HOLOLAND_MODEL_VILLAGE_PRODUCTION_PLAN.md).

## What this slice is

Before MV-B1 the experiment had **no provider seam at all**: `adapter_a/b/c`
were opaque labels, `InvokeLockedModelAdapterStep` was
`target_not_observed`, and "local sealed research store" was a declarative
string with no implementation. MV-B1 builds the first executable versions of
both, in the **engineering certification lane only** — routes are declared
openly, and the sealed `adapter_a/b/c` alias-to-route assignment is explicitly
out of scope.

## New surfaces

| Surface | File | Schema / identity |
|---|---|---|
| Sealed custody store | `scripts/model-village-custody-store.mjs` | `hololand.model-village-sealed-custody-store.v1`, `...custody-access-log-entry.v1`, `...custody-tombstone.v1`, `...custody-backup-checksums.v1` |
| Locked-adapter runtime | `scripts/model-village-adapter-runtime.mjs` | `hololand.model-village-adapter-certification.v1`, `hololand.model-village-model-turn.v1`, engine `hololand-model-village-adapter-runtime-v1` |
| Certification drill manifest | `source/proofs/model-village-adapter-custody-drill.hs` | `hololand.model-village-adapter-custody-drill.v1`, drill `mv-b1-adapter-custody-v1` |
| Checker | `scripts/check-hololand-model-village-adapter-custody.mjs` (`npm run check:hololand-model-village-adapter-custody`) | receipt `hololand.model-village-adapter-custody.v1` |
| Tests | `scripts/__tests__/model-village-custody-store.test.mjs` (12 pass + 1 POSIX-only skip), `...adapter-runtime.test.mjs` (14), `...hololand-model-village-adapter-custody.test.mjs` (7) | fully offline (in-process OpenAI-compatible stubs) |

All structured hashing routes through the existing `canonicalJson` /
`canonicalDigest` exports of `model-village-phase0b-runtime.mjs` — one
canonicalization implementation for the whole lane.

### Custody store properties

- AES-256-GCM, per-store random 32-byte content key, fresh IV per object,
  AAD-bound to the custodyId (sha256 of plaintext). Object metadata
  (kind/label) is encrypted too, so key destruction deletes meaning, not just
  bytes; access-log entries and tombstones are nonidentifying by construction.
- Every operation appends a write-then-fsync, hash-chained access-log entry
  (genesis `custody-access-log-genesis-v1`, monotonic sequence).
- Deletion = key destruction (zero-overwrite, fsync, unlink) plus a
  nonidentifying tombstone; the append-only chain is never rewritten
  (spec lines 460-464). Post-destruction verification switches to
  ciphertext-checksum-only mode.
- Backup deliberately excludes `key/` (a backup must not widen key custody).
- Exclusive `store.lock` per live handle plus an append-time fork fence
  (tail re-read before every append), so a stale handle fails loud on its own
  write instead of corrupting the chain.
- Key file written `0o600`, key dir `0o700`; on POSIX `verifyIntegrity` fails
  if the key mode widens (mode bits are synthetic on win32 — documented).

### Adapter runtime properties

- **No fallback by construction**: one route, one endpoint, no rerouting code
  path. **Zero retry by construction**: `retryCount` pinned 0 in the manifest;
  one fetch; failures return a receipted failed turn (`errorClass`), never a
  second request.
- **No hidden prompt enhancement**: the request body is serialized once;
  `promptHash` = sha256 of the exact wire bytes, which are sealed to custody;
  the test suite asserts sealed bytes == wire bytes.
- Certification receipts carry: route, transport, server-reported revision
  evidence (model id, process instance, package version — evidence tier
  `server-reported`), `serializerHash` (pinned descriptor matching the actual
  wire shape in both model-id branches), ceilings, probe latency,
  failure-phase classification (`health_probe_unreachable` /
  `health_probe_body_read_failed` / `evidence_seal_failed` — a reached
  endpoint is never receipted as unreachable).
- Cache state is receipted as the honest tri-state
  `{providerCacheControlProbed: false, state: 'unknown_contamination_receipted'}`
  (spec lines 424-426) — the receipt asserts only that no probe ran.
- Model turn receipts (`hololand.model-village-model-turn.v1`) carry the spec
  line 278-291 field set. Raw prompts and responses are custody-only; the
  public receipt carries hashes and bounded summaries. The model's free-form
  `reason` is projected to `sha256 + length`; provider-reported `usage` is
  projected to a closed set of integer token counts, and the verifier rejects
  any receipt that smuggles anything else.
- `parseProposal` is strict closed-key JSON with **default deny**
  (spec line 297): 24 adversarial malformations all deny; only an exactly-one
  JSON object with vocabulary-valid fields is `valid_proposal`.
- Response body reads are bounded (5 MiB streaming cap) and inside the
  receipt boundary: mid-body socket death yields a failed-turn receipt with
  promptHash, sealed request custodyId, latency, and errorClass preserved.

## Executed evidence (live, 2026-07-26)

Two independent live executions (workflow lane, then a fresh first-hand
verification run) against the two sovereign routes. Second run:

```
manifestHash:      31402171d0fb20b6c33ebf3dbcf8001f40237e0d5b5e89a4672a36b1a536a6f1
receiptHash:       ddfb0c72b51f2fd4ceb1e3e3885a1cf1de079ab9b685b1c55f6250c2be0b9612
storeManifestHash: 953e0f02be27ce14959a6d4315cb58cafdd5e6bad339a1adde91406b0129754d
serializerHash:    c4dbadc4318f0edb... (identical for both routes — same wire discipline)
```

| Route | Required | Certified | Revision evidence | Turn | Proposal decision |
|---|---|---|---|---|---|
| `sovereign-holoserve-laptop` (127.0.0.1:8099, HoloServe pytorch-holo, CUDA) | yes | yes | `holorunner-s0`, pkg 0.1.2, process instance receipted | completed (2767 ms; first run 50418 ms cold) | **deny** — the 49.9M model wrapped its JSON in prose; `proposal-not-exactly-one-json-object`; default-deny worked as designed and is receipted honestly |
| `sovereign-holollama-jetson` (192.168.0.119:18080, llama-server proxy) | optional | yes | `qwen3-4b-instruct.gguf` (server-reported) | completed (2878 ms) | **valid_proposal** — `contribute_water -> commons_cistern`, amount 1; reason projected to sha256+length |

The two decisions are a live demonstration of the adjudication boundary: a
sovereign route producing vocabulary-valid JSON is admitted as a proposal; a
route producing prose is denied without mutation, and both are receipts, not
judgments — **no model superiority claim is made or supported by one
certification turn per route.**

Custody drills: write, read-back replay (byte-hash match), integrity verify,
backup + backup verify, hash-chained access log (14 entries), key-destruction
on a disposable second store (reads then throw `CustodyKeyDestroyedError`,
nonidentifying tombstone appended, checksum-mode verify still passes). All ok.

Non-interference: the frozen-lane suites (`model-village-canonical-lifecycle`,
`model-village-phase0b-runtime`, `hololand-model-village-experiment`) still
pass unchanged; zero provider calls were introduced into any canonical lane
(`canonicalLaneProviderCallsIntroduced: 0`). No frozen source was modified —
new files plus two `package.json` wiring lines only.

## Adversarial review log

Two independent reviewers (research-integrity lens, engineering lens) with
confirmed-by-repro discipline, then a fix pass; all blocker/major findings
fixed, none refuted:

- **Blocker:** repeat turns against one store threw
  `CustodyDuplicateObjectError` past the receipt boundary (would have blocked
  the six-resident lane). Fixed: content-addressed idempotent seal.
- **Majors fixed:** identical health payloads across routes laundered into
  `health_probe_unreachable` (failure-phase classification added); mid-body
  transport death escaped unreceipted (read moved inside receipt boundary +
  5 MiB cap); key file world-readable on POSIX (0600/0700 + verify check);
  dual-handle access-log corruption with no recovery (lock + fork fence);
  test suite silently green with the real store broken (stub fallback
  deleted); provider-controlled `usage` could smuggle raw model text into
  public receipts (closed integer projection + verifier enforcement).
- **Deferred (named follow-ups):** read-only audit open for
  `verifyIntegrity` on frozen/preserved copies; `serializerVersion` stays
  `mv-b1-serializer-v1` (wire format unchanged; only the descriptor was
  corrected).

## Claim boundary (verbatim from the receipt)

Observed: first executable adapter seam (manifest-pinned certification +
model-turn execution); two certified sovereign routes; one receipted model
turn per certified route in the engineering certification lane; sealed custody
write / read-back replay / integrity verify / backup / backup verify /
hash-chained access log / key destruction / nonidentifying tombstone drills;
zero-retry by construction; raw prompt and response bytes custody-only.

Not observed / not claimed: live study run; Phase 1 admission or readiness;
six-resident live turns; blinded alias assignment (sealed
`adapter_a/b/c` alias-to-route assignment is out of scope for this drill);
production validator custody; process-crash durability; provider sampling
determinism (temperature zero is not a determinism receipt). All pinned
`false` in the receipt and asserted by the tests.

## Remaining Phase 1 backend blockers (next slices)

1. **MV-B2 — live turn scheduler:** six-resident, multi-run scheduler with
   frozen concurrency/timeout policy and a proposal barrier that closes before
   any admission (gate line 572 remaining requirement), consuming this
   adapter seam.
2. **MV-B3 — sealed alias assignment + study custody:** bind
   `adapter_a/b/c` to certified routes inside custody (never publicly),
   consuming the frozen assignment matrix; captured-response replay from
   custody instead of authored fixtures.
3. **MV-B4 — production validator custody:** Ed25519 provisioning, rotation,
   revocation, trust publication (gate 577) — replace the ephemeral
   engineering fixture keypair.
4. **MV-B5 — durability:** process-crash drills, multi-process CAS
   (gates 578/581).
5. **HoloScript substrate:** an open-outcome receipt tier — the current
   headless plan schema requires `expected.finalPublicState` up front, which
   no live-model run can satisfy; live turns need an "attested, not
   pre-determined" tier beside v4.
6. **Operational go decision:** founder-owned; nothing in this slice advances
   it.

## Reproduce

```bash
npm run test:hololand-model-village
npm run check:hololand-model-village-adapter-custody          # live sovereign drill
node scripts/check-hololand-model-village-adapter-custody.mjs --skip-live   # hermetic
node scripts/check-hololand-model-village-adapter-custody.mjs --verify .tmp/hololand/model-village/adapter-custody-receipt.json
```
