// H3Q flat deterministic material-calibration seed.

object H3QMaterialCalibrationSeedManifest {
  type: "native_webgpu_fixed_light_material_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3q-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3Q_MATERIAL_CALIBRATION"
  source: "source/proofs/model-village-character-appearance-h3q-material-calibration-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3q-material-calibration.holo"
  policySource: "source/proofs/model-village-character-appearance-h3q-material-calibration-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3P_HAND_TOPOLOGY_CONVERGENCE"
  upstreamHoloScriptCommit: "40697c773533db38d3111855c1eeab9ac381c396"
  compilerTarget: "character-webgpu"
  rendererEntrypoint: "renderCharacter"
  rendererBackend: "webgpu"
  materialCalibrationProfile: "fixed-light-human-v1"
  skinReceiptSchema: "holoscript.agent-avatar-skin-material.v2"
  materialReceiptSchema: "holoscript.character-material-plate.v2"
  authoredProfile: "coherent-hand-landmarks-v3"
  semanticMaterialRoles: ["skin", "keratin-nail", "nail-bed"]
  fixedLightDirection: [0.32, 0.72, 0.61]
  fixedClearColor: [2, 8, 17]
  keratinGroupCountPerResident: 20
  nailBedGroupCountPerResident: 10
  keratinIndexCountPerResident: 2160
  nailBedIndexCountPerResident: 720
  nailSurfaceIndexCountPerResident: 2880
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

object OpenAIMaterialCalibrationSeed {
  type: "named_model_family_material_calibration_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
  skinTone: "#B9826F"
  nailTone: "#E6BEB2"
  nailBedTone: "#C9827C"
}

object ClaudeMaterialCalibrationSeed {
  type: "named_model_family_material_calibration_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
  skinTone: "#C58B70"
  nailTone: "#EDC7B6"
  nailBedTone: "#D28A7C"
}

object GeminiMaterialCalibrationSeed {
  type: "named_model_family_material_calibration_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
  skinTone: "#8D695C"
  nailTone: "#C9A094"
  nailBedTone: "#9E706B"
}

object GrokMaterialCalibrationSeed {
  type: "named_model_family_material_calibration_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
  skinTone: "#D0A086"
  nailTone: "#F1CCBB"
  nailBedTone: "#D99A8A"
}
