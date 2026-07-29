# Model Village Character Appearance H3S: Hand-Surface Anatomy

Date: 2026-07-29  
Status: bounded native witness passed

## Outcome

H3S advances the four symbolic Model Village residents—OpenAI, Claude, Gemini,
and Grok—from the V4 deforming-hand profile to the source-selectable V5
hand-surface profile. The HoloScript compiler and native host now carry an
operative `holoscript.agent-avatar-hand-surface.v1` receipt through to native
Dawn WebGPU pixels.

The proof is authored as a three-format HoloScript stack:

- `.holo` owns the world, residents, poses, material inputs, V5 profile request,
  and claim boundaries.
- `.hsplus` owns the compiler and native-readback admission policy.
- `.hs` owns the deterministic seed and forbidden input classes.

This is a real source/compiler/runtime lane. It is not a render-only fixture.

## Upstream repair discovered by the proof

The first H3S native compile exposed a fixed-light material integration defect:
V5 cuticle-contoured nail plates emit 576 indices, while the native host still
required the V4 fixed count of 288.

HoloScript commit `8f1555f8a8ccf16a3745b9f021bcc21cf87e2b96`
replaced that hard-coded partition with a deterministic proportional partition
for any nail index count divisible by 12. The V4 receipt remains unchanged, and
the new V5 regression pins 4,320 keratin indices, 1,440 nail-bed indices, and
5,760 total nail-surface indices.

Focused upstream validation passed:

- engine TypeScript type check
- `CharacterHostFromComposition.test.ts`
- `AgentAvatarMesh.test.ts`
- 45 of 45 focused tests
- HoloRepo automatic-policy promotion

## Causal topology result

The contact sheet is organized as four resident rows and two columns:

- left: V5 `coherent-hand-surface-v5`
- right: V4 `coherent-deforming-hands-v4`

For each pair, the checker derives V4 by replacing only the four authored body
profile values. Pose, material source values, joint-deformation receipt, detail
camera, clear color, and light direction are held fixed.

| Resident | Changed pixels | Absolute RGB-channel delta | V5 figure pixels | V4 figure pixels |
|---|---:|---:|---:|---:|
| OpenAI | 7,501 | 307,462 | 26,411 | 26,433 |
| Claude | 5,904 | 269,512 | 23,968 | 23,908 |
| Gemini | 5,803 | 193,819 | 24,007 | 23,916 |
| Grok | 3,589 | 151,470 | 16,179 | 16,220 |

Every compiled resident recorded:

- a 1,336-vertex V5-over-V4 delta
- byte-identical repeated V5 compilation
- 1,008 secondary-influenced vertices
- 38 deformation joint pairs
- two hand-surface geometry receipts
- the exact aggregate V5 region counts pinned by the language tests

Native readback ran through
`HoloScript CharacterRender.renderCharacter` on the Dawn D3D12 backend. The
adapter reported NVIDIA Ampere / GeForce RTX 3060 Laptop GPU and driver
`32.0.16.1088`.

## Visual inspection

The 658 by 1,310 artifact is readable as four same-pose comparison rows. The V5
silhouettes retain the broad H3R gestures while introducing the denser tapered
digit, wrist-transition, commissure, metacarpal-knuckle, and cuticle topology.
The changes are intentionally subtle because this plate isolates topology under
fixed inputs.

This artifact is foundation geometry, not the final Model Village beauty shot.
It still lacks production skin textures, measured tissue response, cinematic
lighting, final grooming, and world-context composition. Those remain later
realism lanes.

## Evidence and claim boundary

- Witness schema:
  `hololand.model-village.character-appearance-h3s-witness.v1`
- Receipt SHA-256:
  `c136e5b405e650bbcc74f0f700703ddd1335c0f7c80b6d6eb4898100cdc0fb74`
- Contact-sheet PNG SHA-256:
  `4e3d6d3c5f1850d23560817e884702f92f6be4c8e005d26b8f09d5aa884ca1d0`
- Native topology pairs: 4
- Browser WebGPU measured: no
- GPU timestamp measured: no
- Fresh RTX benchmark claimed: no
- Wall-clock samples treated as GPU frame time: no
- Photorealism claimed: no
- Biometric likeness claimed: no
- Full-world convergence claimed: no

The recorded wall-clock durations include submission and readback. The first
plate also includes runtime warm-up. They are diagnostic observations only and
must not be presented as renderer or RTX benchmarks.
