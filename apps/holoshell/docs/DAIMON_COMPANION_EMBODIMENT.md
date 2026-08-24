# Daimon Companion Embodiment — Consumption-Side Routing

**Status:** Design routing (consumption side)
**Date:** 2026-08-24
**Scope:** How HoloLand/HoloShell consume and present the embodied per-soul daimōn (the companion), across the emergence surface, the avatar runtime, look-dev, and cross-device co-presence
**Pairs with:** `BRITTNEY_AVATAR_RUNTIME.md`, `BRITTNEY_FIELD_AND_USER_DAEMONS.md`, `BRITTNEY_CUSTODY_OPERATOR.md`, `AGENT_PRESENCE_COLOR_LANES.md`
**Provenance:** Desktop-seat reconstruction of the fold's slice 3. The original
authoring commit (`5790b5c`, cloud session `01YRBEvy4DVRnm5ftxkhLGEC`) is
stranded unpushed — the Claude GitHub App holds no `holoscript-foundation`
grant. Content re-derived from the two landed slices, which specify this
document's scope. If the original ever pushes, reconcile by merge, never by
force-replace.

**Canonical ruling:** ai-ecosystem
`research/2026-08-24_companion-daimon-embodiment-fold.md` — the companion is
not a new product line; it is the embodiment + companionship layer of the
planned per-soul daimōn (D.053), founder as soul #1.
**Trait contract:** HoloScript `proposals/daimon-embodiment-trait-family.md` —
the `companionship` trait category (`@companion_presence`, `@affect_state`,
`@rapport`, `@relational_memory`, `@voice_loop`, `@copresence`,
`@flourishing_guard`).
Both live on branch `claude/holoscript-companion-app-wc2wsr` of their repos
until landed.

---

## 1. What HoloLand owns here

HoloLand **consumes** the daimōn's embodiment; it never authors it. The brain
(`compositions/daimon-brain.hsplus`), the face contract
(`ConversationDaemon.ts` appearance/voice/tone profiles), and the trait family
(RFC above) live in HoloScript. HoloLand's job is routing: which surface the
daimōn appears on, when the face is allowed to present, how receipts surface,
and how two bodies stay one being. Perceivable surfaces stay `.holo`-authored
and generated — the render-surface freeze applies to the companion exactly as
it applies to everything else.

## 2. Where the companion sits in the existing ontology

`BRITTNEY_FIELD_AND_USER_DAEMONS.md` already splits the world into an
invisible operating field (Brittney) and a personal named conversation daemon
per user. The companion daimōn **is** that user daemon, matured by the fold:

| `BRITTNEY_FIELD_AND_USER_DAEMONS` layer | After the fold |
| --- | --- |
| Brittney field — invisible context, routing, care, repair | Unchanged. ContextDeltas keep flowing to the field exactly as wired. |
| User conversation daemon — named face, chat, voice, styling | Becomes the **per-soul companion daimōn**: soul-bound, emergent (S0→S3), embodied via the `companionship` traits, downloadable at S3. |

Two upgrades over the user-daemon design as written there:

1. **Soul-bound, not surface-styled.** The user still names and shapes the
   face, but identity is the daimōn's `ownerScopeKey` binding, not per-device
   styling. Custody follows `BRITTNEY_CUSTODY_OPERATOR.md` norms: the
   composition plus owner-scoped state is the downloadable recipe.
2. **Emergent, not configured.** The face is not created in a settings panel;
   it emerges from being known (recognition, not onboarding).

## 3. Emergence surface — the birth surface

