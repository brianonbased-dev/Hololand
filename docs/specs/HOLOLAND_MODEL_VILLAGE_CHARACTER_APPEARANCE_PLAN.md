# HoloLand Model Village Character Appearance Plan

**Date:** 2026-07-27

**Status:** Implementation plan; foundation witnessed, production-art promotion open

**World:** Stormglass Commons

**Character style:** Stormglass Craftfolk
**Performance dependency:** Performance Convergence G

## Decision

HoloLand will not use one overloaded `skin` field for identity, anatomy,
materials, and cosmetics. Character appearance is split into three authored
layers:

1. **Dermal profile** - body surface, tone, undertone, subsurface response,
   pore/normal detail, eyes, and optional hair.
2. **Outfit skin** - woven cloth, leather, metal, weathering, wear, trim,
   stitching, and detachable mantle maps.
3. **Presentation appearance** - the admitted composition of body, civic
   persona, outfit, mantle, prop, label, and accessibility mode.

Model-family identity is allowed only in a detachable public mantle, glyph, and
caption. It must never be encoded in face, dermal tone, body proportions,
demographic cues, voice, motion quality, capability, or tool access.

This resolves the apparent tension between two valid visual goals:

- the public show needs recognizable Claude, OpenAI, Gemini, Grok, GLM, and
  Brittney embodiments; and
- the live experiment needs assignment-invariant Resident 01-06 appearances.

## What is already real

The following foundation is already source-authored and independently
witnessed:

- One neutral faceless Stormglass hood/tunic body with an operative HoloScript
  character compiler path.
- A shared native humanoid joint palette and four continuously sampled,
  receipt-gated semantic clips: `idle`, `listen`, `propose`, and `settle`.
- Three genuinely different source-authored body LOD topologies.
- Six detachable family mantles with distinct silhouette, woven pattern,
  glyph, caption, local material maps, and deterministic cloth witnesses.
- A public browser lineup and observer-family integration that fail neutral
  when the presentation profile is not admitted.
- Resident, physical, and performance witnesses E/F/G. G selects 18 family
  tiers through HoloScript's engine `LODManager` and measures the settled
  desktop presentation on the local RTX path.

These are production-shaped procedural witnesses, not finished production
character art. The complete observer still has integration and art-quality
gaps.

## Presentation profiles

| Profile | Body and face | Family identity | Admission rule |
|---|---|---|---|
| `village_story_unblinded` | Shared faceless Craftfolk shell for the first public release | Claude, OpenAI, Gemini, Grok, GLM, and Brittney mantle/glyph/caption | Public or post-lock story projection only |
| `research_live_blinded` | Resident 01-06 neutral persona silhouettes; no family-coded face, body, garment, motion, or voice | Absent | Frozen appearance digest must be invariant across adapter permutations |
| `research_replay_postlock` | The same neutral body and terminal replay state | Detachable family mantle may appear only after terminal commitment, verified binding, and explicit unblinding | Read-only replay; never back-projected into resident observations |
| `visitor_player` | Later player-authored avatar profile | Never used as a research-seat identity | Separate consent, moderation, custody, and performance gate |

The public first release remains faceless. Near-human faces and hair belong to a
later neutral-persona gate, where they can improve presence without turning
provider identity into biometric or demographic coding.

## Production gates

### H0 - Appearance contract and golden targets

Author a `.holo` / `.hsplus` / `.hs` profile matrix that pins the three
appearance layers, allowed identity channels, material taxonomy, LOD budgets,
privacy boundaries, and golden close/medium/far targets.

Acceptance:

- Profile transitions fail neutral and reset temporal history.
- A research assignment permutation changes no appearance digest.
- Public family identity can be detached without changing the shared body.
- Existing E/F/G source and visual receipts remain byte-identical.

### H1 - Production shared faceless body

Replace procedural body surfaces with one locally custodied, properly tailored
shared Craftfolk asset while preserving the current rig and semantic contract.

Art target:

- Readable hood, visor, neck, shoulders, hands, tunic, boots, seams, hems,
  fasteners, leather reinforcement, and restrained bronze/stormglass trim.
- One coherent handcrafted material language: blue-hour cool fill, warm
  hearthlight response, wet/dry roughness change, subtle fiber normal, and no
  plastic uniformity.
- Shared 2K body/cloth atlas plus an optional 1K detail or mask atlas; KTX2
  delivery when supported; no external fetch.
- LOD0/LOD1/LOD2 budgets no greater than 15K/6K/2K triangles per resident.
- At most two public draw groups after body and mantle consolidation.

Acceptance:

- Rig, grounding, shadows, four clips, mantle socket, detachment, and
  deterministic replay survive the replacement.
