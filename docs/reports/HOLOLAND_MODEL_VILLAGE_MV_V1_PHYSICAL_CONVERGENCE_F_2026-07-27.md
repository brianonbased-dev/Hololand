# HoloLand Model Village MV-V1 Physical Convergence F

**Date:** 2026-07-27
**Status:** PASS
**Receipt:** `9fd7dfbdcbc157b8f2d584849230d0e88876a160c479184dcabc1fbd817b31a6`

Physical Convergence F makes Stormglass Commons move as one authored physical
tableau. The six named Resident E embodiments remain presentation-only and
immutable, while HoloScript now owns a 120 Hz deterministic mantle contract,
body-collision projection, twelve sole/terrain probes, rain-driven wet-cloth
material response, and one shared wind field across cloth, rain, reeds, smoke,
and water.

## What is physically proven

- HoloScript's `DeterministicClothSimulation` advances 468 dynamic mantle vertices across six residents with 5 iterations at 120 Hz.
- The local collision projector observed 12 body-surface corrections and left at most 0.00000001 m residual penetration.
- 12 sole probes remained on the authored 0.42 m terrain plane with 0.00000000 m maximum error.
- One HoloScript wind field drives all 5 declared systems.
- Three fixed-input replays produced the same combined physical digest.
- 49 deterministic temporal frames were presented before the accepted final frame.

## Deterministic temporal samples

| Time (s) | Fixed steps | State digest | Max mantle displacement (m) | Body corrections | Sole probes |
|---:|---:|---|---:|---:|---:|
| 0.0 | 0 | d10fc79ee571c13e195758b1238c1828a506c596181e7b44902f2087847380ee | 0.022065 | 24 | 12 |
| 0.8 | 96 | 8504306c61ec66544d86f6cd3ad92af81fe15dfa79b954ee453138554076f9f1 | 0.039829 | 16 | 12 |
| 1.6 | 192 | 337ca2c71937ae61eb50e0d6d29ca1d839ca911c00cf0538885d1e60308d3830 | 0.034833 | 12 | 12 |

Combined replay digest: `5b65d9d44350cbd1e9d6a3879c31f947fb2541d3b2204e36d1be93483403f315`

## Shared wind coupling

| Coupled batch | Transforms |
|---|---:|
| rain_streaks | 320 |
| wind_foliage | 48 |
| chimney_smoke | 12 |
| cistern_ripples | 8 |

The wet-cloth response is deliberately bounded to mantle material roughness and
clearcoat. It does not claim a fluid absorption solver or two-way
fluid-structure interaction.

## Real GPU presentation

- GPU: ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU (0x00002520) Direct3D11 vs_5_0 ps_5_0, D3D11)
- API: WebGL 2.0 (OpenGL ES 3.0 Chromium)
- Browser: 150.0.7871.182
- Draw calls, shadow-inclusive: 741
- Triangles: 115940
- Materials / textures: 70 / 34
- Hero: `docs/assets/model-village/model-village-receipt-loom-physical-convergence-f-2026-07-27.png`
- Motion contact sheet: `docs/assets/model-village/model-village-receipt-loom-physical-convergence-f-motion-2026-07-27.png`

The renderer is real local D3D11/WebGL2 hardware. The mantle solver and
collision/contact bridge execute on the CPU. This witness does **not** claim
native GPU cloth compute.

## HoloScript three-format ownership

- `.holo`: physical world semantics, solver/collision/contact parameters,
  shared-wind coupling, wet-cloth bounds, camera, quality budget, and truth
  boundary.
- `.hsplus`: runtime binding, fixed-step schedule, replay gate, GPU witness
  requirements, and no-causal-merge firewall.
- `.hs`: portable resident order, mantle group, terrain, collision, wind, and
  phase inputs.

All three formats parsed through their dedicated HoloScript parsers. The
`.hsplus` action is structured policy evaluated by the receipted bridge; this
report does not claim native action-block execution.

## Simulation contract

The witness binds meters/seconds, Y-up geometry, exact source/input hashes,
deterministic fixed steps, empty interaction provenance, three-run replay, and
separate GPU presentation evidence. Same inputs produced the same physical
state digest.

## Truth boundary

This is the public `village_story_unblinded` projection, separate from live
blinded research. It performs zero model calls, network fetches, canonical
writes, or resident-observation writes. It does not claim model behavior,
provider endorsement, exact model revisions, cloth self-collision, two-way
fluid-structure interaction, production tailoring, native GPU physics,
photorealism, measured real-time performance, or full-world convergence.

## Validation

- PASS: `physicalContractPass`
- PASS: `hsplusPolicyPass`
- PASS: `hsSeedPass`
- PASS: `residentContractPass`
- PASS: `atmosphereContractPass`
- PASS: `geometryContractPass`
- PASS: `materialContractPass`
- PASS: `baseContractPass`
- PASS: `manifestPass`
- PASS: `sourceHashReachedBrowser`
- PASS: `sceneIrHashReachedBrowser`
- PASS: `physicalPlanHashReachedBrowser`
- PASS: `policyHashReachedBrowser`
- PASS: `seedHashReachedBrowser`
- PASS: `immutableResidentSourceReachedBrowser`
- PASS: `immutableResidentBridgeReachedBrowser`
- PASS: `immutableResidentApplicationReachedBrowser`
- PASS: `inheritedResidentPass`
- PASS: `exactResidentCount`
- PASS: `exactMantleVertices`
- PASS: `exactDynamicMantleVertices`
- PASS: `continuousTemporalWitness`
- PASS: `distinctTemporalFrames`
- PASS: `exactReplayRuns`
- PASS: `deterministicReplay`
- PASS: `bodyCollisionObserved`
- PASS: `bodyCollisionResolved`
- PASS: `mantleDisplacementBound`
- PASS: `mantleEdgeStrainBound`
- PASS: `exactSoleProbeCount`
- PASS: `terrainContactResolved`
- PASS: `exactSharedWindSystems`
- PASS: `exactCoupledTransformCounts`
- PASS: `wetClothWithinBounds`
- PASS: `cpuWitnessBudget`
- PASS: `webgl2`
- PASS: `hardwareRenderer`
- PASS: `d3d11Backend`
- PASS: `noExternalRequests`
- PASS: `noPageErrors`
- PASS: `drawCallBudget`
- PASS: `triangleBudget`
- PASS: `materialBudget`
- PASS: `textureBudget`
- PASS: `lockedHeroResolution`
- PASS: `lockedContactSheetResolution`
- PASS: `contactSheetHasThreeFrames`
- PASS: `liveResearchSeparation`
- PASS: `readOnlyBoundary`
- PASS: `solverRenderBoundary`
- PASS: `boundedPhysicsBoundary`
