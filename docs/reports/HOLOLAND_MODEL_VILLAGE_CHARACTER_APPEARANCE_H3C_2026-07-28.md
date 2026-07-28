# HoloLand Model Village Character Appearance H3C

Date: 2026-07-28  
Status: accepted bounded foundation  
Milestone: `MV_CHARACTER_APPEARANCE_H3C_FACE_FOUNDATION`

## Outcome

H3C replaces H3B's visible block-head cap with a source-selectable
`neutral-anatomical-v2` topology authored through:

- `.holo`: the world/look-development contract and three civic personas;
- `.hsplus`: native-bundle admission and the research/custody firewall;
- `.hs`: the deterministic read-only proof seed.

The sovereign `character-webgpu` compiler emitted all nine persona/LOD bundles
without fallback or stubs. The new topology adds 561 vertices over the
5,958-vertex legacy comparison bundle and carries its topology identity through
the native morph receipt.

![Accepted H3C native face portraits](../assets/model-village/model-village-character-appearance-h3c-native-face-portraits-2026-07-28.png)

## Native implementation

Pinned HoloScript commit:
`faf90ec8cbac992c6ca0ed9ffafb9033fa9bd127`

The implementation adds:

- an opt-in smooth skull with jaw taper and a flatter facial plane;
- a smooth bounded nose volume, upper eyelid and lower tearline arcs, and a
  neutral lip seam;
- smaller embedded ocular geometry for the anatomical topology;
- `@face(topology: "neutral_anatomical_v2", radial_segments: 22,
  vertical_segments: 16, tearline: true)` mapping;
- face topology serialization in the sovereign `character-webgpu` compiler;
- topology identity in native facial morph receipts.

The legacy `procedural-head-v1` remains the default. Unsupported topology names
fail closed instead of relabeling the legacy cap.

## GPU witness

The accepted fourth visual iteration was captured at 1,800 × 720 in Chrome
150.0.7871.182 on:

`ANGLE (NVIDIA GeForce RTX 3060 Laptop GPU, Direct3D11)`

Measured over the three simultaneous portrait renderers:

| Measure | Result |
|---|---:|
| Post-warm frame interval p95 | 20.6 ms |
| Render-submit p95 | 4.5 ms |
| Native persona/LOD bundles | 9 |
| Native expression receipts | 3 |
| Topology vertex delta | +561 |
| External requests | 0 |
| Page errors | 0 |

The look-development witness intentionally selects the source-authored LOD2 hair
topology (28/24/28 guides) so facial landmarks remain readable. LOD0 and LOD1
are still compiled, hashed, and admitted. The procedural iris/pupil presentation
is driven by each persona's authored `irisColor`; a segmented native iris
material is not claimed.

## Visual iteration record

1. LOD0 close-up rejected: inherited hair cards occluded the face.
2. Eye-centered LOD2 framing rejected: full elliptical landmark rims read as
   glasses and the ocular surfaces were oversized.
3. Refined eye scale, eyelid arcs, nose, and lip seam rejected: the nose volume
   remained too tall and the iris normal sign was wrong.
4. Softer nose, corrected iris facing, and source-authored portrait hair
   substitutions accepted as the bounded H3C foundation.

## Truth boundary

H3C proves a deterministic native procedural facial foundation. It does not
claim a scan-derived face, biometric likeness, production blendshape rig,
wet tear film, morph-normal recomputation, temporal reprojection, TAA
convergence, or photorealism. It performs no model calls, research-seat joins,
canonical village writes, resident-observation writes, or external network
fetches.

The accepted image is a substantial improvement over the block head, but it is
not the final realistic NPC target.

## Next bounded lane: H3D production facial regions

1. Split native eye geometry/material groups into sclera, iris, pupil, cornea,
   and tearline surfaces; eliminate the presentation-only iris shader.
2. Add facial regions for brow, cheek, lips, nostrils, ears, teeth, and tongue
   on a deformation-safe topology.
3. Recompute or transport normals/tangents after morph deformation and validate
   blink, smile, jaw, and viseme combinations on GPU.
4. Replace opaque ribbon hair cards with alpha-tested/tapered native hair
   shading, a scalp occlusion surface, and production hairline masks.
5. Author skin/dermal variation and age/detail atlases without tying neutral
   civic bodies to model-family identity.
6. Re-run the three-persona portrait and village-distance lineup through the
   existing LOD/performance/TAA gates before any production-face or
   photorealism claim.

## Verification

```text
HoloScript engine tests: 28 passed
HoloScript compiler tests: 10 passed
HoloScript engine build: passed
HoloScript core build and public types: passed
HoloLand H3C contract tests: 3 passed
HoloLand H3C native/GPU witness: passed
HoloScript safe-commit quality gates: passed for all three upstream commits
```

GraphRAG refresh scanned 11,648 tracked files, but impact analysis remained
non-authoritative because the cached graph covered only 57.44% of the current
20,280-file candidate set. Direct source reads, targeted tests, builds, compiler
receipts, and the GPU witness are the evidence of record for this lane.