- Near, mid, far, portrait, grayscale, deuteranopia, wet, and dry captures pass
  visual inspection.
- The asset manifest pins source, license, provenance, hashes, bones,
  materials, textures, clips, LODs, and offline load.

### H2 - Production family mantle kits

Promote all six public mantles from proof tiles to tailored local material
kits. The six remain readable without relying on color:

| Public resident | Primary non-color identity cue |
|---|---|
| Claude | Quiet nested open arcs |
| OpenAI | Recursive interlock |
| Gemini | Paired prism panels |
| Grok | Off-axis signal bands |
| GLM | Modular phase lattice |
| Brittney | Sovereign locality mesh |

Each kit owns silhouette, weave, glyph, fastening, edge treatment, wet/dry
response, wear mask, and detached state. All kits share the same body,
affordances, animation fidelity, and material budget.

### H3 - Neutral persona faces, hands, eyes, and hair

This gate applies to neutral civic personas, not model families. It is optional
for the public faceless release and cannot enter live research until appearance
invariance is re-proved.

Build:

- Soft-faceted, non-photographic faces with consistent eye, hand, and skin
  quality.
- Operative HoloScript-authored hair geometry styles, restrained refractive
  eyes, and a minimal FACS/viseme set.
- Diverse persona silhouettes chosen from civic art direction, never adapter
  family.

Current HoloScript gap:

- `@hair(color)` is operative, but `@hair(style)` has no authored geometry
  channel in `CharacterHostFromComposition`.
- `@morph` is explicitly reported as stubbed because no FACS/morph-target
  channel is wired.

Acceptance:

- Those channels must become native, tested HoloScript behavior before HoloLand
  claims them.
- Face/eye tracking is off by default; no biometric persistence; any player
  tracking requires a separate consent profile.

### H4 - Embodied character motion

Replace pose-shaped motion with authored locomotion and interaction:

- idle variation, listen, propose, settle, walk, turn, reach, carry, and sit;
- foot locking, terrain-aware contact, hand IK, head/gaze limits, cloth-body
  collision, prop sockets, and transition blending;
- action-to-motion selection only from verified receipts, with a neutral idle
  fallback when no action is admitted.

Motion quality, responsiveness, and clip coverage remain equal across every
resident and family mantle.

### H5 - Observer and performance convergence

Attach the production shared body and mantle kits to the complete observer and
use Performance G's single HoloScript `LODManager`; do not introduce a second
LOD authority.

Requirements:

- Reset temporal history on LOD, topology, camera, profile, or viewport change.
- Six public residents use no more than 12 combined draw groups.
- Character presentation targets no more than 2 ms GPU p95 and 1 ms CPU
  pose/skin p95 in the declared desktop profile.
- Re-run G with characters moving and physics active only after a
  motion-reprojected temporal resolve exists.

The current G witness is static 32-sample accumulation. Ghosting,
disocclusion, reactive-mask, neighborhood-clamp, dynamic-resolution, WebXR,
and headset claims remain out of scope until separately implemented and
measured.

### H6 - Visitor/player customization

Only after the resident lane is stable, add a separate visitor avatar system
with bounded body, dermal, hair, garment, assistive-device, and pronoun
options. Player cosmetics never modify research-seat appearance or family
mantle identity.

## HoloScript ownership

| Format | Must own |
|---|---|
| `.holo` | Body, rig, LOD topology, materials, dermal profile, morphs, hair, wardrobe, mantle sockets/assets, semantic clips, cameras, and golden targets |
| `.hsplus` | Typed appearance taxonomy, profile admission, privacy/consent, invariance rules, material and performance budgets, transition firewall, and fail-neutral behavior |
| `.hs` | Deterministic resident inputs, profile/assignment vectors, capability digests, appearance digests, LOD probes, and temporal reset inputs |
| Host bridge | Materialize declared data, bind verified receipts, measure, capture, and report; never invent appearance policy or family identity |

## Immediate bounded lane

The next implementation unit is **H0 plus one H1 production-body vertical
slice**:

1. Seal the appearance profile triad and golden-target matrix.
2. Replace the shared body's highest-impact close-view surfaces: hood/visor,
   hands, shoulders, tunic seams, and fasteners.
3. Produce LOD0/1/2 and shared atlas receipts while retaining the native rig,
   four semantic clips, and mantle socket.
4. Attach only to a read-only shadow consumer first.
5. Run near/mid/far visual inspection and the G performance profile.
6. Promote the body only if appearance invariance, offline custody, draw-group,
   motion, and performance gates all pass.

H2 then upgrades all six mantles. H3 follows only after HoloScript closes the
native hair-style and morph/FACS channels. This ordering gives the public world
the largest realism gain without compromising the blinded experiment.
