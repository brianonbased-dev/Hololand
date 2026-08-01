# H4H material and model-family identity convergence

Status: **PASS**

H4H fixes a real compiler-to-shader identity loss: exact `@hair(color)` RGB now remains operative alongside the melanin response. The four residents still render through the promoted H4G persistent shared WebGPU graph in one command buffer and one queue submission.

## Source-compiled identity

| Resident | Source hair | Material receipt | Source weight | Geometry digest |
|---|---:|---|---:|---|
| OpenAI | #2F2928 | holoscript.agent-avatar-hair-material.v2 | 0.55 | `0356bbac29c8` |
| Claude | #6B4633 | holoscript.agent-avatar-hair-material.v2 | 0.55 | `c2fb9c81d321` |
| Gemini | #303641 | holoscript.agent-avatar-hair-material.v2 | 0.55 | `1475656d4b82` |
| Grok | #171D22 | holoscript.agent-avatar-hair-material.v2 | 0.55 | `f7ef9c65b338` |

## Live RTX scope

- Shared four-resident aggregate median: 0.624 ms.
- Shared 2x2 composite median: 0.046 ms.
- Samples: 32 measured shared frames after 4 warmups.
- Per sample: one command buffer, one queue submission, 26 GPU timestamp queries, and zero measured pixel readbacks.
- Browser/GPU: Chrome/151.0.7922.71; nvidia/ampere.

## Honest boundary

This is a bounded four-resident character/composite measurement and material-identity witness. It is not a complete HoloLand world frame, a Quest/headset result, a production whole-frame budget, or a photorealism claim.
