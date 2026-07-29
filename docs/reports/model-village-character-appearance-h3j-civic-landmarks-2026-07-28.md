# Model Village Character Appearance H3J — Civic Landmark Convergence

Date: 2026-07-28
Status: bounded H3J witness accepted; production character realism remains open

## Outcome

H3J moves four character controls out of the presentation layer and into
HoloScript source plus the sovereign `character-webgpu` compiler:

- an actual open civic-tunic topology with a lowered front neckline and shaped
  V collar;
- smaller ocular globes plus explicit lid, brow, ear, and mouth controls;
- a denser `civic-landmarks-v1` facial region;
- source-authored groom cluster count and spread.

The three-resident HoloLand witness compiles Hearth Keeper, Path Tender, and
Record Steward from `.holo`, admits the bundles through `.hsplus`, and binds the
flat deterministic inputs in `.hs`. The witness remains anonymous with respect
to model-family seats. It does not join the live experiment, call a model, write
resident observations, or mutate the canonical village.

The accepted portrait is a meaningful compiler and topology advance, not a
photoreal result. The faces, eyes, lids, brows, ears, lips, and clustered groom
are readable, while the native garment is visible but subordinate in the
face-focused crop. The retained prototype upper body is still visibly blocky.

## Source and provenance

- World source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h3j-civic-landmarks.holo`
- Admission policy:
  `source/proofs/model-village-character-appearance-h3j-civic-landmarks-policy.hsplus`
- Deterministic seed:
  `source/proofs/model-village-character-appearance-h3j-civic-landmarks-seed.hs`
- Inherited H3I source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h3i-anatomy-surface.holo`
- Pinned HoloScript commit:
  `1bc81ee7e02fade1095dc1c1548d7879e27a2800`
- Pinned garment builder SHA-256:
  `7feaa616776b15a63e101505d96ff4d55847069c1b08d28b48ce5a33341273d3`
- Sovereign compiler target: `character-webgpu`
- Compiler fallback: forbidden and unused

The upstream work also added compiler serialization for the new face, garment,
and groom controls and carried their exact receipt fields through the character
host and composition bridge. The final garment correction added a native
per-ring front drop, widened and moved the open tunic shoulder rings outside
the prototype torso, and retained the closed hooded-tunic path.

## Native proof

The checker parses all three HoloScript formats and compiles authored, repeated,
and stripped-control variants for all three residents at LOD0. Every admitted
bundle carries:

- `holoscript.agent-avatar-facial-landmarks.v1` with exact eye scale, brow
  height/thickness, ear scale, mouth depth, and `civic-landmarks-v1`;
- `holoscript.agent-avatar-garment-geometry.v1` with
  `stormglass_open_civic_tunic`, `open-v-collar`, 396 cloth vertices, and 536
  cloth triangles;
- `holoscript.agent-avatar-groom-geometry.v1` with exact cluster count and
  spread.

The three final native bundles contain 8,452, 7,276, and 8,772 vertices. Their
groom receipts contain 14/12/16 clusters, 128/108/138 emitted guides, and
256/216/276 cards.

The proof isolates causality:

- removing only civic facial controls removes the landmark receipt and changes
  native geometry by 514 vertices for every resident;
- removing only the open garment removes its receipt and changes native
  geometry by 396 vertices for every resident;
- removing only groom clustering changes geometry for every resident, with
  emitted/cull-set vertex deltas of -160, -140, and -192.

Repeated compilation is byte-stable, all three bundles remain fallback-free
and stub-free, and each contains exactly eight ocular material groups. The
HoloLand H3J suite passes three tests, including fail-closed rejection of false
wardrobe-bridge, torso-clip, photorealism, motion-reprojection, and native
WebGPU-TAA claims.

The sovereign local HoloScript surface discovered the `.holo` template,
objects, and traits. Direct `.hsplus` and `.hs` parsing returned zero errors and
zero warnings.

