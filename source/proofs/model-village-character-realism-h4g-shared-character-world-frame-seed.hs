// H4G deterministic shared resident-frame schedule and claim boundary.

object H4GSharedCharacterWorldFrameSeedManifest {
  type: "browser_webgpu_shared_character_world_frame_seed_manifest"
  schema: "hololand.model-village.character-realism-h4g-seed.v1"
  milestone: "MV_CHARACTER_REALISM_H4G_SHARED_CHARACTER_WORLD_FRAME"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-realism-h4g-shared-character-world-frame.holo"
  policySource: "source/proofs/model-village-character-realism-h4g-shared-character-world-frame-policy.hsplus"
  upstreamHoloScriptCommit: "7a09fa27ba78694ad0751eabf9befea08aa973e3"
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  deterministicSeed: 3108014
  tileWidth: 512
  tileHeight: 512
  compositeWidth: 1024
  compositeHeight: 1024
  compositeLayout: "two-by-two"
  warmupSharedFrames: 4
  measuredSharedFrames: 32
  totalMeasuredSamples: 32
  temporalFeedback: 0.75
  temporalJitterSampleCount: 8
  disocclusionDepthThreshold: 0.01
  timestampQueryRequired: true
  timestampQueryCount: 26
  timestampScope: "four-character-color-motion-depth-temporal-through-composite-gpu-scope"
  persistentGpuResourcesRequired: true
  fixedTopologyRequired: true
  sharedCommandBufferCountRequired: 1
  sharedQueueSubmissionCountRequired: 1
  zeroCopyResidentOutputsToCompositeRequired: true
  intermediateFrameReadbackCountRequired: 0
  finalEvidenceFrameReadbackCount: 1
  boundedSharedCharacterCompositeRtxBenchmarkClaimed: true
  fullHoloLandWorldFrameClaimed: false
  productionWholeFrameTimeClaimed: false
  questHeadsetMeasured: false
  photorealismClaimed: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "browser_profile_as_quest_device", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object H4GSharedFrameSchedule {
  type: "deterministic_source_compiled_shared_micro_motion_schedule"
  frameStateOffsetsSeconds: [0, 0.84]
  alternateSourceStates: true
  temporalJitterSequence: "halton_base_2_3_eight_samples"
  warmupSharedFrames: 4
  measuredSharedFrames: 32
  finalEvidenceSharedFrames: 1
  measuredCapturePixels: false
  finalEvidenceCapturePixels: true
}