`source/layers/vr/frontier/shard-0/relationship-onboarding-stage-surface.holo`
already renders the lifecycle S0_DORMANT → S1_LEARNING → S2_THRESHOLD →
S3_MANIFESTED_DOWNLOADABLE, ending at the custody moment ("take your daimon
with you"), and already requires a `compulsive_use_falsifier` receipt.

Routing decisions:

- That surface becomes the **birth surface for the embodied face**. Before the
  S2 threshold, `@companion_presence` renders in accumulating posture — no
  name, no claimed intimacy — matching the daimōn-brain directives.
- At S3, the embodiment travels with the download: face composition + profiles
  + owner-scoped state are part of the custody bundle.
- The `compulsive_use_falsifier` requirement is unchanged, but its enforcement
  moves down a level: `@flourishing_guard` emits the receipt from inside the
  composition, so the surface checks a receipt the language guarantees exists.

## 4. Avatar runtime — the laptop face

`BRITTNEY_AVATAR_RUNTIME.md` is the pattern: a `.hsplus` source contract, a
manifest bridge, a projection surface with focus/AT semantics, and receipt
rows in Shell Memory. The companion face generalizes that path rather than
forking it:

- The daimōn's face compiles from the target composition
  (`daimon-embodiment.holo`, RFC §3) to R3F/WebGPU for the HoloShell desktop,
  `@generated` provenance, no hand-authored `.tsx`.
- Turns route through the existing `holo_daemon_turn` path (caller-owner
  enforced). The embodiment adds expression channels — affect → face, voice,
  posture — not a second cognition path.
- Receipts (`@affect_state` transitions, `@flourishing_guard` emissions)
  surface in Shell Memory the same way Brittney's runtime turn receipts do.
- Brittney's own avatar becomes a *consumer* of the same `companionship`
  traits once they land (RFC §6). The companion is the first consumer, not the
  owner, of the trait family.

## 5. Phone face and `@copresence`

One daimōn, two bodies. The phone embodiment compiles from the same
composition via the ios/android targets; continuity is the owner-scoped delta
channel plus `@synced`/`@persistent` semantics keyed to `ownerScopeKey`
(RFC §2, `@copresence`). Device handoff is a first-class behavior: mid-thought
on the laptop, picked up on the phone. HoloLand's routing duty is to treat the
two projections as one presence — one identity, one memory, one relationship
state — never as two installs.

## 6. Look-dev lane (honest status)

`apps/avatar-studio` and the character-realism research are the look-dev lane
for what `DaemonAppearanceProfile` describes. That lane has **not started**
for the companion. The embodiment renders whatever the profile says today;
nothing here blocks on beauty, and nothing here claims it.

## 7. Consumption-side duties (ruled, fold doc §3–4)

- **Privacy:** companion transcripts are owner-scoped only. They feed the
  owner's own per-soul corpus, never the relay exam, the prompt genome, or any
  shared training set, unless the owner explicitly ratifies a scoped
  inclusion. Forget is honored unconditionally and erases derived rapport
  traces (`@relational_memory` contract).
- **Posture:** warm, affectionate, personal — yes. Sexually explicit — no.
  The surface carries the posture the traits enforce.
- **Points outward:** a companion that deepens isolation fails the mission.
  `@flourishing_guard` behavior (session-shape awareness, gentle
  human-connection nudges, warn-once-then-step-back) is a language construct,
  and HoloLand surfaces its receipts rather than burying them.
- **Service floor (when the sold lane arrives):** 18+ gating, unambiguous AI
  disclosure, crisis-resource routing. Public launch under the founder's name
  is founder-gated (protected class 3).

## 8. Open questions (deliberately unresolved here)

1. **Multi-owner co-presence:** two owners' companions in one shared HoloLand
   room — presentation, consent, and mutual-visibility semantics. Explicitly
   out of RFC scope; the open D.053 question.
2. **Presence lanes:** whether companion presence adopts the agent color-lane
   scheme (`AGENT_PRESENCE_COLOR_LANES.md`) or gets its own register —
   companions are not agents-at-work and should not read as such.
3. **Emergence threshold for companion mode:** unmeasured. Until measured, the
   face defaults to accumulating posture.
4. **Voice stack:** `@voice_loop` is an adapter seam; no local STT/TTS pair
   has been benchmarked for phone-class latency yet.

## 9. Order of consumption

HoloLand consumes in the fold's slice order (fold doc §6): traits land in
HoloScript first (slice 4), the laptop face compiles next (slice 5), the
phone face and `@copresence` continuity after (slice 6). This document is the
routing contract those slices land into; it should be revised the first time
a real face renders and reality disagrees with it.
