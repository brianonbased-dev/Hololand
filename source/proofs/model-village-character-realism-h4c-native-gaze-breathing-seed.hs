// H4C flat deterministic native-presence seed.

object H4CNativeGazeBreathingSeedManifest {
  type: "browser_webgpu_native_presence_seed_manifest"
  schema: "hololand.model-village.character-realism-h4c-seed.v1"
  milestone: "MV_CHARACTER_REALISM_H4C_NATIVE_GAZE_BREATHING"
  source: "source/proofs/model-village-character-realism-h4c-native-gaze-breathing-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-realism-h4c-native-gaze-breathing.holo"
  policySource: "source/proofs/model-village-character-realism-h4c-native-gaze-breathing-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_REALISM_H4B_MICRO_MOTION_TIMING"
  upstreamHoloScriptCommit: "c96c6bf7314be5d8849c6da256e92464f461b846"
  deterministicSeed: 301206
  compilerTarget: "character-webgpu"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  profile: "human_presence_v1"
  absoluteTimeSampling: true
  deterministicReplayRequired: true
  nativeBlinkApplied: true
  nativeGazeTransformApplied: true
  nativeBreathTransformApplied: true
  nativeClothSimulationApplied: false
  measuredBrowserFrameCount: 3
  measuredFrameOffsetsSeconds: [0, 0.84, 1.68]
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

object OpenAINativePresenceSeed {
  type: "named_model_family_native_presence_seed"
  order: 0
  targetObjectId: "OpenAIResident"
  displayLabel: "OpenAI"
  sourceTimeSeconds: 2.940911
}

object ClaudeNativePresenceSeed {
  type: "named_model_family_native_presence_seed"
  order: 1
  targetObjectId: "ClaudeResident"
  displayLabel: "Claude"
  sourceTimeSeconds: 1.50983
}

object GeminiNativePresenceSeed {
  type: "named_model_family_native_presence_seed"
  order: 2
  targetObjectId: "GeminiResident"
  displayLabel: "Gemini"
  sourceTimeSeconds: 0.896702
}

object GrokNativePresenceSeed {
  type: "named_model_family_native_presence_seed"
  order: 3
  targetObjectId: "GrokResident"
  displayLabel: "Grok"
  sourceTimeSeconds: 3.434138
}
