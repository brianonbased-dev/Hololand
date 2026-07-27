# HoloLand Model Village MV-B2: Live Turn Scheduler with Proposal Barrier

**Status:** Bounded engineering-tracer witness; executed, adversarially reviewed, and receipted

**Date:** 2026-07-26

**Lane:** MV-B2 (experiment backend), consuming the MV-B1 adapter seam
(commit `a021acd`). Board: task_1785113448190_mnj5 (claimed by claude5).

**Contract targets:** experiment spec gate line 572 ("Six-resident, multi-run
scheduler"), lines 293-330 (default-deny decision chain), 427-433 (rejection
without mutation, append-only hash-chained receipts), and the production
plan's Run-slot rule: same frozen snapshot per turn, concurrent model calls
only under a frozen concurrency+timeout policy, proposal barrier closed
before any admission or mutation.

## The load-bearing design: live proposals gate, deterministic receipts mutate

A live model proposal NEVER becomes a world mutation directly. After the
barrier closes and adjudication runs, an ADMITTED proposal exactly matching
the pre-authorized catalog action (`contribute_water -> commons_cistern`,
amount 1 — already frozen in the phase0b plan) **gates** the execution of the
existing deterministic V4 lane; the mutation is committed from that lane's
VERIFIED receipt through the existing atomic admission path. Admitted
non-matches, denials, failures, and timeouts are receipted refusals with no
mutation. This keeps live turns honest while the open-outcome receipt tier
(`idea-seeds/2026-07-26-open-outcome-receipt-tier.md`) remains a future
HoloScript substrate slice.

## New surfaces

| Surface | File | Schema / identity |
|---|---|---|
| Frozen turn policy | `source/proofs/model-village-turn-policy.hs` | `hololand.model-village-turn-policy.v1` (`mv-b2-turn-policy-v1`: 6 residents, concurrency 2, 90s dispatch-relative ceiling, retry 0, default deny; vocabulary pinned BY REFERENCE to the MV-B1 manifest) |
| Turn scheduler | `scripts/model-village-turn-scheduler.mjs` | `...turn-opportunity.v1`, `...turn-record.v1`, `...proposal-barrier.v1`, `...safety-check.v1`, `...action-decision.v1`; engine `hololand-model-village-turn-scheduler-v1` |
| Admission bridge | `scripts/model-village-admission-bridge.mjs` | `hololand.model-village-gated-admission.v1`; engine `hololand-model-village-admission-bridge-v1`; per-run isolation (`provisionIsolatedRun`) |
| Checker | `scripts/check-hololand-model-village-turn-scheduler.mjs` (`npm run check:hololand-model-village-turn-scheduler`) | receipt `hololand.model-village-turn-scheduler.v1`, self-hashed, `--verify` supported |
| Tests | scheduler suite (14), bridge suite (8), integration suite (10) | fully offline; live lane exercised only by the checker |

Scheduler properties: runtime-issued turn opportunities (nonce + single-use
identity), snapshot freeze with recompute-before-dispatch and
recompute-before-adjudication, bounded-concurrency pool with receipted
high-water mark, **dispatch-relative enforced deadlines** (pool queuing is
never charged against the model; a never-settling executor is receipted
`timeout_contaminated` instead of wedging the barrier), zero-retry by
construction, scheduler-scoped replay registries with single-use runIds, and
a hash chain `prior -> barrier -> safety -> decision -> ... -> gated
admission` whose verifier refuses truncation in both directions.

Bridge properties: closed-key, schema-pinned decision receipts that must bind
the FROZEN policy and vocabulary hashes (a self-hashed forgery naming an
attacker-authored policy is rejected before any V4 execution); refusals are
receipted side-effect-free; post-commit verification failures are receipted
`committed_but_unverified` rather than thrown past the receipt boundary; the
`GatedAdmissionReceipt` carries `policyHash`/`vocabularyHash` so it verifies
against the frozen manifest in isolation.

## Adversarial review and recovery log

Two independent reviewers (research-integrity, engineering) produced
**1 blocker + 3 majors + 4 minors, all confirmed by repro**. The workflow's
fix agent died mid-edit on a session limit, leaving the scheduler half-fixed
(updated header contract, dangling `RUN_ID_PREFIX` reference, old body
semantics); the fixes were completed and verified in the main thread:

- **Blocker — truncated-chain acceptance:** `verifyRoundReceiptChain` now
  requires exactly one safety/decision pair per resolved turn on a non-frozen
  barrier; wholesale erasure of the adjudication chain no longer verifies.
  Regression test added.
- **Major — issue-relative deadlines:** the deadline clock now starts at
  DISPATCH and is enforced with a real timer race; the shipped policy is no
  longer internally incoherent (3 waves x 60s route ceiling vs a 90s
  issue-relative window), and receipts no longer misattribute pool queuing to
  the model. Route-ceiling <= turn-ceiling coherence is checked at
  construction. Regression tests: queue-not-charged, hang-guard.
