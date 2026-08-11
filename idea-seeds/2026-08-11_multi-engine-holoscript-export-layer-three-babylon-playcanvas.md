# Multi-engine HoloScript export layer (Three/Babylon/PlayCanvas)

**Date:** 2026-08-11
**Class:** deleted-work
**Status:** seed
**Repository:** Hololand
**Source context:** bf424c5

## What Might Be Valuable

~30,000 lines that took a parsed HoloScript scene and drove three unrelated web
engines from it — Three.js (23k lines, by far the most developed), Babylon.js,
and PlayCanvas — plus a React/R3F component layer. The interesting part is not
the renderers, it is the evidence that one HoloScript scene description was
sufficient to drive engines with genuinely different scene-graph, material and
lifecycle models. That is a portability claim with code behind it. The Three
adapter also carried a multiplayer presence layer (`PresenceOverlay`,
`usePresence`) built on the `CRDTRoom` type from `@hololand/network`, which is
live work that outlived the adapter it shipped inside.

## Why Not Now

`docs/HOLOLAND_PURPOSE.md` Proof Policy is explicit: HoloLand "is not primarily
a proof that HoloScript can export to every competitor runtime or compiler
target." Whatever value this has belongs to HoloScript, whose compiler already
publishes `compile_to_*` targets for these engines — not to HoloLand, whose job
is embodiment and hardware proof. It was also dead weight in practice:
`@hololand/renderer`, the actual shipping renderer, never imported any of the
three adapters. It depends on `three` and `@react-three/fiber` directly.

## Smallest Next Experiment

Take one non-trivial `.holo` scene, compile it through HoloScript's existing
`compile_to_r3f` and any second engine target, and diff the visual result. If
HoloScript's own compiler targets already reach parity with what these adapters
did, the seed is closed permanently. If they do not, the deleted Three adapter
is the reference implementation for what the gap looks like.

## Reopen Trigger

- A HoloScript compiler target for a web engine needs a reference implementation
  and its authors want prior art.
- Multiplayer presence-over-CRDT gets picked up again — recover
  `PresenceOverlay.tsx` / `usePresence.ts` rather than rewriting them.
- An outside consumer asks to render HoloScript in an engine HoloScript does not
  yet target.

## Do Not Preserve

- The `@hololand/*` scope for any of it. If this returns it belongs to
  HoloScript, not HoloLand.
- The `@holoscript/core@^3.43.0` pins. That major was never published to npm
  (core went 1 → 2 → 5 → 6 → 7 → 8), so those ranges are unresolvable and came
  from a private monorepo version line.
- The `file:../../../../HoloScript/packages/...` dependency style. It assumes
  HoloScript is a sibling folder on one disk and cannot work for any consumer.
- `packages/adapters/{unity,vrchat}` — empty directories, never had content.

## Links

- Commit `bf424c5` — removal, with the full rationale in the message.
- `docs/HOLOLAND_PURPOSE.md` — Proof Policy and the "What HoloLand Does Not Own" table.
- `packages/platform/renderer` — the renderer that actually ships, for comparison.
