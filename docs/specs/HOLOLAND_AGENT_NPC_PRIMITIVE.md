# HoloLand Agent NPC Primitive

**Status:** HL-014 implementation slice
**Source:** `apps/holoshell/source/hololand-agent-npc-primitive.hsplus`
**World embed:** `apps/holoshell/source/hololand-agent-npc-world.holo`

## Decision

HoloLand NPCs are native HoloMesh agents embedded in worlds. They are not
rented dialogue widgets. The minimum primitive is:

1. x402/HoloMesh identity.
2. HoloScript brain source and trait manifest.
3. Shared world-state read/write contract.
4. Player-visible world embodiment.
5. Re-executable CAEL-style action receipts with rollback plans.

This is the sovereign response to Inworld-style AI-NPC infrastructure: HoloLand
can make NPCs accountable world actors instead of opaque model endpoints.

## Primitive Contract

The source contract defines:

| Layer | Requirement |
|---|---|
| Identity | `holomeshAgentId` and `x402SeatId` are required before registration. |
| Brain | `MiraWayfinderBrain` declares Brittney lineage, sovereign traits, memory boundary, and dialogue boundary. |
| World state | `SharedWorldStateBinding` names readable public state, writable NPC state, and forbidden private writes. |
| Embodiment | `hololand-agent-npc-world.holo` places the NPC, shared-state board, and receipt ledger in the world. |
| Receipts | `AgentNpcActionReceipt` requires action, outcome, rollback plan, player-visible impact, and source hashes. |

## Brittney Feature Declaration

```yaml
brittney_feature:
  name: "HoloLand Agent NPC Primitive"
  supported_modes:
    - local_gguf
    - local_lan_ollama
    - byok_cloud
    - holoscript_cli_mcp
    - in_world_npc_steward
  unsupported_modes:
    - mode: "managed_hololand_service"
      reason: "This slice proves the sovereign local-first primitive before managed fleet operation."
      unblock_condition: "Managed runtime must preserve x402 identity, source hashes, cost ceilings, and receipts."
  receipt_behavior:
    actor: "HoloMesh agent NPC"
    source: "HoloScript NPC brain and world embed source"
    route: "local-first, LAN fallback, BYOK only by explicit policy"
    world_effect: "proposal or receipted mutation"
    storage: ".tmp/hololand-agent-npc-primitive/receipt.json"
  fallback_order:
    - "local_gguf"
    - "local_lan_ollama"
    - "byok_cloud"
  cost_ceiling: "0.5 USD/day per NPC unless an explicit policy overrides it"
  privacy_boundary: "public world state only; private player memory is forbidden"
  source_contract: "apps/holoshell/source/hololand-agent-npc-primitive.hsplus"
```

## Validation

Run:

```powershell
pnpm run check:hololand-agent-npc-primitive
```

The check parses both HoloScript sources with the local HoloScript source
parser, verifies the semantic anchors, checks this spec/source-map/package
wiring, and writes `.tmp/hololand-agent-npc-primitive/receipt.json`.
