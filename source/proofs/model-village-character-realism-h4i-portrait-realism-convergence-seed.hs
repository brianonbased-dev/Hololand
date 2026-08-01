// H4I deterministic portrait-realism seed and claim boundary.

object H4IPortraitRealismSeedManifest {
  type: "source_compiled_portrait_realism_seed_manifest"
  schema: "hololand.model-village.character-realism-h4i-seed.v1"
  milestone: "MV_CHARACTER_REALISM_H4I_PORTRAIT_REALISM_CONVERGENCE"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-realism-h4i-portrait-realism-convergence.holo"
  operativeAppearanceSource: "source/layers/vr/frontier/model-village/model-village-character-realism-h4i-portrait-realism-convergence.holo"
  upstreamHoloScriptCommit: "94594d173de8667c0d86ec0cf41f537ef623899b"
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  complexionProfile: "anatomical-complexion-v1"
  minimumComplexionStrength: 0.5
  groomProfile: "scalp-flow-volume-v5"
  silhouetteProfile: "massed-silhouette-clumps-v1"
  expectedSkinMaterialSchema: "holoscript.agent-avatar-skin-material.v4"
  expectedGroomGeometrySchema: "holoscript.agent-avatar-groom-geometry.v5"
  deterministicSeed: 3108016
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

object H4IPortraitRealismRuntimeBindings {
  type: "native_webgpu_portrait_realism_runtime_bindings"
  sourceBridge: "CharacterHostFromComposition"
  hostMaterial: "CharacterHost"
  groomBuilder: "AgentAvatarHair"
  materialPacking: "packCharacterMaterial"
  nativeShader: "skin-skinning.wgsl/anatomicalComplexion"
  sharedFrameGraph: "CharacterWorldFrameGraph"
  sourceComplexionRequired: true
  massedHairSilhouetteRequired: true
  exactHairColorRetentionRequired: true
  legacyProfileCompatibilityRequired: true
}
