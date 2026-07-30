# Model Village Character Appearance H3Y

## Outcome

H3Y is a passing, source-pinned HoloScript character-realism witness for four
symbolic model-family residents: OpenAI, Claude, Gemini, and Grok. The durable
1400x900 image was rendered in Chrome through HoloScript's native WebGPU
character renderer and visually inspected after capture.

This lane adds four bounded improvements over H3X:

- A separately indexed four-panel fieldcoat with eight intended seams, two
  shoulder yokes, a front placket, and open lapels.
- An anatomical lid-fold orbital profile and a connected upper/seam/lower lip
  ribbon with a cupid-bow contour.
- Deterministic ellipsoidal scalp containment for the authored groom cards.
- A source-authored three-lobe directional diffuse/specular probe.

The wider accepted frame visibly exposes each resident's colored fieldcoat and
lapels while retaining readable face, eye, lip, expression, and groom geometry.
This is an incremental native-realism result. It is not a claim of photographic
HDRI, photorealism, a physically calibrated camera, or final character art.

## Source provenance

- HoloLand source:
  `source/layers/vr/frontier/model-village/model-village-character-appearance-h3y-constructed-soft-tissue-probe.holo`
- Typed admission policy:
  `source/proofs/model-village-character-appearance-h3y-constructed-soft-tissue-probe-policy.hsplus`
- Deterministic seed:
  `source/proofs/model-village-character-appearance-h3y-constructed-soft-tissue-probe-seed.hs`
- Pinned HoloScript commit:
  `293bd5f8e1b6bd4a4e4e8d9c970bbee545b0c898`
- Source compiler:
  `CharacterWebGPUCompiler.compile`
- Browser renderer:
  `HoloScript CharacterRender.renderCharacter`

The `.holo` source owns resident names, distinct appearance parameters,
fieldcoat colors, expressions, pose, LOD budgets, facial profiles, groom
profiles, and probe parameters. The `.hsplus` policy fails closed over the
expected native receipts. The `.hs` seed is a flat, deterministic browser
witness request and contains no provider/model binding.

## Native compiler admission

All four residents compiled twice with byte-identical outputs. Each close-up
spec contains 12,062 vertices and 54,078 indices; each authored distance-LOD
counterfactual contains 7,516 vertices.

For every resident, the engine returned:

- `holoscript.agent-avatar-garment-geometry.v2`
  - `constructionProfile = four-panel-fieldcoat-v1`
  - `constructedPanelCount = 4`
  - `constructionSeamCount = 8`
  - `shoulderYokeCount = 2`
- `holoscript.agent-avatar-facial-landmarks.v4`
  - `profile = portrait-soft-tissue-v4`
  - `lipTopology = connected-cupid-bow-ribbon-v1`
  - 54 connected lip-surface vertices and 68 triangles
- `orbitalProfile = anatomical-lid-fold-v2`
- `holoscript.agent-avatar-groom-geometry.v2`
  - `profile = scalp-flow-containment-v2`
  - `containmentProfile = ellipsoidal-scalp-exterior-v1`
  - final scalp-penetration vertex count of zero
- `holoscript.character-environment-light.v2`
  - `profile = directional-reflection-probe-v1`
  - `responseProfile = three-lobe-diffuse-specular-probe-v1`

The H3X cranial-neck stitch, asymmetric source pose, expression normal
recomputation, 44x30 close-up face budget, and 24x16 distance face budget remain
admitted.

## Chrome WebGPU witness

Captured at `2026-07-30T03:07:31.415Z` with:

- Chrome `150.0.7871.187`
- `navigator.gpu = true`
- adapter acquired and device created
- adapter vendor `nvidia`, architecture `ampere`
- zero external network requests
- screenshot SHA-256
  `4386d320bb4c7498cd07230d505189a665ce38a61ab6f492788590f979623503`
- screenshot size 646,232 bytes
- receipt integrity
  `48b91bed7d30f763175c545f903e89262dcf475acb93215265219374e10b1ddd`

| Resident | Non-background pixels | Probe delta pixels | Normal delta pixels | LOD delta pixels |
|---|---:|---:|---:|---:|
| OpenAI | 107,268 | 106,692 | 16,361 | 8,038 |
| Claude | 107,473 | 107,361 | 17,434 | 9,340 |
| Gemini | 104,535 | 104,284 | 15,091 | 7,191 |
| Grok | 112,382 | 112,087 | 18,136 | 8,891 |

Every portrait exceeded the minimum coverage and luminance-range gates. Every
directional-probe, recomputed-normal, and close-up-LOD counterfactual produced a
non-zero, gate-clearing pixel difference.

## Hardware boundary

The non-invasive Codex hardware audit passed before the witness. Current
readback reported:

`NVIDIA GeForce RTX 3060 Laptop GPU, driver 610.88, 6144 MiB`

The browser independently reported an NVIDIA Ampere WebGPU adapter and created
a device. This proves the browser runtime and native rendering path used by this
witness. It does not establish a fresh RTX timing benchmark:

- GPU timestamp measured: **false**
- fresh RTX benchmark claimed: **false**
- Quest headset measured: **false**
- browser WebXR measured: **false**
- photographic HDRI claimed: **false**
- photorealism claimed: **false**
- full-world performance claimed: **false**

## Validation

Passing checks:

```text
node --test scripts/__tests__/hololand-model-village-character-appearance-h3y.test.mjs
pnpm --filter @holoscript/engine exec vitest run \
  src/character-render/__tests__/AgentAvatarGarment.test.ts \
  src/character-render/__tests__/hair.test.ts \
  src/character-render/__tests__/AgentAvatarMesh.test.ts \
  src/character-render/__tests__/CharacterHostFromComposition.test.ts \
  src/character-render/__tests__/character-render.test.ts \
  src/character-render/__tests__/character-render-xr.test.ts
pnpm --filter @holoscript/engine run build
pnpm --filter @holoscript/engine exec tsc --noEmit -p tsconfig.json
pnpm --dir C:/Users/josep/.ai-ecosystem check:codex-hardware
node scripts/check-hololand-model-village-character-appearance-h3y.mjs \
  --holoscript-root C:/holorepo-worktrees/holoscript-h3y-constructed-soft-tissue-probe \
  --skip-manifest --write-artifacts
```

One broad dependency build encountered the pre-existing
`@holoscript/alphafold-plugin` TS5096 baseline failure. Exact dependencies were
then built and the engine's own typecheck, build, focused 94-test suite, HoloRepo
quality gates, and live browser witness all passed.

The HoloLand repository-wide `npm test` baseline was also unavailable in this
isolated candidate: its first workspace packages reported missing `node_modules`
and `vitest` executables before reaching this source/proof lane. The targeted
Node tests, parser/compiler admission, immutable-manifest check, and live Chrome
WebGPU witness are the scoped validation for this change.

## Next bounded realism lane

H3Z should improve the authored material and silhouette layer without blurring
the evidence boundary:

1. jacket thickness, closures, cuffs, and fabric-specific normals;
2. hair density and flyaway cleanup under the containment invariant;
3. corneal/tear-film response and softer eyelid transitions;
4. an authored, non-photographic room-scale Stormglass environment that
   preserves deterministic source custody;
5. only then, a separately gated TAA/performance convergence pass with real GPU
   timestamps and a current driver-bound benchmark.
