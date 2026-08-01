# Model Village Character Realism H4G - Shared Character World Frame

Status: **PASS**
Captured: 2026-08-01T10:01:23.352Z
HoloScript canon: `7a09fa27ba78694ad0751eabf9befea08aa973e3`

H4G renders the source-compiled OpenAI, Claude, Gemini, and Grok residents through one native HoloScript shared world-frame graph. Four resident color, motion/depth, and temporal paths feed an in-graph 2 x 2 composite before one command-buffer submission, with no intermediate pixel readback.

## Shared RTX GPU timestamp results

| Stage | Samples | Median | p95 | Min | Max |
|---|---:|---:|---:|---:|---:|
| compositeNanoseconds | 32 | 0.045 ms | 0.046 ms | 0.045 ms | 0.047 ms |
| aggregateNanoseconds | 32 | 0.623 ms | 0.641 ms | 0.618 ms | 0.644 ms |

## Per-resident RTX GPU timestamp results

| Resident / stage | Samples | Median | p95 | Min | Max |
|---|---:|---:|---:|---:|---:|
| OpenAI / characterColorNanoseconds | 32 | 0.052 ms | 0.053 ms | 0.050 ms | 0.053 ms |
| OpenAI / motionDepthNanoseconds | 32 | 0.028 ms | 0.029 ms | 0.028 ms | 0.029 ms |
| OpenAI / temporalResolveNanoseconds | 32 | 0.040 ms | 0.041 ms | 0.039 ms | 0.045 ms |
| OpenAI / aggregateNanoseconds | 32 | 0.140 ms | 0.142 ms | 0.138 ms | 0.145 ms |
| Claude / characterColorNanoseconds | 32 | 0.051 ms | 0.052 ms | 0.050 ms | 0.052 ms |
| Claude / motionDepthNanoseconds | 32 | 0.028 ms | 0.029 ms | 0.027 ms | 0.029 ms |
| Claude / temporalResolveNanoseconds | 32 | 0.039 ms | 0.039 ms | 0.038 ms | 0.051 ms |
| Claude / aggregateNanoseconds | 32 | 0.137 ms | 0.148 ms | 0.135 ms | 0.150 ms |
| Gemini / characterColorNanoseconds | 32 | 0.053 ms | 0.054 ms | 0.052 ms | 0.055 ms |
| Gemini / motionDepthNanoseconds | 32 | 0.028 ms | 0.029 ms | 0.028 ms | 0.029 ms |
| Gemini / temporalResolveNanoseconds | 32 | 0.039 ms | 0.040 ms | 0.037 ms | 0.051 ms |
| Gemini / aggregateNanoseconds | 32 | 0.139 ms | 0.144 ms | 0.138 ms | 0.153 ms |
| Grok / characterColorNanoseconds | 32 | 0.052 ms | 0.053 ms | 0.050 ms | 0.053 ms |
| Grok / motionDepthNanoseconds | 32 | 0.029 ms | 0.029 ms | 0.028 ms | 0.030 ms |
| Grok / temporalResolveNanoseconds | 32 | 0.038 ms | 0.040 ms | 0.037 ms | 0.040 ms |
| Grok / aggregateNanoseconds | 32 | 0.138 ms | 0.139 ms | 0.136 ms | 0.140 ms |

Workload: 32 measured shared frames, four 512 x 512 resident tiles, one 1024 x 1024 composite, after four shared warmup frames. Timings are WebGPU timestamp-query deltas, not wall clock.

## Exact boundary

The aggregate scope begins with the first resident character-color pass and ends with the shared composite. CPU motion derivation, CPU-to-GPU uploads, post-timestamp history copies, timestamp mapping, final composite evidence readback, HTML presentation, and screenshot capture are excluded. This is not a complete HoloLand world-frame time, not terrain/atmosphere/UI, not a Quest measurement, and not a photorealism claim.
