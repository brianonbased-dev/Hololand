// H4B flat deterministic character micro-motion seed.

object H4BMicroMotionTimingSeedManifest {
  type: "browser_webgpu_micro_motion_timing_seed_manifest"
  schema: "hololand.model-village.character-realism-h4b-seed.v1"
  milestone: "MV_CHARACTER_REALISM_H4B_MICRO_MOTION_TIMING"
  source: "source/proofs/model-village-character-realism-h4b-micro-motion-timing-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-realism-h4b-micro-motion-timing.holo"
  policySource: "source/proofs/model-village-character-realism-h4b-micro-motion-timing-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H4A_FACIAL_VOLUME_GARMENT_FRAMING"
  upstreamHoloScriptCommit: "1f295ee62e255883dc95394f5249700023bb39df"
  deterministicSeed: 301205
  compilerTarget: "character-webgpu"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  profile: "human_presence_v1"
  absoluteTimeSampling: true
  deterministicReplayRequired: true
  nativeBlinkApplied: true
  nativeGazeTransformApplied: false
  nativeBreathTransformApplied: false
  nativeClothSimulationApplied: false
  staticTaaConvergenceMeasured: true
  staticTaaSampleCount: 8
  productionTaaIntegrated: false
  motionVectorsIntegrated: false
  gpuTimestampMeasured: false
  wallClockUsedAsGpuTime: false
  freshRtxBenchmarkClaimed: false
  photorealismClaimed: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "browser_profile_as_quest_device", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object OpenAIMotionSeed {
  type: "named_model_family_micro_motion_seed"
  order: 0
  targetObjectId: "OpenAIResident"
  displayLabel: "OpenAI"
  sourceTimeSeconds: 2.940911
}

object ClaudeMotionSeed {
  type: "named_model_family_micro_motion_seed"
  order: 1
  targetObjectId: "ClaudeResident"
  displayLabel: "Claude"
  sourceTimeSeconds: 1.50983
}

object GeminiMotionSeed {
  type: "named_model_family_micro_motion_seed"
  order: 2
  targetObjectId: "GeminiResident"
  displayLabel: "Gemini"
  sourceTimeSeconds: 0.896702
}

object GrokMotionSeed {
  type: "named_model_family_micro_motion_seed"
  order: 3
  targetObjectId: "GrokResident"
  displayLabel: "Grok"
  sourceTimeSeconds: 3.434138
}
