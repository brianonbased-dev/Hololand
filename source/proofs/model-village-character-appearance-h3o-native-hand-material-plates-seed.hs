// H3O flat deterministic witness manifest.

object H3ONativeHandMaterialSeedManifest {
  type: "native_webgpu_hand_material_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3o-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3O_NATIVE_HAND_MATERIAL_PLATES"
  source: "source/proofs/model-village-character-appearance-h3o-native-hand-material-plates-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3o-native-hand-material-plates.holo"
  policySource: "source/proofs/model-village-character-appearance-h3o-native-hand-material-plates-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3N_HAND_LANDMARKS_TAA_LOD"
  upstreamHoloScriptCommit: "b76b9f2c62a8de753fca6e55b11e7e60385bce02"
  compilerTarget: "character-webgpu"
  rendererEntrypoint: "renderCharacter"
  rendererBackend: "webgpu"
  materialReceiptSchema: "holoscript.character-material-plate.v1"
  detailFrameSchema: "holoscript.character-detail-frame.v1"
  authoredProfile: "coherent-hand-landmarks-v3"
  landmarkCountPerRenderedHand: 18
  nailMaterialRole: "keratin-nail"
  nailGroupCountPerResident: 10
  nailGroupCountPerRenderedHand: 5
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  nativeDawnGpuReadbackClaimed: true
  browserWebgpuMeasured: false
  gpuTimestampFrameTimeClaimed: false
  freshRtxBenchmarkClaimed: false
  photorealismClaimed: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "webgl_bridge_as_native_webgpu", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object OpenAIHandMaterialSeed {
  type: "named_model_family_native_hand_material_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
  nailTone: "#E6BEB2"
  nailRoughness: 0.24
}

object ClaudeHandMaterialSeed {
  type: "named_model_family_native_hand_material_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
  nailTone: "#EDC7B6"
  nailRoughness: 0.28
}

object GeminiHandMaterialSeed {
  type: "named_model_family_native_hand_material_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
  nailTone: "#C9A094"
  nailRoughness: 0.31
}

object GrokHandMaterialSeed {
  type: "named_model_family_native_hand_material_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
  nailTone: "#F1CCBB"
  nailRoughness: 0.22
}
