// H4H deterministic material-identity seed and claim boundary.

object H4HMaterialModelFamilyIdentitySeedManifest {
  type: "source_compiled_model_family_material_identity_seed_manifest"
  schema: "hololand.model-village.character-realism-h4h-seed.v1"
  milestone: "MV_CHARACTER_REALISM_H4H_MATERIAL_MODEL_FAMILY_IDENTITY_CONVERGENCE"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-realism-h4h-material-model-family-identity-convergence.holo"
  operativeAppearanceSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h4a-facial-volume-garment-framing.holo"
  upstreamHoloScriptCommit: "712698cf465b15c8552c3c5e545800543b929c78"
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  sourceHairColors: ["#2F2928", "#6B4633", "#303641", "#171D22"]
  sourceColorWeight: 0.55
  expectedHairMaterialSchema: "holoscript.agent-avatar-hair-material.v2"
  distinctSourceHairColorCountRequired: 4
  deterministicSeed: 3108015
  warmupSharedFrames: 4
  measuredSharedFrames: 32
  timestampQueryRequired: true
  timestampQueryCount: 26
  sharedCommandBufferCountRequired: 1
  sharedQueueSubmissionCountRequired: 1
  intermediateFrameReadbackCountRequired: 0
  finalEvidenceFrameReadbackCount: 1
  boundedSharedCharacterCompositeRtxBenchmarkClaimed: true
  fullHoloLandWorldFrameClaimed: false
  productionWholeFrameTimeClaimed: false
  questHeadsetMeasured: false
  photorealismClaimed: false
}

object H4HMaterialIdentityRuntimeBindings {
  type: "native_webgpu_material_identity_runtime_bindings"
  hairColorBridge: "CharacterHostFromComposition"
  hostMaterial: "CharacterHost"
  materialPacking: "packCharacterMaterial"
  nativeShader: "skin-skinning.wgsl/fs_marschner"
  sharedFrameGraph: "CharacterWorldFrameGraph"
  sourceColorRetentionRequired: true
  melaninEnergyPreservationRequired: true
  legacyZeroWeightCompatibilityRequired: true
}
