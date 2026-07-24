# HoloLand Model Village Production Plan

**Status:** Experience vision and execution plan

**Version:** 0.1.0

**Date:** 2026-07-24

**Canonical experiment contract:** [HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md](./HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md)

**Product source:** HoloScript

## Vision

> **Target, not current capability:** Model Village should feel like a living
> frontier observatory: six residents inhabit a beautiful settlement, face a
> shared problem, and leave an inspectable trail from proposal to consequence.
> HoloScript should be visible as the medium that builds the world, governs the
> residents, and proves what happened.

The desired experience is not a research dashboard placed behind six markers.
It is a village worth watching, with the rigor of an instrument and the presence
of a small living world.

This document intentionally uses vivid target language in this section. The
evidence register below separates that vision from what is observed now.

## Production decision

Keep the validated twelve-object composition as the **canonical experimental
substrate**. Do not turn that file into the cinematic showcase.

Build visual richness as a second, HoloScript-authored, read-only
**observer projection**. It may consume canonical object identities, public
state, ordered receipts, and sealed replay data. It may not:

- Write world state.
- Change clocks, scheduling, actions, prompts, or mutations.
- Enter any resident observation.
- Reveal model or condition identity before the protocol permits unblinding.
- Animate an action, consequence, or freeze before the corresponding receipt
  exists.
- infer a causal event that the canonical receipt stream does not contain.

The proposed observer source is:

`source/layers/vr/frontier/model-village/model-village-observer-projection.holo`

The exact import or projection mechanism must be validated against the active
HoloScript parser and runtime before implementation. This plan does not invent
syntax for it.

```text
.holo world truth + .hsplus policy + .hs trial kernel
                         |
                  canonical runtime
                         |
              ordered, hashed receipt stream
                    /                 \
     resident observation          observer projection
     canonical and hashed          read-only HoloScript
                    \                 /
                     no feedback edge
```

The existing HoloLand visual-projection-sandwich pattern is the architectural
precedent: HoloLand can add presentation responsibilities while declaring that
source semantics were not rewritten and while emitting browser and interaction
receipts.

## Evidence register

| Register | 2026-07-24 statement |
|---|---|
| Observed | The canonical three-format pilot parses, materializes twelve objects, and reproduces its canonical scene and pose/physics projections in two native headless runs. |
| Observed | A 1600 x 900 HoloScript screenshot was captured from the canonical `.holo` source. |
| Observed | The local hardware baseline reports an RTX 3060 Laptop GPU with 6 GB VRAM, 32 GB system memory, Node 24, and installed Chrome/Edge browsers. |
| Gap | The scene is visually an instrument diagram: small in frame, sparse, primitive, flatly lit, and affected by label and panel collisions. |
| Gap | `.hsplus` actions, `.hs` pipeline actions, live model turns, state mutations, captured-response replay, and the emergency-stop binding are not yet executed by the current headless path. |
| Unknown | Browser WebGPU, headset performance, sustained frame timing, mobile rendering, and final visual quality have not been measured. |
| Target | A premium browser, desktop, and XR living-observatory experience whose spectacle is HoloScript-authored, receipt-backed, and unable to contaminate the study. |

### Durable visual before-state

![Model Village visual before-state](../assets/model-village/model-village-visual-baseline-2026-07-24.png)

- Source:
  `source/layers/vr/frontier/model-village/model-village.holo`
- Capture: HoloScript CLI headless screenshot, 1600 x 900, 2500 ms wait.
- SHA-256:
  `f7e89e46b5819f4e88be9f20ab18a6f580852b77de3da37a62d34cd79c58642a`
- Interpretation: this is a reproducible before-state, not evidence of the
  target look.

The image shows six resident markers around a flat Commons, three rear
instrument panels, an isolation line, and an emergency stop. The village is too
small in the frame, resident silhouettes are not distinctive, labels overlap,
the panels compete with residents, and the environment lacks architecture,
terrain, depth, lighting hierarchy, and a hero landmark.

## Experience thesis: the Living Observatory

The art direction target is a **Bioluminescent Frontier Observatory**:

- A compact settlement grown from dark basalt, weathered timber, brushed metal,
  and translucent stormglass.
- A warm central **Receipt Loom** makes the Commons the visual heart. Verified
  events become woven light and crystalline receipt tokens.
