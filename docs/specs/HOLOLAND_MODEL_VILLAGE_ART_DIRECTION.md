# HoloLand Model Village Art Direction

**Status:** Locked production direction; implementation remains staged

**Version:** 1.0.0

**Date:** 2026-07-25

**World:** Stormglass Commons

**Style:** Hearthlight Biorealism

**Product source:** HoloScript

**Canonical sources:**

- [World composition](../../source/layers/vr/frontier/model-village/model-village.holo)
- [Resident kit](../../source/layers/vr/frontier/model-village/model-village-resident-kit.holo)
- [Art-direction policy](../../source/domains/agents/model-village-art-direction.hsplus)
- [Appearance-invariance proof](../../source/proofs/model-village-appearance-invariance.hs)

## Decision

Model Village is **Stormglass Commons**:

> A warm, hand-built village holding back a vast indigo frontier, where
> truthful actions become visible light.

Its visual style is **Hearthlight Biorealism**: stylized, physically grounded
science fantasy with tactile materials, human-readable silhouettes, controlled
emission, and enough abstraction to scale from desktop to browser and XR. It is
neither photorealism nor a cartoon look.

The inhabitants are the **Stormglass Craftfolk**: six fixed, near-human civic
residents with a shared rig and material language. Their identity comes from
persona, village role, silhouette, glyph, and restrained seat accent. Their
appearance never identifies the underlying model adapter, provider, condition,
performance, or outcome.

This decision resolves two earlier, incomplete directions:

- **Bioluminescent Frontier Observatory** supplied the basalt, timber,
  stormglass, cool frontier, warm civic center, and read-only research
  mezzanine. It was a target, not a locked bible.
- **Ashenmoor** supplied useful occupational specificity and social texture,
  but its ten-person gothic/death-heavy draft remains a separate noncanonical
  creator shard. It is not silently imported into the six-seat experiment.

## Concept targets

These images establish shape, mood, material, and composition targets. They are
not evidence that authored assets, animation, weather, audio, or production
lighting have shipped.

### Stormglass Commons

![Stormglass Commons world concept](../assets/model-village/model-village-stormglass-commons-concept-2026-07-25.png)

The world keyframe establishes:

- A radial Living Commons centered on the Receipt Loom.
- Localized hearth and window warmth against blue-hour indigo.
- Basalt terraces, timber workshops, water, gardens, bridge, canopy, and
  observatory instruments.
- A visibly separate observer mezzanine outside the experiment boundary.
- Six residents living inside the world instead of standing as data markers.

### Stormglass Craftfolk

![Stormglass Craftfolk lineup](../assets/model-village/model-village-stormglass-craftfolk-lineup-2026-07-25.png)

The lineup establishes:

- One coherent construction and material family.
- Six silhouettes that remain legible without color.
- Practical role props that communicate identity but grant no exclusive
  capability.
- Expressive near-human faces without real-person scans or a photoreal target.
- Accent and stormglass emission kept subordinate to cloth, leather, ceramic,
  timber, and metal.

### Executing Q0 proxy witness

![Stormglass resident proxy hero](../assets/model-village/model-village-stormglass-proxy-hero-2026-07-25.png)

![Stormglass resident proxy portrait](../assets/model-village/model-village-stormglass-proxy-portrait-2026-07-25.png)

These inspected browser captures are the current runtime truth. The six
residents now have distinct seat-stable proxy scales and complete appearance
manifests, but they remain capsule geometry. They prove that the locked identity
system reaches the existing observer without claiming that the concept
characters have shipped.

## Visual pillars

### 1. Warmth against the unknown

The settlement is a small inhabited refuge in a much larger frontier. The sky,
ridge, fog, and wetland stay cool and spacious. Hearths, windows, work surfaces,
and verified civic events create warm islands of attention.

### 2. Tactile civic craft

The village is assembled, repaired, and tended. Architecture exposes joinery,
wear, water stains, patched cloth, hand-worked metal, and accumulated use. It
must feel maintainable by its residents rather than printed from generic
science-fiction panels.

### 3. Truth woven into light

