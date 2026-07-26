# HoloLand Model Village Experiment

**Status:** Phase 0B bounded engineering tracer observed; Phase 1 blocked

**Version:** 0.4.1

**Canonical product source:** HoloScript
**Study class:** Mechanism pilot and rough variance signal, not confirmatory evidence
**Production plan:** [Logistics, visual quality, and observer experience](./HOLOLAND_MODEL_VILLAGE_PRODUCTION_PLAN.md)
**Art direction:** [Stormglass Commons and the six fixed residents](./HOLOLAND_MODEL_VILLAGE_ART_DIRECTION.md)

## Purpose

The Model Village experiment asks a narrow question:

> Does a village containing these three locked model-adapter configurations
> coordinate differently from otherwise identical villages whose residents all
> use one of those configurations?

The planned study will run inside isolated HoloLand shards. Residents will be
HoloScript-defined agent actors with metadata-masked model adapters, equal
logical affordances, bounded memory, one proposal opportunity per turn, and
receipted world effects.

The estimand is the composition effect for this exact adapter triplet, persona
set, action protocol, and challenge distribution. It is not a generic
model-family or population effect. Each adapter is an end-to-end treatment
bundle: model and revision, provider/runtime, tokenizer/serializer, and request
path.

This document separates what is observed now from the experiment we intend to
run. A source file or parser success is not a behavioral result.

## Claim register

| Register | Current statement |
|---|---|
| Observed | In the recorded source-contract check, the three canonical HoloScript sources parsed and two native headless materializations under the receipt's duration/tick settings produced equal canonical scene and pose/physics digests. Runtime statistics were outside that canonical projection. |
| Observed | The `0.2.0` checker also parses a source-declared, one-tick captured fixture from the canonical `.hs` and `.hsplus` sources. A bounded HoloLand bridge executes three fixture schedule entries, materializes six identity-neutral observation envelopes, and seals two hash-chained action receipts with zero provider calls. It also proves that the three frozen adapter-assignment hashes remain outside this pre-inference canonical projection. This is fixture-replay and static noninterference evidence, not native `.hs` pipeline, `.hsplus` action, or post-inference outcome equivalence. |
| Observed | The bounded Phase 0B bridge consumes an upstream V4 source-run receipt that recomputes a four-object static `.holo` projection, executes the `.hs` `main()` plan through the Rust/WASM/uAAL path, and executes an engine-owned deterministic `.hsplus` action subset. Its sealed run contains four schedule rows, two subject-bound observations, two action receipts, and five public-state snapshots. Two synthetic captured-response hashes drive one allowed water mutation and one denied external-message attempt; no provider or live model is invoked. |
| Observed | The same bounded bridge hashes frozen Phase 1 challenge and metric inputs. Its host caller passes a frozen public trust-policy input (`trustedValidatorConfig`) separately from the manifest-signing capability (`signRunManifest`); the bridge verifies the resulting Ed25519 signature against the pinned public configuration. The included key-generation helper supplies both sides only as an ephemeral engineering fixture, not production key custody or a production trust root. |
| Observed | Atomic persistence accepts only an action and post-action snapshot extracted from a reverified HoloScript V4 source run. Target mismatch and missing or malformed state-hash attempts each burn one authorization, deny, and leave the world unchanged. Persistent-state validation checks the authorization, outbox, ledger-chain, and terminal-world invariants. A fresh Node process rereads the same validated file state. Injected process-level faults immediately before and after rename expose the old or complete state; they are not process-crash tests. |
| Observed | A fresh source replay matches ordered decisions, post-state hashes, action root, and terminal commitment. The visible `.holo` declares the bounded stop reason and target; the bridge hashes that dispatch request, matches it to the signed stop plan and `.hsplus` invocation, dispatches `ModelVillagePhase0BBehavior.freeze_run`, and seals a safety receipt. The full outer verifier requires the external trusted configuration and reverifies both main and stop V4 receipts. Its self-hash check alone proves only receipt self-integrity. |
| Observed | The Phase 0B observer consumes one sealed four-object V4 execution after sealing, introduces zero experiment executions, and preserves the complete canonical payload plus the seven scene, pose, clock, public-state, schedule, resident-observation, and action-root fields. A separate HoloLand browser off/on sandwich withholds and then SHA-256-acknowledges one canonical payload before presentation; the browser renders only from that parsed acknowledged string while the complete host physics receipt and compiled source hashes remain unchanged. The observer `.holo` and `.hsplus` sources remain hash-bound and read-only. |
| Observed | The read-only Living Commons presentation derives three public water units, one admitted `contribute_water` action, and one blocked `deny_external_message` action from the bounded receipt. The blocked receipt links to the admitted receipt and equals the terminal action root. A separate binding derived from the fully verified execution ledger anchors both receipt hashes, their link, the root, and the source-run/terminal commitments before the browser may render. Its cistern, hearth, receipt halo, and boundary ward reference those existing fields or action receipts. This is observer evidence only and does not enter resident observations. See the [2026-07-25 witness](../reports/HOLOLAND_MODEL_VILLAGE_PHASE0B_OBSERVER_LIVING_COMMONS_2026-07-25.md). |
| Target | Locked model adapters drive six residents through identical, seeded village runs; every observation, model turn, action decision, mutation, rollback reference, and run summary is receipted. |
| Gap | Phase 0B proves only the named bounded source subsets and a file-backed single-process bridge. Live models, provider routes, full or native `.hs`/`.hsplus` execution, native `.holo` lifecycle and cross-composition dispatch, physics execution by this tracer, production validator provisioning/custody, process-crash durability, and production multi-process/CAS/fleet durability remain unobserved. The frozen Phase 1 manifests are inputs, not proof that isolation, budgets, six-resident lifecycle, live routing, custody, or the overall Phase 1 go gate is ready. |
| Forbidden claim | No emergence, model superiority, population effect, inference determinism, production trust or durability, process-crash durability, Phase 1 readiness, or completed scientific experiment may be claimed from this bounded tracer. |

