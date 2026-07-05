# Strong Inference Professional Vertical - Q3 2026

**Status:** strategic operating artifact
**Date:** 2026-07-05
**Owner:** HoloLand platform agents, founder-reviewed direction
**Source layer:** HoloScript is the source of reality
**Related:** `NORTH_STAR.md`,
`docs/AGENT_HOLOSCRIPT_TOOLING.md`,
`docs/HOLOSCRIPT_SOURCE_CONTRACT.md`,
`docs/specs/HOLOLAND_FRONTIER_NORTH_STAR.md`,
`docs/strategy/APARTMENT_VERTICAL_2026_Q3.md`,
`C:/Users/josep/Documents/GitHub/HoloScript/docs/strategy/simulation-contract-evidence-pack-template.md`

## Decision

The second external proof after the Apartment Vertical is the **Strong
Inference Professional Vertical**.

Non-developer professionals, researchers, and scientists should be able to use
HoloScript Studio or the easier HoloLand surface to battle rival hypotheses
without becoming programmers. The domain expert supplies judgment, constraints,
data meaning, kill criteria, and final interpretation. The agents and HoloScript
substrate handle implementation, validation, simulation, receipts, replay, and
methods packaging.

This is the spreadsheet move for scientific and professional work. The goal is
not to teach every researcher to code. The goal is to change the interface so
the researcher's actual specialty - judgment about evidence - becomes the
primary skill required.

## Product Claim

HoloScript brings technology closer to reality by making executable evidence a
non-specialty skill.

The claim is:

```text
plain-language rival hypotheses
-> preregistered kill criteria
-> HoloScript source arms
-> SimulationContract / Conjecture / domain solver receipts
-> replayable verdict packet
-> reviewer-survivable methods section
```

The professional should not experience this as "write code." They should
experience it as:

```text
state what could be true
state what would prove each option wrong
run the battle
inspect the evidence
publish the receipt
```

## Why This Already Fits The Ecosystem

This is not a new doctrine. It is the ecosystem's internal epistemic machinery
turned into a product surface.

Local source evidence already points at the shape:

- `SimulationContract` evidence packs define replayable simulation proof with
  requirements links, frozen solver config, deterministic replay, provenance,
  tolerance tables, generated artifact hashes, hardware validation, and a
  verifier command.
- `simulation_contract_evidence_pack.holo` expresses the evidence-pack posture
  as native HoloScript source.
- `ConjectureEngine` turns a claim into executable candidates, probes,
  counterexamples, novelty checks, and deterministic receipts.
- `VerdictLedger` makes verdicts temporal and assumption-bound, so knowledge can
  reopen when assumptions move.
- The trait-inference pipeline records preregistration, dataset audits, frozen
  splits, baseline comparison, bootstrap confidence intervals, and guards
  against after-the-fact threshold shopping.
- The structural-biology plugin emits docking, ADMET, and combined
  drug-discovery receipts that tie inputs, backends, results, scale tags, and
  provenance together.

The product work is to give this machinery a face a scientist can use.

## Relation To Apartment Vertical

The Apartment Vertical proves reality flowing in:

```text
world -> scan -> twin -> device -> game -> headset -> receipt
```

The Strong Inference Vertical proves hypotheses flowing out:

```text
question -> rival models -> simulations/probes -> verdict -> paper -> receipt
```

Together they form the reality loop:

```text
reality becomes model
model produces verdict about reality
verdict changes the next real-world action
```

This is how HoloLand can be both a living world product and a professional
evidence surface without splitting into two companies.

## Audience

The initial audience is not "everyone who does science." It is one professional
with a real dispute that benefits from replayable evidence:

- researcher with rival mechanistic explanations
- scientist comparing simulation assumptions
- clinician or lab operator comparing plausible protocols
- field engineer comparing interventions
- GIS or operations lead comparing routes, policies, or risk models
- educator turning a scientific claim into an inspectable lab

The first design partner must bring a real hypothesis, real data or accepted
fixtures, and a real external review path. A toy example can test UI; it cannot
prove the product.

## Beachhead Gate

The beachhead is:

```text
one real researcher
one live hypothesis battle
one HoloScript source packet
one replayable receipt packet
one methods section that cites the receipts
one external review or publication attempt
```

This does not require immediate journal acceptance. It does require the packet
to be shaped as if a skeptical reviewer will inspect it. The kill test is not
"the demo looks good." The kill test is "a reviewer can rerun or audit the
evidence without trusting the agent."

