# Model Village Character Realism H4F — Character Temporal Frame Graph

Status: **PASS**  
Captured: 2026-08-01T08:10:59.377Z  
HoloScript canon: `345b85c87ef5a97bcad11cd39be8ece59358a319`

H4F renders the source-compiled OpenAI, Claude, Gemini, and Grok residents through the native HoloScript character color, motion/depth, and temporal-resolve graph. Each per-character frame uses one command buffer and one queue submission with no intermediate pixel readback.

## RTX GPU timestamp results

| Stage                      | Samples |   Median |      p95 |      Min |      Max |
| -------------------------- | ------: | -------: | -------: | -------: | -------: |
| characterColorNanoseconds  |      64 | 0.052 ms | 0.054 ms | 0.050 ms | 0.054 ms |
| motionDepthNanoseconds     |      64 | 0.029 ms | 0.029 ms | 0.027 ms | 0.030 ms |
| temporalResolveNanoseconds |      64 | 0.040 ms | 0.041 ms | 0.039 ms | 0.055 ms |
| aggregateNanoseconds       |      64 | 0.140 ms | 0.142 ms | 0.137 ms | 0.155 ms |

Workload: 64 measured per-character samples (16 per resident), 512 × 512, after four warmup frames per resident. Timings are WebGPU timestamp-query deltas, not wall clock.

## Exact boundary

The aggregate scope begins with the character-color render pass and ends with temporal resolve. CPU motion derivation, CPU-to-GPU uploads, post-timestamp history copies, timestamp mapping, final evidence readback, HTML composition, and screenshot capture are excluded. This is not a whole-world frame time, not one submission for all four characters, not a Quest measurement, and not a photorealism claim.
