# Quest 3 In-World Authoring Loop

This spec defines HoloLand's minimum source-owned answer to in-headset world
building. It is intentionally narrower than Resonite-style in-world node
scripting: HoloLand now has a contract for voice-to-world and
gesture-to-trait authoring, but not a realtime collaborative graph runtime or
headless self-hosted session model.

## Source Layer

| Layer | Source |
|---|---|
| Room surface | `apps/holoshell/source/hololand-quest3-authoring-room.holo` |
| Policy semantics | `apps/holoshell/source/hololand-quest3-authoring-policy.hsplus` |
| Voice pipeline anchor | `packages/brittney/ai-bridge/src/VoiceMCPPipeline.ts` |
| Natural language bridge | `packages/brittney/ai-bridge/src/HololandAIBridge.ts` |
| Trait compiler anchor | `packages/spatial-builder/src/services/SpatialBridgeService.ts` |
| Hand and wrist tracking anchor | `packages/ar/tracking/src/holoscript/bindings.ts` |
| Quest viewer budget anchor | `apps/holoshell/source/hololand-quest-browser-webxr-viewer.holo` |
| Local check | `scripts/check-hololand-quest3-authoring-loop.mjs` |

## Workflow

1. Capture voice input through the Brittney voice pipeline.
2. Normalize the transcript into a `VoiceWorldIntentPacket`.
3. Use pointing, pinching, wrist rotation, two-hand scale, palm inspect,
   air draw, cup spawn, or wrist save to bind target and edit mode.
4. Compile the gesture and intent into strict trait payloads through the
   spatial bridge.
5. Generate a HoloScript patch and record source hash before and after.
6. Parse the patch and render a preview ghost.
7. Check the Quest 3 budget before headset-readiness copy.
8. Commit only after explicit confirmation.
9. Record a `Quest3AuthoringReceipt`.

## Packets

`VoiceWorldIntentPacket` carries transcript, intent class, target world, target
object, confidence, source context hash, and clarification state.

`GestureTraitBindingPacket` carries gesture name, required hand keypoints,
target object, trait namespace, modifier payload, confidence, and confirmation
requirement.

`InWorldAuthoringPatch` carries generated HoloScript, source ref, source hashes,
trait namespaces, parser state, preview state, and Quest budget state.

`Quest3AuthoringReceipt` carries the full commit proof: voice, gesture, target,
trait, source hashes, parse state, preview state, budget state, commit flag, and
the parity boundary.

## Product Boundary

This contract narrows the competitor gap by making HoloLand's headset authoring
loop source-owned and checkable. It does not claim:

- ProtoFlux-equivalent in-world node scripting.
- Realtime collaborative graph editing.
- Conflict resolution for simultaneous multi-user source edits.
- Headless or self-hosted session hosting.
- Marketplace-scale mod distribution.

Those are follow-up backend/runtime gaps, not copy problems.
