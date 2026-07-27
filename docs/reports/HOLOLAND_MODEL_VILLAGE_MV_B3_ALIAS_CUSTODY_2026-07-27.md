# HoloLand Model Village MV-B3: Sealed Alias Assignment and Captured-Response Custody

**Status:** Bounded engineering witness; executed, adversarially reviewed, and receipted

**Date:** 2026-07-27

**Lane:** MV-B3 (experiment backend), building on MV-B1 (`a021acd`) and MV-B2
(`814fcb4`). Board: task_1785113448191_nmnh (claimed by claude5).

**Gate addressed:** [HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md](../specs/HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md)
line 576, "Captured replay" row, remaining column — *"Real captured-response
custody and provider-route evidence."* Plus spec lines 216-228 (per-adapter
sampling and custody evidence) and 188-204 (blinding).

That row is **still open in the spec** and this slice does not close it: the
drop-in swap was proven *eligible-or-not* by an executable verifier but never
*admitted* (`frozenPlanSwapPerformed: false`), so the frozen synthetic fixtures
remain the ones the replay lane actually executes. Closing line 576 requires
performing the swap — which changes `planExecutionSourceHash` — and that is a
study-lane decision, not this lane's.

## What this slice is

Two sealed surfaces the experiment had only as prose:

1. **Sealed alias assignment.** The study's `adapter_a/b/c` aliases are bound to
   MV-B1-certified sovereign routes *inside* the encrypted custody store. The
   public artifact is a commitment carrying **no mapping** — salted digests
   only. Unblinding is a two-person, fail-neutral, key-holder operation.
2. **Real captured-response custody.** Provider responses are captured through
   the MV-B1 certified-turn path, raw bytes and derived canonical form both
   sealed, with provider-route and sampling evidence receipted per spec
   216-228 — and an **executable drop-in verifier** that proves whether a
   custody-backed pair could substitute for the frozen synthetic fixtures.

## New surfaces

| Surface | File | Schema / identity |
|---|---|---|
| Alias vault + unblinding | `scripts/model-village-alias-vault.mjs` | `hololand.model-village-alias-vault.v1`, `...alias-assignment-commitment.v1`, `...unblinding-receipt.v1`; engine `hololand-model-village-alias-vault-v1` |
| Captured-response custody | `scripts/model-village-captured-response-custody.mjs` | `hololand.model-village-captured-response-custody.v1`, `...captured-response-record.v1` |
| Checker | `scripts/check-hololand-model-village-alias-custody.mjs` (`npm run check:hololand-model-village-alias-custody`) | receipt `hololand.model-village-alias-custody.v1`, self-hashed, `--verify`, `--skip-live` |
| Tests | alias-vault (14), captured-response-custody (16), integration (12) | fully offline |

The frozen assignment matrix is consumed through the **shipped**
`extractCanonicalAdapterMatrix` (no hand re-parse), and per-block
`assignmentManifestHash` mirrors MV-L12's formula exactly, so both lanes agree.
Seat bindings reuse MV-L12's snake_case shape and positional binding
(`resident-0N` ↔ `personasAndSeats[N-1]` ↔ `blocks[blockId][N-1]`).

Where this receipt names a field codex's presentation lane already declares
(`commitmentId`, `canonicalHash`, `priorReceiptHash`, `terminalCommitmentId`,
`terminalCommitmentHash`, `runId`, `assignmentManifestHash`, `failNeutral`), it
reuses that exact name so the custody-issued receipt lifts into
`VerifiedUnblindingReceipt` without renaming, and honors the declared chain
(`priorReceiptHash === terminalCommitmentHash`). No presentation-lane struct is
redefined and no profile admission is implemented here.

## Adversarial review: three blockers, and what they teach

A reviewer was assigned solely to **break the blinding**. It did, twice:

- **Blocker — replay oracle.** The record published unsalted
  `rawResponseHash` / `rawResponseCustodyId`. Because an attacker can enumerate
  plausible response bodies, those bare digests let anyone *confirm* which
  route produced a given response, defeating the seal without touching the key.
  Fixed: all four provider-correlated hashes (`rawResponseHash`,
  `rawResponseCustodyId`, `turnReceiptHash`, `priorReceiptHash`) are `null`
  under blinding; the public bindings are salted commitments
  (`rawResponseCommitment`, `turnReceiptCommitment`) under a **fresh
  per-capture salt**, with the true hashes and custody locations moved into the
  sealed route disclosure so spec 216-228 evidence stays complete for the
  key-holder. The fix agent correctly *extended* the finding: the turn-receipt
  digest's preimage embeds the raw response hash, routeId, and endpoint, so
  fixing only the named pair would have left the hole open.
- **Blocker — derivable assignment.** Aliases were assigned round-robin over
  the certified routes, so the "sealed" mapping was a deterministic function of
  public source — predictable with no key at all. Fixed with a CSPRNG
  Fisher-Yates draw (`drawAliasRouteAssignment`), surjective onto the certified
  routes so `distinctRouteCount` stays truthful. Verified: the from-source
  prediction no longer matches, and five drills produced four distinct maps.
- **Blocker — unbound frozen source.** `verifyAliasAssignmentCommitment` is
  self-consistency plus anti-leak only; a commitment sealed against a *drifted*
  kernel would be cryptographically perfect and evidentially void (D.131/DT-24:
  a check that reads only a record verifies that someone wrote the record).
  Fixed inside the checker: `kernelSourceHash` and all three
  `assignmentManifestHashes` are re-derived from canonical `.hs` on every run
  and re-bound by `verifyAliasCustodyReceipt(receipt, { hololandRoot })`, with a
  distinct `frozen-source-drift` failure reason.

