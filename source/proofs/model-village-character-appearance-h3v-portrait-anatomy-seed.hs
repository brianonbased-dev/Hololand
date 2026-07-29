// H3V flat deterministic portrait-anatomy seed.

object H3VPortraitSeedManifest {
  type: "browser_webgpu_portrait_anatomy_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3v-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3V_PORTRAIT_ANATOMY"
  source: "source/proofs/model-village-character-appearance-h3v-portrait-anatomy-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3v-portrait-anatomy.holo"
  policySource: "source/proofs/model-village-character-appearance-h3v-portrait-anatomy-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3U_BROWSER_QUEST_TEMPORAL_LOD"
  upstreamHoloScriptCommit: "38cef37972e2c5a6a980ae874206c15f5752ce26"
  compilerTarget: "character-webgpu"
  browserRendererEntrypoint: "renderCharacter"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  upperBodyProfile: "coherent_portrait_anatomy_v6"
  faceProfile: "portrait_silhouette_v2"
  shoulderBlendRingCount: 6
  minimumAuthoredShoulderRadiusRatio: 0.7
  superiorContourScaleMin: 0.15
  poseName: "portrait_arms_down"
  poseBoneCount: 4
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