## Canonical three-format split

| Format | Owns | Canonical source |
|---|---|---|
| `.holo` | Village space, six resident embodiments, commons, public state, observer deck, isolation boundary, receipt ledger, emergency stop | `source/layers/vr/frontier/model-village/model-village.holo` |
| `.hsplus` | Study design, resident and adapter contracts, equal affordances, safety/isolation policy, receipt envelopes, claim boundary | `source/domains/agents/model-village-experiment.hsplus` |
| `.hs` | Trial pipeline, randomized-block matrix, deterministic world schedule target, metrics, replay and capability gates | `source/proofs/model-village-trial-kernel.hs` |

JavaScript may invoke parsers, invoke the headless runtime, canonicalize receipts,
and verify hashes. It must not contain resident reasoning, village rules,
experimental treatments, scoring policy, or model-specific behavior.

## Experimental design

### Study units

- Three locked model adapters: `adapter_a`, `adapter_b`, and `adapter_c`.
- Six fixed resident personas.
- Four isolated conditions per seed block:
  - `mixed`: two residents use each adapter.
  - `adapter_a_only`: all six residents use adapter A.
  - `adapter_b_only`: all six residents use adapter B.
  - `adapter_c_only`: all six residents use adapter C.
- Three seed blocks.
- Twelve planned village-runs.
- Six deterministic turns per run.
- Three predefined cooperative challenge windows per run.

The village-run is the experimental unit. Resident turns and challenge windows
are repeated observations within a run, not independent samples.

Three seed blocks provide a mechanism pilot and rough variance signal. They do
not provide a stable powering basis, a meaningful population claim, or a
confirmatory p-value. A later confirmatory run requires a preregistered sample
size justified with stronger evidence.

### Assignment and run order

Within each mixed condition, adapter-to-persona assignment rotates across seed
blocks using the frozen matrix in `model-village-trial-kernel.hs`:

| Seed block | Seats 01-02 | Seats 03-04 | Seats 05-06 |
|---|---|---|---|
| 1 | A | B | C |
| 2 | B | C | A |
| 3 | C | A | B |

Across three blocks, every persona and seat/turn position receives every
adapter once. The complete persona x adapter x seat x turn-order matrix is
hashed into each run manifest. Homogeneous villages use the same personas,
world source, event schedule, and affordance envelope.

