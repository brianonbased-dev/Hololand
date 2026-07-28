# Model Village Character Appearance H3H — Temporal LOD Convergence

Date: 2026-07-28
Status: bounded H3H witness accepted; headset frame pacing and motion-reprojected TAA remain open

## Outcome

H3H moves the character witness from three independent WebGL renderers to one
shared renderer, one scene, and one temporal composer. The `.holo` source now
authors the LOD selection mode, hysteresis band, fade mode, and fade duration.
The HoloScript `character-webgpu` compiler carries those controls into an exact
`holoscript.character-lod-transition.v1` receipt for every persona and tier.

The browser witness instantiates HoloScript's authored `LODTransition` class
directly. It exercises LOD1-to-LOD2 and LOD2-to-LOD1 transitions, probes the
hysteresis boundary, and uses the transition's dither threshold and Bayer
pattern. The presentation bridge applies Three.js `TAARenderPass` only while
the scene is stable. Motion and active LOD changes invalidate history because
this bridge has no motion vectors.

## Source and provenance

- World source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h3h-temporal-lod.holo`
- Admission policy:
  `source/proofs/model-village-character-appearance-h3h-temporal-lod-policy.hsplus`
- Deterministic seed:
  `source/proofs/model-village-character-appearance-h3h-temporal-lod-seed.hs`
- Pinned HoloScript commit:
  `daf5993dc1c5372bfb79d2fa81b8dbcc6d32ebfb`
- Sovereign compiler target: `character-webgpu`
- Compiler fallback: forbidden and unused
- Authored transition runtime:
  `packages/engine/src/lod/LODTransition.ts`

The checker binds the H3G source, compiler bridge, transition runtime, renderer,
shader, draw-spec, and compiler paths by SHA-256. The H3H presentation remains
read-only and unblinded: it performs no model calls, resident-observation
writes, canonical village mutations, external fetches, or family-seat binding.

## Native proof

The checker parsed `.holo`, `.hsplus`, and `.hs` with the current HoloScript
parsers. It then compiled three personas at LOD0, LOD1, and LOD2. All nine
native bundles carried this exact derived receipt:

```json
{
  "schemaVersion": "holoscript.character-lod-transition.v1",
  "selectionMode": "distance",
  "mode": "dither",
  "durationSeconds": 0.26,
  "hysteresisBand": 0.65
}
```

Every bundle also retained the admitted H3G scalp-flow geometry, eight ocular
material groups, card-width UVs, tangent response, and alpha-to-coverage
request. The H3H test suite passed three tests, including fail-closed rejection
of false motion-reprojection and native-WebGPU-TAA claims. The upstream
HoloScript change passed 19 engine tests, 11 compiler tests, both package
builds, lint, type checking, workspace dependency checks, and the repository
safe-commit gates.

## Shared renderer and temporal policy

The accepted surface uses:

- one WebGL renderer context;
- one Three.js scene;
- one `EffectComposer`;
- one `TAARenderPass` at sample level 0;
- 32 stable accumulation frames;
- `invalidate-on-motion-or-lod-change-v1`;
- a source-authored 0.81 internal render scale: 1360 × 448 rendered into a
  1680 × 554 presentation stage.

The final stable accumulation index reached 32. Two consecutive sampled final
frames had a mean absolute channel delta of 0 and a changed-channel ratio of 0
across 114,240 sampled channels.

This is a stable-scene accumulation bridge, not temporal reprojection. It has
no velocity buffer, motion vectors, disocclusion handling, or native WebGPU TAA
claim.

## Hardware measurement

The witness ran locally in headless Chrome 150 through ANGLE on:

`NVIDIA GeForce RTX 3060 Laptop GPU · WebGL 2.0 · Direct3D11 · D3D11`

The driver exposed `EXT_disjoint_timer_query_webgl2`. Four accepted runs each
returned 132 timer-query samples. Observed p95 ranges were:

| Measure | Observed range |
| --- | ---: |
| Stable GPU render work | 2.618–2.831 ms |
| History-invalidated GPU render work | 3.867–4.285 ms |
| CPU render-submit | 1.8–2.2 ms |
| Headless `requestAnimationFrame` interval | 17.3–17.5 ms |

The 11.1 ms comparison is valid only for measured GPU render work on this
desktop D3D11 path: both stable and invalidated p95 stayed below it. The
headless frame interval remained display-cadenced above 11.1 ms, and no Quest
headset or 90 Hz WebXR session was measured. H3H therefore does not claim VR
performance convergence.

## Visual iteration

The first H3H presentation used one renderer but three independent temporal
composers. It preserved the H3G portrait framing, yet timer-query p95 remained
about 15.6 ms because each portrait repeated the full temporal pipeline.

The accepted iteration combines all three residents into one scene and one
composer, then uses the authored 0.81 internal render scale. This reduced
stable GPU p95 to 2.618–2.831 ms while retaining the source-derived materials,
portrait labels, and final LOD1 appearance. The final 1800 × 720 capture was
inspected at original resolution.

## Truth boundary and next delta

H3H proves deterministic native transition receipts, live use of HoloScript's
LOD transition runtime, one-context/one-scene/one-composer consolidation,
motion-and-LOD history invalidation, stable 32-frame accumulation, and real
desktop GPU timer measurements.

It does not prove motion-reprojected TAA, native WebGPU TAA, headset frame
pacing, 90 Hz WebXR convergence, strand hair, production grooming,
photorealism, biometric likeness, or full-world convergence.

The next character-realism lane should return to visual anatomy: crown topology
and card clumping, face proportions, and skin microdetail. The next performance
lane should move this policy into the native WebGPU render graph with velocity,
reactive, and disocclusion inputs, then measure it in an actual Quest 3 WebXR
session.
