// H3Z flat deterministic material-depth/room-response seed.

object H3ZMaterialDepthRoomResponseSeedManifest {
  type: "browser_webgpu_material_depth_room_response_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3z-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3Z_MATERIAL_DEPTH_ROOM_RESPONSE"
  source: "source/proofs/model-village-character-appearance-h3z-material-depth-room-response-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3z-material-depth-room-response.holo"
  policySource: "source/proofs/model-village-character-appearance-h3z-material-depth-room-response-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3Y_CONSTRUCTED_SOFT_TISSUE_PROBE"
  upstreamHoloScriptCommit: "3987bb2ba5e70a62c6c9b1aa65d4d55ad3fef989"
  deterministicSeed: 291203
  compilerTarget: "character-webgpu"
  browserRendererEntrypoint: "renderCharacter"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  garmentStyle: "stormglass_structured_fieldcoat"
  garmentConstructionProfile: "structured_fieldcoat_shell_v2"
  shellThicknessM: 0.008
  closureCount: 5
  cuffBandCount: 2
  fabricSurfaceProfile: "stormglass_crossweave_normal_v1"
  groomProfile: "scalp_flow_breakup_v3"
  groomContainmentProfile: "ellipsoidal_scalp_exterior_v1"
  groomBreakupProfile: "contained_flyaway_breakup_v1"
  flyawayGuideCount: 12
  maximumScalpPenetrationVertexCount: 0
  orbitalProfile: "anatomical_lid_blend_v3"
  lidTransitionProfile: "cubic_lid_blend_v1"
  lidTransitionRows: 4
  ocularProfile: "layered_ocular_tearfilm_v2"
  tearMeniscusProfile: "lower_cornea_meniscus_v1"
  environmentLightProfile: "stormglass_room_basis_v2"
  environmentResponseProfile: "source_authored_room_basis_v2"
  counterfactualGarmentStyle: "stormglass_tailored_fieldcoat"
  counterfactualGroomProfile: "scalp_flow_containment_v2"
  counterfactualOrbitalProfile: "anatomical_lid_fold_v2"
  counterfactualOcularProfile: "layered_ocular_v1"
  counterfactualEnvironmentProfile: "directional_reflection_probe_v1"
  browserWebgpuMeasured: true
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