Condition execution order is frozen and hashed per seed block, with order
varied inside each recorded provider/time batch. Three blocks cannot fully
counterbalance four condition positions, so order remains a measured pilot
limitation.

For each seed block `s`, the primary paired contrast is:

```text
D_s = Y_mixed,s -
      (Y_adapter_a_only,s + Y_adapter_b_only,s + Y_adapter_c_only,s) / 3
```

Pilot reporting consists of the three `D_s` values and their descriptive mean
and range. Turns, residents, and challenges are never treated as independent
sample size. This avoids treating one arbitrary adapter as the control for
heterogeneity.

### Equal-affordance envelope

In Phase 1, every resident will receive the same:

- System scaffold.
- Persona schema.
- Public observation function.
- Memory limit and retention rule.
- Action vocabulary.
- Tool permissions.
- Token budget.
- Temperature.
- Timeout and retry count.
- Turn opportunity.
- Initial public world state.
- Scripted cooperative challenge schedule.

"Same" means the same logical envelope. Token limits, temperatures, and other
provider controls are not assumed to have equivalent semantics across adapter
bundles.

In Phase 1, model identity metadata will be sealed until analysis. Residents
will not receive their own or another resident's adapter identity, and observers
will see aliases.
Behavior and writing style may still reveal identity, so behavioral blinding is
not claimed. Blinded evaluators will record identity guesses and confidence if
a human-scored outcome is later introduced.

Phase 1 adapters will disable provider fallback and hidden prompt enhancement.
Each adapter will receipt its actual provider route, model revision or local
file hash, generation parameters, serializer/request hash, retry count,
cache-state evidence, and fallback evidence.

## Determinism boundary

World RNG, event order, resident assignment, and turn order are intended to be
seeded and replayable.

Model sampling will remain a separate evidence question. Each Phase 1 adapter
will record:

- Whether a sampling seed was requested.
- Whether the provider accepted it.
- Model revision or local model file hash.
- Temperature and token limit.
- Raw response hash.
- Captured response location under local sealed custody.

Temperature zero is not a determinism receipt. When provider sampling cannot be
reproduced, the Phase 1 replay path will use captured model responses without
reinference.

## Target event and receipt chain

The envelopes below remain the target live-study chain. Phase 0B now executes
and persists a bounded two-resident subset through the named V4 engines and
HoloLand bridge. That evidence does not promote the full six-resident lifecycle,
provider-backed model turns, native HoloScript lifecycle dispatch, or production
durability.

### RunManifestReceipt

Will freeze:

- Run, block, condition, provider/time batch, and budget ceilings.
- World, policy, kernel, metric-spec, and challenge-manifest hashes.
- Turn schedule, condition order, and blinded assignment matrix hashes.
- Adapter manifests and request serializer hashes.
- Equal-affordance, safety, and isolation policy.

A full `RunManifestValidationReceipt` will bind the run ID and manifest hash to
a pinned authority ID, validator source hash, registry receipt, monotonic
validation sequence, verified signature, and allow/deny decision. The Phase 0B
bridge proves the narrower cryptographic prerequisite: its host caller supplies
the frozen public trust policy as `trustedValidatorConfig`, separately from the
`signRunManifest` signing capability. The public configuration pins the
authority, validator source, registry receipt, and public-key fingerprint; it
does not grant signing authority. The bridge verifies the manifest signature
produced by `signRunManifest` against that policy. The bundled
`createRuntimeInjectedValidatorFixture()` helper generates an ephemeral
engineering key pair and exposes both inputs for this drill; it is not
production key provisioning, custody, or a trust root. General deployment injection,
manifest-validation sequencing, key rotation and revocation, and fleet-wide
validator configuration remain Phase 1 runtime blockers.

### ObservationEnvelope

Will record:

- Run, tick, resident, and location.
- Visible public event IDs.
- Public-state hash.
- Bounded-memory hash.
- Observation hash.

It excludes peer private memory and sealed model identity. The bounded Phase 0B
run emitted two subject-bound, identity-neutral observation receipts from one
public event and public-state snapshot.

