# Model Village Character Appearance H3Z

## Outcome

H3Z is a passing, source-pinned HoloScript material-depth and room-response
witness for four symbolic model-family residents: OpenAI, Claude, Gemini, and
Grok. The durable 1400x900 image was rendered in Chrome through HoloScript's
native WebGPU character compiler and renderer, then visually inspected across
three look-development passes.

This lane adds five bounded improvements over H3Y:

- A structured fieldcoat shell with raised facings, five closure studs, two
  cuff bands, resident-scaled thickness, and a compact crossweave
  albedo/normal/roughness material tile.
- Twelve deterministic flyaway cards per resident while preserving the
  ellipsoidal scalp-containment invariant and zero final penetration vertices.
- Four rows of cubic lid-transition topology between the face and orbital
  opening.
- A separately indexed lower-cornea tear meniscus with 192 indices per
  resident.
- A source-authored Stormglass room basis in the skin shader, with a rendered
  no-room-basis counterfactual.

The final presentation pass increases source-authored key, fill, and rim energy
and labels the receipts visible in each card. This is an incremental
native-realism result. The procedural faces remain visibly stylized and do not
yet match the aspirational character art. H3Z is not a claim of photorealism,
photographic HDRI, physically calibrated cinematography, or final character
quality.

## Source provenance

