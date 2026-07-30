// H3W flat deterministic expressive-lighting seed.

object H3WExpressiveLightingSeedManifest {
  type: "browser_webgpu_expressive_lighting_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3w-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3W_EXPRESSIVE_LIGHTING"
  source: "source/proofs/model-village-character-appearance-h3w-expressive-lighting-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3w-expressive-lighting.holo"
  policySource: "source/proofs/model-village-character-appearance-h3w-expressive-lighting-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3V_PORTRAIT_ANATOMY"
  upstreamHoloScriptCommit: "09fe4773d58122927eabb9787c9fc2fcb4e486ba"
  compilerTarget: "character-webgpu"
  browserRendererEntrypoint: "renderCharacter"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  upperBodyProfile: "coherent_expressive_anatomy_v7"
  jointDeformationProfile: "expressive_neck_scapular_volume_v3"
  faceProfile: "portrait_silhouette_v2"
  neckBlendRingCount: 4
  neckInfluenceWeights: [0.08, 0.22, 0.45, 0.2]
  neckInfluencedVertexCount: 96
  poseName: "civic_conversation"
  poseBoneCount: 5
  expressionProfile: "source_authored_asymmetric_expression_v1"
  environmentLightProfile: "analytic_three_point_v1"
  environmentCounterfactualRequired: true
  browserWebgpuMeasured: true
  questHeadsetMeasured: false
  browserWebxrMeasured: false
  gpuTimestampMeasured: false
  freshRtxBenchmarkClaimed: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "browser_profile_as_quest_device", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object OpenAIPortraitSeed {
  type: "named_model_family_portrait_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
  accentColor: "#62D9C0"
}

object ClaudePortraitSeed {
  type: "named_model_family_portrait_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
  accentColor: "#E3A16F"
}

object GeminiPortraitSeed {
  type: "named_model_family_portrait_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
  accentColor: "#829BFF"
}

object GrokPortraitSeed {
  type: "named_model_family_portrait_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
  accentColor: "#65D8E7"
}
