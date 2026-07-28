# Model Village Character Appearance H3G — Native Hair Coverage and Response

Date: 2026-07-28  
Status: bounded H3G witness accepted; strand hair, full character realism, and VR convergence remain open

## Outcome

H3G turns the H3F scalp-flow groom into a source-authored native material
surface. `.holo` `@hair` controls now select card-width coverage, edge softness,
anisotropy strength, and longitudinal lobe shift. The HoloScript engine derives
those values into a material receipt, requests a 4× multisampled
alpha-to-coverage pipeline for covered hair, and applies tangent-aware shifted
dual-lobe response in the native WGSL shader.

The compiler transports the engine-derived receipt without reimplementing the
behavior. This preserves the source-of-truth boundary: HoloScript owns the
functionality and the compiled draw specification carries evidence of it.

## Source and provenance

- World source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h3g-hair-response.holo`
- Admission policy:
  `source/proofs/model-village-character-appearance-h3g-hair-response-policy.hsplus`
- Deterministic seed:
  `source/proofs/model-village-character-appearance-h3g-hair-response-seed.hs`
- Pinned HoloScript commit:
  `5a828db7f9fa54b805741e0997e1e98bb4e48926`
- Sovereign compiler target: `character-webgpu`
- Compiler fallback: forbidden and unused

The witness inherits the admitted H3F scalp-flow geometry. Its three civic
personas remain neutral, unblinded appearance subjects; model-family identity,
research-seat binding, calls to models, and world writes are absent.

## Native proof

The checker parsed `.holo`, `.hsplus`, and `.hs` with the current HoloScript
parsers, then compiled every persona at LOD0, LOD1, and LOD2 twice. All nine
pairs were byte-identical.

| Persona | LOD0 vertices / triangles | LOD1 vertices / triangles | LOD2 vertices / triangles | LOD1 hair cards |
| --- | ---: | ---: | ---: | ---: |
| Hearth Keeper | 5,896 / 5,692 | 3,674 / 3,756 | 3,324 / 3,466 | 55 |
| Path Tender | 4,924 / 4,816 | 3,460 / 3,568 | 3,300 / 3,448 | 42 |
| Record Steward | 6,196 / 6,004 | 3,644 / 3,732 | 3,324 / 3,466 | 52 |

Every bundle preserved eight native ocular material groups and produced a
`holoscript.agent-avatar-hair-material.v1` receipt. Indexed hair-card UVs span
the full authored width from 0 to 1. For each persona and LOD, the checker also
compiled an `opaque-v1` comparison after removing only the H3G response
controls. All nine comparisons retained the exact same geometry bytes, proving
that this lane changes material semantics rather than quietly replacing the
groom.

The source-authored values remained operative:

| Persona | Coverage | Edge softness | Anisotropy | Longitudinal shift |
| --- | ---: | ---: | ---: | ---: |
| Hearth Keeper | 0.84 | 0.12 | 0.86 | 0.08 |
| Path Tender | 0.80 | 0.14 | 0.90 | 0.12 |
| Record Steward | 0.86 | 0.10 | 0.84 | 0.06 |

HoloScript's targeted engine suite passed 30 tests, including live Dawn GPU
tests that detected the local GPU and verified source-authored coverage changes
in real multisampled output. The targeted compiler suite passed 11 tests, and
the core and engine packages built successfully.

## Hardware visual witness

The accepted 1800 × 720 capture was produced locally in headless Chrome 150
through ANGLE on:

`NVIDIA GeForce RTX 3060 Laptop GPU · Direct3D11 · D3D11`

The browser surface used antialiasing with four reported samples. It rendered
three source-derived LOD1 bundles, made zero external requests, loaded no
external hair textures, and reported no page errors.

Measured across three simultaneous portrait renderers after warm-up:

- frame-interval p95: **17.2 ms**;
- render-submit p95: **1.5 ms**.

The frame interval does **not** pass the 11.1 ms VR target. H3G remains a desktop
D3D11 look-development witness, not VR performance convergence.

## Visual iteration

Nine real-GPU captures informed the accepted result. The first surface rendered
the full cap and cards through one anisotropic Three.js material, producing a
black crown. Tangent, color-map, alpha-map, and texture-orientation probes
isolated the failure to anisotropy over the cap's pole and degenerate UV region.
Setting anisotropy to zero restored the cap, and splitting cap triangles from
card triangles at the native receipt's cap boundary removed the failure.

The final bridge uses a rough, color-preserving physical material for the cap
and the source-derived anisotropic alpha-to-coverage material for cards. LOD1
was selected over LOD2 for this close material witness because it keeps a
bounded mid-tier card count while giving coverage enough silhouette density.
The final capture was inspected at its original 1800 × 720 resolution.

This split is a presentation compatibility bridge, not a replacement for the
native HoloScript implementation. It uses no custom shader and no external
texture. Procedural color and alpha maps are used only in the Three.js witness;
native WGSL behavior is independently covered by the Dawn GPU tests.

## Truth boundary and next delta

H3G proves deterministic native card coverage controls, derived material
receipts, 4× alpha-to-coverage pipeline selection, and tangent-aware native
response. It does not claim individual strand alpha coverage, strand hair,
scan-derived or production grooming, anatomical hair accuracy, biometric
likeness, photorealism, or full-world convergence.

The next bounded lane should return to performance, LOD, and temporal
convergence: exercise LOD transitions under motion, measure alpha-to-coverage
stability through TAA, consolidate the three portrait contexts where possible,
and close the measured frame interval toward 11.1 ms without weakening the
native receipt. Crown topology, face proportions, and skin microdetail remain
separate later visual-quality lanes.
