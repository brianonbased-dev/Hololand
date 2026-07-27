# HoloLand Model Village MV-V1 Performance / LOD / TAA Convergence G

**Date:** 2026-07-27
**Status:** PASS
**Receipt:** `fcd8e13e8df318e8e968751f775e1aadd7e474e1436c2735464c6bf5333bb634`

Performance Convergence G seals the immutable Physical F tableau and promotes
one measured local desktop profile. Six family residents now have three
source-authored HoloScript character tiers selected by HoloScript's engine
`LODManager`; the settled frame is accumulated through Three's static
32-sample TAA pass and measured for 600 warm-up plus 1,800 frames.

## Measured local profile

| Metric | p50 | p95 | p99 | Maximum |
|---|---:|---:|---:|---:|
| rAF cadence (ms) | 16.700 | 16.800 | 16.900 | 33.400 |
| CPU render submit (ms) | 1.300 | 4.000 | 6.100 | 9.900 |

- Warm-up / measured frames: 600 / 1800
- Dropped-frame ratio above 25 ms: 0.056%
- Browser: 150.0.7871.182
- GPU: ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU (0x00002520) Direct3D11 vs_5_0 ps_5_0, D3D11)
- API/backend: WebGL2 / D3D11

## Source-authored family LOD

| Resident | LOD0 tris / hash | LOD1 tris / hash | LOD2 tris / hash |
|---|---:|---:|---:|
| Claude | 1668 / d3703bd507 | 1298 / 8800a555cf | 1100 / f28ebdc69a |
| OpenAI | 1668 / a53aa7fed8 | 1298 / b9b35c35fa | 1100 / ffedc17f7d |
| Gemini | 1668 / 8f8d06aa23 | 1298 / 890551ba9a | 1100 / 26081d62f4 |
| Grok | 1668 / a626b29738 | 1298 / 6fd4cf164c | 1100 / 37f0b34d1a |
| GLM | 1668 / 9aebb2d499 | 1298 / f8ec260c56 | 1100 / 5ab082f406 |
| Brittney | 1668 / c016d91c9a | 1298 / 02bbc067f0 | 1100 / 565d8d2fa6 |

Every tier compiled twice byte-identically without fallback from the existing
family mantle catalog. LOD0 remains the physically settled F geometry; LOD1 and
LOD2 are static presentation tiers and do not claim tier-specific cloth
simulation.

## Static temporal accumulation

- Implementation: `three_taa_render_pass`
- History samples: 32
- Center-patch mean pixel delta, first window: 0.126424
- Center-patch mean pixel delta, final window: 0.131558
- History resets receipted: 9

This is static jittered accumulation for a settled frame. It has no motion
vectors, reprojection, disocclusion rejection, reactive mask, or neighborhood
clamp and is not claimed as production motion-stable TAA.

## Physical preservation

Physical F replay digest before and after profile/LOD/TAA work:
`5b65d9d44350cbd1e9d6a3879c31f947fb2541d3b2204e36d1be93483403f315`.

The benchmark does not run the CPU cloth solver concurrently. Physical F keeps
its separate 120 Hz solver receipt and local CPU timing witness.

## Visual receipts

- Hero: `docs/assets/model-village/model-village-receipt-loom-performance-convergence-g-2026-07-27.png`
- LOD/TAA comparison: `docs/assets/model-village/model-village-receipt-loom-performance-convergence-g-comparison-2026-07-27.png`

## Truth boundary

The witness is a read-only public story projection, separate from live blinded
research. It performs no model calls, network fetches, canonical writes,
resident-observation writes, or wallet/seat identity mutation. It does not
claim cross-device, WebXR/headset, dynamic resolution, native WebGPU TAA,
concurrent physics/render performance, provider endorsement, model behavior,
photorealism, production TAA, or full-world convergence.

## Validation

- PASS: `performanceContractPass`
- PASS: `hsplusPolicyPass`
- PASS: `hsSeedPass`
- PASS: `manifestPass`
- PASS: `inheritedPhysicalPass`
- PASS: `exactInheritedPhysicalArtifacts`
- PASS: `physicalReplayDigestPreserved`
- PASS: `exactFamilyTierCount`
- PASS: `repeatedFamilyCompileByteIdentity`
- PASS: `authoredFamilyTopologyReduces`
- PASS: `nativeLodManagerReachedBrowser`
- PASS: `exactMeasuredFrameProtocol`
- PASS: `rafP95Budget`
- PASS: `rafP99Budget`
- PASS: `renderSubmitP95Budget`
- PASS: `droppedFrameBudget`
- PASS: `lod0DrawCallRegression`
- PASS: `lod0TriangleRegression`
- PASS: `lod2TriangleReduction`
- PASS: `exactForcedLodSelection`
- PASS: `taaSourceReachedBrowser`
- PASS: `staticTaaHistorySettled`
- PASS: `temporalStabilityConverged`
- PASS: `historyResetCoverage`
- PASS: `boundedTemporalClaim`
- PASS: `settledPerformanceBoundary`
- PASS: `webgl2`
- PASS: `hardwareRenderer`
- PASS: `d3d11Backend`
- PASS: `noExternalRequests`
- PASS: `noPageErrors`
- PASS: `lockedHeroResolution`
- PASS: `lockedComparisonResolution`
- PASS: `comparisonHasFourPanels`
- PASS: `liveResearchSeparation`
- PASS: `readOnlyBoundary`
- PASS: `boundedPerformanceBoundary`
