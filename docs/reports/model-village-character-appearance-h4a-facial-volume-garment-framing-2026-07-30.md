# Model Village Character Appearance H4A

## Outcome

H4A is a passing, source-pinned HoloScript facial-volume and garment-framing
witness for four symbolic model-family residents: OpenAI, Claude, Gemini, and
Grok. The durable 1400x900 plate was rendered in Chrome through HoloScript's
native WebGPU character compiler and renderer, then visually inspected across
two framing passes.

This lane closes four bounded gaps left by H3Z:

- `portrait-facial-volume-v5` emits source-controlled nasal bridge and tip,
  philtrum, malar, mandibular, lip, and denser brow-arc volume.
- `scalp-flow-portrait-v4` adds two brow ribbons and four lash ribbons using
  the hair material while preserving zero final scalp-penetration vertices.
- `layered-ocular-calibrated-v3` reduces the remaining doll-eye imbalance with
  restrained iris, pupil, cornea, lid-opening, scleral exposure, and inherited
  lower-cornea wetline geometry.
- `stormglass_portrait_fieldcoat` extends the coat through a split lower hem
  with seven closures and two cuff bands.

The accepted plate uses two source-derived frames per resident. The primary
frame remains a facial close-up. A garment-focused inset is computed from the
emitted coat vertex range, making the torso, placket, closures, sleeves, cuffs,
and lower-coat direction materially more legible than the first whole-character
framing pass.

This remains an incremental native-realism result. The residents are
procedurally modeled and visibly stylized; they do not yet match the
aspirational character art. H4A is not a claim of photorealism, photographic
HDRI, TAA convergence, GPU timing, physically calibrated cinematography, or
final production-character quality.

## Source provenance