- A cool indigo and teal landscape, distant ridge, restrained fog, and moon
  rim-light give the settlement depth and scale.
- Warm windows and the Commons communicate life without turning the world into
  generic neon.
- The observer occupies a raised stone-and-glass mezzanine outside the
  experiment boundary. Research UI belongs there, not behind resident heads.
- Red is reserved for actual emergency, denial, and freeze states.

This is a visual target. Materials, light values, effects, and geometry budgets
remain provisional until a closed screenshot and frame-profile loop proves
them.

### Composition

The default desktop shot should be an elevated three-quarter view at a
provisional 40-50 degree field of view.

- The village occupies 55-75% of viewport width and 50-70% of height at
  1600 x 900.
- The Receipt Loom sits near the lower-center third.
- Foreground: observer rail, grasses, or stormglass frame.
- Midground: residents, pathways, challenge object, and Commons.
- Background: institutions, ridge, one landmark, and sky.
- A locked comparison camera provides reproducible screenshots.
- Optional inspection orbit must not replace the locked evidence camera.
- XR uses a stationary human-height observer position, teleport, and snap turn;
  it has no forced camera move.

### Residents

The six residents need to read as inhabitants, not colored data points.

- Use a shared procedural kit with head, torso, shoulders, hands, and one fixed
  seat glyph.
- Distinguish persona/seat through silhouette, number or icon, and restrained
  accent color together.
- Keep each persona's appearance identical in every condition.
- Never encode adapter assignment, model family, provider, performance, or
  outcome in color, silhouette, label, animation, or sound.
- Provide neutral idle, listening, and proposal gestures.
- A gesture may imply an admitted action only after its receipt exists.
- Use shared materials, atlases, instancing, and three levels of detail.

Provisional resident budgets:

| Level | Target |
|---|---:|
| Desktop LOD0 | At most 30,000 triangles per resident |
| Mid LOD1 | At most 12,000 triangles per resident |
| XR/far LOD2 | At most 4,000 triangles per resident |

### Lighting and materials

Initial look-development targets:

- Ambient intensity around 0.25-0.35 instead of the current 0.76.
- One cool directional moon key with soft shadows.
- One warm central fill associated with the Receipt Loom.
- Limited emissive window lights with baked or faked contribution.
- Distance fog and a blue-black horizon gradient.
- ACES tone mapping.
- Restrained bloom on receipts and the Loom, not across the whole image.
- Rough basalt, matte timber, brushed metal, and stormglass.
- Minimal stacked transparency in XR.

These values are hypotheses for the next screenshot, not accepted settings.

## Three presentation modes

| Mode | Purpose | Authority |
|---|---|---|
| Research | Operate and inspect a live or fixture run with unambiguous state, safety, and chain health. | Read-only observer authority; no cinematic pacing. |
| Showcase | Present the village, current challenge, and receipt-backed consequences with minimal UI. | Read-only; may hide detail but may not invent it. |
| Exhibit replay | Compare sealed villages, scrub divergence, and explain receipts after closure. | Captured-response and receipt playback only; never fresh inference. |

The observer projection should declare, for every visual element:

- Whether residents can see it.
- Whether it requires a receipt.
- Whether it may affect the world or clock.
- At what protocol stage it may reveal a condition.
- Which receipt or canonical public-state field it represents.

The projection must fail dark or show **unverified** when its evidence is absent.

## Observer journey

The repeatable observer loop is:

```text
notice a public problem
-> predict how residents will coordinate
-> witness admitted and blocked actions
-> inspect causal receipts
-> compare villages
-> replay the first divergence
-> form the next hypothesis
```

### First 30 seconds

- **0-5 seconds:** arrive at the observer deck with all six residents, the
  Commons, and the challenge landmark readable in one frame.
- **5-10 seconds:** HoloScript Genesis assembles and seals the run.
- **10-18 seconds:** six stable persona silhouettes activate with no model or
  condition identity.
- **18-30 seconds:** a public challenge changes the canonical world, followed
  by one receipt-backed proposal, admitted action, or blocked action.

A new observer should understand: six residents, one shared problem, an
isolated experiment, and inspectable evidence.

### By one minute

The observer has seen:

- One admitted or blocked decision.
- One real public consequence.
- The link between action, receipt, and state change.
- A way to focus a resident, challenge, or receipt without entering the
  experiment.

### By ten minutes

