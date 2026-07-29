# Model Village Character Appearance H3L — Upper-Limb Tailoring

Date: 2026-07-28 America/Phoenix
Lane: H3L connected upper limbs, shoulder/collar tailoring, and fresh RTX evidence
Status: source and current local desktop evidence pass; Quest/WebXR and photorealism remain unclaimed

## Outcome

H3L replaces the legacy box-segment arm path for the coherent upper-body profile
with one indexed, skinned shoulder-to-palm component on each side. It also narrows
the open civic garment around the shoulder shell and emits explicit collar, sleeve
root, and sleeve cuff measurements. The four symbolic residents remain OpenAI,
Claude, Gemini, and Grok.

The HoloScript upstream implementation was promoted through HoloRepo as
`h3l-coherent-upper-limbs` at commit
`7d7ebaefb1dcfe7bba15525d6f261cc216aab793`. HoloLand pins that exact commit and
the source hashes of the mesh, garment, character host, composition bridge, hair,
and compiler files.

## HoloScript-native source

- `.holo`: the read-only world/look-development contract, four named witnesses,
  exact upper-limb topology envelope, garment tailoring envelope, and fail-closed
  fresh-GPU admission requirements.
- `.hsplus`: executable-intent admission actions for upper-limb receipts,
  tailored garments, and a fresh RTX hero. Native hsplus action execution is not
  claimed in H3L; the checker parses and independently enforces the contract.
- `.hs`: a flat deterministic manifest for the four residents and all exact
  geometry/admission constants.

The H3L checker compiles the inherited H3K character composition through the
promoted HoloScript `character-webgpu` target. The new H3L source is therefore an
admission overlay on executable HoloScript character source, not a detached
presentation-only description.

## Geometry and pose evidence

The final H3L witness receipt recorded for this report is
`c723452b51ca32f288049468cf1fb91ae1b8c0c38176a9bdd63e302540e5e7cd`.

| Check | Measured result |
|---|---:|
| Native character bundles | 4 |
| Upper-limb receipts | 8 |
| Connected upper-limb components | 8 |
| Tailored garment receipts | 4 |
| Upper-limb vertices per side | 193 |
| Upper-limb indices per side | 1,080 |
| Pose/resident clearance receipts | 12 |
| Posed triangle intersections | 0 |
| Minimum measured body/garment clearance | 0.02385231928147596 m |
| Minimum outward-ray garment coverage | 1.0 |

Every emitted limb uses
`holoscript.agent-avatar-upper-limb-geometry.v1`,
`coherent-arm-palm-v1`, 24 radial segments, and 8 rings. The checker independently
walks each receipt's index range and proves all 193 declared vertices belong to
one connected component. This proves shoulder-to-palm continuity within each
limb; H3L does not claim the limb and torso share vertices.

The four measured shoulder-shell half widths are 0.391706 m (OpenAI), 0.38569 m
(Claude), 0.360831 m (Gemini), and 0.419539 m (Grok). Grok's intentionally
broader frame caused the initial 0.4 m admission cap to fail; the source and
policy now use a measured 0.43 m envelope. Sleeve root/cuff radii are respectively
0.095701/0.052302 m, 0.095976/0.052452 m, 0.091484/0.049997 m, and
0.09978/0.054531 m, so all four sleeves are explicitly tapered.

## Fresh RTX truth

Earlier RTX scene numbers remain legitimate only as timestamped historical
captures. They are not current-driver evidence after the driver loss and
reinstallation.

The fresh post-install checks on this machine measured:

- NVIDIA installer process: absent.
- Windows display-device state: RTX 3060 Laptop GPU `OK`, `CM_PROB_NONE`.
- Generic pending rename strings: 16; NVIDIA/display-driver matches: 0.
- `nvidia-smi`: NVIDIA GeForce RTX 3060 Laptop GPU, driver `610.88`, 6,144 MiB.
- CIM driver readback: `32.0.16.1088`.
- Chrome: `150.0.7871.182`.
- Headed secure-localhost WebGPU probe: `navigator.gpu`, high-performance adapter,
  and `requestDevice()` all passed; `timestamp-query` was exposed.
- Fresh H3L scene bridge: ANGLE on NVIDIA RTX 3060 Laptop GPU, Direct3D 11,
  hardware antialiasing enabled.
- Fresh scene samples: 20 timed frames, `renderer.render` p95 of 6 ms.
- Browser purity: 0 external requests and 0 page errors.
- Screenshot: 1,800 × 900, 400,806 bytes,
  SHA-256 `91b963b5aab773041379f9370af9c4b0cebaf8ba362e157d848134c0f65774e9`.
- Fresh scene receipt:
  `262e03d8f2abd3e12a85840265846cfa45d28f54db9cebd01449c0c975c89045`.

The 6 ms number is a browser wall-clock measurement around `renderer.render`.
It is not a WebGPU GPU timestamp, an end-to-end display latency, a Quest/WebXR
measurement, or a guarantee of 142 FPS. The WebGPU device probe and the H3L scene
measurement are two distinct receipts: the current scene bridge still renders
through Three.js WebGL/ANGLE D3D11.

## Visual review

The fresh image is materially better than H3K: heads are consistently visible,
the collar is narrower, the shoulder silhouette is less wing-like, and the arms
form continuous tapered skin surfaces rather than a stack of legacy boxes.

It is not yet realistic enough for the target art. Visible limitations remain:

- the shoulder-to-sleeve transition still reads as separate layered shells;
- palms are simple caps without fingers or knuckle landmarks;
- elbow and wrist silhouettes remain mechanically cylindrical;
- cloth is analytic procedural geometry without production folds or stitching;
- skin and hair remain procedural, low-detail, and non-photoreal;
- the presentation has no native TAA, motion reprojection, or WebGPU scene path.

The next bounded realism lane should be H3M: anatomical shoulder/deltoid seam
convergence plus articulated palm/finger topology, followed by a fresh
same-camera A/B capture. That is a higher visual return than adding more
post-processing to the current geometry.

## Validation boundary

Focused H3L Node tests: 5 passed, 0 failed. The promoted HoloScript
character-render suite previously passed 87 tests with 17 skipped, and engine
typecheck passed. A broad recursive dependency build encountered an unrelated
existing `@holoscript/alphafold-plugin` TS5096 configuration failure; the exact
runtime dependencies required for this lane were built and the H3L compile,
topology, pose-clearance, browser, and screenshot gates all passed afterward.

No provider model calls, live research joins, resident observation writes,
canonical village mutations, external textures, biometric likeness, native TAA,
Quest/WebXR measurement, or photorealism are claimed.
