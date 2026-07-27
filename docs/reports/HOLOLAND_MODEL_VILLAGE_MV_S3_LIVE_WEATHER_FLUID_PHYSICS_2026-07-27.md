# HoloLand Model Village MV-S3 — Live Weather and Fluid Physics

Date: 2026-07-27
Board task: `task_1785115459791_ngge`
Status: PASS on the named local laptop build

## What shipped

- A first-class HoloScript `weather` block drives a bounded Stormglass squall.
- `@fluid_simulation` advances 96 CPU SPH particles through the shipped HoloScript trait lifecycle.
- `@advanced_cloth` advances 140 CPU PBD particles through the shipped HoloScript trait lifecycle.
- HoloScript `PhysicsWorld` records sphere/box collision contacts.
- A real browser WebGPU adapter, device, canvas context, render pipelines, command encoder, and draws present the receipted physics state.
- `.holo`, `.hsplus`, and `.hs` have distinct parser-verified roles: world, behavior policy, and deterministic seed.

## Deterministic replay

Three runs used the same fixed 120 Hz inputs for 360 steps.

| Domain | Digest |
|---|---|
| Fluid | `63426218162bf321be30af5af230186cced15a26bfe838d4ece1d87a417a053c` |
| Cloth | `82e5a1e4e4307a03f6ec26a85e1cd27c5ee6c698f81ba6a42d7f105545a3605c` |
| Rigid | `a82242733b484bfb125a5d1d5998d3172d9d94e1b0757271e474f7794a5d6e67` |
| Events | `804b1fc3fcb98fa0697278a8f578a6733be9b20ac9284ac8a7ad074d17b75fa4` |
| Combined | `08a840a7bf49d31354093f268e13d9f85819723a169311d526a6aa7f5d780b96` |

All five digest classes matched exactly across all three runs. Solver timing and GPU rendering are excluded from the state digests.

## Measured evidence

Named hardware: NVIDIA GeForce RTX 3060 Laptop GPU; browser Chrome/150.0.7871.182.

| Lane | p50 | p95 | p99 | Samples |
|---|---:|---:|---:|---:|
| CPU fixed-step total | 0.516 ms | 1.333 ms | 3.594 ms | 360 |
| Browser GPU render pass | 0.034 ms | 0.035 ms | 0.035 ms | 24 |

CPU solver time and GPU presentation time are separate lanes. This witness does not claim a GPU physics solver.

## Causality and claim boundary

MV-S3 physics reads only its own world source, behavior policy, and deterministic seed. The verifier additionally reads the immutable evidence manifest. Neither path consumes the sealed MV-P10 receipt fixture or village action receipts as physics inputs, and neither can write canonical village state, resident observations, schedules, actions, or receipts.

Not proved: GPU SPH/PBD/rigid solvers, fluid-structure interaction, CFD accuracy, turbulence or forecasting, real meteorological input, photorealism, cross-hardware determinism, WebXR/headset performance, resident perception/response, causal merge with village receipts, or provider affiliation.

## Source and visual witness

- Holo world: `source/layers/vr/frontier/model-village/model-village-live-weather-fluid-physics.holo`
- Immutable Holo evidence manifest: `source/layers/vr/frontier/model-village/model-village-live-weather-fluid-physics-manifest.holo`
- HoloScript+ policy: `source/proofs/model-village-live-physics-contract.hsplus`
- HoloScript seed: `source/proofs/model-village-live-physics-seed.hs`
- Hero frame: `docs/assets/model-village/model-village-live-weather-fluid-physics-hero-2026-07-27.png`
- Upstream HoloScript cloth lifecycle fix: `adbc71e4ba693ba87ab448cedf1616c7c1421496`

Receipt root: `2c3ba7e80d1d4881af1b198926fc1bf387c89a5aa97ba57a417a9def55e7c542`