- HoloLand world source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h4a-facial-volume-garment-framing.holo`
- Typed admission policy:
  `source/proofs/model-village-character-appearance-h4a-facial-volume-garment-framing-policy.hsplus`
- Deterministic seed:
  `source/proofs/model-village-character-appearance-h4a-facial-volume-garment-framing-seed.hs`
- Pinned HoloScript commit:
  `0e5b0a3b7745f4113ee8b9dd62f70be9fc63d8d2`
- Pinned HoloScript capsule:
  `sha256:1bdbc7edb1bf50b7cae97919e3f53a8ff61c23f1acfe9738c21a816aed8cb793`
- HoloScript promotion receipt:
  `sha256:49a9767760ee8ea5aff6512d1fe408fa147a7a06bf8abdd68e81db55a743846f`
- Source compiler:
  `CharacterWebGPUCompiler.compile`
- Browser renderer:
  `HoloScript CharacterRender.renderCharacter`

The `.holo` source owns resident identity labels, facial proportions, calibrated
eye values, groom density, garment style, lighting, asymmetric pose,
expressions, and LOD budgets. The `.hsplus` program expresses a typed,
fail-closed admission policy over the native geometry receipts and dual-frame
coverage. The flat `.hs` program carries the deterministic seed and forbidden
input classes. Native hsplus action execution is not claimed; the sovereign
local parser admits the program and the checker enforces its contract.

## Native compiler admission

All four residents compiled twice with byte-identical outputs. Close-up geometry
ranged from 12,887 to 12,919 vertices and 58,362 to 58,446 indices. The authored
distance-LOD counterfactual ranged from 8,861 to 8,869 vertices.

For every resident, the compiler returned:

- `holoscript.agent-avatar-facial-landmarks.v5`
  - `profile = portrait-facial-volume-v5`
  - `facialVolumeProfile = nasal-malar-mandibular-volume-v1`
  - 255 nose-bridge/tip vertices
  - 108 philtrum vertices
  - 22 brow-arc segments
  - inherited connected cupid-bow lip ribbon
- `holoscript.agent-avatar-groom-geometry.v4`
  - `profile = scalp-flow-portrait-v4`
  - `facialFramingProfile = portrait-brow-lash-ribbons-v1`
  - two brow cards and four lash cards
  - more than 200 facial-framing vertices
  - zero final scalp-penetration vertices
- `holoscript.agent-avatar-ocular-geometry.v3`
  - `profile = layered-ocular-calibrated-v3`
  - `calibrationProfile = portrait-ocular-balance-v1`
  - source-authored iris scale from 0.44 to 0.47
  - source-authored pupil scale from 0.32 to 0.36
  - inherited lower-cornea tear meniscus
- `holoscript.agent-avatar-garment-geometry.v4`
  - `style = stormglass_portrait_fieldcoat`
  - `constructionProfile = portrait-full-fieldcoat-v3`
  - seven closures and two cuff bands
  - source-scaled coat length from 1.372265 m to 1.496695 m
  - source-scaled front split depth from 0.616987 m to 0.672933 m
  - `portraitFramingProfile = full-coat-closures-cuffs-v1`

The H3Z room basis, material-depth response, tear meniscus, four-row lid blend,
crossweave material tile, groom containment, expression-normal recomputation,
cranial-neck stitch, source pose, 44x30 close-up face tier, and 24x16 distance
face tier remain admitted.

## Chrome WebGPU witness

Captured at `2026-07-30T05:43:00.020Z` with:

- Chrome `150.0.7871.187`
- `navigator.gpu = true`
- NVIDIA Ampere adapter acquired and device created
- zero external network requests
- 20 browser WebGPU character renders: portrait, garment frame, room
  counterfactual, static-normal counterfactual, and distance-LOD
  counterfactual for each resident
- screenshot SHA-256
  `f316cb078d3c5eefc08027e4da735bc07b6845fa222f93b4e7cf2bb6ae27103f`
- screenshot size 703,737 bytes
- receipt integrity
  `574444d99dfcdb0af73f873559b616fcf441915fe050f42dd65e922f7ca21fbf`

| Resident | Portrait pixels | Garment-frame pixels | Room delta pixels | Normal delta pixels | LOD delta pixels |
|---|---:|---:|---:|---:|---:|
| OpenAI | 107,509 | 96,466 | 107,402 | 17,521 | 11,653 |
| Claude | 107,538 | 97,630 | 107,414 | 18,427 | 11,816 |
| Gemini | 104,881 | 97,201 | 104,784 | 16,085 | 11,186 |
| Grok | 112,590 | 97,103 | 112,435 | 20,097 | 11,125 |

Every portrait and garment frame passed non-background coverage gates. Every
authored-room, recomputed-normal, and close-up-LOD counterfactual produced a
non-zero, gate-clearing pixel difference. Secondary joint weights were consumed
in all four browser witnesses.

## Hardware and claim boundary

The task-native witness read back:

`NVIDIA GeForce RTX 3060 Laptop GPU, driver 610.88, 6144 MiB`

Chrome independently reported an NVIDIA Ampere WebGPU adapter and created a
device. This proves the browser runtime used by this witness. It is not a timing
benchmark:

The non-invasive `check:codex-hardware` baseline passed at
`2026-07-30T05:47:45.946Z`. Its default browser probe was intentionally skipped;
the task-native CDP witness above independently acquired the adapter and device,
rendered, and read pixels back.

- browser WebGPU measured: **true**
- browser adapter and device measured: **true**
- dual-frame portrait and garment rendering measured: **true**
- TAA convergence measured: **false**
- GPU timestamp measured: **false**
- fresh RTX benchmark claimed: **false**
- Quest headset measured: **false**
- browser WebXR measured: **false**
- photographic HDRI claimed: **false**
- photorealism claimed: **false**
- full-world performance claimed: **false**

## Validation

Passing scoped checks:

```text
pnpm --filter @holoscript/engine exec vitest run \
  src/character-render/__tests__/AgentAvatarMesh.test.ts \
  src/character-render/__tests__/hair.test.ts \
  src/character-render/__tests__/eyes.test.ts \
  src/character-render/__tests__/AgentAvatarGarment.test.ts \
  src/character-render/__tests__/CharacterHostFromComposition.test.ts
  PASS: 5 files / 95 tests

pnpm --filter @holoscript/core exec vitest run \
  src/compiler/__tests__/CharacterWebGPUCompiler.test.ts
  PASS: 1 file / 17 tests

pnpm exec tsc --noEmit -p packages/engine/tsconfig.json
pnpm --filter @holoscript/core typecheck

npm test
  PASS: 61 of 62 HoloLand workspace projects in recursive test scope

pnpm test:hololand-model-village-character-appearance-h4a
node scripts/check-hololand-model-village-character-appearance-h4a.mjs \
  --holoscript-root C:/holorepo-worktrees/holoscript-h4a-facial-volume-garment-framing \
  --browser "C:/Program Files/Google/Chrome/Application/chrome.exe" \
  --write-artifacts --skip-manifest
```

The HoloLand checker independently parses the `.holo`, `.hsplus`, and `.hs`
inputs through the sovereign local HoloScript parser surface before compilation.
The Chrome witness then compiles the named residents, constructs an actual
adapter and device, renders all five views per resident, reads pixels back, and
captures the final plate.

## Next bounded realism lane

H4B should keep temporal quality and performance evidence separate from H4A's
static look-development result:

1. add a deterministic micro-motion sequence for head, eyes, brows, hair edges,
   coat hem, and cuff silhouettes;
2. prove TAA convergence against a source-authored jitter sequence with
   per-frame ghosting and disocclusion metrics;
3. measure real WebGPU GPU timestamps only when the adapter exposes the required
   feature, with wall-clock fallback clearly labeled non-GPU;
4. preserve the H4A portrait and garment frames as static visual controls;
5. keep LOD-transition quality, timing, RTX identity, Quest, WebXR, and
   full-world claims independently receipted.
