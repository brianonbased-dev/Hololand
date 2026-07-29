# Model Village Character Appearance H3M — Anatomical Hands

Date: 2026-07-28 America/Phoenix
Lane: H3M deltoid transition and articulated digit topology
Status: native HoloScript source, topology, pose clearance, and local visual witness pass; production realism, native scene WebGPU/TAA, and Quest/WebXR remain unclaimed

## Outcome

H3M adds an opt-in `coherent_anatomical_limbs_v2` body profile to the native
HoloScript character path. The profile emits a smoother twelve-ring
torso/shoulder/neck surface, a nine-ring deltoid-to-palm surface per side, and
five independently skinned three-phalanx digit surfaces per hand. The four
symbolic residents remain OpenAI, Claude, Gemini, and Grok.

The upstream work was promoted through two bounded HoloRepo changes:

- `h3m-anatomical-hands` at
  `a89d351926609aa4aa9c00befbecf2622796c885` added the native geometry and
  receipt contract.
- `h3m-anatomical-hands-compiler` at
  `7ed46ad627d5b9582216f008aa82021ef4e85152` admitted the profile through
  `CharacterHostFromComposition` so authored `.holo` traits reach the sovereign
  `CharacterWebGPUCompiler.compile` target.

The final HoloLand witness pins the second commit and exact hashes for the body
builder, garment builder, character host, composition mapper, hair builder, and
native character compiler.

## HoloScript-native source

- `.holo` authors the complete four-resident character composition. Every
  resident directly selects `coherent_anatomical_limbs_v2`; the checker does not
  patch the parsed AST to manufacture the profile.
- `.hsplus` defines fail-closed admission intent for the anatomical limb,
  deltoid overlap, five digits, three phalanx segments, and six connected
  surfaces per limb. Native hsplus action execution is not claimed; the checker
  parses and independently enforces the contract.
- `.hs` fixes the deterministic resident order, model-family labels, exact
  topology counts, pose set, and forbidden nondeterministic inputs.

The checker loads the exact promoted parser, compiler, and character-render
sources through an esbuild validation module resolver, then invokes
`CharacterWebGPUCompiler.compile`. This avoids stale built-package artifacts
without changing compiler semantics or using a presentation-only body override.

## Native geometry evidence

The accepted visual-run witness receipt is
`ca5ba9f2d5a10c227e40031a86528afd42025e966150fb6c0419d09a234f723d`.

| Check                                        |             Measured result |
| -------------------------------------------- | --------------------------: |
| Native character bundles                     |                           4 |
| Anatomical upper-body receipts               |                           4 |
| Anatomical limb receipts                     |                           8 |
| Articulated digit receipts                   |                          40 |
| Connected surfaces across eight limbs        |                          48 |
| Tailored garment receipts                    |                           4 |
| Upper-body rings / vertices / indices        |            12 / 288 / 1,584 |
| Arm-palm rings / vertices / indices per side |             9 / 217 / 1,224 |
| Digit rings / vertices / indices per digit   |                5 / 41 / 216 |
| Pose/resident clearance receipts             |                          12 |
| Posed torso/garment triangle intersections   |                           0 |
| Minimum measured torso/garment clearance     |       0.02385231928147596 m |
| Minimum outward-ray garment coverage         |                         1.0 |
| Repeated compile byte identity               |                        pass |
| Stripped-profile causal geometry delta       | pass for all four residents |

Each digit receipt is
`holoscript.agent-avatar-digit-geometry.v1` with
`articulated-three-phalanx-v1`, eight radial segments, five rings, and skinning
to exactly four in-range rig joints: hand, proximal, intermediate, and distal.
The checker walks every declared index range and proves that all 41 vertices in
each digit form one connected surface.

Each limb reports a deltoid overlap above 0.02 m. Measured overlap depths are
0.029378 m (OpenAI), 0.028927 m (Claude), 0.027062 m (Gemini), and 0.031465 m
(Grok). The inherited tailored garment still clears all three poses for all four
residents.

