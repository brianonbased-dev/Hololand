# Model Village Character Appearance H3I — Anatomy and Surface Convergence

Date: 2026-07-28
Status: bounded H3I witness accepted; concept-art realism remains open

## Outcome

H3I turns the H3H visual debt into source-authored, compiler-operative controls.
Each of the three residents now authors face width, face length, jaw taper,
shoulder scale, torso scale, crown whorl, and bounded analytic skin
microdetail. The HoloScript `character-webgpu` target derives exact anatomy,
groom, skin, and LOD receipts for every persona at LOD0, LOD1, and LOD2.

The accepted HoloLand portrait keeps H3H's one-renderer, one-scene, one-composer
temporal path. It adds procedural bump and roughness maps for the native skin
material and a source-scaled civic-tunic presentation bridge. These maps are
generated locally from authored HoloScript values; no external skin, hair, or
wardrobe texture is fetched.

H3I improves control, silhouette, and surface response. It does not make the
current procedural mesh photorealistic. The retained native head, ocular, and
hair-card topology still reads as stylized low-poly work, visibly short of the
painted concept-art target.

## Source and provenance

- World source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h3i-anatomy-surface.holo`
- Admission policy:
  `source/proofs/model-village-character-appearance-h3i-anatomy-surface-policy.hsplus`
- Deterministic seed:
  `source/proofs/model-village-character-appearance-h3i-anatomy-surface-seed.hs`
- Inherited H3H source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h3h-temporal-lod.holo`
- Pinned HoloScript commit:
  `96b8f4afc811caff5438a74e7246c02eab3e7898`
- Sovereign compiler target: `character-webgpu`
- Compiler fallback: forbidden and unused

The checker SHA-binds the inherited H3H/H3G sources and the current upstream
groom builder, anatomy builder, character host, composition bridge, LOD
runtime, native renderer, shader, draw-spec, and compiler. The witness is
read-only and unblinded. It performs no model calls, resident-observation
writes, canonical-village mutations, external fetches, family-seat binding, or
biometric persistence.

## Native proof

The checker parses `.holo`, `.hsplus`, and `.hs` with the current HoloScript
parsers and compiles three personas at three LODs. All nine bundles carry:

- `holoscript.agent-avatar-anatomy.v1`, with the exact authored
  `faceWidth`, `faceLength`, `jawTaper`, `shoulderScale`, and `torsoScale`;
- `holoscript.agent-avatar-skin-material.v1`, using
  `analytic-pore-v1` with exact authored scale and strength;
- `holoscript.agent-avatar-groom-geometry.v1`, including exact
  source-authored `crownWhorl`;
- `holoscript.character-lod-transition.v1`, preserving the H3H distance,
  dither, 0.26 second, and 0.65 hysteresis policy.

The proof isolates causality rather than checking receipt presence alone:

- removing only body and face controls removes the anatomy receipt and changes
  native geometry for all nine bundles;
- removing only `crown_whorl` restores `0` and changes native hair geometry for
  all nine bundles;
- removing only skin microdetail removes the skin receipt, restores
  `profile=none`, `scale=0`, and `strength=0`, while leaving geometry
  byte-identical.

All native bundles remain fallback-free and stub-free. The HoloLand H3I suite
passes three tests, including fail-closed rejection of false texture,
presentation, photorealism, biometric-likeness, motion-reprojection, and
native-WebGPU-TAA claims.

The upstream HoloScript change passed 41 targeted engine tests, 12 compiler
tests, the 95-test character suite with one capture-only skip, six native-render
tests, both package builds, public type checks, lint, renderer conformance, the
native render contract, and the Dawn-backed WebGPU render tests.

## Presentation bridge

The accepted 1800 × 720 capture was inspected at original resolution. Its
presentation path uses:

- one WebGL renderer, one scene, and one `EffectComposer`;
- one Three.js `TAARenderPass`, sample level 0;
- 32 stable accumulation frames;
- motion/LOD history invalidation with no motion vectors;
- 1360 × 448 internal rendering presented at 1680 × 554;
- procedural cylindrical UVs plus local bump/roughness maps for skin;
- a local procedural woven map on a tapered civic tunic;
- an eye-height-relative native-torso clip so the tunic can cover the
  prototype block torso without claiming native garment parity.

The last three items are explicit presentation bridges. No custom shader is
injected. The native anatomy, crown, skin, and transition receipts remain the
admission source of truth, but the hero image must not be used as proof that
the native renderer already owns production skin texturing or an open civic
garment.

## Hardware measurement

The accepted witness ran in headless Chrome 150 through ANGLE on:

`NVIDIA GeForce RTX 3060 Laptop GPU · WebGL 2.0 · Direct3D11 · D3D11`

`EXT_disjoint_timer_query_webgl2` returned 132 samples in each of four isolated
runs:

| Measure | Observed range |
| --- | ---: |
| Stable GPU render work | 2.537–2.677 ms |
| History-invalidated GPU render work | 2.722–2.876 ms |
| CPU render-submit | 2.3–3.2 ms |
| Headless `requestAnimationFrame` interval | 17.4–17.7 ms |

Two consecutive sampled stable frames had mean absolute channel delta `0`.
The measured GPU work stays below the 11.1 ms comparison threshold and remains
inside the H3H single-renderer envelope despite the added material maps and
tunic geometry. This is a desktop D3D11 result, not a Quest 3 WebXR or 90 Hz
frame-pacing result; VR performance convergence remains unclaimed.

## Visual assessment and next delta

H3I closes the requested source/compiler gaps for crown direction, neutral face
and upper-body proportions, and bounded skin microdetail. It also makes the
portrait stage easier to read by replacing the exposed prototype torso with a
clearly declared presentation tunic.

The visual inspection still rejects a photoreal or concept-art-parity claim.
The dominant remaining defects are:

- round exposed ocular geometry and weak eyelid/eyebrow landmarks;
- sparse, visibly card-shaped crown hair at close range;
- low-density facial planes, simple nose and mouth forms, and no ear detail;
- presentation-owned clothing rather than a native open civic garment;
- analytic microdetail without production albedo variation, normal capture, or
  scan-derived displacement.

The next bounded character lane should be H3J: native open civic garments,
smaller recessed ocular globes with stronger eyelid and brow landmarks, higher
facial topology density, and groom-card density/cluster controls. Only after
that should a texture lane add authored or licensed skin albedo/normal/
roughness sets with mip, compression, and distance-response validation. The
performance lane remains native WebGPU velocity/reactive/disocclusion inputs
plus an actual Quest 3 WebXR measurement.