## Presentation bridge

The accepted 1800 × 720 portrait was inspected at original resolution. Its
presentation path uses:

- one WebGL renderer, one shared scene, and one `EffectComposer`;
- Three.js `TAARenderPass` with 32 stable accumulation frames;
- deterministic history invalidation during the bounded camera perturbation;
- 1458 × 486 internal rendering presented at 1800 × 720;
- locally generated skin, hair, alpha, and woven-cloth maps;
- native garment geometry with a bounded Three.js cloth material.

There is no presentation wardrobe-geometry replacement and no native-torso
clip. Material-group bounds are recorded after skinning so the witness can
distinguish native cloth and skin extents. No external skin, hair, or wardrobe
texture is fetched.

The material response and TAA are presentation bridges. The browser path is
WebGL2 through ANGLE/D3D11, not the native WebGPU renderer. The hero image must
not be used as evidence of native WebGPU TAA, motion reprojection, production
skin shading, production groom, Quest rendering, or photorealism.

## Hardware measurement

The accepted witness ran in headless Chrome 150 through ANGLE on:

`NVIDIA GeForce RTX 3060 Laptop GPU · WebGL 2.0 · Direct3D11 · D3D11`

`EXT_disjoint_timer_query_webgl2` returned 132 samples in each of four isolated
sequential runs. All four produced the same hero SHA-256:
`b462da4e6d1d8eb10a990a57734ab4a01187c749839750c79f7d858cd12aede3`.

| Measure | Observed range |
| --- | ---: |
| Stable GPU render work | 2.228–2.820 ms |
| History-invalidated GPU render work | 1.027–2.292 ms |
| CPU render-submit | 1.4–1.9 ms |
| Headless `requestAnimationFrame` interval | 17.1–17.7 ms |

Two consecutive sampled stable frames had mean absolute channel delta `0`
across 106,290 channels. GPU render work remains below the 11.1 ms comparison
threshold. This is not a Quest 3 WebXR or 90 Hz frame-pacing measurement, so
headset performance convergence remains unclaimed.

## Validation

Upstream HoloScript:

- focused character-host contract: 22 tests passed;
- complete character-render suite: 96 passed, 1 capture-only skip;
- engine build: passed;
- safe-commit lint, enforced engine type check, workspace dependency, legacy
  bridge, render-surface, and repository quality gates: passed.

The first attempted parallel core/engine build raced the core package's clean
step and was not counted as green. Sequential core then engine builds passed
before the initial H3J feature commit; the final garment revision rebuilt the
engine successfully.

HoloLand:

- H3J checker compile and browser witness: passed;
- H3J Node suite: 3/3 passed;
- `.holo`, `.hsplus`, and `.hs` parse/admission boundary: passed;
- four repeated GPU captures: passed;
- external network requests and page errors: zero.

## Visual assessment and next delta

H3J closes the native controls named by H3I: open garment geometry, smaller
eyes with landmark controls, denser facial landmarks, and groom clusters. It
also removes H3I's presentation-owned tunic and torso clip.

The current image still rejects concept-art or photoreal parity. The dominant
remaining defects are:

- a block-built upper torso, shoulders, arms, and neck seam beneath the native
  garment;
- stylized low-density head planes and simple nose and mouth forms;
- visibly card-based groom silhouettes and sparse crown breakup;
- analytic local material maps rather than authored or licensed production
  albedo, normal, roughness, and displacement sets;
- presentation-owned TAA without velocity, reactive, or disocclusion inputs.

The next character lane should replace the legacy block upper body with a
coherent production shoulder/neck/torso topology and validate garment
occlusion across poses. The next skin lane should admit owned or licensed
albedo/normal/roughness sets with mip, compression, color-space, and
distance-response receipts. The next performance lane remains native WebGPU
velocity/reactive/disocclusion convergence, groom/garment LODs, and an actual
Quest 3 WebXR measurement.
