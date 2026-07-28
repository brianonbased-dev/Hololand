# Model Village Character Appearance H3E — Native Orbital Fit

Date: 2026-07-28
Status: bounded H3E witness accepted; full character and VR convergence remain open

## Outcome

H3E replaces H3D's exposed-globe/tearline-rim presentation with an opt-in,
source-authored `recessed-lids-v1` profile in HoloScript. The native
`character-webgpu` output now carries the authored globe recession, lid opening,
and canthal tilt for each civic persona. Real upper and lower skin-shell
triangles sit in front of the layered sclera, iris, pupil, and cornea geometry.

This is an operative geometry step, not a texture-mask or presentation-shader
simulation of eyelids.

## Source and provenance

- World source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h3e-orbital-fit.holo`
- Admission policy:
  `source/proofs/model-village-character-appearance-h3e-orbital-fit-policy.hsplus`
- Deterministic seed:
  `source/proofs/model-village-character-appearance-h3e-orbital-fit-seed.hs`
- Pinned HoloScript commit:
  `444d39491600856ac4cb305ad40680a212ed2a06`
- Sovereign compiler target: `character-webgpu`
- Compiler fallback: forbidden and unused

## Native proof

The checker parsed all three HoloScript formats and compiled every persona at
LOD0, LOD1, and LOD2 twice. All nine pairs were byte-identical.

| Persona        | LOD0 vertices / triangles | LOD1 vertices / triangles | LOD2 vertices / triangles | Recess | Opening | Tilt |
| -------------- | ------------------------: | ------------------------: | ------------------------: | -----: | ------: | ---: |
| Hearth Keeper  |             7,127 / 6,552 |             3,757 / 3,616 |             3,071 / 3,048 |   0.30 |    0.46 | 0.14 |
| Path Tender    |             5,615 / 5,192 |             3,431 / 3,330 |             3,053 / 3,036 |   0.27 |    0.49 | 0.10 |
| Record Steward |             7,503 / 6,956 |             3,717 / 3,584 |             3,071 / 3,048 |   0.32 |    0.44 | 0.16 |

Every bundle preserved:

- `neutral-anatomical-v2` facial topology;
- `layered-ocular-v1`;
- two native material groups for each of sclera, iris, pupil, and cornea;
- the mapped `@face(orbital_profile=recessed-lids-v1)` receipt;
- the exact source-authored recession, opening, and tilt values;
- zero compiler stubs and no fallback.

The fitted profile emits 152 dedicated orbital vertices and 432 indices per
persona. Against the same source compiled with the legacy tearline profile, it
adds exactly 76 vertices and 76 triangles. The smaller delta is expected because
the legacy tearline already contained 76 vertices; the fitted profile replaces
that rim with 152 vertices of upper/lower occluding skin geometry.

## Hardware visual witness

The accepted 1800 × 720 capture was produced locally in headless Chrome through
ANGLE on:

`NVIDIA GeForce RTX 3060 Laptop GPU · Direct3D11 · D3D11`

The page made zero external requests and reported no browser errors. It rendered
the three source-derived LOD2 bundles with their native skin, hair, and eight
ocular material groups. No eyelid texture mask or presentation shader was used.

Measured across three simultaneous portrait renderers after warm-up:

- frame-interval p95: **17.2 ms**;
- render-submit p95: **1.4 ms**.

The 17.2 ms frame interval does **not** pass the 11.1 ms VR target. This witness
therefore proves a desktop D3D11 look-development surface, not VR performance
convergence.

## Visual iteration

Three real-GPU captures informed the accepted result:

1. The first exposed an undefined native hair-color binding that rendered cards
   white; the checker now binds the source persona hair color.
2. LOD0 and LOD1 were tested and rejected because their denser card fields hid
   more of the orbital silhouette.
3. LOD2 was restored and the source-authored lid openings were tightened to
   0.44–0.49, producing a clearer skin occlusion around the globes.

## Truth boundary and next delta

H3E does not claim scan-derived anatomy, production tear film, eyelashes,
vascular detail, anatomical eye accuracy, biometric likeness, photorealism, or
full-world convergence.

The dominant remaining visual defect is now the procedural hair-card system:
sparse flat cards still cross the face and prevent the portraits from matching
the intended concept-art quality. The next bounded character lane should improve
native hair-card orientation, width taper, scalp distribution, and alpha/strand
coverage before adding finer skin or lash detail. VR convergence also remains a
separate measured performance lane because the current frame interval is above
11.1 ms.