## Topology boundary

“Connected surfaces” is deliberately plural. Each side contains one connected
arm/palm surface plus five connected digit surfaces, for six surfaces per limb.
The digit bases are embedded into the palm silhouette but do not share vertices
with the palm. H3M therefore does not claim a single watertight hand, shared
palm/finger topology, shared torso/arm vertices, knuckle webbing, nail beds, or
production deformation around the metacarpals.

The pre-existing `coherent-shoulder-neck-torso-v1` output was cross-checked
between the H3L and H3M candidates. Positions, normals, tangents, indices, joint
indices, joint weights, and the upper-body receipt produced identical SHA-256
values, so the new profile is opt-in rather than a silent v1 geometry change.

## Visual and GPU truth

The accepted image is 1,800 × 900, 369,799 bytes, SHA-256
`9dd340304bbdafb3139fa4ca1d7b56ca84abd7110e0c73e8fa54b67e9dd46887`.
It uses one full four-resident stage plus four magnified, isolated hand-detail
views. The detail views render the actual compiled arm/palm and digit index
ranges; they are not concept-art replacements.

The capture read back:

- Chrome `150.0.7871.182`.
- ANGLE on NVIDIA GeForce RTX 3060 Laptop GPU, Direct3D 11.
- Hardware antialiasing enabled with four samples.
- Four native resident meshes and forty digit receipts.
- Zero external browser requests and zero page errors.

This is a visual hardware witness, not a new RTX performance benchmark. No
frame-time number from H3M is promoted. The scene still uses the Three.js
WebGL/ANGLE D3D11 material bridge; it is not native WebGPU scene rendering, a
WebGPU timestamp query, TAA, end-to-end display latency, motion reprojection, or
a Quest/WebXR measurement. The earlier H3L 6 ms wall-clock renderer sample
remains a historical H3L receipt and is not relabeled as H3M evidence.

## Visual review

The hand detail is materially more legible than H3L’s capped palms: all five
digits have distinct silhouettes, deterministic length variation, tapered tips,
and three-phalanx rig binding. The deltoid swell also reduces the straight tube
read at the upper arm.

The image is still far from the target art:

- digit bases lack continuous webbing and palm-shared topology;
- palms have no thenar/hypothenar mass, knuckle plane, creases, nails, or tendon
  landmarks;
- elbows and wrists remain analytically smooth and underspecified;
- the shoulder-to-sleeve boundary is visibly layered;
- cloth remains procedural without production folds, seams, or stitching;
- skin and hair remain low-detail procedural materials;
- the residents are symbolic designs, not biometric likenesses;
- the stage has no native TAA or production post-processing.

The next realism lane should make each hand a single watertight palm-and-digit
surface with webbing and knuckle landmarks, then retarget sleeve and shoulder
clearance around that geometry. Skin microstructure and hair fidelity should
follow, not conceal, that silhouette work.

## Validation

- HoloScript engine typecheck passed for the geometry and mapping changes.
- HoloScript character-render slice: 105 passed, 1 intentionally skipped.
- H3M HoloLand Node tests: 4 passed, 0 failed.
- All three HoloScript formats parsed from the promoted source toolchain.
- Four native compiler bundles, forty digit topology proofs, deterministic
  recompiles, stripped-profile causal deltas, twelve pose-clearance proofs, and
  the D3D11 visual capture passed.

The first one-resident export against a borrowed H3L dependency junction failed
closed with the v2 profile reported as unsupported. That result was rejected.
The isolated HoloScript candidate was then fully hydrated offline with zero
downloads, engine/core rebuilt against current workspace links, and the final
source-resolved compiler witness passed. No provider model calls, research-seat
joins, resident observation writes, canonical village mutations, external
textures, native TAA, fresh RTX benchmark, Quest/WebXR result, biometric
likeness, or photorealism are claimed.