Five majors and four minors also fixed, including: unblinding now rebinds the
public aggregates to the sealed truth it opens (a forged
"three distinct routes" commitment is refused); an issuance-side self-audit
nulls route-shaped authorizer strings *before* the vault opens; capture-error
reasons are a closed enum because Node's `JSON.parse` errors quote the
offending input (echoing one would have exported raw model bytes into a durable
public receipt — which the live run would have done); and a vacuous
"≥128 hex" test guard was replaced with a real preimage check, proven
non-vacuous by planting the true salts and observing four detections where the
old rule fired zero.

## Executed evidence (live, 2026-07-27)

`npm run test:hololand-model-village` — full 12-suite chain **EXIT 0**
(MV-B1 + MV-B2 + frozen lanes + MV-B3's 42 tests).

`npm run check:hololand-model-village-alias-custody` (live) — **EXIT 0**:

```
kernelSourceHash: 2f939bb98ae18d44972a5b871eb97d9a1c865af42ec1d3c8bb72c23bf122c966
alias assignment (block1): distinctRouteCount=2 certifiedRouteCount=2 routeReuseDeclared=true
custody access-log entries: 23
```

- Both sovereign routes certified; the two-live-route reality is receipted via
  an explicit `allowRouteReuse`, not hidden.
- Two blinded captures issued records (both turns completed, both proposals
  vocabulary-valid).
- **Drop-in: not eligible**, failing the named check `response-hashes-distinct`
  — both models proposed the *same* action, while the frozen lane's two fixture
  slots require one allow and one deny. A legitimate outcome, receipted as
  such and never massaged. (An earlier live run failed differently — non-strict
  JSON — because the sovereign model is nondeterministic; the offline stub lane
  *does* produce an eligible pair and hard-fails if it ever stops doing so.)
- All four unblinding drills correct: missing, mismatched, and
  incomplete-authorization terminal commitments each returned `failNeutral`
  with `revealed: null`; the authorized reveal matched the sealed mapping while
  the receipt itself carried none of it.

**Independent leak audit** (run in the main thread, not by the builders) over
the emitted 17,390-byte receipt: zero hits for either sovereign routeId,
`127.0.0.1`, `192.168.0.119`, `8099`, `18080`, `localhost`, `://`, or `http`.
Both records show `routeIdentityBlinded: true`, `routeId: null`, and all four
provider-correlated hashes `null`, with distinct salted commitments per
capture.

## Claim boundary

Observed: frozen matrix consumed with latin-square verification and re-derived
from canonical source on every run; alias-to-route assignment CSPRNG-drawn and
sealed in encrypted custody with a public commitment carrying no mapping;
certified-routes-only enforcement; real provider responses captured under
custody with provider-route and sampling evidence; executable drop-in
eligibility verification; two-person fail-neutral unblinding issuance.

Not claimed (pinned false and verifier-enforced): live study run; Phase 1
admission; frozen plan swap (`frozenPlanSwapPerformed: false` — eligibility is
*proven*, never *admitted*; the swap changes `planExecutionSourceHash` and is a
study-lane decision); post-lock presentation execution (codex's lane);
family-to-model attribution; blinded evaluation; production validator custody.

Residual limits stated rather than papered over: with three aliases over two
certified routes the candidate space is only the six surjections and
`distinctRouteCount` is public — randomization removes *derivability*, not the
small space, and confirming any guess still requires the sealed salt and
therefore the custody key. The two-person rule compares two distinct authorizer
strings, not two independently held signing keys. `responseHash` and
`parsedProposal` remain public but are route-*independent* (they carry the
study payload, not the route); payload-to-model inference is behavioral
blinding, which this lane explicitly does not claim. Nothing here is signed —
authenticity belongs to MV-B4.

## Remaining

MV-B4 (production validator custody, task_1785113448191_9k9n), MV-B5
(durability drills, task_1785113448191_ijwd), the HoloScript open-outcome
receipt tier (idea seed), and — newly surfaced — no model-village checker
appears in any `.github/workflows` file, so none of these gates run in CI.

## Reproduce

```bash
# 1. FULL / LIVE — this is the form the evidence in this report came from,
#    including the "drop-in: not eligible" outcome. Exercises the real sovereign
#    routes (HoloServe 127.0.0.1:8099, Jetson 192.168.0.119:18080); both must be
#    up, or it fails for that reason. The sovereign model is nondeterministic, so
#    the drop-in verdict is a live measurement and may legitimately differ.
npm run test:hololand-model-village
npm run check:hololand-model-village-alias-custody

# 2. HERMETIC SUBSET — in-process OpenAI-compatible loopback stubs.
#    It does NOT exercise the sovereign routes, so a PASS here does NOT
#    reproduce the live evidence above; the stub lane deliberately produces an
#    eligible drop-in pair and hard-fails if it ever stops doing so.
node scripts/check-hololand-model-village-alias-custody.mjs --skip-live

# 3. Re-verify an already-emitted receipt without re-running the drill.
node scripts/check-hololand-model-village-alias-custody.mjs --verify .tmp/hololand/model-village/alias-custody-receipt.json
```
