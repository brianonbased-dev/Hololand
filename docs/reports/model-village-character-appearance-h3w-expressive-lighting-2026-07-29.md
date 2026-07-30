# Model Village Character Appearance H3W: Expressive Lighting

Date: 2026-07-29

Milestone: `MV_CHARACTER_APPEARANCE_H3W_EXPRESSIVE_LIGHTING`  
Status: measured browser witness complete

## Outcome

H3W gives the four symbolic model-family residents a source-authored
conversation read instead of another neutral identity-card pose. OpenAI,
Claude, Gemini, and Grok now carry independent left/right scapular elevation
and protraction, a five-bone neck-and-shoulder pose, asymmetric blink and brow
controls, smile and jaw controls, and a warm-key / cool-fill / copper-rim
environment.

The `.holo` composition is the visual source of truth. Its controls compile
through HoloScript `CharacterWebGPUCompiler` and
`buildCharacterHostFromComposition`; `.hsplus` defines the fail-closed
admission policy, and `.hs` supplies the deterministic resident seed. Native
`.hsplus` action execution is not claimed.

The first inspected H3W board passed its numeric checks but still framed the
residents as distant full-body cards and stretched the square render buffers.
The selected pass narrows the compiler-derived frame to face plus upper-body
ranges, renders at 512 square pixels per resident, and displays those buffers
without aspect distortion. This makes the authored eyelid, brow, neck, and
shoulder differences legible while retaining the same source and admission
gates.

## Measured browser witness

Each resident was compiled twice with exact byte identity. The checker then
rendered the same compiled draw specification twice in headless Chrome:

1. the compatibility key-light path; and
2. the source-authored analytic three-point environment.

The controlled pixel difference proves that the environment changes native
material output rather than merely changing the surrounding HTML.

| Resident | Portrait pixels | Luminance range | Relit pixels | Absolute channel delta |
|---|---:|---:|---:|---:|
| OpenAI | 132,109 | 235.4362 | 125,935 | 4,676,696 |
| Claude | 132,850 | 229.0872 | 132,848 | 4,974,107 |
| Gemini | 123,205 | 252.0506 | 121,077 | 4,519,618 |
| Grok | 142,114 | 229.2814 | 137,083 | 4,838,698 |

Browser evidence:

- Chrome `150.0.7871.187`
- WebGPU vendor `nvidia`, architecture `ampere`
- adapter acquired: true
- device created: true
- external requests: 0
- hero image: 1400 x 900, 677,234 bytes
- hero SHA-256:
  `4774212f1c2d6cb2e5babb7722a5083266a9b27246383236786522bdcf518e27`
- canonical evidence receipt:
  `bf48227ae795a6139fd5701364051a93b872244872db0c4a0bb5526c45425f96`

Current host readback from the same checker run:

`NVIDIA GeForce RTX 3060 Laptop GPU, driver 610.88, 6144 MiB`

The adapter and device evidence establishes browser-native WebGPU execution on
the NVIDIA Ampere adapter. The host readback establishes the installed driver.
Neither is an RTX frame-time benchmark.

## Language-native evidence

- upper-body profile: `expressive-anatomy-v7`
- joint deformation: `expressive-neck-scapular-volume-v3`
- influenced vertices: 1,296 total, including 96 neck vertices
- neck blend: four rings with weights `[0.08, 0.22, 0.45, 0.2]`
- per-resident independent scapular elevation and protraction: receipted
- pose: `civic_conversation`, five local-bone rotations
- facial morph receipt: `holoscript.native-facial-morph.v2`
- six authored expression targets per resident
- changed expression vertices: 1,721 to 1,729 per resident
- environment receipt: `holoscript.character-environment-light.v1`
- key / fill / rim intensities: `1.18 / 0.30 / 0.66`
- environment exposure: `1.05`
- repeated compiler output byte identity: true
- secondary joint weights serialized and consumed: true

The upstream HoloScript runtime is pinned to
`09fe4773d58122927eabb9787c9fc2fcb4e486ba`. Its focused H3W character suite
passed 67 of 67 tests, engine TypeScript checks, and ESM/CJS builds before
HoloRepo promotion. A broader package test attempt exceeded the bounded
60-second runner and is not reported as green.

## Claim boundary

Measured:

- deterministic HoloScript source compilation for four residents
- browser-native WebGPU adapter and device acquisition
- V7 asymmetric scapular controls and operative neck blend weights
- source-authored facial morph application
- analytic three-point material response against a legacy-light counterfactual
- pixel coverage, luminance range, hashes, and current NVIDIA driver readback

Not measured or claimed:

- GPU timestamp frame time or a fresh RTX performance benchmark
- Quest headset or WebXR execution
- physically calibrated camera or lights
- photorealism or digital-double fidelity
- full Model Village world performance
- provider model calls, behavioral identity, or adapter-family binding

H3W is a visibly stronger procedural conversation-portrait foundation. The
remaining realism gap is still substantial: higher-density face topology,
better garment construction, image-based environment response, and production
hair/skin assets belong to later bounded lanes.