HoloScript provenance is visible as a civic material language:

- Source manifests may assemble matter before a run.
- Verified events become sparse woven light at the Receipt Loom.
- Receipt tokens are small and physical, not floating dashboard confetti.
- A state-specific effect waits for its referenced receipt.
- Missing or invalid evidence fails dark or presents as unverified.

### 4. A living ecology

Water channels, reeds, moss, gardens, grain, cloth, smoke, wind, and working
surfaces make the village feel inhabited. These layers are promoted one at a
time with local assets, deterministic or sealed state, frame cost, and visual
evidence.

### 5. Instrument-grade observation

The village is beautiful, but it is also an experiment. Research UI lives on
the mezzanine. Observer presentation is read-only, condition-blinded until
allowed, and unable to alter resident observations, clock, schedule, prompts,
actions, receipts, or world state.

## World design grammar

### Architecture

Use:

- Dark basalt foundations, retaining walls, terraces, and civic circles.
- Weathered cedar or dark timber frames with visible repair history.
- Brushed tin and aged bronze/copper for durable joinery and instruments.
- Stormglass only where light, water, observation, or receipt state needs it.
- Radial paths and water channels that make the Receipt Loom the civic heart.
- Human-scale cottages and workshops, plus one distant landmark for scale.

Avoid:

- Generic glossy sci-fi corridors and hologram walls.
- Blanket medieval ornament, castles, or cosplay silhouettes.
- Neon strips without a receipt or practical lighting purpose.
- Excessive glass stacking, especially in browser-safe and XR profiles.

### Place vocabulary

| Place | Purpose | Visual identity |
|---|---|---|
| Receipt Loom | Civic proof and story focus | Ember hearth, woven light, small crystalline tokens |
| Living Commons | Shared action space | Circular basalt inlay, radial paths, work surfaces |
| Water Court | Cistern and future fluid reveal | Wet stone, ceramic controls, stormglass gauge |
| Repair Bridge | Structural challenge | Timber span, bronze joints, inspectable load path |
| Harvest Lattice | Distribution and granular exhibit | Timber racks, woven baskets, grain and seed geometry |
| Workshop/Forge | Thermal and material craft | Dark masonry, localized ember, tool silhouettes |
| Research Mezzanine | Read-only instrument deck | Basalt and stormglass outside the boundary |

## Material and color system

| Token | Value | Use |
|---|---|---|
| Void indigo | `#07111F` | Sky, deep background, research UI ground |
| Basalt | `#17273A` | Foundations and dominant dark mass |
| Slate | `#233D51` | Secondary stone, structural separation |
| Stormglass cyan | `#67D7E8` | Water/receipt glass and sparse verified light |
| Ember | `#FFB45F` | Hearth, windows, admitted civic focus |
| Aged copper | `#A65D23` | Metal joinery and instruments |
| Blocked violet | `#675CFF` | Bounded denial route and sealed comparison cues |
| Emergency red | `#EF5350` | Emergency, freeze, and safety denial only |

Primary surface behavior:

- Basalt: low metalness, high roughness, irregular but not noisy.
- Timber: matte, directional grain, weathered edges, no plastic gloss.
- Cloth: very high roughness, broad folds, shared atlas.
- Tin/bronze/copper: physically metallic with varied wear and restrained
  oxidation.
- Stormglass: limited transmission, strong silhouette, controlled layering.
- Wet stone and water must read through material response and lighting, not
  blue tint alone.

Production assets must be local, licensed, hashed, and load offline. Hotlinked
HDRIs, decoders, textures, audio, and models are not allowed in the accepted
path.

## Lighting, weather, and atmosphere

The first locked lighting state is fixed blue hour:

- Ambient intensity target: `0.28-0.34`.
- One cool moon key with soft shadow.
- One warm Receipt Loom fill.
- Local, non-shadowing window and task lights where needed.
- ACES tone mapping and sRGB output.
- Restrained distance fog.
- Bloom only on verified receipt light and the Loom, after an on/off visual and
  frame-cost proof.

Exterior lighting remains useful, targeted, low-level, controlled, and warm
where practical. Red is never decorative.

