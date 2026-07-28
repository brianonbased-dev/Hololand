# Model Village: physics-layer proposal (superseded blocker table — see notice)

**Status:** Proposal (unadopted) — not a Locked decision under the experiment contract's own register.
**Context:** Founder-authorized 2026-07-27 to begin closing the Frontier Loop (D.130) via a persistent Model Village instance. This doc corrects one factual error in the pitch that triggered that authorization, then originally scoped Phase 1 blockers directly against the contract text.

> **SUPERSESSION NOTICE (2026-07-27/28):** While this doc was in review, a 31-agent read-only gate-truth audit — `research/2026-07-27_model-village-gate-truth-audit.md` (same repo, backend-MV-B lane, self-audit of its own MV-B1–B6 work) — completed and found **0 of 14 contract gate rows genuinely closed, 0 of 24 shipped closure claims survived adversarial refutation**, including two the audit's own author personally re-executed (durability atomicity deleted from production code leaves the gate green; the "live provider" flag is a CLI argument, not an observation). The audit's own §4 blocker table (backend A1–A13, codex-visual B1–B4, HoloScript-substrate C1–C6, founder/ops D1–D6) is more accurate and more current than the table originally below and should be read INSTEAD of it. Its explicit verdict: **"By today's evidence it must be NO-GO."** The blocker-scoping table below is left for the historical record of what looked true before the audit landed; do not act on it.

**Highest-leverage single fact from that audit for this proposal specifically:** C1 — "Open-outcome receipt tier does not exist... the plan schema requires `expected.finalPublicState` upfront, which a live run cannot satisfy... no live model output can produce a novel world mutation. **Highest-leverage substrate item.**" This means the physics-substrate proposal below is premature regardless of which runtime backs it — there is currently no execution surface a live resident's action could flow through to reach any physics layer at all (also C2/C3/C4: `.hs` execution is one hardcoded string literal, `.hsplus` execution has no eval/VM/globals, no native `.holo` dispatch exists). Fix C1–C4 first; the physics-substrate question becomes actionable only after.

## Correction of record

A same-day strategic pitch claimed: *"the Model Village contract already names the deterministic action runtime as its physics."* That is false. `HOLOLAND_MODEL_VILLAGE_EXPERIMENT.md:533-536` states the opposite:

> "The tracer makes zero provider calls and executes no live model. It does not exercise physics, native `.holo` lifecycle dispatch, full/native `.hs` or `.hsplus`, distributed concurrency, a six-resident production run, or a scientific outcome."

And the Gap row (`:94`) lists "physics execution by these tracers" as explicitly unobserved. Nothing in this doc changes that claim register — Phase 0B still proves only what it proves.

## Proposal: candidate physics substrate for Phase 1

HoloScript separately ships a receipt-backed, cross-target deterministic execution guarantee that Model Village does not currently reference anywhere:

- `HoloScript/reports/library-coherence/2026-07-26_std-abi-conformance.owned-metal.v0.json` — 170/170 vectors pass on Jetson arm64 owned-metal (`hostLabel: "jetson-orin"`).
- Cross-target equality (node-x64 / Node-WASM / Jetson-arm64) verified on a 50-vector shared corpus, memory entry W.883, commit `15568d53d`.
- `scripts/std-abi-jetson-conformance.mjs` (`c/9eb04d7929`, 2026-07-27) — now fails closed if zero vectors ran, so a green verdict can't be vacuous.

**Proposal:** when Phase 1 is actually built, wire HoloScript's std-ABI-conformant execution path in as the named physics/action-effect layer for resident actions and world mutation, rather than inventing a new physics mechanism. This is not an adoption — it is a recommendation that the contract owners evaluate, because:

- It already has receipts at the exact rigor level this document expects (numbered vectors, pass/fail, owned-metal + cross-target).
- It is the same execution substrate the rest of the six-month compiler/library effort has been proving out — reusing it here is what makes the loop-closing work "load-bearing," not shelf inventory.
- It has NOT been exercised inside any Model Village bridge. Adopting it requires a real Phase 1 wiring pass and its own receipt before any physics claim can move from Gap to Observed.

If adopted, the correct place to record it is a new row in the Claim register (`:78-95`) under a genuine "Observed" entry once a Phase 1 bridge actually calls it and seals a receipt — not this proposal doc.

## Phase 1 blocker scoping (against `:614-624`)

The contract lists eight remaining Phase 1 requirements. Five already have a certified bounded-drill mechanism behind them (MV-B1–B5, all reported SHIPPED 2026-07-26/27) — the real remaining work is mostly *integration into one standing process*, not starting from zero:

| Contract blocker | Existing mechanism | Real remaining work |
|---|---|---|
| Locked live adapters and provider receipts | MV-B1 adapter-certification (`docs/reports/HOLOLAND_MODEL_VILLAGE_MV_B1_ADAPTER_CUSTODY_2026-07-26.md`) | Replace synthetic captured responses with real live-provider calls under the certified custody scheme |
| Sealed response custody | MV-B1 sealed-custody slice | Extend from drill scope to all six residents, continuously |
| Production isolation and ceilings | Not drilled yet | New work — process/resource ceilings per resident, spend-cap wiring (local fleet is free, but ceilings still needed for stability) |
| Native lifecycle/stop binding | MV-B2 turn scheduler (`MV_B2_TURN_SCHEDULER`) partially covers turn-level lifecycle | Bind native `.holo` lifecycle dispatch, not just the engine-owned deterministic `.hsplus` subset |
| Production validator provisioning/custody | MV-B4 validator custody (`MV_B4_VALIDATOR_CUSTODY_2026-07-27.md`) | Move from drilled trust config to a real provisioned/rotatable validator |
| Process-crash durability | MV-B5 durability drill — real SIGKILL, multi-process contention (`MV_B5_DURABILITY_2026-07-27.md`) | Already real-drilled; needs to run under the actual standing process, not a bounded test harness |
| Multi-process/CAS and fleet durability | MV-B5 partially covers multi-process contention | Extend to full fleet (Jetson + laptop pair) |
| Explicit operational go decision | N/A | This is the founder checkpoint the contract itself names. Founder-authorized *starting this scoping/integration work* 2026-07-27. The full Phase 1 "go" — flipping to a standing live instance with real residents and continuous spend — is a separate checkpoint once the integration above is real, not implied by today's authorization. |

## What this doc does not claim

Per the contract's own "Forbidden claim" register (`:95`): this proposal does not claim emergence, model superiority, production trust/durability, process-crash durability at production scale, Phase 1 readiness, or a completed scientific experiment. It is a scoping and physics-substrate recommendation only.

## Coordination note

MV-V*/MV-S* (visual/observer lanes) are codex-owned per `project_model-village-backend-lane.md`. This doc only touches backend/runtime scope (physics substrate, lifecycle binding, custody, durability) and is filed to the HoloMesh board rather than merged directly into the contract's Locked-decision registers, so codex and other active lanes can review before anything here is adopted.