Use an 8-10 minute post-run replay cut. Do not impose cinematic pacing on the
live treatment.

- Compress quiet periods only after closure.
- Visit all three challenge windows.
- Seal the final chain.
- Compare the four conditions for one seed.
- Jump to the first divergence.
- Invite comparison with another seed.

## Signature moments

| Moment | Target experience | Integrity boundary | Required proof |
|---|---|---|---|
| HoloScript Genesis | Before the run, source glyphs resolve into terrain, institutions, six seats, and a visible manifest seal. | Ends before resident observations begin. | Source and manifest hashes plus a projection event receipt. |
| The Village Needs Something | A cistern drains, bridge fractures, or harvest lattice destabilizes so the frozen challenge is visually legible. | Canonical public state, identical for every resident and included in its hash. | Challenge-state transition and equal observation projection. |
| Receipt Constellation | An admitted action weaves a light path from resident to target; a denied external action stops at the isolation boundary. | Observer-only, adapter-neutral, emitted after the receipt. | Displayed receipt ID, prior hash, action status, and pre/post-state evidence. |
| Consequence Crescendo | Cooperation restores water, reconnects a bridge, or balances a harvest system. | Deterministic rendering of actual state; never an “emergence detected” effect. | Canonical state transition and challenge predicate receipt. |
| Four-Village Fold | Four miniature villages unfold after closure and replay the same seed across mixed and homogeneous conditions. | Sealed captured-response replay; identities remain blinded until the reveal stage. | Equal replay root, first-divergence index, and comparison receipt. |

An optional **Freeze Lattice** may drain color, close the isolation field, and
crystallize the last valid receipt. It is forbidden until the real `.hsplus`
freeze transition and emergency-stop binding are observed.

## Research and visual integrity gates

The projection cannot be promoted until:

1. Projection on/off produces identical canonical scene, pose, clock, public
   state, and resident `ObservationEnvelope` hashes.
2. Adapter permutations produce no identity metadata, color, silhouette,
   label, animation, or audio leakage.
3. Every displayed action and consequence resolves to a canonical receipt.
4. Observer input has no path to model prompts, clocks, actions, or world
   mutations.
5. Visual workload cannot change logical scheduling.
6. Comparison labels remain blinded until integrity dispositions are frozen.
7. Cinematic time compression exists only in sealed replay.
8. Toggling quality profiles leaves experiment hashes unchanged.

The safest first public presentation is a post-run, receipt-driven replay. Live
spectating can follow after the no-feedback boundary is machine-proven.

## Operational scale

The frozen Phase 1 design implies:

| Quantity | Count |
|---|---:|
| Seed blocks | 3 |
| Conditions per block | 4 |
| Village-runs | 12 |
| Residents per run | 6 |
| Turns per run | 6 |
| Proposal/model-call opportunities per run | 36 |
| Live model-call opportunities, zero retries | 432 |
| Opportunities per adapter across the study | 144 |
| Predefined challenge windows | 36 |
| Paid calls during captured-response replay | 0 |

Phase 1 should set retries to zero. A transport failure contaminates the run;
it must not create treatment-dependent retry behavior. A replacement, when the
frozen rule permits it, receives a new run ID and belongs to a separate
replacement batch.

## Crew

| Role | Responsibility |
|---|---|
| Protocol lead | Freezes study hashes, order, exclusions, stop rules, and authorizes later unblinding. |
| Run conductor | Creates clean shards, reserves resources, stages six seats, and executes the lifecycle. |
| Safety controller | Independently owns freeze and incident declaration. |
| Data custodian | Controls sealed prompts/responses, receipt verification, backups, access logs, and the unblinding key. |
| Visual operator | Operates the read-only observer projection or sealed replay. |
| Look-development and hardware QA | Owns screenshots, accessibility checks, quality profiles, and device receipts. |

One person may cover protocol lead and data custodian. One person may cover
visual operation and look-development QA. Do not combine run conductor and
safety controller during a live pilot. Unblinding should require both protocol
lead and data custodian.

## Production calendar

