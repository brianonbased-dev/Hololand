# Model Village Character Realism H4E: Zero-Copy Temporal Frame Graph

Status: **bounded pass**  
Captured: `2026-08-01T06:45:11.386Z`  
Milestone: `MV_CHARACTER_REALISM_H4E_ZERO_COPY_TEMPORAL_FRAME_GRAPH`

## Outcome

H4E moved temporal color and depth history into a persistent HoloScript WebGPU
frame graph and measured its resolve pass with actual GPU timestamp queries. The
live Chrome witness completed 40 timestamped resolves at 1400 x 900, with one
command buffer and one queue submission per resolve, zero intermediate frame
readbacks, and all seven deterministic LOD transitions rejecting stale history.

The measured temporal resolve kernel was:

| Statistic | GPU timestamp result |
|---|---:|
| Samples | 40 |
| Minimum | 98,304 ns (0.098304 ms) |
| Median | 99,328 ns (0.099328 ms) |
| Mean | 99,737.6 ns (0.0997376 ms) |
| P95 | 100,352 ns (0.100352 ms) |
| Maximum | 101,376 ns (0.101376 ms) |

These are GPU timestamp deltas for `temporal-resolve-compute-pass`. They are not
wall-clock durations and not full character, world, browser-frame, or production
frame times.

## Source Custody

The experiment is authored as three distinct HoloScript surfaces:

- `.holo`: executable world/benchmark intent and four named model-family bindings.
- `.hsplus`: typed fail-closed admission policy for timing, zero-copy, submission,
  readback, LOD-history, and claim boundaries.
- `.hs`: deterministic warmup, measurement, and LOD-stress schedule.

All three parsed successfully with the HoloScript toolchain. The browser bundle
was built directly from HoloScript canon commit
`b72544464b2054797c7a73a0de2150da45621b1a`, pinning
`TemporalFrameGraph.ts`, `TemporalConvergence.ts`, and their public WebGPU export
by SHA-256.

## Live Hardware Witness

- GPU: NVIDIA GeForce RTX 3060 Laptop GPU, 6144 MiB
- NVIDIA driver: `610.88`
- Windows driver version: `32.0.16.1088`
- Driver date reported by Windows: July 21, 2026
- VBIOS: `94.06.19.00.68`
- Browser: Chrome `151.0.7922.71`
- Browser adapter identity: vendor `nvidia`, architecture `ampere`
- Adapter and device feature: `timestamp-query`
- External network requests: `0`

The browser requested a high-performance WebGPU adapter, failed closed unless
`timestamp-query` was exposed, and requested the device with that feature as a
required feature. Each measured receipt required a positive timestamp delta,
the exact compute-pass scope, one command buffer, one queue submission, a
persistent pipeline, GPU-resident texture inputs/history, and no evidence or
intermediate frame readback.

## LOD / History Stress

After 8 warmup and 40 measured LOD0 frames, the harness ran 24 stress frames in
the deterministic sequence `LOD0 x3 -> LOD2 x3`, repeated four times. Seven
actual LOD transitions occurred. All seven produced `lod-change` invalidations,
`historyValid: false`, and `historyConsumed: false`. No stale LOD history crossed
an admitted transition.

## Visual Evidence

The final image is the temporally resolved GPU output derived from the admitted
H4D resident plate, with live H4E telemetry composed in the secure loopback page.
It preserves the four source-authored residents named OpenAI, Claude, Gemini, and
Grok while exposing the exact timing and history-rejection result.

- Screenshot SHA-256:
  `c5af02d0503e16754047243284400aba0974e1b476ef60243930a70c23e93985`
- Resolved output pixel SHA-256:
  `31102e66b5c1bcc6c85257ae9dced4eda9de6f50560585ae03f17b0c682a8360`
- Evidence receipt integrity:
  `c710964158f549f9286757734dd989e797a28b933b69ab79743b07c764ae6232`

## Truth Boundary

H4E proves the isolated HoloScript temporal resolve on this RTX/Chrome/driver
combination, including persistent color/depth history, zero-copy texture inputs,
single-submit execution, real GPU timestamps, and LOD-change history rejection.

H4E does **not** measure texture upload, query mapping, evidence readback,
screenshot capture, character rasterization, motion-vector rasterization, whole
browser frames, the full HoloLand world, Quest hardware, WebXR, or production
frame pacing. It does not establish a general RTX performance claim and does not
claim photorealism. The visual plate is inherited from H4D; H4E improves and
measures the temporal integration path rather than replacing character art.
