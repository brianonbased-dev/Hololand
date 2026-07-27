# HoloLand Model Village MV-S2 Spatial Soundscape

Date: 2026-07-27
Status: PASS (structural and executable audio proof; human mix approval remains open)

## Outcome

`model-village-spatial-soundscape.holo` owns a 52-second, six-source weather bed for **Stormglass Commons: Weather in the Light**. The local bridge deterministically materializes those authored recipes into six mono WAV stems and one stereo master, then constructs a real admitted Web Audio graph with five spatial panners, seven gains, a dynamics compressor, and the browser destination.

## Verified boundary

- HoloScript parse: 0 errors; six first-class `audio` blocks.
- Local LSP: 0 syntax errors and five stale-registry warnings for `@audio_listener`, `@environmental_audio`, `@audio_material`, `@audio_occlusion`, and `@audio_portal`; the built compiler accepts them and the live HoloScript trait suite passes 84/84 tests.
- Deterministic PCM: two independent renders produced the same master PCM SHA-256, `4f068aca3dde32638afb5256cc1d4e23f3354f9323f52576d6b42f888d046593`.
- Browser: real secure-loopback `AudioContext` reached `running` after a user gesture; default muted; mute, replay, captions, and text audio-description controls passed.
- Admission: story and post-lock profiles are exact-hash admitted; live blinded research and missing tokens fail neutral without constructing an audio graph.
- HoloScript target proof: Godot lowering contains five `AudioStreamPlayer3D` nodes and one `AudioStreamPlayer`.
- Noninterference: the protected parent-show and research-appearance hashes are unchanged; external fetches, model calls, and browser writes are zero.

## Listening handoff

The playable stereo master is [stormglass-weather-in-the-light-master.wav](../assets/model-village/stormglass-weather-in-the-light-master.wav). It is a deterministic engineering handoff, not evidence that a human completed a listen pass or approved the mix.

## Claim boundary

Proved: authored timing and source placement, deterministic local PCM/WAV materialization, real browser graph topology, control behavior, admission behavior, and no-feedback invariants.

Not proved: human listening completion, human mix approval, calibrated loudspeaker/headphone response, perceptual HRTF accuracy, spoken narration/TTS, live weather physics, resident hearing, adaptive music, provider endorsement, or headset performance.
