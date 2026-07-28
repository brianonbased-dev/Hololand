# HoloLand Model Village Character Appearance H3D

Date: 2026-07-28

Status: PASS — bounded native ocular-region foundation

Milestone: `MV_CHARACTER_APPEARANCE_H3D_NATIVE_OCULAR_REGIONS`

## Outcome

H3D replaces H3C's presentation-only procedural iris shader with source-authored,
compiler-serialized ocular geometry and material roles. Every compiled resident now has
separate left/right sclera, iris, pupil, and cornea ranges. The HoloLand proof maps those
native groups into ordinary physical materials; it does not inject an `onBeforeCompile`
eye shader.

This is a real language/runtime increment, not a screenshot-only improvement:

- `.holo` authors `@face(ocular_profile: "layered_ocular_v1")`, iris/sclera colors,
  iris and pupil scale, and cornea IOR.
- `.hsplus` defines fail-closed admission and the no-presentation-shader firewall.
- `.hs` fixes the three deterministic ocular seeds.
- HoloScript commit `ac44ce5fbdb93c4a78e17a3c535138de49978bbd` owns the geometry builder,
  composition mapping, draw-spec roles, material packing, WGSL shading, and transparent
  cornea draw path.

## Native compiler evidence

The sovereign `character-webgpu` compiler emitted:

- 3 personas × 3 authored LODs = 9 byte-identical replay bundles;
- 3 native expression receipts;
- exactly 8 refractive-eye material groups per bundle;
- exactly 2 groups each for `sclera`, `iris`, `pupil`, and `cornea`;
- transparent draw flags and IOR `1.376` on both cornea groups;
- no legacy composite eye group;
- no compiler fallback and no stubbed source traits.

Against the same H3D source with the layered ocular fields removed, the first LOD0 bundle
measured:

- `+532` vertices;
- `+848` triangles;
- 1,168 ocular triangles total in the layered profile;
- 6,519 vertices in the legacy-composite comparison bundle.

The source-authored iris and sclera colors are present in the serialized materials for all
nine bundles.

## GPU look-development loop

The final portrait witness was rendered at 1800×720 in Chrome 150 through ANGLE D3D11 on
the NVIDIA GeForce RTX 3060 Laptop GPU. The browser made zero external requests.

Three inspected iterations were used:

1. Native regions were visible, but a bright cornea projection and asymmetric eye point
   light washed out the left iris.
2. Cornea opacity, clearcoat, exposure, and key/fill intensities were reduced without
   changing source geometry or adding a shader override.
3. The asymmetric point light was removed. Both eyes then retained their authored iris
   color under shared key/fill/environment lighting.

Accepted visual:

`docs/assets/model-village/model-village-character-appearance-h3d-native-ocular-portraits-2026-07-28.png`

Accepted image SHA-256:

`09d3b9a0f30203e3753a9a3d329e34ee3687b33466bec4d63b7fa2c229323a4e`

Measured compatibility-projection timing:

- accepted visual-loop frame-interval p95: `18.69999998807907 ms`;
- accepted visual-loop render-submit p95: `4.699999988079071 ms`;
- manifest-verification rerun frame-interval p95: `19.0 ms`;
- manifest-verification rerun render-submit p95: `3.5 ms`;
- simultaneous portrait renderers: 3.

The 11.1 ms VR budget is not claimed. This is a desktop D3D11 look-development
projection, while the HoloScript engine test separately exercised the layered material path
on live Dawn WebGPU.

## Truth boundary

H3D proves:

- native sclera, iris, pupil, and cornea geometry;
- native serialized eye-region roles and authored colors;
- a transparent cornea material group;
- deterministic compilation and a real topology delta;
- a presentation that consumes those groups without painting the iris in a custom shader.

H3D does not prove:

- a wet tear film or lacrimal meniscus;
- sclera vascular or iris texture atlases;
- anatomically calibrated eyeball/eyelid fit;
- scan-derived anatomy or biometric likeness;
- production hair, brows, lashes, teeth, tongue, or ear anatomy;
- normals/tangents recomputed after facial morphs;
- production TAA, motion reprojection, or VR-budget convergence;
- photorealism.

The remaining visual delta is explicit: the underlying procedural eyelid aperture remains
round and exposed, and the inherited low-LOD hair cards still cross facial landmarks. The
new ocular regions are much more legible than H3C's single composite eye sphere, but the
face is still stylized.

## Validation

- `pnpm --filter @holoscript/engine exec vitest run src/character-render/__tests__/eyes.test.ts --reporter=verbose`
  - 6/6 passed on live Dawn GPU.
- `pnpm --filter @holoscript/engine exec vitest run src/character-render/__tests__/eyes.test.ts src/character-render/__tests__/CharacterHostFromComposition.test.ts src/character-render/__tests__/hair.test.ts src/character-render/__tests__/morph.test.ts`
  - targeted character suite passed.
- `pnpm --filter @holoscript/engine build`
  - passed.
- `pnpm run test:hololand-model-village-character-appearance-h3d`
  - 3/3 passed.
- `pnpm run check:hololand-model-village-character-appearance-h3d`
  - passed with real D3D11 GPU capture.
- `pnpm run check:hololand-model-village-character-appearance-h3d -- --require-manifest`
  - passed; manifest-verification receipt
    `5b364702b63ab23f0c647c71a12951193350fce0239ba644c21f3aeaa22cb36d`.

## Next bounded lanes

1. H3E orbital fit: recess the globe, add upper/lower lid occlusion and canthal shaping, and
   preserve the no-wet-film boundary.
2. H3F secondary facial regions: brows, nostril wings/openings, ear shells, lip volume,
   teeth, and tongue as independently serialized semantic regions.
3. H3G morph normals/tangents and expression-safe ocular/eyelid deformation.
4. H3H production hair and lash geometry, then skin/iris/sclera atlas admission.
5. Return to the performance lane after the stable geometry set exists: grouped-draw
   consolidation, LOD policy, TAA convergence, and a measured 11.1 ms VR gate.