| Time | Gate |
|---|---|
| T-14 | Close runtime bindings: trusted validator, atomic mutation admission, ordered traces, snapshots, replay, and stop binding. |
| T-10 | Pass three consecutive two-resident fixture tracers plus isolation and stop drills. |
| T-7 | Complete a full twelve-run dress rehearsal using captured responses and zero provider calls. |
| T-3 | Certify adapters; freeze study manifests, run order, serializers, quotas, price snapshot, ceilings, and retention policy. |
| T-1 | Rehearse credentials, storage, hardware, emergency control, and observer projection without study calls. |
| Days 1-3 | Execute one four-condition seed block per day in the frozen order and same UTC window. |
| Day 4 | Run sealed replay, receipt verification, and integrity dispositions without reviewing outcomes. |
| Day 5 | Freeze eligibility and missingness decisions, then unblind and analyze. |

The order already encoded in the `.hs` trial kernel is:

| Day/block | Frozen condition order |
|---|---|
| 1 | mixed -> A-only -> B-only -> C-only |
| 2 | B-only -> C-only -> mixed -> A-only |
| 3 | C-only -> B-only -> A-only -> mixed |

Each four-run block creates 48 call opportunities per adapter. Running one seed
block per day makes provider/time batch an explicit block rather than an
untracked nuisance.

### Run slot

Derive the slot from measured tracer p95 values:

```text
run slot =
  clone and reset
  + 6 x (locked round timeout + adjudication and mutation budget)
  + chain close and verification
  + captured-response replay
```

Do not shorten a slot because one condition finishes early.

Within a turn, all residents receive the same frozen public snapshot. Model
calls may execute concurrently only if the concurrency and timeout policy is
frozen and the proposal barrier closes before any admission or mutation. This
is a target runtime behavior and must be proven in the engineering tracer.

## Run-day lifecycle

For each village:

1. Verify source, policy, kernel, challenge, metric, serializer, assignment,
   order, and adapter hashes.
2. Verify exact provider revision or local model file, quota, allowlisted
   adapter egress, and sealed-store health.
3. Reserve the complete worst-case run budget.
4. Validate and seal only the next run manifest.
5. Clone a clean shard and prove that no cross-run state is present.
6. Stage six unique resident and seat IDs.
7. Execute with no manual prompt edits, provider fallback, or hidden prompt
   enhancement.
8. Close the run and verify receipt completeness and chain root.
9. Replay captured responses in a fresh isolated clone.
10. Copy encrypted custody data, verify checksums, and tear down the shard.
11. Decide integrity disposition while outcomes and model identities remain
    blinded.

A sealed run is never resumed in place. Preserve it as complete, frozen, or
contaminated. Any permitted replacement gets a new ID.

### Stop and contamination rules

Immediately freeze the current run for:

- Isolation or emergency-stop failure.
- Unauthorized mutation.
- Missing or broken receipt chain.
- Source, serializer, model, or configuration hash drift.
- Cost, token, timeout, or quota ceiling breach.
- Provider fallback, revision drift, route drift, or hidden prompt augmentation.
- Observer/showcase data entering a resident observation.

For a systemic incident, preserve the current run, keep remaining drafts
unsealed, requalify the runtime and adapters, and issue a new provider/time
batch ID. Never delete or silently retry contaminated evidence.

## Cost, quota, and storage controls

Pin and hash the price schedule used for the reservation. Do not hardcode a
currency estimate in this plan while model selections remain masked.

```text
maximum turn cost =
  input-token ceiling x input unit price
  + output-token ceiling x output unit price

run reservation =
  sum(maximum turn cost across its 36 opportunities)

study ceiling =
  sum(all 12 run reservations)
  + explicit replacement reserve
```

- Reserve the full worst-case run cost and quota before sealing.
- Warn at 70% and 85% of the active ceiling.
- Deny a new run before the study ceiling can be crossed.
- Record cost, tokens, and latency as diagnostics, not behavioral outcomes.
- Capture secrets only in the adapter's local secret store, never in receipts.

Use an encrypted per-run custody structure for manifests, prompts, responses,
receipts, snapshots, and replay evidence. Maintain one encrypted secondary copy
and an append-only access log. Public artifacts carry hashes and bounded
summaries, never credentials or raw model text.

Freeze retention before the first live turn. Deletion should destroy the
content key or append a nonidentifying tombstone; it must not rewrite a receipt
chain.

## Visual quality ladder