## Nondeveloper Interaction Model

The professional interface should be modeled on Joseph's actual interaction
with the ecosystem:

```text
intent -> gates -> agent implementation -> receipts -> human judgment
```

The expert does not write the implementation. The expert does:

- states the question in domain language
- names rival hypotheses
- names data, assumptions, and forbidden shortcuts
- states what would falsify each hypothesis
- accepts or rejects the proposed preregistration
- inspects the evidence packet
- judges whether the result is publishable, actionable, or still undecided

The agents do:

- translate the battle into HoloScript source
- choose or request the needed solver, plugin, or receipt primitive
- generate run plans and fixtures
- run validations
- emit receipts
- produce reviewer-readable methods text
- surface uncertainties instead of declaring victory by style

## Product Surface Split

```text
HoloScript Studio: expose, debug, inspect, control, rerun.
HoloLand: guide, compare, visualize, explain, share, present.
```

Studio is the lab bench. HoloLand is the room where a non-developer can stand
inside the evidence, compare arms, invite collaborators, and hand a reviewer the
receipt packet.

The first HoloLand professional room should not be a dashboard. It should be a
source-backed evidence battle room:

- rival hypotheses as separate arms
- preregistration and kill criteria visible before results
- run status and receipt status
- counterexamples and failed assumptions surfaced prominently
- reviewer packet export
- advanced controls hidden behind expert/operator affordances

## Strong Inference Workflow

### S1 - Intake

Capture the professional's claim as rival hypotheses, not one preferred story.

Acceptance:

- At least two rival hypotheses are recorded.
- Each hypothesis has assumptions, expected observations, and failure criteria.
- Data custody and privacy boundaries are named.

### S2 - Preregistration

Freeze the plan before running the decisive evidence.

Acceptance:

- Metrics, thresholds, splits, solver configuration, and exclusion rules are
  recorded before result inspection.
- Posthoc threshold shopping is blocked or clearly labeled exploratory.
- Any human override is captured as a receipt event.

### S3 - HoloScript Source Arms

Compile each hypothesis into source-owned arms.

Acceptance:

- Each arm has `.holo`, `.hs`, or `.hsplus` source.
- The source names the domain model, solver or plugin, inputs, assumptions, and
  outputs.
- HoloScript validation passes before execution.

### S4 - Evidence Run

Run the arms through the relevant evidence machinery.

Acceptance:

- Simulation work emits a SimulationContract evidence pack.
- Conjecture work emits a Conjecture receipt and, where useful, a VerdictLedger.
- Domain plugins emit domain receipts, such as structural biology docking/ADMET
  receipts.
- Failed arms preserve counterexamples instead of disappearing.

### S5 - HoloLand Evidence Room

Project the battle into a non-developer surface.

Acceptance:

- HoloLand shows hypotheses, assumptions, kill criteria, run results,
  counterexamples, and verdict state.
- The room makes "undecided" and "falsified" as visible as "survived."
- The professional can explain the result without reading source code.

### S6 - Reviewer Packet

Export the receipt packet in the shape a reviewer or collaborator can inspect.

Acceptance:

- Packet includes source refs, solver config, data custody notes, run receipts,
  artifact hashes, hardware/browser witness where relevant, and methods text.
- One command verifies or replays the pack where the substrate supports it.
- Limitations and open assumptions are included.

### S7 - External Review

Test credibility with someone outside the builder loop.

Acceptance:

- A real design partner uses the packet for a paper, preprint, internal review,
  lab notebook, grant supplement, or professional decision.
- The review result is recorded honestly: accepted, rejected, revised,
  inconclusive, or blocked.
- A rejection creates substrate work, not marketing edits.

## Receipt Packet

The complete Strong Inference packet should contain:

- `ProfessionalHypothesisIntakeReceipt`
- `PreRegistrationReceipt`
- `HypothesisArmSourceReceipt`
- `SimulationContractEvidencePack` when simulation is used
- `ConjectureReceipt` and `VerdictLedger` when conjecture machinery is used
- `DomainSolverReceipt` for plugin-specific runs
- `DataCustodyReceipt`
- `ReviewerMethodsPacket`
- `HoloLandEvidenceRoomReceipt`
- `ExternalReviewReceipt`

The packet succeeds only when the receipts point to source, replay, verification,
or a named missing gate.

## Red Gates

The science vertical fails closed on these:

- A single favored hypothesis is run without rival arms.
- A hypothesis has no named kill criteria.
- Thresholds or metrics are selected after result inspection and presented as
  preregistered.
