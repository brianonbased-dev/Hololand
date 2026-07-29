# Model Village Character Appearance H3V: Portrait Anatomy

Date: 2026-07-29

Milestone: `MV_CHARACTER_APPEARANCE_H3V_PORTRAIT_ANATOMY`
Status: measured browser witness complete

## Outcome

H3V replaces the H3U bind-like arm silhouette with a source-authored, four-bone
portrait pose and adds language-native shoulder and face controls. The four
symbolic model-family residents remain named OpenAI, Claude, Gemini, and Grok.
Their bodies, faces, skin response, hair, clothing, and pose originate in the
`.holo` composition; `.hsplus` supplies the fail-closed admission contract and
`.hs` supplies the deterministic resident seed.

The final look-development pass was selected by visual inspection, not only by
numeric admission. The first arms-down capture exposed sharp superior deltoid
poles. HoloScript commit `38cef37972e2c5a6a980ae874206c15f5752ce26`
flattens those poles through a receipted `0.15` superior-contour scale on the
first V6 shoulder section, while retaining the six-ring transition, 288
shoulder-influenced vertices, 1,200 total dual-influenced vertices, and the
existing posed-volume floor.

## Measured browser witness

The checker compiled each resident twice through
`CharacterWebGPUCompiler.compile` and required exact repeated byte identity.
It then serialized the secondary joint channels and rendered all four residents
through HoloScript `renderCharacter` in headless Chrome using a browser-native
WebGPU adapter and device.

| Resident | Non-background pixels | Luminance range |
|---|---:|---:|
| OpenAI | 32,907 | 206.4132 |
| Claude | 33,273 | 198.3370 |
| Gemini | 32,524 | 216.2688 |
| Grok | 33,066 | 215.7072 |

Browser evidence:

- Chrome `150.0.7871.187`
- WebGPU vendor `nvidia`, architecture `ampere`
- adapter acquired: true
- device created: true
- external requests: 0
- hero image: 1400 x 900, 603,337 bytes
- hero SHA-256:
  `33a99d2030bcf66512ce0fd0609fe0b134d3847b0bd5b5f8b07c69d54020b7b0`
- canonical evidence receipt:
  `aa27bed35575357c77d0bd91e5aba51c3e86c5e7ab1296c7c09bd40d495e64be`

Current host readback from the same checker run:

`NVIDIA GeForce RTX 3060 Laptop GPU, driver 610.88, 6144 MiB`

This readback confirms the installed driver visible to `nvidia-smi`; it is not
an RTX frame-time benchmark.

## Language-native evidence

- upper-body profile: `portrait-anatomy-v6`
- shoulder deformation: `portrait-shoulder-volume-v2`
- superior contour minimum: `0.15`
- facial detail: `portrait-silhouette-v2`
- pose: `portrait_arms_down`, four local-bone rotations
- skin calibration: `fixed-light-human-v1`
- microdetail: `analytic-pore-v1`
- surface response: `calibrated-skin-surface-v1`
- repeated compiler output byte identity: true
- secondary joint weights serialized and consumed: true

The HoloScript language/runtime work passed 50 focused character tests, engine
TypeScript checks, lint, and ESM/CJS builds before HoloRepo promotion.

## Claim boundary

Measured:

- deterministic HoloScript source compilation for four residents
- browser-native WebGPU adapter and device acquisition
- one controlled fixed-light portrait render per resident
- source pose application and deformation receipts
- pixel coverage, luminance range, hashes, and current NVIDIA driver readback

Not measured or claimed:

- GPU timestamp frame time
- a fresh RTX performance benchmark
- Quest headset or WebXR execution
- physically calibrated camera or lighting
- photorealism
- full Model Village world performance
- provider model calls, behavioral identity, or adapter-family binding

The result is a visibly improved procedural character foundation, not a final
human digital-double system.