| Tier | Outcome | Promotion proof |
|---|---|---|
| Q0 Instrument | Canonical twelve-object world remains deterministic. | Existing source-contract receipt. |
| Q1 Visual tracer | Hero camera, terrain bowl, resident silhouettes, lighting hierarchy, and decluttered UI. | Inspected desktop and portrait screenshots. |
| Q2 Living village | Institutions, idle life, Receipt Loom, and receipt-bound reactions. | Browser interaction receipt plus event assertions. |
| Q3 Spectacle | Genesis, Receipt Constellation, and post-run condition comparison. | Ordered event, receipt, and captured-replay proof. |
| Q4 Platform polish | Adaptive browser, desktop, WebXR, and headset profiles with accessibility and audio. | Hardware-specific frame, interaction, comfort, and screenshot receipts. |

### Provisional performance budgets

These are targets, not observed measurements:

| Profile | Frame target | Scene budget |
|---|---|---|
| Browser Safe | 30 FPS minimum; 60 FPS target on the local RTX 3060 at 1600 x 900 | At most 120 draw calls, 250,000 visible triangles, and 256 MB textures. |
| Desktop Hero | 60 FPS at 1440p on the local RTX 3060 Laptop GPU | At most 250 draw calls, 750,000 visible triangles, and 512 MB textures. |
| WebXR Safe | 72 FPS target | At most 100 draw calls, 180,000 visible triangles, 192 MB textures, and one shadow-casting light. |
| Headset High | 90 FPS where supported | Device-specific receipt required before making the claim. |

XR profiles disable depth of field, motion blur, heavy transparency, and
expensive SSAO. Foliage, lanterns, path stones, and receipt particles should be
instanced.

### Screenshot and interaction matrix

Capture and inspect:

- 1600 x 900 cinematic hero.
- 1600 x 900 research mode.
- 390 x 844 portrait/browser doorway.
- Browser Safe and Desktop Hero profiles.
- Emergency-stop state.
- Receipt event state.
- Four-condition replay state.
- WebXR and headset views when hardware exists.

Each receipt should include:

- Canonical source hash.
- Observer-projection hash.
- Canonical scene digest.
- Viewport, runtime, browser, and quality profile.
- Screenshot hash.
- Referenced action or state receipt.
- GPU and frame metrics only when actually observed.

Visual hashes supplement, but do not replace, human inspection.

### Readability, accessibility, and comfort

- Zero persistent label collisions at 1600 x 900 and 390 x 844.
- Hide nameplates in cinematic mode; show focus labels or a side roster in
  research mode.
- Desktop body text is at least 16 CSS pixels with WCAG 4.5:1 normal-text
  contrast.
- Meaning survives grayscale and common color-vision deficiencies.
- Use silhouette, pattern, number, and caption rather than color alone.
- Provide seated mode, teleport, snap turning, reduced motion, captions, and
  audio descriptions.
- Avoid flashing effects and dense particle storms.
- Keep the emergency control visible in research mode but outside the cinematic
  focal path.

## Comprehension and wow gates

Use at least five fresh testers for the first qualitative gate:

- At least four identify the shared problem, six residents, action result, and
  evidence surface within 60 seconds.
- At least four understand that HoloScript owns world rules and proof, not just
  the interface.
- At least four choose to compare another condition or seed after one replay.
- No tester reports severe discomfort during a ten-minute seated XR review.
- No displayed effect is orphaned from a receipt.
- No tester can infer adapter assignment from resident presentation before
  unblinding.

The language in the experience remains bounded: **coordination trace**,
**challenge completed**, or **unscripted sequence** are acceptable when
supported. **Emergence proven** is not.

## Vertical tracer backlog

| ID | Vertical slice | Proposed primary source | Done when |
|---|---|---|---|
| MV-P0 | Observer-boundary gate | Observer projection plus Model Village checker | Projection on/off and adapter permutations preserve canonical and observation hashes; no write path exists. |
| MV-P1 | Hero greybox | `model-village-observer-projection.holo` | New inspected hero and portrait screenshots fix scale, depth, camera, labels, and control placement. |
| MV-P2 | Six-seat resident kit | HoloScript objects/assets referenced by the observer projection | Six stable silhouettes read at distance and remain invariant across conditions. |
| MV-P3 | Living Commons | Receipt Loom plus one frozen challenge visual | One fixture challenge produces a real, identical public consequence and a receipt-bound visual response. |
| MV-P4 | Research mezzanine | Read-only observer state and receipt panels | Run, turn, challenge, safety, and chain state are legible without overlapping the village. |
| MV-P5 | Two-resident causal tracer | Canonical `.holo`, `.hsplus`, `.hs`, and captured fixtures | One admitted action, one blocked external action, one public consequence, and matching captured replay root. |
| MV-P6 | Receipt Constellation | Observer projection | Every effect waits for a valid receipt; missing evidence fails dark. |
| MV-P7 | Four-Village Fold | Exhibit replay composition | Four sealed conditions scrub to first divergence without inference calls or early unblinding. |
| MV-P8 | Platform quality profiles | HoloScript profile source plus browser/hardware receipt harness | Browser, desktop, portrait, WebXR, accessibility, and comfort gates have receipts. |