- **Major — forgeable decision binding:** closed keys + exact schema pin +
  frozen policy/vocabulary hash equality in the bridge; `executeGatedAdmission`
  takes `expectedPolicyHash`/`expectedVocabularyHash`. Regression tests:
  attacker-authored policy hash and wrong-schema receipts refused pre-commit
  with zero side effects.
- **Major — per-round replay registries:** registries moved to the scheduler;
  runIds are single-use, so opportunity identities can never repeat across
  rounds. Regression test added.
- **Minors:** shared `RUN_ID_PATTERN` (scheduler exports, bridge imports —
  one law, checked before live turns are spent); integration concurrency
  assertion strengthened to `=== concurrencyLimit`; post-commit failure
  receipting (above); timed-out responses withheld from public turn records.

## Executed evidence (live, 2026-07-26)

`npm run test:hololand-model-village`: full chain green — canonical-lifecycle,
phase0b, experiment, MV-B1 custody/adapter/integration, and the three MV-B2
suites (14 + 8 + 10), zero failures. Frozen lanes untouched.

`npm run check:hololand-model-village-turn-scheduler` (live):

```
receiptHash:    e3b8a1f99cff4b89d1bac7482c6764fe4d63a81fe4ee22b559817b267012d98c
policyHash:     fc42210549be00dce1ccab3a9e1913a84a0a75a4a0d4a481cc1034b585301cf0
vocabularyHash: 16b26b3a48dad9483c88a1080c24eff45dc7aa2775cecd99c308e2e50bf77b4b
```

| Run | Routes | Barrier | Decisions | Gated commits |
|---|---|---|---|---|
| `mv-b2-live-r1` (LIVE) | both sovereign routes certified (HoloServe :8099 required; Jetson :18080 optional); six residents round-robin | completed=6, failed=0, timedOut=0, frozen=false, high-water 2 | 3 holoserve residents default-denied (prose-wrapped JSON); 3 jetson residents admitted with catalog match | **exactly 1** deterministic-lane commit; the other 2 matches receipted `preauthorized_action_already_committed` |
| `mv-b2-live-r2` (loopback stubs) | both stub routes certified | completed=6, failed=0, timedOut=0, frozen=false, high-water 2 | alternating catalog-match / valid-abstain | exactly 1 commit; abstains receipted `no_preauthorized_match` |

Isolation: run r2 proved `priorRunUntouched=true` (r1's run directory
byte-identical afterwards) and `crossRunCustodyReadRefused=true`. Receipt
self-verified via `--verify`; `liveSovereignRouteExercised=true`;
`canonicalLaneProviderCallsIntroduced: 0`.

## Claim boundary

Observed: runtime-issued nonce-bearing turn opportunities; frozen-snapshot
distribution; bounded concurrency with measured high-water mark; proposal
barrier closed before any adjudication; default-deny decision receipts
binding policy/proposal/vocabulary hashes; gated admission in which ONLY the
deterministic V4 lane mutates; per-run isolation; zero retry; dispatch-relative
enforced deadlines.

Not claimed (pinned false in the receipt): live study run; Phase 1 admission;
six-resident live STUDY (residents are engineering aliases mapped to openly
declared routes); blinded alias assignment; open-outcome canonical mutation;
native lifecycle dispatch; multi-day run controls; production validator
custody; provider sampling determinism.

## Remaining next slices

MV-B3 (sealed alias assignment + captured-response study custody,
task_1785113448191_nmnh), MV-B4 (production validator custody,
task_1785113448191_9k9n), MV-B5 (durability drills, task_1785113448191_ijwd),
and the HoloScript open-outcome receipt tier (idea seed). One residual
observation: the MV-B1 integration suite flaked once during a full-chain run
(did not reproduce standalone or on re-run; likely ephemeral-port timing) —
worth watching under MV-B5's contention drills.

## Reproduce

```bash
# 1. FULL / LIVE — this is the form the evidence in this report came from.
#    Exercises the real sovereign routes (HoloServe 127.0.0.1:8099, Jetson
#    192.168.0.119:18080); both must be up, or it fails for that reason.
npm run test:hololand-model-village
npm run check:hololand-model-village-turn-scheduler

# 2. HERMETIC SUBSET — in-process OpenAI-compatible loopback stubs.
#    It does NOT exercise the sovereign routes, so a PASS here does NOT
#    reproduce the live evidence above; it only shows the offline lane is green.
node scripts/check-hololand-model-village-turn-scheduler.mjs --skip-live

# 3. Re-verify an already-emitted receipt without re-running the rehearsal.
node scripts/check-hololand-model-village-turn-scheduler.mjs --verify .tmp/hololand/model-village/turn-scheduler-receipt.json
```