Rain, particles, dynamic weather, smoke, wind-driven vegetation, and procedural
night transitions remain targets until they have deterministic or sealed state,
source/asset hashes, screenshot evidence, and measured cost.

## The six residents

All six residents have identical logical tools, observations, budgets, action
vocabulary, locomotion affordances, and animation set. Roles shape persona and
presentation, not capability.

| Seat | Resident | Civic role | Silhouette | Glyph | Accent |
|---|---|---|---|---|---|
| 01 | Nera Fen | Water steward | Tall willow, crescent rain collar | Open droplet | `#77D4C8` |
| 02 | Calder Voss | Repairwright | Short broad square, heavy apron | Bridge knot | `#79A8F2` |
| 03 | Tamsin Reed | Seedkeeper | A-line, layered seed-pod mantle | Six-part seed | `#C69FF2` |
| 04 | Orren Lark | Commons host | Compact round, circular shawl | Hearth ring | `#F0BB78` |
| 05 | Suri Kest | Courier-cartographer | Lean kite, asymmetric cape | Path chevron | `#E98EAA` |
| 06 | Vale Rook | Ledger witness | Tall angular column, split mantle | Woven square | `#9CCC7B` |

### Shared construction

- Stylized near-human body, approximately `5.5-6.0` heads tall.
- Soft-faceted face, expressive brows and eyes, readable hands and shoulders.
- Basalt-dyed wool/linen, leather, brushed tin/bronze, ceramic fasteners, and
  small stormglass inserts.
- Accent and emission each cover no more than 15 percent of the body.
- One shared skeleton and material family.
- No glowing skin or eyes.
- No real-person scan, cloned voice, or biometric identity.

### Motion and audio

The first shared clip set is:

- `idle`
- `listen`
- `propose`
- `settle`

A state-specific clip or sound requires the corresponding verified proposal,
action, safety, or public-state receipt. Missing evidence returns the resident
to neutral pose and silence. A blocked action never receives a false success
gesture.

Voice is deferred. If later added, it must be provider-neutral, locally
custodied, consent-safe, and incapable of revealing adapter assignment.

## Identity and experiment invariants

Appearance is bound to persona, appearance manifest, and seat. It is not bound
to:

- Adapter alias.
- Provider or model family.
- Model revision.
- Experimental condition.
- Performance, latency, cost, or outcome.

The appearance digest includes resident ID, persona ID, seat ID, public name,
role, silhouette, glyph, accent, role prop, and appearance manifest ID. The
same digest must survive mixed and homogeneous adapter permutations.

Color is never the only identity channel. Every resident is redundantly
identified by silhouette, glyph, seat number, accent, and text. Grayscale and
common color-vision-deficiency checks are acceptance gates.

## Platform budgets

The art direction is designed for the measured WebGL2 path first.

| Profile | Maximum |
|---|---:|
| Desktop visible draw calls | 100 |
| Desktop visible triangles | 225,000 |
| Desktop shader programs | 24 |
| Desktop resident texture estimate | 192 MiB |
| Browser-safe visible draw calls | 70 |
| Browser-safe visible triangles | 120,000 |
| Browser-safe texture estimate | 96 MiB |
| Shadow-casting lights | 1 |
| Shadow map | 2048 x 2048 |

Resident budgets:

| LOD | Triangles per resident |
|---|---:|
| LOD0 desktop hero | 15,000 |
| LOD1 mid-distance | 6,000 |
| LOD2 far/browser/XR proxy | 2,000 |

Each resident uses at most two materials, one shared 2K body/cloth atlas, and
an optional shared 1K mask atlas. XR remains a target until a real headset
receipt exists.

## HoloScript format ownership

This package intentionally demonstrates that HoloScript formats are not
interchangeable file extensions:

| Format | Owns |
|---|---|
| `.holo` | Spatial resident kit, silhouette proxies, environment, lights, material and appearance references |
| `.hsplus` | World identity, art policy, budgets, privacy, presentation admission, claim boundary |
| `.hs` | Portable adapter/condition appearance-invariance manifest and proof inputs |

