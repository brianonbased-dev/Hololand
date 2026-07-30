// H4D flat deterministic temporal seed.

object H4DProductionTemporalSeedManifest {
  type: "browser_webgpu_character_temporal_seed_manifest"
  schema: "hololand.model-village.character-realism-h4d-seed.v1"
  milestone: "MV_CHARACTER_REALISM_H4D_PRODUCTION_TEMPORAL_CONVERGENCE"
  source: "source/proofs/model-village-character-realism-h4d-production-temporal-convergence-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-realism-h4d-production-temporal-convergence.holo"
  policySource: "source/proofs/model-village-character-realism-h4d-production-temporal-convergence-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_REALISM_H4C_NATIVE_GAZE_BREATHING"
  upstreamHoloScriptCommit: "623b2bf3c6f4e7ba0fa4ed62ce20061796664c28"
  deterministicSeed: 301207
  compilerTarget: "character-webgpu"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  previousFrameOffsetSeconds: 0
  currentFrameOffsetSeconds: 0.84
  temporalSampleCount: 8
  temporalFeedbackCeiling: 0.875
  motionVectorSpace: "current_minus_previous_pixels"
  depthDisocclusionThreshold: 0.01
  neighborhoodClampingRequired: true
  reactiveMaskRequired: true
  productionTemporalEntrypointsIntegrated: true
  readbackBackedVerification: true
  zeroCopyFrameGraphMeasured: false
  gpuTimestampMeasured: false
  wallClockUsedAsGpuTime: false
  freshRtxBenchmarkClaimed: false
  questHeadsetMeasured: false
  photorealismClaimed: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "browser_profile_as_quest_device", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object H4DTemporalFrameZero {
  type: "deterministic_temporal_frame_seed"
  order: 0
  sourceTimeOffsetSeconds: 0
  haltonSampleIndex: 0
  historyValid: false
}

object H4DTemporalFrameOne {
  type: "deterministic_temporal_frame_seed"
  order: 1
  sourceTimeOffsetSeconds: 0.84
  haltonSampleIndex: 1
  historyValid: true
}
