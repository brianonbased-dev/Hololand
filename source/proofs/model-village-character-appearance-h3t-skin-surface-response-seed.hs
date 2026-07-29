// H3T flat deterministic skin-surface response seed.

object H3TSkinSurfaceSeedManifest {
  type: "native_webgpu_skin_surface_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3t-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3T_SKIN_SURFACE_RESPONSE"
  source: "source/proofs/model-village-character-appearance-h3t-skin-surface-response-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3t-skin-surface-response.holo"
  policySource: "source/proofs/model-village-character-appearance-h3t-skin-surface-response-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3S_HAND_SURFACE_ANATOMY"
  upstreamHoloScriptCommit: "f165a58722c0808bc4ab9753ab1c68136870e10d"
  compilerTarget: "character-webgpu"
  rendererEntrypoint: "renderCharacter"
  rendererBackend: "webgpu"
  materialCalibrationProfile: "fixed-light-human-v1"
  skinSurfaceResponseProfile: "calibrated-skin-surface-v1"
  skinReceiptSchema: "holoscript.agent-avatar-skin-material.v3"
  handSurfaceSchema: "holoscript.agent-avatar-hand-surface.v1"
  semanticSurfaceChannels: ["albedo-variation", "roughness-variation", "fine-normal-response"]
  retainedHandMaterialRoles: ["skin", "keratin-nail", "nail-bed"]
  rakingLightDirection: [0.72, 0.28, 0.63]
  fixedClearColor: [2, 8, 17]
  facePlateSizePixels: 320
  handInsetSizePixels: 128
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  nativeDawnGpuReadbackClaimed: true
  browserWebgpuMeasured: false
  gpuTimestampFrameTimeClaimed: false
  freshRtxBenchmarkClaimed: false
  measuredTissueModelClaimed: false
  photorealismClaimed: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "webgl_bridge_as_native_webgpu", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object OpenAISkinSurfaceSeed {
  type: "named_model_family_skin_surface_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
  albedoVariationStrength: 0.052
  roughnessVariationStrength: 0.14
  normalMicrodetailStrength: 0.28
}

object ClaudeSkinSurfaceSeed {
  type: "named_model_family_skin_surface_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
  albedoVariationStrength: 0.048
  roughnessVariationStrength: 0.13
  normalMicrodetailStrength: 0.25
}

object GeminiSkinSurfaceSeed {
  type: "named_model_family_skin_surface_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
  albedoVariationStrength: 0.058
  roughnessVariationStrength: 0.16
  normalMicrodetailStrength: 0.3
}

object GrokSkinSurfaceSeed {
  type: "named_model_family_skin_surface_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
  albedoVariationStrength: 0.044
  roughnessVariationStrength: 0.12
  normalMicrodetailStrength: 0.23
}