### ModelTurnReceipt

Will record:

- Prompt hash.
- Adapter alias and sealed model revision evidence.
- Generation parameters and seed support.
- Response hash and parsed proposal.
- Token use, latency, retries, route, cache state, and fallback evidence.

Raw prompts and responses will remain in a local sealed research store. Public
receipts will carry hashes and bounded summaries. Phase 0B consumed two
source-authored synthetic response hashes and parsed proposals; it did not
execute a model turn, contact a provider, or prove the live custody path.

### SafetyCheckReceipt and ActionDecisionReceipt

The full chain will record the policy hash, proposal hash, action-vocabulary
hash, allow/deny decision, and reason; its default will be deny. The bounded
bridge currently correlates each signed action's entrypoint, target, resident,
parsed proposal, frozen-input hashes, decision/safety/turn IDs, nonce, and
monotonic authorization sequence. Before admission, it reverifies the
HoloScript V4 source-run receipt and takes the candidate action and post-action
world only from that receipt's action ledger and public-state snapshots; the
caller does not supply an authoritative action or world state. A target
mismatch and an attempt with missing or malformed state hashes each consume one
authorization, deny without world mutation, and reject reuse. The consumed
sequence remains present when the file is reread in a fresh Node process, but
that is not process-crash durability evidence. Full typed
policy/proposal/vocabulary receipts, production multi-process compare-and-swap,
distributed locking, and fleet recovery remain Phase 1 requirements.

### ModelVillageActionReceipt

Will record:

- Proposal and admission decision.
- Action, target, outcome, or rejection reason.
- Pre-state and post-state hashes.
- Rollback reference.
- Player-visible impact.
- Prior-receipt hash.

The bounded Phase 0B bridge admitted one water mutation and denied one external
message. For each attempt, one atomic file replacement couples the
authorization burn, receipt, world state, and durable post-commit outbox.
Validation checks the state hash, ledger entry hashes and chain root,
authorization and outbox bindings, denied-action non-mutation, and agreement
between the terminal ledger hash and durable world. Injected process-level
faults immediately before and after rename expose the old or complete state,
never a partial state in this drill. They do not terminate the process and are
not crash-recovery evidence. This is bounded single-host bridge evidence, not a
general native or distributed transaction claim.

### RunSummaryReceipt

Will record preregistered metrics, analysis eligibility, contamination reasons,
receipt completeness, and the receipt-chain root.

For the bounded Phase 0B artifact, matching the outer receipt's own hash proves
self-integrity only. Full verification separately requires the host's trusted
validator configuration, reconstructs the manifest from canonical sources, and
reverifies both the main and emergency-stop HoloScript V4 source-run receipts.
It then reconstructs the complete expected persistent state from the verified
action sequence and compares the complete stop dispatch, safety receipt, and
visible binding rather than trusting nested receipt-local hashes.

## Outcomes

### Primary outcome

```text
cooperative_event_completion_rate =
  completed_predefined_cooperative_events /
  eligible_predefined_cooperative_events
```

Eligible events, initial state, open tick, deadline, success predicate,
permitted action types, and the minimum number of distinct resident
contributors (`>= 2`) will be frozen before the first Phase 1 model turn.
Treatment behavior will not be allowed to change eligibility. A runtime-invalid
event will contaminate the run rather than disappear from the denominator.

The Phase 1 HoloScript input bundle now freezes three concrete challenge
definitions, exact predicates, permitted actions, eligibility and denominator
rules, and one metric specification with the `missing_not_zero`
zero-denominator rule. The Phase 0B bridge hashes that source before execution.
These are frozen Phase 1 inputs, not evidence that a live Phase 1 run has
executed or passed its overall go gate.

### Secondary outcomes

- Proposal rate and abstention rate per resident turn opportunity.
- Valid-action rate: valid action proposals divided by submitted proposals.
- Safety-block rate: safety-rejected proposals divided by submitted proposals.
- Directed-interaction reciprocity: eligible directed initiations answered by
  the end of the next complete resident round.
- Interaction dominance: the maximum resident share of outgoing directed
  interactions.
