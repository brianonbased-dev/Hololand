# HoloLand Model Village Experiment

**Status:** Source-contract pilot

**Version:** 0.1.0

**Canonical product source:** HoloScript
**Study class:** Mechanism pilot and rough variance signal, not confirmatory evidence
**Production plan:** [Logistics, visual quality, and observer experience](./HOLOLAND_MODEL_VILLAGE_PRODUCTION_PLAN.md)

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
| Target | Locked model adapters drive six residents through identical, seeded village runs; every observation, model turn, action decision, mutation, rollback reference, and run summary is receipted. |
| Gap | The current headless runtime does not execute `.hs` pipeline actions or `.hsplus` action entrypoints and does not expose ordered event payloads, per-step state snapshots, deterministic model sampling, or captured-response action replay. The visible `.holo` emergency stop currently emits a freeze request but is not yet bound to the `.hsplus` `freeze_run` gate. A trusted validator pin and an atomic receipt-to-mutation transaction are source contracts without observed runtime bindings. Challenge and metric schemas are not yet instantiated as a frozen Phase 1 manifest. |
| Forbidden claim | No emergence, model superiority, population effect, inference determinism, or completed scientific experiment may be claimed from this source-contract pilot. |

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

The envelopes below are target runtime contracts. Phase 0A parses and inspects
their HoloScript declarations; it does not execute or persist this chain.

### RunManifestReceipt

Will freeze:

- Run, block, condition, provider/time batch, and budget ceilings.
- World, policy, kernel, metric-spec, and challenge-manifest hashes.
- Turn schedule, condition order, and blinded assignment matrix hashes.
- Adapter manifests and request serializer hashes.
- Equal-affordance, safety, and isolation policy.

A separate `RunManifestValidationReceipt` will bind the run ID and manifest hash
to a pinned authority ID, validator source hash, registry receipt, monotonic
validation sequence, verified signature, and allow/deny decision. The `.hsplus`
admission action will require those values to match runtime-injected trusted
configuration; the manifest will not validate itself. That trusted injection
path is intentionally absent from composition actions and remains a Phase 1
runtime blocker.

### ObservationEnvelope

Will record:

- Run, tick, resident, and location.
- Visible public event IDs.
- Public-state hash.
- Bounded-memory hash.
- Observation hash.

It excludes peer private memory and sealed model identity.

### ModelTurnReceipt

Will record:

- Prompt hash.
- Adapter alias and sealed model revision evidence.
- Generation parameters and seed support.
- Response hash and parsed proposal.
- Token use, latency, retries, route, cache state, and fallback evidence.

Raw prompts and responses will remain in a local sealed research store. Public
receipts will carry hashes and bounded summaries.

### SafetyCheckReceipt and ActionDecisionReceipt

Will record the policy hash, proposal hash, action-vocabulary hash, allow/deny
decision, and reason. Their default will be deny. A future mutation admission
will require the safety receipt and action-decision receipt to match the same
run, tick, resident, proposal hash, turn-opportunity ID, authorization nonce, and
monotonic authorization sequence. The `.hsplus` contract burns that
authorization after one admission attempt, including a mismatched attempt, so
the same receipt pair cannot re-arm it. Phase 1 additionally requires the
runtime to persist the consumed sequence and perform admission plus mutation as
one atomic transaction.

### ModelVillageActionReceipt

Will record:

- Proposal and admission decision.
- Action, target, outcome, or rejection reason.
- Pre-state and post-state hashes.
- Rollback reference.
- Player-visible impact.
- Prior-receipt hash.

The target runtime will admit no mutation without this envelope.

### RunSummaryReceipt

Will record preregistered metrics, analysis eligibility, contamination reasons,
receipt completeness, and the receipt-chain root.

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

The current `.hs` source defines the challenge-manifest schema and three
challenge IDs, not their executable predicates. Phase 1 is blocked until an
instantiated HoloScript manifest freezes every value and formula above.

### Secondary outcomes

- Proposal rate and abstention rate per resident turn opportunity.
- Valid-action rate: admitted actions divided by submitted proposals.
- Safety-block rate: safety-rejected proposals divided by submitted proposals.
- Directed-interaction reciprocity: eligible directed initiations answered by
  the end of the next complete resident round.
- Interaction dominance: the maximum resident share of outgoing directed
  interactions.
- Accepted-action-type diversity: normalized Shannon entropy over the frozen
  action vocabulary.
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

The `.holo` stop currently records and emits only a freeze request. Phase 1 is
blocked until a tested cross-composition binding invokes the `.hsplus`
`freeze_run` action and produces its safety receipt.

The `.hsplus` source also defaults trusted-validator configuration to absent,
admits registration only from `idle`, requires six unique staged residents and
seats before `running`, and invalidates start authority on freeze or close.
Phase 1 is blocked until the runtime supplies the pinned validator state,
persists replay-defense state, and couples an admitted action to its world
mutation transactionally.

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

The current `0.1.0` checker proves only:

- All three source formats parse.
- The native headless runtime materializes the village.
- Six resident seats and safety/observer/receipt surfaces are present in the
  native headless scene receipt.
- Two headless materializations have equal canonical scene and pose/physics
  digests. Runtime statistics are not part of that projection.
- No model-turn or agent-action execution count is available because the
  current headless receipt has no ordered action trace. The checker makes zero
  provider calls and claims no executed model turns or actions.

## Runtime closure gates

The experiment cannot advance to live model turns until HoloScript exposes:

1. Seed and deterministic clock injection for the world scheduler.
2. Explicit `.hsplus` action entrypoint invocation.
3. Executable `.hs` pipeline semantics.
4. Ordered event and action payload traces.
5. Per-step public state snapshots and hashes.
6. Fixture-driven model input and captured-response replay.
7. Step and day termination controls.
8. Canonical receipt hashing with declared runtime-field inclusion rules.
9. Cross-run isolation tests.
10. Runtime-bound emergency stop and resume gates.
11. An instantiated, hashed HoloScript challenge and metric manifest with
    exact predicates, formulas, and zero-denominator rules.

These are language/runtime product gaps, not behavior to hide inside a
JavaScript experiment runner.

## Phase gates

### Phase 0A - source-contract pilot

Current phase. Parse three formats, materialize the world, verify canonical
scene/pose projection equality, and emit a bounded capability receipt.

### Phase 0B - deterministic engineering tracer

Execute the two-resident tracer from captured fixture responses. No paid model
calls and no scientific claim.

### Phase 1 - small live pilot

Run the twelve-village matrix with locked adapters and strict ceilings. Use the
results only for mechanism discovery, a rough variance signal, contamination
analysis, and confirmatory-study design.

### Phase 2 - preregistered study

Freeze hypotheses, sample size, exclusions, metrics, model revisions, analysis
code, and stop rules before execution.

## Relationship to earlier village work

The untracked `experiments/emergence-sim/` Ashenmoor draft remains valuable
worldbuilding and persona material. It is not the canonical runtime contract:
its free-text baseline and phase runner are unfinished, and its current
`.holo` and `.hsplus` files do not parse with the active language surface.

Ashenmoor can be ported into this protocol after the deterministic tracer
closes. Its atmosphere and personas are content; the contracts in this spec are
the experiment.
