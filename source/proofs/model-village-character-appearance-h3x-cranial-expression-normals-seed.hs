// H3X flat deterministic cranial/expression-normal seed.

object H3XCranialExpressionNormalSeedManifest {
  type: "browser_webgpu_cranial_expression_normal_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3x-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3X_CRANIAL_EXPRESSION_NORMALS"
  source: "source/proofs/model-village-character-appearance-h3x-cranial-expression-normals-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3x-cranial-expression-normals.holo"
  policySource: "source/proofs/model-village-character-appearance-h3x-cranial-expression-normals-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3W_EXPRESSIVE_LIGHTING"
  upstreamHoloScriptCommit: "df6ebcd00b5e36fa6bc5fcc8ed8dde36dbd655c2"
  compilerTarget: "character-webgpu"
  browserRendererEntrypoint: "renderCharacter"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  upperBodyProfile: "coherent_expressive_anatomy_v7"
  jointDeformationProfile: "expressive_cranial_neck_volume_v4"
  faceProfile: "portrait_cranial_v3"
  cranialNeckProfile: "indexed_neck_cranium_stitch_v1"
  cranialBridgeTriangleCount: 68
  cranialNeckContinuityProfile: "dual_influence_neck_head_stitch_v1"
  expressionNormalPolicy: "recompute_affected_v1"
  expressionReceiptSchema: "holoscript.native-facial-morph.v3"
  closeupLodLevel: 0
  closeupFaceSegments: [44, 30]
  distanceLodLevel: 2
  distanceFaceSegments: [24, 16]
  expressionNormalCounterfactualRequired: true
  closeupLodCounterfactualRequired: true
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
