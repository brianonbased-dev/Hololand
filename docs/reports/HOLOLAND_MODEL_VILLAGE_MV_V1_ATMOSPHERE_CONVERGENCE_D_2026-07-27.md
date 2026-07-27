# HoloLand Model Village MV-V1 - Atmosphere Convergence D

**Date:** 2026-07-27  
**Status:** PASS - bounded atmosphere witness  
**World:** Stormglass Commons  
**Art direction:** Hearthlight Biorealism  
**Courtyard:** Receipt Loom Courtyard  

## Outcome

Atmosphere Convergence D adds one sealed blue-hour presentation state to the
immutable Art Convergence A, Material Convergence B, and Geometry Convergence C
witnesses. The authored atmosphere reads as a rain-wet Stormglass evening:
visible light rain, low mist, warm path practicals, wet basalt response,
restrained chimney smoke, cistern ripple highlights, wind-bent vegetation,
contact-depth patches, and layered storm-cloud veils.

The accepted 1600x900 witness is:
[model-village-receipt-loom-atmosphere-convergence-d-2026-07-27.png](../assets/model-village/model-village-receipt-loom-atmosphere-convergence-d-2026-07-27.png).

## What HoloScript owns

`model-village-receipt-loom-atmosphere-convergence.holo` is the product source
of truth. It owns:

- the sealed `stormglass_blue_hour_after_rain` environment state;
- nine atmosphere kits and their deterministic seeds;
- 442 atmosphere instances in 11 batches;
- six practical-light positions and the shared light profile;
- the palette, fog density, opacity channels, and tone-mapping exposure;
- the comparable C inspection camera and 1600x900 render budget;
- the read-only, zero-model-call, zero-network, identity-neutral truth boundary;
- explicit non-claims for continuous weather, volumetric fog, fluid simulation,
  physically simulated rain, production foliage physics, gameplay physics,
  photorealism, and measured real-time performance.

The JavaScript checker is presentation and receipt infrastructure. It parses
the HoloScript source with the built HoloScript core, derives the deterministic
placement plan, extracts the exact sealed Geometry C browser application,
materializes the authored batches in Three.js, records the GPU witness, and
fails closed on drift.

## Immutable inheritance

Atmosphere D does not modify the earlier witnesses.

| Witness | Bound source/checker evidence |
|---|---|
| Art Convergence A | Base courtyard source `6396f156...d4bd`; browser bridge `261d01c8...9a19` |
| Material Convergence B | Material source `525ae37b...59fa`; deterministic synthesis retained through Geometry C |
| Geometry Convergence C | Geometry source `1f6f495e...e530`; plan `fc05193f...5538`; checker `8d97f7cd...fbb4`; extracted browser application `cf606269...ebf` |
| Atmosphere Convergence D | Atmosphere source `51963bf2...940f`; SceneIR `87881c24...475c`; plan `dd1f3e0b...c651` |

The inherited C application re-runs inside the D witness and must report
`status=pass` before the atmosphere overlay can render.

## Authored atmosphere inventory

| Kit | Instances | Batch role | Bounded reading |
|---|---:|---|---|
| Rain field | 320 | `rain_streaks` | One deterministic light-rain sheet at a sealed phase |
| Mist sheets | 10 | `ground_mist_sheets` | Local soft camera-facing sheets, not volumetric fog |
| Practical lanterns | 18 | posts, glass, caps | Six three-part fixtures plus six non-shadowing point lights |
| Wet puddles | 14 | `wet_puddles` | Shallow clearcoat patches reinforcing wet basalt |
| Chimney smoke | 12 | `chimney_smoke` | One sealed, wind-bent soft-sheet plume |
| Water ripples | 8 | `cistern_ripples` | Concentric highlights, not a fluid simulation |
| Wind foliage | 48 | `wind_foliage` | One shared captured wind pose |
| Contact depth | 6 | `contact_depth` | Subtle grounding patches under focal objects |
| Cloud veils | 6 | `cloud_veils` | Soft depth bands separating sky and mountain silhouettes |

The bridge creates one local 128x128 radial texture for mist, smoke, and cloud
edge falloff. No external asset or network request is used.

## GPU witness

The accepted iteration rendered through Chrome 150 on the local NVIDIA GeForce
RTX 3060 Laptop GPU:

- API: WebGL 2.0
- backend: ANGLE Direct3D11 / D3D11
- software renderer: false
- shadow-inclusive draw calls: 520
- triangles: 85,348
- geometries: 418
- textures: 22
- unique materials: 40
- external network requests: 0
- page errors: 0
- image: 1600x900, 1,299,506 bytes
- hero SHA-256:
  `c7ff9d38ff16014533f488019894a4f1c34fc56186c52ee4695c9f55b5760a0b`

Relative to Geometry C, D adds 17 shadow-inclusive calls, 14,240 triangles,
six geometries, one texture, and ten unique materials while remaining inside
the authored limits of 620 calls, 110,000 triangles, 28 textures, and 44
materials.

## Visual inspection

Two GPU iterations were inspected.

1. The first pass proved the full kit but the rain and lantern glass read too
   graphic and white-hot.
2. The accepted pass reduced rain opacity, warmed the hearth palette, lowered
   glass emissive intensity, and raised soft mist/smoke separation. The cottage,
   Receipt Loom, two neutral residents, wet ground reflections, and mountain
   silhouettes remain legible.

This is an art-development witness, not a claim that the scene is final,
photoreal, headset-ready, or production-performant.

## Receipt

- Algorithm: SHA-256 over canonical JSON
- Receipt:
  `054171bed8b6a10d00f01d97e1d3dfb0fb5cb85af9e6101d9feefb9cd3c6680d`
- Ephemeral witness:
  `.tmp/hololand/model-village/atmosphere-convergence-d/atmosphere-convergence-d-witness.json`
- Bridge route:
  `HoloScript atmosphere -> deterministic sealed-state plan -> immutable C -> immutable B -> immutable A -> batched Three/WebGL2 presentation`

## Validation

Passed:

- 21 focused Node tests across Art A, Material B, Geometry C, and Atmosphere D;
- ESLint for the D checker and focused test;
- HoloScript diagnostics for the D source and manifest: zero findings;
- local HoloScript parser, SceneIR compiler, browser plan-hash agreement, and
  real GPU witness;
- `git diff --check` for all D text artifacts.

The broader `pnpm run test:hololand-model-village-rendering` gate remains
baseline-red outside this change. It fails in the HoloScript CLI deterministic
`.hs` plan kernel with `Rust/WASM compiler emitted code outside the constant
plan kernel` before reaching Atmosphere D. The same failure was reproduced from
a clean detached `52a9cd6` worktree, so it is recorded as an inherited
cross-repository runtime blocker rather than a D pass.

## Truth boundary and residue

Verified now:

- one HoloScript-authored sealed blue-hour atmosphere;
- deterministic source/SceneIR/plan agreement between Node and browser;
- immutable A/B/C inheritance;
- real local WebGL2/D3D11 GPU execution;
- bounded renderer budgets;
- zero external requests, page errors, model calls, or canonical writes;
- live-study-compatible identity neutrality with two neutral Craftfolk staging
  forms.

Still open:

- Resident Convergence E with receipted production resident assets;
- a bounded cloth, water, foliage, and contact-physics vertical slice;
- frame-time distribution and quality-tier fallback evidence;
- cinematic observer and spatial soundscape integration;
- district-scale architecture/material/atmosphere rollout;
- the separate post-lock public projection carrying Claude, OpenAI, Gemini,
  Grok, GLM, Brittney, and other admitted family embodiments.
