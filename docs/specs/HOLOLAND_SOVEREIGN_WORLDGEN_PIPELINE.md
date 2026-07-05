# HoloLand Sovereign Worldgen Pipeline

This spec defines the HL-013 proof lane: text and optional observed image facts
become a typed, navigable HoloScript world instead of an opaque splat artifact.

## Source Layer

| Layer | Source |
|---|---|
| Pipeline source contract | `apps/holoshell/source/holoshell-sovereign-worldgen-pipeline.hsplus` |
| Bridge and receipt writer | `scripts/holoshell-sovereign-worldgen-pipeline.mjs` |
| Local check | `scripts/__tests__/holoshell-sovereign-worldgen-pipeline.test.mjs` |
| Package command | `pnpm run check:hololand-sovereign-worldgen` |

## Workflow

1. Capture a text prompt and optional image-observation facts.
2. Decompose the facts into explicit `observed` records.
3. Create `inferred` world decisions linked to the observed facts.
4. Generate a typed asset graph with geometry, navigation, collision, and
   provenance nodes.
5. Emit `.holo` source for a navigable Quest/WebXR world.
6. Parse the source with the local HoloScript parser path.
7. Render a browser preview artifact from the same graph.
8. Write a receipt, registry record, and learning signal.

## Product Boundary

World Labs Marble and Google Genie are benchmarks. The HoloLand lane does not
depend on their opaque world representation as source truth. Splat ingest can
exist as an optional import fixture or `compile_to_3dgs` bridge, but the
canonical artifact remains an editable HoloScript asset graph with observed vs
inferred provenance.

## Done State For HL-013

The first shipped slice is intentionally deterministic. It proves that HoloLand
has a source-owned path from intent to navigable world artifact and receipt.
Future work should replace the synthetic observed-fact fixture with a live image
decomposition model while keeping the same receipt contract.
