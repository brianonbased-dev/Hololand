# Model Village Character Appearance H3Q — Fixed-Light Material Calibration

Date: 2026-07-29
Status: PASS — bounded native renderer witness
Task: `task_1785031011215_lop6` (MV-V1 remains open)

## Outcome

H3Q makes fixed-light analytic skin, keratin, and proximal nail-bed calibration
an operative HoloScript source contract. The four symbolic model-family
residents — OpenAI, Claude, Gemini, and Grok — compile through
`CharacterWebGPUCompiler`, bridge into `CharacterHost`, and render through the
native Dawn/WebGPU `renderCharacter` entrypoint.

The source-owned path is split across all three formats:

- `.holo` owns resident appearance, `fixed_light_human_v1`, the fixed light,
  camera contract, and semantic material controls.
- `.hsplus` owns the admission policy for receipt shape, non-overlap, and three
  GPU counterfactuals.
- `.hs` owns the flat deterministic resident/material seed.

HoloScript canon is pinned at `40697c773533db38d3111855c1eeab9ac381c396`.
That canon includes the engine material implementation at `bfb714788` and the
source bridge at `40697c773`.

## What changed upstream

- `fixed-light-human-v1` is opt-in; legacy characters retain the original draw
  schedule.
- Skin receipts now expose the exact analytic optical controls used by the
  native shader.
- Every 288-index V3 nail plate is partitioned without geometry duplication:
  216 keratin indices and 72 proximal nail-bed indices.
- Ten nail plates therefore emit 20 keratin draw groups and 10 nail-bed draw
  groups, covering 2,880 indices with zero skin/keratin, skin/nail-bed, or
  keratin/nail-bed overlap.
- `.holo` maps `material_calibration_profile`, `nail_bed_tone`, and
  `nail_bed_roughness` into the native host. Nail-bed controls without the
  fixed-light profile fail closed as unsupported instead of silently changing
  output.

## Native GPU receipt

Adapter readback:

- Vendor: NVIDIA
- Architecture: Ampere
- Device: NVIDIA GeForce RTX 3060 Laptop GPU
- Dawn backend: D3D12
- Reported driver: `32.0.16.1088`
- `timestamp-query` supported: yes
- `timestamp-query` measured: **no**

All plates used the same light direction `[0.32, 0.72, 0.61]`, clear color
`[2, 8, 17]`, 320 × 320 framebuffer, and a source-bounded orthographic hand
frame.

| Resident | Figure pixels | Skin changed pixels / abs diff | Keratin changed pixels / abs diff | Nail-bed changed pixels / abs diff |
|---|---:|---:|---:|---:|
| OpenAI | 28,880 | 29,212 / 2,955,860 | 158 / 14,673 | 183 / 10,027 |
| Claude | 29,570 | 29,351 / 3,025,078 | 157 / 13,673 | 180 / 9,778 |
| Gemini | 25,489 | 26,327 / 2,541,054 | 155 / 15,449 | 180 / 10,541 |
| Grok | 30,752 | 30,502 / 2,972,114 | 115 / 10,290 | 135 / 7,935 |

Each counterfactual changed only one semantic material role and changed no
geometry. The evidence receipt is
`hololand.model-village.character-appearance-h3q-witness.v1`, receipt digest
`cf948b512fd88c3c7c4766260eae5b9f9bba99d573eca4466a4f436a7d968f7e`.

## Visual inspection

The 2 × 2 native contact sheet was inspected at original resolution. All four
hand plates are readable against the Stormglass background; finger volumes and
nail silhouettes remain stable under the shared light. Baseline keratin and
nail-bed differences are deliberately subtle at this framing, while the
role-specific GPU counterfactuals prove that both regions contribute distinct
pixels. The plate is renderer evidence, not a substitute for the aspirational
Model Village concept art.

## Validation

- PASS: H3Q `.holo`, `.hsplus`, and `.hs` parse through HoloScript.
- PASS: four residents compile twice with byte-identical output.
- PASS: compiler output has 20 `keratin-nail` and 10 `nail-bed` groups per
  resident.
- PASS: native Dawn/WebGPU readback for all four residents.
- PASS: skin, keratin, and nail-bed counterfactual thresholds for every plate.
- PASS: `node --test
  scripts/__tests__/hololand-model-village-character-appearance-h3q.test.mjs`
  (2/2).
- PASS: visual inspection of the generated PNG at original resolution.

Workspace baseline remains red outside H3Q. `npm test` passed the Babylon and
PlayCanvas adapter suites, then stopped in `@hololand/three-adapter`: 59 tests
passed, while nine suites could not import pre-existing missing dependencies
`three`, `react`, and `@testing-library/react`. No H3Q path imports those
packages. This is recorded as baseline-red, not treated as a passing full
workspace suite.

## Claim boundary

H3Q proves a calibrated analytic shader contract under one fixed light. It does
not prove measured tissue optics, production skin textures, browser WebGPU,
Quest/WebXR, TAA convergence, end-to-end display latency, biometric likeness,
photorealism, or whole-world convergence.

The wall-clock render/readback values in the JSON include submission, readback,
and first-use warm-up. They are diagnostic only. No GPU timestamp or fresh RTX
performance benchmark is claimed.

## Next bounded lane

Proceed to palm silhouette and joint-deformation convergence: then validate the
same material profile over flexion/extension poses before widening to facial
skin regions or final-world lighting.