- HoloLand source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h3z-material-depth-room-response.holo`
- Typed admission policy:
  `source/proofs/model-village-character-appearance-h3z-material-depth-room-response-policy.hsplus`
- Deterministic seed:
  `source/proofs/model-village-character-appearance-h3z-material-depth-room-response-seed.hs`
- Pinned HoloScript commit:
  `3987bb2ba5e70a62c6c9b1aa65d4d55ad3fef989`
- Pinned HoloScript capsule:
  `sha256:86229a6bd536cb6a89e85f0ac09d2eec9f67ad67f3b18469d260b54a0121fbb5`
- HoloScript promotion receipt:
  `sha256:ce32923b0f4618c2ec4a87f28aac43e8e8a0ba9b6c2dc0c1c20670f9e085d4f4`
- Source compiler:
  `CharacterWebGPUCompiler.compile`
- Browser renderer:
  `HoloScript CharacterRender.renderCharacter`

The `.holo` source owns resident identity labels, appearance parameters,
material/groom/ocular/environment profiles, asymmetric pose, expressions, and
LOD budgets. The `.hsplus` policy fails closed over the expected native
receipts. The `.hs` seed is deterministic and has no provider/model binding.
All three formats were independently admitted by the sovereign local
HoloScript parser surface.

## Native compiler admission

All four residents compiled twice with byte-identical outputs. Close-up
geometry ranged from 11,954 to 11,986 vertices and 54,294 to 54,378 indices.
Authored distance-LOD counterfactuals ranged from 7,928 to 7,936 vertices.

For every resident, the engine returned:

- `holoscript.agent-avatar-garment-geometry.v3`
  - `constructionProfile = structured-fieldcoat-shell-v2`
  - `constructedPanelCount = 4`
  - `closureCount = 5`
  - `cuffBandCount = 2`
  - `fabricSurfaceProfile = stormglass-crossweave-normal-v1`
  - source-derived shell thickness from 0.008510 m to 0.009282 m
- `holoscript.agent-avatar-groom-geometry.v3`
  - `profile = scalp-flow-breakup-v3`
  - `breakupProfile = contained-flyaway-breakup-v1`
  - 12 flyaway guides and 12 flyaway cards
  - zero final scalp-penetration vertices
- `orbitalProfile = anatomical-lid-blend-v3`
  - `lidTransitionProfile = cubic-lid-blend-v1`
  - four lid-transition rows
- `holoscript.agent-avatar-ocular-geometry.v2`
  - `profile = layered-ocular-tearfilm-v2`
  - `tearMeniscusProfile = lower-cornea-meniscus-v1`
  - 192 meniscus indices
- `holoscript.character-environment-light.v3`
  - `profile = stormglass-room-basis-v2`
  - `responseProfile = source-authored-room-basis-v2`
  - `photographicHdri = false`

The H3Y cranial-neck stitch, source pose, expression-normal recomputation,
44x30 close-up face budget, 24x16 distance face budget, fixed-light skin
calibration, and secondary joint weights remain admitted.

## Chrome WebGPU witness

Captured at `2026-07-30T04:14:03.436Z` with:

- Chrome `150.0.7871.187`
- `navigator.gpu = true`
- NVIDIA Ampere adapter acquired and device created
- zero external network requests
- screenshot SHA-256
  `c5f79a538aac26dee1c52315eb3af732b360c4188f75ea9e5e899f9eef929e37`
- screenshot size 675,485 bytes
- receipt integrity
  `a1f19b9ed9cba3bb87045ea8598f5263306af936508c5bbce0460aafa9a01338`

| Resident | Non-background pixels | Room-basis delta pixels | Normal delta pixels | LOD delta pixels |
|---|---:|---:|---:|---:|
| OpenAI | 107,272 | 107,132 | 17,458 | 11,449 |
| Claude | 107,371 | 107,244 | 18,371 | 11,699 |
| Gemini | 104,561 | 104,463 | 16,033 | 10,972 |
| Grok | 112,315 | 112,183 | 18,861 | 10,822 |

Every portrait passed coverage and luminance-range gates. Every authored-room,
recomputed-normal, and close-up-LOD counterfactual produced a non-zero,
gate-clearing pixel difference. Secondary joint weights were consumed in all
four browser renders.

## Hardware and claim boundary

The witness read back:

`NVIDIA GeForce RTX 3060 Laptop GPU, driver 610.88, 6144 MiB`

Chrome independently reported an NVIDIA Ampere WebGPU adapter and created a
device. This proves the browser runtime used by this witness. It is not a fresh
RTX timing benchmark:

- browser WebGPU measured: **true**
- browser adapter and device measured: **true**
- GPU timestamp measured: **false**
- fresh RTX benchmark claimed: **false**
- Quest headset measured: **false**
- browser WebXR measured: **false**
- photographic HDRI claimed: **false**
- photorealism claimed: **false**
- full-world performance claimed: **false**

The non-invasive `check:codex-hardware` baseline passed. Its separate optional
`--probe-browser` path could not launch because `playwright` is not installed in
the `.ai-ecosystem` package context. H3Z does not treat that unavailable helper
as a pass: browser WebGPU admission instead comes from the task-native CDP
harness, which independently verified `navigator.gpu`, adapter acquisition,
device creation, shader/pipeline/texture/buffer/encoder methods, render output,
and pixel readback.

## Validation

Passing scoped checks:

```text
sovereign local parse_holo(.holo): success = true
sovereign local parse_hs(.hsplus): success = true
sovereign local parse_hs(.hs): success = true
node --test scripts/__tests__/hololand-model-village-character-appearance-h3z.test.mjs
node scripts/check-hololand-model-village-character-appearance-h3z.mjs \
  --holoscript-root C:/holorepo-worktrees/holoscript-h3z-material-depth-room-response \
  --browser "C:/Program Files/Google/Chrome/Application/chrome.exe" \
  --write-artifacts --skip-manifest
```

The pinned HoloScript engine candidate passed six focused Vitest files with 90
tests passed and 15 GPU-gated tests skipped. Its candidate typecheck reached
only the existing WebXR ambient-type baseline errors; it produced no H3Z-file
diagnostics. The HoloLand test and browser witness are the scoped validation for
this isolated source/proof lane.

## Next bounded realism lane

H4A should address the largest visible gap between the deterministic witness
and the aspirational art:

1. replace the remaining mask-like facial planes with source-controlled nose,
   philtrum, cheek, jaw, and lip volume profiles;
2. make the full fieldcoat torso, placket, closures, cuffs, and cloth thickness
   legible in the accepted camera frame;
3. add density-aware hair coverage and eyebrow/eyelash geometry without
   violating the zero-penetration gate;
4. calibrate eye scale, scleral exposure, corneal highlight, lid occlusion, and
   wetline energy under the authored room basis;
5. keep TAA convergence and real GPU timestamps as a separate performance gate,
   so visual quality and timing evidence remain independently attributable.