- Accepted-action-type diversity: distinct accepted action types divided by
  permitted action types.
- Persona retention is exploratory until the rubric, evaluator hash, blinded
  sample, and inter-rater agreement rule are frozen.
- Receipt completeness.
- Captured-response replay success.
- Route, fallback, retry, revision, cache, and isolation contamination counts.

Tokens, latency, and cost are diagnostics rather than behavioral outcomes.

"Novel coordination" means an unscripted multi-resident action sequence that
completes a predefined event. It does not mean that the village merely felt
alive.

## Contamination, evaluability, and reruns

The following mark a started run contaminated:

- Equal-affordance mismatch.
- Provider fallback.
- Adapter revision or route drift.
- Hidden prompt augmentation.
- Missing required receipts.
- Isolation failure.
- Provider cache state that cannot be disabled or established.

A run starts when its validated manifest is sealed. Contaminated runs are
preserved and reported in the manifest-started set; they are not silently
retried, deleted, or replaced. Any replacement receives a new run ID and an
explicit preregistered replacement status. Primary evaluability and exclusions
are decided from integrity receipts without viewing outcomes. A per-protocol
sensitivity analysis may be reported separately.

The disposition set contains every manifest-started run. The primary analysis
set contains manifest-started runs whose outcome is observable under
pre-outcome integrity rules. A non-evaluable outcome is missing, not zero.
Reports include disposition, missingness, and preregistered worst-case bounds
so infrastructure failure is neither disguised as failed coordination nor
silently dropped.

## Safety, consent, and isolation

The Phase 1 protocol requires:

- A dedicated cloned shard marked `sandboxed_experimental` for every run.
- Denial of filesystem, browser, payment, wallet, external messaging, and
  physical actuation capabilities.
- Reset experiment-controlled sessions, memory, and caches, with no
  inter-village communication. Provider-side state is disabled where supported
  and otherwise receipted as unknown contamination.
- Rejection of malformed or out-of-vocabulary proposals without mutation.
- Rate, token, time, per-run, and study-level cost ceilings.
- A state snapshot and rollback reference before every accepted mutation.
- Append-only, hash-chained runtime receipts.
- Six unique resident IDs and six unique seat IDs staged against the validated
  assignment-manifest hash before the lifecycle may enter `running`.
- An emergency stop bound to the runtime freeze gate and a safety receipt.
- No human interaction in Phase 0.
- Explicit transcript consent for later interactive observation, plus
  read-only observer authority, a withdrawal/deletion path, and bounded
  retention.
- No dependency, attachment, or session-frequency optimization.

The visible `.holo` stop now declares the bounded event entrypoint, dispatch
reason, target object, target `.hsplus` composition, and `freeze_run`
entrypoint. The bridge constructs and hashes that dispatch request, matches its
reason and target to the signed stop plan, matches the executed action to the
signed `.hsplus` invocation, transitions public state to `triggered` and
`frozen`, and seals a safety receipt. This is bounded HoloLand bridge dispatch,
not native `.holo` lifecycle or native cross-composition execution; both remain
required before Phase 1.

The bounded bridge also receives the frozen public `trustedValidatorConfig`
separately from the `signRunManifest` capability, verifies the resulting
Ed25519 validator receipt against that public policy, and couples each
reverified V4 admission attempt to its receipt, state, and outbox in one atomic
file replacement. The resulting state validates after an in-process reread and
a fresh Node-process reread. The before/after-rename drills inject process-level
faults without crashing the process. Those tests close the local Phase 0B drill
only. Six-resident lifecycle admission, production validator custody,
production multi-process/CAS safety, process-crash durability, fleet
durability, and live provider isolation remain Phase 1 blockers.

Raw model text will remain in a sealed local research store with named operator
access and a retention/deletion policy frozen before live runs. Durable public
receipts will contain nonidentifying hashes; later deletion will be reconciled
through key destruction or a nonidentifying tombstone rather than rewriting the
append-only chain.

The planned experiment uses sandbox identities. It will not create wallets or
financial custody merely to satisfy an identity-shaped test fixture.

## Engineering tracer

