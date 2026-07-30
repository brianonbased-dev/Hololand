// H3Y flat deterministic constructed-soft-tissue-probe seed.

object H3YConstructedSoftTissueProbeSeedManifest {
  type: "browser_webgpu_constructed_soft_tissue_probe_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3y-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3Y_CONSTRUCTED_SOFT_TISSUE_PROBE"
  source: "source/proofs/model-village-character-appearance-h3y-constructed-soft-tissue-probe-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3y-constructed-soft-tissue-probe.holo"
  policySource: "source/proofs/model-village-character-appearance-h3y-constructed-soft-tissue-probe-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3X_CRANIAL_EXPRESSION_NORMALS"
  upstreamHoloScriptCommit: "293bd5f8e1b6bd4a4e4e8d9c970bbee545b0c898"
  deterministicSeed: 291103
  compilerTarget: "character-webgpu"
  browserRendererEntrypoint: "renderCharacter"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  upperBodyProfile: "coherent_expressive_anatomy_v7"
  jointDeformationProfile: "expressive_cranial_neck_volume_v4"
  facialDetailProfile: "portrait_soft_tissue_v4"
  orbitalProfile: "anatomical_lid_fold_v2"
  lipTopology: "connected_cupid_bow_ribbon_v1"
  garmentStyle: "stormglass_tailored_fieldcoat"
  garmentConstructionProfile: "four_panel_fieldcoat_v1"
  constructedPanelCount: 4
  groomProfile: "scalp_flow_containment_v2"
  groomContainmentProfile: "ellipsoidal_scalp_exterior_v1"
  maximumScalpPenetrationVertexCount: 0
  environmentLightProfile: "directional_reflection_probe_v1"
  environmentResponseProfile: "three_lobe_diffuse_specular_probe_v1"
  counterfactualGarmentStyle: "stormglass_open_civic_tunic"
  counterfactualFaceProfile: "portrait_cranial_v3"
  counterfactualOrbitalProfile: "recessed_lids_v1"
  counterfactualGroomProfile: "scalp_flow_v1"
  counterfactualEnvironmentProfile: "analytic_three_point_v1"
  closeupLodLevel: 0
  closeupFaceSegments: [44, 30]
  distanceLodLevel: 2
  distanceFaceSegments: [24, 16]
  poseName: "civic_conversation"
  poseBoneCount: 5
  expressionNormalPolicy: "recompute_affected_v1"
  browserWebgpuMeasured: true
  photographicHdriPresent: false
  questHeadsetMeasured: false
  browserWebxrMeasured: false
  gpuTimestampMeasured: false
  freshRtxBenchmarkClaimed: false
  forbiddenInputClasses: ["photographic_hdri", "wall_clock_as_gpu_time", "browser_profile_as_quest_device", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
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
