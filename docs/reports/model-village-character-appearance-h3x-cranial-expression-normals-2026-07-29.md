# Model Village Character Appearance H3X

Date: 2026-07-29  
Milestone: `MV_CHARACTER_APPEARANCE_H3X_CRANIAL_EXPRESSION_NORMALS`  
Status: passed the bounded source, compiler, native Chrome WebGPU, counterfactual, and visual-inspection gates

H3X moves the four symbolic Model Village residents—OpenAI, Claude, Gemini, and Grok—from the H3W bust plate to a genuine close-up facial witness. The operative world is authored in `.holo`; the admission contract is authored in `.hsplus`; the flat deterministic seed is authored in `.hs`. The checker parses all three formats, compiles each resident through `CharacterWebGPUCompiler`, rebuilds the host receipts independently, and renders the result through HoloScript's native WebGPU character renderer.

## What changed

- `portrait_cranial_v3` raises the authored close-up face budget to 44 radial by 30 vertical segments.
- LOD2 remains explicitly authored at 24 by 16; HoloScript does not invent a decimated tier.
- A 24-segment V7 neck loop is joined to the 44-segment lower cranium by 68 indexed bridge triangles.
- The stitch receives dual neck/head influence through `expressive-cranial-neck-volume-v4`.
- `recompute_affected_v1` rebuilds expression-adjacent one-ring normals and emits a deterministic full-normal digest.
- A same-position static-normal build and a 24-by-16 distance build are rendered as isolated pixel counterfactuals.

The first close-up render exposed inward-facing reconstructed normals as a dark forehead band. That visual gate was treated as a failure, not preserved as evidence. HoloScript commit `df6ebcd00b5e36fa6bc5fcc8ed8dde36dbd655c2` aligns reconstructed normals to the neutral outward hemisphere and adds a regression test rejecting opposing normals. The durable H3X image and receipt were regenerated only after that correction.

## Measured browser witness

Chrome 150 created a WebGPU adapter and device reporting NVIDIA/Ampere. All traffic remained on loopback and no external request was observed.

| Resident | Recomputed vs static normal pixels | 44x30 vs 24x16 pixels | Close-up vertex count | Distance vertex count |
|---|---:|---:|---:|---:|
| OpenAI | 36,428 | 12,658 | 12,098 | 7,552 |
| Claude | 38,535 | 15,473 | 12,098 | 7,552 |
| Gemini | 34,045 | 9,321 | 12,066 | 7,552 |
| Grok | 40,708 | 15,163 | 12,098 | 7,552 |

Every normal counterfactual used byte-identical positions. Each resident emitted:

- `holoscript.agent-avatar-cranial-neck.v1`
- `indexed-neck-cranium-stitch-v1`
- `holoscript.agent-avatar-joint-deformation.v4`
- `expressive-cranial-neck-volume-v4`
- `holoscript.native-facial-morph.v3`
- `recompute-affected-v1`

The 1,400-by-900 hero PNG is 665,095 bytes with SHA-256 `ff026384517886d57a296b0f6aa57376a4c61914d28531dfe9e0c14883075a9c`.

## Hardware and claim boundary

`nvidia-smi` reported `NVIDIA GeForce RTX 3060 Laptop GPU, 610.88, 6144`. That is a host readback, not an RTX performance benchmark. Browser WebGPU adapter/device creation and pixels were measured. GPU timestamps, frame-time distributions, ray tracing, Quest hardware, WebXR, full-world performance, and physically calibrated cameras were not measured. H3X remains a procedural-realist improvement and does not claim photorealism.

## Next realism lane

H3Y should address the defects the close-up now makes easy to see: constructed garments instead of open shoulder shells, more natural eyelid and lip topology, strand-level groom containment around the hairline, and image-based lighting/reflection probes. Those changes should preserve the H3X face LOD and expression-normal counterfactuals as regression witnesses.
