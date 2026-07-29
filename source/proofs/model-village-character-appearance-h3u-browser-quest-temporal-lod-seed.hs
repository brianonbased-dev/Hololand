// H3U flat deterministic temporal LOD seed.

object H3UTemporalLodSeedManifest {
  type: "browser_webgpu_temporal_lod_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3u-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3U_BROWSER_QUEST_TEMPORAL_LOD"
  source: "source/proofs/model-village-character-appearance-h3u-browser-quest-temporal-lod-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3u-browser-quest-temporal-lod.holo"
  policySource: "source/proofs/model-village-character-appearance-h3u-browser-quest-temporal-lod-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3T_SKIN_SURFACE_RESPONSE"
  upstreamHoloScriptCommit: "0c1a5313d0ed207744bf115ee3697a74e59046d2"
  compilerTarget: "character-webgpu"
  browserRendererEntrypoint: "renderCharacter"
  temporalEntrypoint: "resolveTemporalFrameGPU"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  browserProfile: "browser-balanced"
  browserSampleCount: 8
  questBudgetProfile: "quest-90hz-budget"
  questBudgetSampleCount: 4
  lodLevels: [0, 1, 2]
  witnessedLodLevels: [0, 2]
  transitionMode: "dither"
  transitionDurationMilliseconds: 180
  transitionHysteresisBand: 0.65
  historyPolicy: "invalidate-on-camera-resident-or-lod-change-v1"
  browserWebgpuMeasured: true
  questProfileExecutedOnBrowserDevice: true
  questHeadsetMeasured: false
  browserWebxrMeasured: false
  gpuTimestampMeasured: false
  freshRtxBenchmarkClaimed: false
  motionVectorsConsumed: false
  reactiveMaskConsumed: false
  disocclusionInputConsumed: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "browser_profile_as_quest_device", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object OpenAITemporalSeed {
  type: "named_model_family_temporal_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
  cameraMotionOffset: 0.035
  residentMotionOffset: 0.05
}

object ClaudeTemporalSeed {
  type: "named_model_family_temporal_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
  cameraMotionOffset: 0.035
  residentMotionOffset: 0.05
}

object GeminiTemporalSeed {
  type: "named_model_family_temporal_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
  cameraMotionOffset: 0.035
  residentMotionOffset: 0.05
}

object GrokTemporalSeed {
  type: "named_model_family_temporal_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
  cameraMotionOffset: 0.035
  residentMotionOffset: 0.05
}
