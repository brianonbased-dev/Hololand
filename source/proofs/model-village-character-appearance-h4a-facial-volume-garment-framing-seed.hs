// H4A flat deterministic facial-volume/garment-framing seed.

object H4AFacialVolumeGarmentFramingSeedManifest {
  type: "browser_webgpu_facial_volume_garment_framing_seed_manifest"
  schema: "hololand.model-village.character-appearance-h4a-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H4A_FACIAL_VOLUME_GARMENT_FRAMING"
  source: "source/proofs/model-village-character-appearance-h4a-facial-volume-garment-framing-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h4a-facial-volume-garment-framing.holo"
  policySource: "source/proofs/model-village-character-appearance-h4a-facial-volume-garment-framing-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3Z_MATERIAL_DEPTH_ROOM_RESPONSE"
  upstreamHoloScriptCommit: "0e5b0a3b7745f4113ee8b9dd62f70be9fc63d8d2"
  deterministicSeed: 301204
  compilerTarget: "character-webgpu"
  browserRendererEntrypoint: "renderCharacter"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  facialDetailProfile: "portrait_facial_volume_v5"
  facialVolumeProfile: "nasal_malar_mandibular_volume_v1"
  garmentStyle: "stormglass_portrait_fieldcoat"
  garmentConstructionProfile: "portrait_full_fieldcoat_v3"
  shellThicknessM: 0.008
  closureCount: 7
  cuffBandCount: 2
  fabricSurfaceProfile: "stormglass_crossweave_normal_v1"
  groomProfile: "scalp_flow_portrait_v4"
  facialFramingProfile: "portrait_brow_lash_ribbons_v1"
  browRibbonCount: 2
  lashRibbonCount: 4
  groomContainmentProfile: "ellipsoidal_scalp_exterior_v1"
  groomBreakupProfile: "contained_flyaway_breakup_v1"
  flyawayGuideCount: 12
  maximumScalpPenetrationVertexCount: 0
  orbitalProfile: "anatomical_lid_blend_v3"
  lidTransitionProfile: "cubic_lid_blend_v1"
  lidTransitionRows: 4
  ocularProfile: "layered_ocular_calibrated_v3"
  ocularCalibrationProfile: "portrait_ocular_balance_v1"
  tearMeniscusProfile: "lower_cornea_meniscus_v1"
  environmentLightProfile: "stormglass_room_basis_v2"
  environmentResponseProfile: "source_authored_room_basis_v2"
  counterfactualFacialDetailProfile: "portrait_soft_tissue_v4"
  counterfactualGarmentStyle: "stormglass_structured_fieldcoat"
  counterfactualGroomProfile: "scalp_flow_breakup_v3"
  counterfactualOrbitalProfile: "anatomical_lid_fold_v2"
  counterfactualOcularProfile: "layered_ocular_tearfilm_v2"
  counterfactualEnvironmentProfile: "directional_reflection_probe_v1"
  browserWebgpuMeasured: true
  dualFramePortraitAndGarmentMeasured: true
  photographicHdriPresent: false
  photorealismClaimed: false
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
