# HoloLand Model Village MV-B4: Production Validator Custody

**Status:** Bounded engineering witness; executed against the real tracer, adversarially reviewed, receipted

**Date:** 2026-07-27

**Lane:** MV-B4 (experiment backend), following MV-B1 (`a021acd`), MV-B2
(`814fcb4`), MV-B3 (`f4da1c9`). Board: task_1785113448191_9k9n.

**Gate addressed:** [HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md](../specs/HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md)
row 577 "Trust and outer verification", remaining column — *"Production
validator provisioning, custody, rotation, revocation, trust publication, and
fleet verification"* — and lines 256-261, which name the ephemeral fixture
keypair as a Phase 1 blocker.

## The load-bearing result

The **real, unmodified** `runPhase0BEngineeringTracer` accepted a
custody-backed validator in place of `createRuntimeInjectedValidatorFixture`.
Not a double, not a mock: the drill imports the shipped tracer, passes
`{signRunManifest: validator.issue, trustedValidatorConfig: validator.config}`,
and the run passes all 16 tracer assertions with
`terminalCommitment d6ed3fec6dab9f04…`. The drill additionally **measures** the
tracer's source digest before and after the run and fails if it changed, so the
"unmodified" claim is evidence rather than assertion.

Then the same signature was verified a second time from the published trust
registry **alone** — and a cold proof re-ran that verification after closing
*and deleting* both custody stores, reading the registry back off disk. That is
what fleet verification means: a party holding no private material and no
custody store can still answer "was this authority allowed to sign this, then?"

## New surfaces

| Surface | File | Identity |
|---|---|---|
| Validator custody | `scripts/model-village-validator-custody.mjs` | `hololand.model-village-validator-custody.v1` + provision/rotation/revocation/trust-publication receipt schemas; engine `hololand-model-village-validator-custody-v1` |
| Trust registry | `scripts/model-village-trust-registry.mjs` | `hololand.model-village-trust-registry.v1`; append-only, hash-chained, fork-fenced |
| Checker | `scripts/check-hololand-model-village-validator-custody.mjs` (`npm run check:hololand-model-village-validator-custody`) | drill receipt `hololand.model-village-validator-custody-drill.v1` |
| Tests | validator-custody (18), trust-registry (18), integration (31) | fully offline |

Ed25519 private keys exist only inside the AES-256-GCM custody store and
transiently in memory while signing. Trust "publication" is a local canonical
file — `networkPublicationPerformed: false`, pinned and machine-checked.

## Executed evidence (2026-07-27)

```
DROP-IN:   tracerRan=true receiptVerified=true
FLEET:     fromRegistryOnly=true negativeRejected=true (key-not-yet-valid)
           tamperRejected=true cold=true
ROTATION:  overlapVerifies=true successorSigned=true
           predecessorRefused=true pastOverlapRejected=true
REVOCATION: preStillVerifies=true (suspect) postRejected=true destroyed=true
           postDestroySigning=validator-key-material-destroyed
TRUST REGISTRY: entries=3 registryHash=99342518266…
```

Full chain `npm run test:hololand-model-village` EXIT 0 (15 suites,
MV-B1→MV-B4 plus the frozen lanes; one pre-existing POSIX-only skip on
Windows). Checker EXIT 0.

Revocation semantics implemented deliberately: `notBefore` inclusive,
`notAfter` **exclusive** (both lanes converged on the stricter rule),
`revokedAt` inclusive-invalid — the boundary instant belongs to the revocation,
because "signed the same second it was revoked" is the case an attacker aims
for. A compromise revocation marks historical signatures `suspect` — they still
verify, so the record is not erased, but the suspicion is surfaced so a reader
can quarantine rather than silently trust. Key destruction is proven the strong
way: against a deliberately **stale** trust view that still believes the key is
active, so the refusal provably comes from custody, not a status check.

## Adversarial review: four blockers

- **A false security claim.** The module documented that checking the clock
  before the signature prevented accepting a revoked key's artifact. It does
  not — the two orderings accept exactly the same set. Deleted, and replaced
  with the honest limit below.
- **Anti-leak audit degraded to a regex** at 8 of 9 call sites. The structural
  DER scan (PKCS#8/PKCS#1/SEC1 framing, all four base64 phases, every byte
  offset) now runs at every site, with positive controls proving the detector
  catches bare base64 behind prefixes and stays quiet on public keys.
- **Revoking a superseded key widened trust** — `revokedAt` and `overlapUntil`
  were treated as exclusive status branches; now evaluated independently.
- **Test signing model diverged from the shipped seam**, so temporal tests
  rested on a fabricated binding. The fixture preimage now mirrors production.

Four majors and eight minors also fixed, including a destroy guard that would
have taken *any* foreign sealed object as collateral (captured responses, alias
records) and now fails closed on metadata-unavailable entries, and two lanes
that fingerprinted the same key differently (SPKI DER vs normalized PEM) — a
real interop bug found only by running the seam.

## The honest limit, stated rather than papered over

**Signing time is unauthenticated.** Nothing binds `signedAt` to reality: a
revoked key's holder can sign now, assert a pre-revocation instant, and the
artifact verifies. The fix agent deliberately did **not** ship a
self-signed timestamp — whoever can forge the signature can forge the
timestamp, so it would have looked like a fix while changing no security
property. Instead the limit is deleted from the prose that claimed otherwise,
stated in both module headers and the checker, pinned as nine machine-readable
flags across three claim boundaries, listed in the receipt's `notObserved`, and
locked by tests in two suites that will fail if the property ever changes
without the boundary changing with it.

Related, also stated: registry entries are **unauthorized** — filesystem write
access can splice an entry, detectable only by an out-of-band `registryHash`
pin. An unsigned registry is self-consistent, not authentic. Closing either
needs a trusted timestamp authority or an independent countersignature, which
is a Phase 1 decision, not an engineering one.

Not claimed (pinned false): live study run, Phase 1 admission, hardware-backed
key storage, threshold/multi-party signing, external or public trust root,
fleet *deployment* (verifiability is proven; deployment is not), network
publication.

## Follow-ups this slice surfaced

- The signed runtime config publishes `keyCustody: 'external_host_key'`, not
  `'sealed-custody-store'`, because `verifyRuntimeInjectedValidator` allowlists
  exactly two values (`model-village-phase0b-runtime.mjs:859-862`). Widening it
  is a one-line change owned by whoever owns that file; until then the richer
  claim rides on the provision receipt and is pinned by tests.
- MV-B1's `CUSTODY_STORE_CLAIM_BOUNDARY` still pins
  `productionValidatorCustodyClaimed: false`. That file was out of bounds here;
  someone with authority over MV-B1 should flip it or record why it stays.
- Spec row 577's remaining column now has a running, receipted answer, but the
  spec was not edited — that is a deliberate docs decision for the study lane.
- Still genuinely unmet: multi-process CAS / distributed locking on the
  registry, and process-crash durability (both are MV-B5).

## Reproduce

```bash
npm run test:hololand-model-village
npm run check:hololand-model-village-validator-custody
node scripts/check-hololand-model-village-validator-custody.mjs --verify .tmp/hololand/model-village/validator-custody-receipt.json
```
