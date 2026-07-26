# HoloLand Model Village Art-Direction Lock

**Date:** 2026-07-25

**Status:** Pass - production direction locked, Q0 proxy integrated

**World:** Stormglass Commons

**Style:** Hearthlight Biorealism

**Residents:** Stormglass Craftfolk

## Outcome

The Model Village now has one explicit world and resident identity:

> A warm, hand-built village holding back a vast indigo frontier, where
> truthful actions become visible light.

The decision is encoded in HoloScript rather than living only in a mood board:

| Format | Source responsibility |
|---|---|
| `.holo` | Six-resident spatial and appearance kit |
| `.hsplus` | Art, budget, privacy, and presentation policy |
| `.hs` | Adapter/condition appearance-invariance manifest |

The canonical world and read-only observer reference the same source triad.
Their six residents agree on resident/persona/seat IDs, names, roles,
silhouettes, glyphs, accents, and appearance-manifest IDs.

## Why this direction

The repo contained two partial directions:

- A proposed Bioluminescent Frontier Observatory with strong material,
  lighting, and observer-boundary ideas.
- An older Ashenmoor gothic draft with richer occupations and social texture,
  but ten residents, an incompatible tone, and unparsed noncanonical source.

Stormglass Commons keeps the strongest shared motifs - basalt, timber, metal,
stormglass, ember light, blue-hour frontier, civic craft, and visible
provenance - while giving the six-seat experiment its own accessible identity.
Ashenmoor remains available as a later creator shard.

## Visual targets

### World keyframe

![Stormglass Commons concept](../assets/model-village/model-village-stormglass-commons-concept-2026-07-25.png)

- Source generated through the OpenAI image-generation surface.
- Saved path:
  `docs/assets/model-village/model-village-stormglass-commons-concept-2026-07-25.png`
- SHA-256:
  `2aa7deae838068e0caffa22d793abb85f76702c9d3e0a55f3169d81de9b611bf`
- Prompt intent: a wide elevated view of a handcrafted basalt, timber, bronze,
  water, garden, and stormglass frontier village at blue hour; central Receipt
  Loom; six inhabitants; separate observer mezzanine; localized warm light;
  restrained emission; no cyberpunk neon, franchise mimicry, text, or logos.

### Resident lineup

![Stormglass Craftfolk lineup](../assets/model-village/model-village-stormglass-craftfolk-lineup-2026-07-25.png)

- Source generated through the OpenAI image-generation surface.
- Saved path:
  `docs/assets/model-village/model-village-stormglass-craftfolk-lineup-2026-07-25.png`
- SHA-256:
  `6f0cf10f5e7e55745cfd06b458a742fd189f54b12b606d0bf6335e2a848edc5e`
- Prompt intent: exactly six full-body, stylized near-human craftfolk using one
  material/rig language, with the locked role, silhouette, glyph, prop, and
  seat-accent matrix; no provider/model branding, robots, real-person likeness,
  text, or extra figures.

Both images are **concept targets**, not runtime screenshots or asset-delivery
claims.

## Six-person roster

| Seat | Resident | Role | Silhouette | Glyph |
|---|---|---|---|---|
| 01 | Nera Fen | Water steward | Willow crescent | Open droplet |
| 02 | Calder Voss | Repairwright | Broad square | Bridge knot |
| 03 | Tamsin Reed | Seedkeeper | A-line seedpod | Six-part seed |
| 04 | Orren Lark | Commons host | Compact hearth ring | Hearth ring |
| 05 | Suri Kest | Courier-cartographer | Lean kite | Path chevron |
| 06 | Vale Rook | Ledger witness | Tall angular column | Woven square |

These roles do not grant different logical tools or physical affordances.
Appearance is invariant across adapter and condition assignments.

## Q0 runtime witness

The existing browser observer was rerun after the six identity manifests and
distinct proxy scales were integrated.

![Desktop proxy witness](../assets/model-village/model-village-stormglass-proxy-hero-2026-07-25.png)

![Portrait proxy witness](../assets/model-village/model-village-stormglass-proxy-portrait-2026-07-25.png)

| Evidence | Result |
|---|---|
| Renderer | Three 0.182 / WebGL2 |
| Hardware | NVIDIA GeForce RTX 3060 Laptop GPU through ANGLE D3D11 |
| Software fallback detected | No |
| Output | sRGB, ACES filmic, exposure 1.05 |
| Shadows | PCF soft, one allocated shadow map |
| Draw calls | 18 |
| Triangles | 15,936 |
| Shader programs | 19 |
| Materials | 39 physical materials |
| Frame cadence p95 / p99 | 16.8 ms / 16.8 ms |
| CPU render-submit p95 | 3.4 ms |
| Canonical authoritative mutation delta | 0 |
| Observer browser comparison | All seven bounded V4 canonical fields equal |
| External network requests | 0 |

Desktop screenshot SHA-256:
`c0defb9b36315972d34df96439127d92db6da5b91b33f7747488410d8af2f3fc`

Portrait screenshot SHA-256:
`f54d0142046e623aefddc6c121f86cde4f7ca62afcba2ae2d4185993209fcf9d`

The proxy witness remains a premium greybox. It does not promote the concept
characters, authored buildings, character animation, production audio, dynamic
weather, advanced physics visualization, WebGPU parity, or photorealism.

## Language and identity verification

The dedicated checker:

1. Parses the resident kit with `HoloCompositionParser`.
2. Parses the art policy with `HoloScriptPlusParser`.
3. Parses the invariance proof with `HoloScriptCodeParser`.
4. Confirms the canonical twelve-object world remains twelve objects.
5. Confirms all six identities match across world, observer, kit, and proof.
6. Confirms six unique silhouettes, glyphs, accents, and proxy scales.
7. Recomputes a SHA-256 appearance digest for every resident.
8. Confirms every mixed and homogeneous adapter assignment retains the same
   appearance manifest.
9. Hashes the two local concept targets.
10. Preserves a narrow observed/target claim boundary.

Preferred HoloScript MCP and hosted parser transports returned `Transport
closed`, so validation used the built sibling HoloScript core. This is a
transport fallback, not a different language implementation.

Initial durable art-direction receipt:
`8b439cb2245e5ddead13d3381d822a092685cf803d450fdfdf46c0e2cf43b544`

## Validation

Passed:

```text
node scripts/check-hololand-model-village-art-direction.mjs
node scripts/__tests__/hololand-model-village-art-direction.test.mjs
node scripts/__tests__/model-village-phase0b-runtime.test.mjs
node scripts/__tests__/hololand-model-village-experiment.test.mjs
node scripts/__tests__/hololand-model-village-physics.test.mjs
node scripts/__tests__/hololand-model-village-rendering-truth-gate.test.mjs
```

## Next promotion

The next visual promotion is not another mood board. It is one locally
custodied shared resident GLB/VRM kit with:

- LOD0/LOD1/LOD2 at 15K/6K/2K triangles per resident.
- At most two materials per resident.
- One shared 2K body/cloth atlas and optional 1K mask.
- Shared `idle`, `listen`, `propose`, and `settle` clips.
- Hash, license, provenance, bones, materials, textures, clip durations, and
  offline-load receipt.
- Near, mid, far, portrait, grayscale, and color-vision-deficiency captures.
- Adapter/condition appearance digest invariance.

The first authored building promotion is one modular cottage/workshop kit, not
six unrelated hero assets. The water, bridge, harvest, forge, cloth, and garden
spectacles then advance one sealed physics adapter at a time.