Before the twelve-run pilot, the runtime must pass a two-resident tracer:

- Two resident aliases.
- Two locked adapters.
- One tick.
- One public event.
- One valid sandboxed action.
- One rejected external-side-effect action.
- One captured-response replay.
- Equal ordered action decisions, post-state hashes, and receipt-chain root.

The bounded Phase 0B tracer now passes:

- The upstream V4 receipt recomputes a four-object static `.holo` projection,
  executes the `.hs` plan entrypoint through Rust/WASM/uAAL, and executes the
  engine-owned deterministic `.hsplus` action subset. It does not claim the full
  or native languages or a `.holo` lifecycle.
- One sealed run contains four ordered schedule entries, two subject-bound
  identity-neutral observations, two action receipts, and five state snapshots.
- Two synthetic captured-response hashes and parsed proposals produce one
  allowed water mutation and one denied external-message attempt. The denied
  attempt consumes its authorization but does not mutate public state.
- The host caller supplies the frozen public `trustedValidatorConfig`
  separately from the `signRunManifest` signing capability. The configuration
  grants no signing authority; the manifest's Ed25519 signature verifies
  against its pins. The helper-generated key pair supplies both inputs only as
  an ephemeral engineering fixture, not production key custody or a production
  trust root.
- Before persistence, the bridge reverifies the HoloScript V4 source-run
  receipt and takes the action and post-action world from its ledger and
  snapshots. A target mismatch and missing or malformed state hashes each burn
  one authorization, deny without world mutation, and reject reuse.
- Each accepted or denied attempt atomically replaces the file-backed
  authorization, receipt, world-state, and durable post-commit outbox state.
  State validation checks outbox, world, authorization, and ledger-chain
  invariants.
- The same validated state hash is readable from a fresh Node process.
  Process-level faults injected immediately before and after rename expose the
  old or complete state. The drill neither kills the process nor proves
  process-crash durability.
- A fresh replay matches ordered decisions, ordered post-state hashes,
  action-receipt root, and terminal commitment.
- The visible `.holo` declares the emergency-stop dispatch reason and target.
  The bridge hashes the request, matches it to the signed stop plan and
  `.hsplus` invocation, dispatches the bounded `freeze_run` entrypoint, reaches
  `triggered`/`frozen`, and seals a safety receipt.
- Full outer verification requires the external trusted configuration,
  reverifies the main and stop V4 receipts, reconstructs the complete expected
  persistent state, and compares the complete stop payload and other semantic
  summaries. The outer receipt self-hash alone establishes self-integrity, not
  external trust.
- Observer proof consumes one sealed execution, introduces zero experiment
  executions, and preserves the complete canonical payload plus the seven
  canonical fields. The separately classified fresh source run remains replay
  evidence, not the consumer toggle.
- The HoloLand browser executes the observer consumer in off and on modes over
  the same verified projection payload. Off withholds the payload; on computes
  and acknowledges its exact SHA-256 digest. Host authoritative hashes remain
  equal before and after both browser runs.

The tracer makes zero provider calls and executes no live model. It does not
exercise physics, native `.holo` lifecycle dispatch, full/native `.hs` or
`.hsplus`, distributed concurrency, a six-resident production run, or a
scientific outcome.

## Runtime closure gates

The V4 source-run and HoloLand bridge close several gates only for the bounded
Phase 0B profile:

