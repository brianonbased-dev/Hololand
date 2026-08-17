# HoloLand Model Village Character Appearance H3A

**Date:** 2026-07-27

**Status:** PASS

**Receipt:** `05fc8924d1eb6bb8f33f8d13ebcd1e136de26ff2e106a00f723074b8cc4ac155`

H3A is a read-only neutral-persona visual target, not full H3. It makes three
civic silhouettes, deterministic dermal materials, restrained eye targets,
soft-faceted faces and hands, source-owned hair geometry, and six expression
deltas operative in a browser shadow consumer.

## Visual result

![H3A neutral personas](../assets/model-village/model-village-character-appearance-h3a-neutral-personas-2026-07-27.png)

![H3A expression preview](../assets/model-village/model-village-character-appearance-h3a-expression-preview-2026-07-27.png)

![H3A LOD comparison](../assets/model-village/model-village-character-appearance-h3a-lods-2026-07-27.png)

![H3A accessibility](../assets/model-village/model-village-character-appearance-h3a-accessibility-2026-07-27.png)

## Source-authored LOD

| Tier | Three persona triangles | Largest persona | Hair parts by persona |
|---|---:|---:|---:|
| LOD0 | 29514 | 11386 | 4 / 4 / 4 |
| LOD1 | 9978 | 3902 | 3 / 3 / 2 |
| LOD2 | 4902 | 1634 | 1 / 1 / 1 |

## Deterministic dermal atlas custody

- 2K albedo: `0faaf56dab3eec4fadeaafd628f01efe1b55881be13a0ea8771e3fcf60c27951`
- 2K normal: `0e55ad828aa72877f0cde85a0129e914109e409659349e97245e07cf0784c84f`
- 1K AO/roughness/metalness mask: `a8ab6f8a82ba3a914334eae227aea55c7868f0303c83a960d0ea3dc584d6a4c9`
- Repeated generation: byte-identical
- External asset requests: 0

## Measured local browser profile

- Browser: 151.0.7922.138
- Renderer: ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU (0x00002520) Direct3D11 vs_5_0 ps_5_0, D3D11)
- Backend: D3D11
- Protocol: 600 measured frames after 300 warm-up
- Three personas simultaneous at LOD0
- rAF p95: 16.80 ms
- Render-submit p95: 2.50 ms
- Dropped-frame ratio: 0.000%

## Native admission boundary (historical, resolved)

H3A was authored against upstream HoloScript commit
`9153ab98a87decffc38876070ca8bfc04b179f01`, which reported authored
`@hair(style)` geometry as having no geometry channel and `@morph` as having no
FACS/morph-target channel. That record is frozen above and is no longer re-derived.

Upstream closed both gaps in `0275f8d4c`.
This run **executed** both channels against commit
`721b4608da5d3752956d978108fa852cb2740b6d` rather than asserting them:

| Authored hair style | Native mapping | Hair triangles |
|---|---|---:|
| cropped_coils | @hair(color), @hair(style=cropped_coils) | 3600 |
| swept_ridge | @hair(color), @hair(style=swept_ridge) | 2240 |
| braided_crown | @hair(color), @hair(style=braided_crown) | 4056 |

| Expression | Native morph mapping | Vertices deformed |
|---|---|---:|
| soft_smile | @morph(targets=smile) | 6 |
| blink | @morph(targets=blink_left,blink_right) | 198 |
| viseme_aa | @morph(targets=jaw_open,viseme_aa) | 6 |
| viseme_ee | @morph(targets=viseme_ee) | 6 |
| viseme_oh | @morph(targets=jaw_open,viseme_oh) | 6 |

H3A still does **not** claim the native channels: its preview geometry remains
source-owned, and native channel coverage is carried by
`H3B` (`source/layers/vr/frontier/model-village/model-village-character-appearance-h3b-native-channels.holo`). Full H3 is not admitted here.

H3A is retained rather than retired because it uniquely holds the deterministic
dermal atlas custody contract, the absolute per-persona triangle budgets, the
benchmark protocol shape, civic-role binding, silhouette and dermal-atlas-cell
uniqueness, the H2 lineage pins, the face/eye tracking defaults, the shared
motion and capability invariants, the promotion/replacement boundary, and the
accessibility evidence -- none of which the successor gate asserts.

No persona binds Claude, OpenAI, Gemini, Grok, GLM, Brittney, or any adapter
family. The live blinded research profile cannot admit these civic personas
until assignment invariance is separately re-proved. Face and eye tracking are
off, biometric persistence is forbidden, and this lane performs no model calls,
network fetches, canonical writes, resident-observation writes, or seat joins.

This does not claim a complete production face, native hair-style behavior,
native morph/FACS behavior, production motion, photorealism, headset
performance, live research participation, or full-world convergence.