MV-P0 and MV-P5 are integrity-critical. MV-P1 may proceed in parallel using
captured fixture receipts. No live model calls wait on visual polish, and no
spectacle bypasses the runtime gates.

## Delivery waves

| Wave | Planning range | Outcome |
|---|---:|---|
| 0 - Production lock | 1-2 working days | Projection boundary, budgets, manifests, screenshot matrix, and ownership are frozen. |
| 1 - Visual tracer | 3-5 working days | Hero greybox, six-seat kit, lighting, terrain, and research/cinematic modes reach Q1. |
| 2 - Causal spectacle | 5-8 working days | Receipt Loom, receipt-bound reactions, Genesis, and fixture replay reach Q2-Q3. |
| 3 - Platform polish | 3-5 working days | Browser/desktop profiles, accessibility, performance, and available XR proof reach Q4 where measured. |
| 4 - Experiment rehearsal | Measured from tracer p95 | Twelve-run captured fixture rehearsal, incident drill, and sealed replay pass. |

These are planning ranges, not delivery promises. Runtime gaps may change them.

## Phase 1 go/no-go

The live twelve-run pilot is currently **no-go**.

Paid model calls begin only after:

1. All runtime closure gates in the experiment spec pass.
2. Three consecutive fixture tracers produce identical ordered decisions,
   post-state hashes, and receipt roots.
3. Emergency stop denies further calls and mutations within one logical tick.
4. Cross-run and cross-village isolation negative tests pass.
5. The complete twelve-run captured-response rehearsal passes with zero provider
   calls.
6. Every adapter proves exact route and revision or file hash, serializer hash,
   no fallback, no hidden prompt enhancement, cache-state evidence, and quota.
7. The custody store passes write, read, replay, backup, access-log, retention,
   and deletion or tombstone drills.
8. The observer projection is machine-proven read-only and absent from resident
   observations.

## Main risks

| Risk | Control |
|---|---|
| Viewer-side fiction | Require a canonical receipt or show unverified; never fabricate causality. |
| Experimental contamination | Separate compositions and prove hash equivalence with projection enabled and disabled. |
| Visual adapter leakage | Bind appearance only to fixed persona and seat manifests; permutation-test the result. |
| Cinematic pacing changes treatment | Keep live execution unpaced; compress only sealed replay. |
| Safety theater | Do not show a successful freeze until the runtime-bound stop transition is observed. |
| Provider or price drift | Pin routes and revisions, hash price/quota snapshots, and freeze on drift. |
| Cross-run memory | Use disposable isolated shards and negative isolation tests. |
| Cost runaway | Reserve worst-case cost before sealing and deny starts above the study ceiling. |
| UI occlusion | Enforce screenshot matrix, focus labels, side roster, and no panels behind residents. |
| XR performance or discomfort | Use explicit profiles, stationary observer posture, reduced effects, and device receipts. |
| Premature scientific language | Maintain observed/target/gap registers and prohibit “emergence proven.” |

## Immediate build slice

Run two tracks in parallel:

1. **Scientific closure:** implement the two-resident, one-tick
   captured-response tracer across the canonical `.holo`, `.hsplus`, and `.hs`
   sources.
2. **Visual tracer:** add the separate observer projection with a locked hero
   camera, terrain bowl, six stable silhouettes, Receipt Loom greybox, and
   decluttered research/cinematic modes.

The visual tracer uses fixture receipts only. Its checker must prove:

- No canonical object-count change.
- No observer write authority.
- No adapter-identity presentation field.
- No resident-observation change.
- No VFX without a referenced receipt.
- A reproducible 1600 x 900 hero screenshot and 390 x 844 portrait screenshot.

That is the shortest path from the current diagram to something recognizably
special while preserving the experiment that makes it meaningful.
