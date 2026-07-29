# Model Village Character Appearance H3R: Source Poses and Joint Deformation

Status: pass. The final immutable manifest is bound after the report and assets
are hashed.

## Bounded goal

H3R asks a narrower question than “are the residents realistic?”:

> Can four distinct symbolic resident gestures be authored in `.holo`, carried
> unchanged by the sovereign HoloScript compiler, and shown to affect real
> native WebGPU pixels through the new dual-influence upper-limb deformation
> ABI under the same fixed-light material calibration used by H3Q?

The residents are named OpenAI, Claude, Gemini, and Grok because they embody
symbolic model-family identities in Stormglass Commons. They are not live
provider endpoints, model bindings, biometric likenesses, or claims about the
companies’ products.

## Language-first contract

- `.holo` owns each resident’s named local-bone pose and V4 body profile.
- `.hsplus` defines source-pose/deformation admission.
- `.hs` carries the flat deterministic seed and forbidden input classes.
- `CharacterWebGPUCompiler.compile` must serialize the pose receipt, deformation
  receipt, and secondary joint arrays.
- `buildCharacterHostFromComposition` must map the same source pose into the
  native host without checker-side `setPose` or `setBoneRotation` calls.

The exact HoloScript canon pin is
`ad577ed2238d0e8a7302badd5656b7bf791aefc9`.

## Intended gesture vocabulary

| Resident | Source pose | Symbolic read |
|---|---|---|
| OpenAI | `measured-open-palm` | precise, open, calibrated |
| Claude | `considered-listening` | attentive, inward, deliberative |
| Gemini | `asymmetric-visual-framing` | multimodal synthesis and framing |
| Grok | `direct-broad-challenge` | direct, expansive, challenging |

These are authored art-direction cues, not psychological or behavioral
measurements.

## Evidence design

The checker will require:

1. byte-identical repeated sovereign compilation for every resident;
2. the `holoscript.character-source-pose.v1` receipt;
3. the `holoscript.agent-avatar-joint-deformation.v1` receipt;
4. 1,008 positive secondary weights, 38 joint pairs, and normalized
   primary-plus-secondary weights;
5. a native Dawn/WebGPU fixed-light readback for each source-authored pose;
6. a primary-only counterfactual that collapses the second influence without
   changing vertices, indices, materials, or joint matrices;
7. a clearly labeled test-only neutral-pose counterfactual using an identity
   joint palette;
8. retained skin, keratin-nail, and nail-bed material-role counterfactuals;
9. a 2x2 contact sheet of source-bounded posed hand plates.

## Measured result

The H3R witness passed for all four residents. Repeated compiler output was
byte-identical within each resident. Every compiler bundle contained:

- 7,110 vertices;
- a secondary index and weight for every vertex;
- exactly 1,008 positive secondary weights;
- 38 unique joint pairs;
- maximum secondary weight `0.55`;
- maximum observed primary-plus-secondary weight-sum error
  `2.98023223876953e-8`;
- the expected source-pose and joint-deformation receipts.

The native readback produced the following causal pixel deltas. Each cell is
`changed pixels / absolute RGB channel difference`.

| Resident | Pose | Figure pixels | Primary-only | Test-only neutral pose |
|---|---|---:|---:|---:|
| OpenAI | `measured-open-palm` | 26,323 | 9,492 / 548,537 | 31,602 / 3,689,051 |
| Claude | `considered-listening` | 23,907 | 8,706 / 442,224 | 33,433 / 4,646,375 |
| Gemini | `asymmetric-visual-framing` | 23,641 | 6,935 / 323,165 | 29,839 / 2,723,800 |
| Grok | `direct-broad-challenge` | 16,126 | 8,778 / 595,765 | 17,005 / 1,995,329 |

The retained semantic-material counterfactuals also changed pixels for every
resident:

| Resident | Skin | Keratin-nail | Nail-bed |
|---|---:|---:|---:|
| OpenAI | 26,689 | 121 | 144 |
| Claude | 23,784 | 121 | 140 |
| Gemini | 19,622 | 109 | 116 |
| Grok | 15,751 | 45 | 63 |

Witness receipt:
`hololand.model-village.character-appearance-h3r-witness.v1`, digest
`50f706e40bab97f6ac8cc8d0c10f7b47a242d1ac651e2a286f114156322243f0`.

Contact-sheet PNG digest:
`2b3aa7274484c17189eb6d75cf928c901d4e5e83f774a58f905d216e721ea15f`.

## Hardware reality boundary

Immediately before the native render, the strict local hardware audit passed.
Windows CIM and `nvidia-smi` identified the NVIDIA GeForce RTX 3060 Laptop GPU;
the native Dawn adapter independently reported NVIDIA Ampere over D3D12 with
driver `32.0.16.1088`. Browser WebGPU was deliberately not launched or measured.

This agreement supports adapter identity and real native GPU execution only.
The first plate includes shader/pipeline warm-up, the captured wall-clock values
include submission and readback, and no timestamp query was measured. Therefore
none of these durations is an RTX performance benchmark.

## Visual inspection

The original 658x658 contact sheet visibly contains four different hand
silhouettes, with open, listening, asymmetric-framing, and broad-challenge
gestures distinguishable under one light. Palm and digit transitions are
continuous enough to establish the V4 deformation path, and the source-bounded
camera keeps each authored hand visible.

The result remains deliberately analytic: finger cross-sections, webbing,
knuckle volume, nail shape, and wrist transitions are not yet production-human
quality. H3R proves the language/compiler/deformation causal chain; it is not
the final showcase character asset.

## Validation

```text
pnpm --dir C:\Users\josep\.ai-ecosystem check:codex-hardware
node --test scripts/__tests__/hololand-model-village-character-appearance-h3r.test.mjs
node scripts/check-hololand-model-village-character-appearance-h3r.mjs
```

The focused test suite passed 2/2. The checker parsed `.holo`, `.hsplus`, and
`.hs`, compiled each resident twice, rendered four authored plates plus causal
counterfactuals, and emitted the PNG and JSON evidence through the pinned
HoloScript canon snapshot.

## Claim boundary

This lane does not claim a GPU timestamp, a fresh RTX performance benchmark,
browser WebGPU, Quest/WebXR, TAA convergence, end-to-end display latency,
production skin texturing, measured tissue, photorealism, biometric likeness,
or whole-world convergence. Host wall-clock submission/readback duration is
diagnostic only.