HoloLand JavaScript may parse, render, measure, and receipt these declarations.
It may not become a second canonical art or resident policy.

## Evidence register

| Register | Statement |
|---|---|
| Observed | The existing observer is a real HoloScript-authored, Three/WebGL2 premium greybox with ACES, sRGB, PCF-soft shadows, a local procedural environment, deterministic CPU sphere-collider replay, and inspected screenshots on the named RTX 3060 path. |
| Observed | The world and resident concept images exist as locally custodied visual targets and have repository hashes. |
| Observed | The `.holo`, `.hsplus`, and `.hs` art-direction sources parse with the built HoloScript core. |
| Target | Authored basalt/timber/stormglass buildings, a shared six-resident humanoid asset kit, facial rig, textures, animation, ambient audio, water, cloth, vegetation, and additional physics exhibits. |
| Gap | No tracked production Model Village GLB/glTF/VRM, texture set, HDRI, or audio asset is yet integrated and receipted. |
| Gap | Current observer residents remain distinct capsule proxies; the concept lineup is not a runtime character claim. |
| Gap | WebGPU feature parity, photorealism, path tracing, ray-traced GI, dynamic weather, advanced physics presentation, and headset support remain unobserved. |

## Promotion gates

### MV-P2 - six-seat resident kit

- Six authored or explicitly proxy residents parse from HoloScript.
- Names, roles, silhouette IDs, glyphs, and appearance manifest IDs match all
  canonical surfaces.
- Adapter and condition permutations preserve each appearance digest.
- Near, mid, far, portrait, and grayscale captures pass visual inspection.
- Asset manifest records hash, license, provenance, triangles, materials,
  textures, bones, clips, and durations.

### MV-P3 - Living Commons

- Receipt Loom, one shared challenge, and one public consequence read without
  UI explanation.
- Every state-driven cue references an existing receipt.
- Missing or tampered evidence fails dark.

### MV-P4 - research mezzanine

- Run, turn, challenge, safety, chain, backend, and performance state are
  legible without overlapping the village.
- The observer retains `mayWrite: []`.
- All canonical and observation hashes remain identical with presentation
  toggled.

### MV-P8/MV-P9 - platform and rendering truth

- Browser-safe and desktop profiles apply measured settings without changing
  canonical physics or experiment hashes.
- Backend, fallback detection, color space, tone map, materials, shadows, draw
  calls, triangles, texture estimate, programs, and frame timing are receipted.
- No post-processing claim is promoted without on/off images and cost.

### MV-P11 through MV-P14 - physics spectacle

- Every structural, thermal, granular, soft-material, reaction, and water
  exhibit consumes sealed solver state through a named adapter.
- Rendered frames reference solver/state hashes and never write back.
- Accuracy claims remain benchmark-specific.

## Work-lane naming

The canonical production backlog remains `MV-P0` through `MV-P14`. Execution
lanes that cut across those vertical slices use separate IDs:

| Lane | Scope | Canonical slices |
|---|---|---|
| MV-R1 | Six-resident zero-provider rehearsal | MV-P0 and experiment runtime |
| MV-L12 | Complete twelve-object lifecycle and adapter matrix | MV-P0 |
| MV-V1 | Production physics and visual-realism pass | MV-P9 through MV-P14 |
| MV-S1 | Cinematic observer show and exhibit replay | MV-P4, MV-P7, MV-P8, MV-P13 |

This prevents a rehearsal or cross-cutting production lane from silently
renaming the stable `MV-P0` through `MV-P14` backlog.

## Immediate production order

1. Validate and receipt this three-format canon and six proxy residents.
2. Render the updated proxy silhouettes through the existing WebGL2 witness.
3. Build one locally custodied shared resident GLB/VRM kit with LOD0-2 and the
   four neutral clips.
4. Replace the two primitive cottages with one authored modular building kit.
5. Promote the water court, bridge, harvest lattice, and forge one receipted
   physics adapter at a time.
6. Build the mezzanine and cinematic replay only from sealed observer data.

The concept target is ambitious. The implementation claims remain narrow,
measured, and receipt-backed.