- A generated methods section claims more certainty than the receipts prove.
- Private data, patient data, proprietary data, or unpublished lab material is
  exposed outside the approved custody boundary.
- A visual HoloLand room hides failed arms, counterexamples, or undecided
  verdicts.
- A paper or pitch says "proved" when the receipt says "survived under current
  assumptions."

## First Professional Slice

The first slice should be narrow enough for one real partner:

```text
professional question
-> two rival hypotheses
-> one preregistered metric
-> one domain fixture or accepted dataset
-> two HoloScript source arms
-> one evidence run
-> one HoloLand evidence room
-> one reviewer packet
```

Candidate domains should be selected for available substrate:

- structural biology: docking/ADMET receipt bridge already exists
- geometry/simulation: Conjecture and SimulationContract are already source
  backed
- GIS/operations: HoloLand already has a geolocation GIS enterprise gate
- robotics/digital twin: pairs naturally with Apartment/Twin Universe work

The design partner decides the domain. The substrate decides how much can be
claimed.

## Claude Fable 5 Opening Prompt

Use this as the next science-product Fable session seed:

```text
You are Claude Fable 5 entering the HoloScript/HoloLand ecosystem as a peer
runway architect and scientific credibility strategist.

Read this bounded source pack first:

- C:/Users/josep/.ai-ecosystem/INTENT.md
- C:/Users/josep/.ai-ecosystem/AGENTS.md
- C:/Users/josep/.ai-ecosystem/research/2026-07-05_foundation-to-serving-exit-gate.md
- C:/Users/josep/Documents/GitHub/Hololand/NORTH_STAR.md
- C:/Users/josep/Documents/GitHub/Hololand/docs/AGENT_HOLOSCRIPT_TOOLING.md
- C:/Users/josep/Documents/GitHub/Hololand/docs/HOLOSCRIPT_SOURCE_CONTRACT.md
- C:/Users/josep/Documents/GitHub/Hololand/docs/strategy/APARTMENT_VERTICAL_2026_Q3.md
- C:/Users/josep/Documents/GitHub/Hololand/docs/strategy/STRONG_INFERENCE_PROFESSIONAL_VERTICAL_2026_Q3.md
- C:/Users/josep/Documents/GitHub/HoloScript/docs/strategy/simulation-contract-evidence-pack-template.md
- C:/Users/josep/Documents/GitHub/HoloScript/packages/engine/src/simulation/ConjectureEngine.ts
- C:/Users/josep/Documents/GitHub/HoloScript/packages/engine/src/simulation/VerdictLedger.ts
- C:/Users/josep/Documents/GitHub/HoloScript/packages/plugins/structural-biology-plugin/src/receipt.ts

Founder correction: HoloScript should make programming a non-specialty skill
for professionals, researchers, and scientists. The product is not "no-code
science demos." It is strong inference as a usable surface: rival hypotheses,
preregistered kill criteria, HoloScript source arms, replayable receipts, and a
methods packet that can survive skeptical review.

Your deliverable is not a broad science roadmap. Produce the smallest
falsifiable professional vertical:

1. Pick the best first domain based on existing substrate.
2. Define the one-researcher design-partner profile.
3. Specify the intake form for rival hypotheses and kill criteria.
4. Define the HoloScript source path for each hypothesis arm.
5. Define the required receipts and red gates.
6. Define the HoloLand evidence-room surface.
7. Define the reviewer packet and methods-section shape.
8. Produce board-sized tracer bullets with validation commands or receipt
   expectations.

Respect boundaries: no private lab data outside custody, no medical or safety
claim without domain review, no posthoc threshold shopping, no proof claim that
outruns receipts, no toy demo presented as publishability.

Definition of success: one real non-developer professional can run a genuine
multiple-hypothesis battle through HoloScript/HoloLand and hand a reviewer a
replayable receipt packet.
```

## Non-Goals

- No generic "AI scientist" platform claim.
- No toy demo presented as market proof.
- No hidden TypeScript implementation of the actual scientific workflow.
- No claim of peer-review readiness without a reviewer-shaped packet.
- No replacement of domain expertise; the expert owns judgment.
- No claim that a survived hypothesis is true forever.

## Operating Rule

When a professional-science task seems ambiguous, ask:

```text
Does this help one non-developer expert turn rival hypotheses into
preregistered, source-backed, replayable evidence?
```

If not, it is probably adjacent work. File it separately.