| Gate | Phase 0B evidence | Remaining Phase 1 requirement |
|---|---|---|
| Seed and deterministic clock | One-tick `.hs` plan executes through Rust/WASM/uAAL. | Six-resident, multi-run scheduler and day controls. |
| Action entrypoints | Engine-owned deterministic `.hsplus` subset executes two actions and the stop drill. | Full/native `.hsplus`, production policy surface, and native lifecycle dispatch. |
| `.hs` execution | The bounded `main(): string` plan kernel executes and returns canonical JSON. | Full/native pipeline semantics beyond the plan subset. |
| Ordered traces and snapshots | Four schedule rows, two observations, two actions, and five snapshots are sealed. | Live provider/model-turn traces and production retention. |
| Captured replay | Synthetic response hashes replay with equal decisions, post-state hashes, action root, and terminal commitment. | Real captured-response custody and provider-route evidence. |
| Trust and outer verification | The host passes frozen public `trustedValidatorConfig` separately from `signRunManifest`; trust policy grants no signing capability. Full outer verification needs only the external trusted configuration, reconstructs canonical inputs, and reverifies main and stop V4 receipts. The helper-generated key pair is ephemeral. | Production validator provisioning, custody, rotation, revocation, trust publication, and fleet verification. |
| Atomic admission | Persistence selects action and post-world state only from a reverified V4 receipt. Target mismatch and missing or malformed state hashes burn once and deny. | Full production policy receipts, multi-process CAS, and distributed locking. |
| Persistent invariants | State validation binds authorization consumption, outbox entries, ledger hashes/root, denied-action non-mutation, and terminal world state. | Production storage, concurrency, retention, and fleet validation. |
| Self-integrity | V4 seals source, ledgers, terminal commitment, and seven canonical fields; the outer self-hash detects artifact mutation. | External trust requires the full verifier and trusted configuration; self-hash alone is not authenticity. |
| File-state fault boundary | A fresh Node process rereads the validated state. Process-level exceptions immediately before/after rename expose the old or complete file state. | Process-crash durability testing, multi-process recovery, and fleet durability. |
| Emergency stop | `.holo` declares reason/target; the hashed request matches the signed stop plan and bounded `.hsplus` invocation before `freeze_run` seals a safety receipt. | Native `.holo` lifecycle/cross-composition dispatch and production resume policy. |
| Observer consumer | One sealed four-object V4 receipt has equal pre/post canonical payload and seven-field hashes; the HoloLand browser withholds then digest-acknowledges the same source-bound read-only projection with zero host authoritative mutation. | Full twelve-object lifecycle execution, adapter-permutation/post-inference equivalence, and production observer deployment profiles. |
| Challenge and metric inputs | Three challenge definitions and one metric specification are frozen and hashed. | Phase 1 operational admission, execution, custody, and overall go decision. |

The bridge is evidence for HoloScript-authored behavior executed through named
bounded engines. It is not a substitute for the remaining native, live, and
production closure gates.

## Phase gates

### Phase 0A - source-contract pilot

Completed as the source-contract foundation: parse three formats plus the
source-bound observer composition, materialize the world, verify canonical
scene/pose replay, execute the original bounded captured fixture, and emit a
claim-bound capability receipt.

### Phase 0B - deterministic engineering tracer

Observed for the bounded bridge described above. The two-resident synthetic
captured-response tracer, fresh replay, separated public trust-policy and
fixture-signing inputs, reverified-V4 atomic admission, fresh-process reread,
process-level rename-fault drills, and bounded emergency-stop dispatch pass with
zero provider calls. The single-receipt observer and browser consumer sandwich
also pass for this bounded scope. This is not a live model run, full
twelve-object or native lifecycle proof, production trust or durability claim,
process-crash test, or scientific result.

### Phase 1 - small live pilot

Blocked. The challenge and metric inputs are frozen, but Phase 1 still requires
the six-resident lifecycle, locked live adapters and provider receipts, sealed
response custody, production isolation and ceilings, native lifecycle/stop
binding, production validator provisioning/custody, process-crash durability,
multi-process/CAS and fleet durability, and an explicit operational go decision.
If admitted later, run the twelve-village matrix only for mechanism
discovery, a rough variance signal, contamination analysis, and
confirmatory-study design.

### Phase 2 - preregistered study

Freeze hypotheses, sample size, exclusions, metrics, model revisions, analysis
code, and stop rules before execution.

## Relationship to earlier village work

The untracked `experiments/emergence-sim/` Ashenmoor draft remains valuable
worldbuilding and persona material. It is not the canonical runtime contract:
its free-text baseline and phase runner are unfinished, and its current
`.holo` and `.hsplus` files do not parse with the active language surface.

The bounded tracer no longer blocks content-porting work, but Ashenmoor remains
outside the canonical experiment until it passes the applicable Phase 1
admission gates. Its atmosphere and personas are content; the contracts in this
spec are the experiment.
