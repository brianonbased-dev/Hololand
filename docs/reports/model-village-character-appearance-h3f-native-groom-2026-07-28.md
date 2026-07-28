# Model Village Character Appearance H3F — Native Scalp-Flow Groom

Date: 2026-07-28  
Status: bounded H3F witness accepted; strand hair, full character realism, and VR convergence remain open

## Outcome

H3F replaces the legacy radial hair-card eruption seen in H3E with an opt-in,
source-authored `scalp-flow-v1` groom in HoloScript. The native engine now emits
scalp-tangent roots, smoothly tapered cards, a procedural scalp cap, a retracted
non-uniform hairline, and a geometry receipt for every compiled character.

The important causal correction was topology alignment. When a character uses
`neutral-anatomical-v2`, the groom now follows that face's ellipsoidal scalp
surface and normals instead of the older spherical head approximation. This
removed the face-crossing planes and floating-cap failure modes observed during
look development.

## Source and provenance

- World source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h3f-native-groom.holo`
- Admission policy:
  `source/proofs/model-village-character-appearance-h3f-native-groom-policy.hsplus`
- Deterministic seed:
  `source/proofs/model-village-character-appearance-h3f-native-groom-seed.hs`
- Pinned HoloScript commit:
  `1203b06bd0e857b26c874479ea9e6b6cdc521896`
- Sovereign compiler target: `character-webgpu`
- Compiler fallback: forbidden and unused

The operative geometry lives in HoloScript's native engine. The compiler and
composition bridge transport the derived groom receipt; they do not substitute
presentation-only geometry for the sovereign implementation.

## Native proof

The checker parsed `.holo`, `.hsplus`, and `.hs` with the current HoloScript
parsers, then compiled every persona at LOD0, LOD1, and LOD2 twice. All nine
pairs were byte-identical.

| Persona | LOD0 vertices / triangles | LOD1 vertices / triangles | LOD2 vertices / triangles | LOD2 cards |
| --- | ---: | ---: | ---: | ---: |
| Hearth Keeper | 5,896 / 5,692 | 3,674 / 3,756 | 3,324 / 3,466 | 25 |
| Path Tender | 4,924 / 4,816 | 3,460 / 3,568 | 3,300 / 3,448 | 22 |
| Record Steward | 6,196 / 6,004 | 3,644 / 3,732 | 3,324 / 3,466 | 25 |

Every bundle preserved:

- `neutral-anatomical-v2` face topology and
  `neutral-anatomical-ellipsoid` groom alignment;
- `layered-ocular-v1` and `recessed-lids-v1`;
- two native material groups for each sclera, iris, pupil, and cornea;
- the exact source-authored card width, root lift, tip taper, and hairline bias;
- a 197-vertex / 364-triangle scalp cap;
- the mapped `@hair(groom_profile=scalp-flow-v1, ...)` receipt;
- zero compiler stubs and no fallback.

The checker also compiled a matching legacy `radial-cards-v1` baseline for all
nine bundles. At the displayed LOD2, scalp-flow root tangent/radial dot p95 was
effectively zero (`8.9e-16` to `3.5e-15`) versus `0.983` to `0.999` for the
legacy profile. The deterministic upper-face prism contained zero scalp-flow
hair vertices, versus 17, 18, and 24 legacy vertices for Hearth Keeper, Path
Tender, and Record Steward respectively.

## Hardware visual witness

The accepted 1800 × 720 capture was produced locally in headless Chrome 150
through ANGLE on:

`NVIDIA GeForce RTX 3060 Laptop GPU · Direct3D11 · D3D11`

The page made zero external requests and reported no browser errors. It rendered
three source-derived LOD2 bundles with native skin, groom, orbital, and ocular
geometry. No hair alpha mask or presentation shader override was used.

Measured across three simultaneous portrait renderers after warm-up:

- frame-interval p95: **17.1 ms**;
- render-submit p95: **0.9 ms**.

The frame interval does **not** pass the 11.1 ms VR target. H3F is therefore a
desktop D3D11 look-development witness, not VR performance convergence.

## Visual iteration

Five real-GPU captures informed the accepted result:

1. Scalp-flow cards still appeared as sparse strips crossing the face.
2. Adding a scalp cap covered the crown but formed an eye-level visor.
3. Raising the legacy spherical hairline left a mask-like eyebrow band.
4. Aligning the groom to the neutral ellipsoidal head removed the intersections,
   but an intentionally shallow cap read as a floating halo.
5. Extending the aligned cap and adding center, temple, and part offsets produced
   the accepted attached silhouette and non-uniform hairline.

The final capture was inspected at its original 1800 × 720 resolution.

## Truth boundary and next delta

H3F proves a deterministic low-poly native groom foundation. It does not claim
alpha-masked card coverage, strand hair, anisotropic hair shading, scan-derived
grooming, production grooming, anatomical hair accuracy, biometric likeness,
photorealism, or full-world convergence.

The remaining visual gap is now coverage and material response rather than
catastrophic card placement. The next bounded character lane should add native
hair coverage/opacity semantics and tangent-aware anisotropic shading, with
LOD-stable dither or alpha-to-coverage admission. Character proportions and
skin microdetail remain later, separate lanes. VR frame pacing also remains open
until the measured interval is at or below 11.1 ms on the target profile.
