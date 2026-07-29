// H3K flat deterministic named-resident and pose-clearance input manifest.

object H3KUpperBodyOcclusionSeedManifest {
  type: "native_upper_body_occlusion_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3k-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3K_UPPER_BODY_OCCLUSION"
  source: "source/proofs/model-village-character-appearance-h3k-upper-body-occlusion-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3k-upper-body-occlusion.holo"
  policySource: "source/proofs/model-village-character-appearance-h3k-upper-body-occlusion-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3J_CIVIC_LANDMARKS"
  upstreamHoloScriptCommit: "5836a2dee69f278b89ef801312c7bb6fe003bf0f"
  compilerTarget: "character-webgpu"
  upperBodyReceiptSchema: "holoscript.agent-avatar-upper-body-geometry.v1"
  upperBodyProfile: "coherent-shoulder-neck-torso-v1"
  garmentReceiptSchema: "holoscript.agent-avatar-garment-geometry.v1"
  garmentStyle: "stormglass-open-civic-tunic"
  garmentFitProfile: "coherent-upper-body-clearance-v1"
  garmentTunicIndexCount: 1008
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  poseCount: 3
  poseNames: ["civic_rest", "open_welcome", "dialogue_reach"]
  poseResidentPairCount: 12
  radialSegments: 24
  ringCount: 10
  minimumClearanceMeters: 0.015
  minimumCoveredRayRatio: 0.95
  zeroTriangleIntersectionsRequired: true
  presentationShaderOverrideUsed: false
  presentationMaterialBridgeUsed: true
  presentationWardrobeBridgeUsed: false
  presentationNativeTorsoClipUsed: false
  presentationTaaBridgeUsed: false
  externalSkinTextureUsed: false
  externalHairTextureUsed: false
  externalWardrobeTextureUsed: false
  nativeWebgpuTaaClaimed: false
  questWebxrMeasured: false
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object OpenAIUpperBodySeed {
  type: "named_model_family_resident_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
  civicRole: "systems_synthesist"
  heroPose: "open_welcome"
  wardrobeColor: "#176B5B"
  accentColor: "#62D9C0"
}

object ClaudeUpperBodySeed {
  type: "named_model_family_resident_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
  civicRole: "constitutional_steward"
  heroPose: "dialogue_reach"
  wardrobeColor: "#A85F36"
  accentColor: "#E3A16F"
}

object GeminiUpperBodySeed {
  type: "named_model_family_resident_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
  civicRole: "multimodal_cartographer"
  heroPose: "civic_rest"
  wardrobeColor: "#3859A8"
  accentColor: "#829BFF"
}

object GrokUpperBodySeed {
  type: "named_model_family_resident_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
  civicRole: "frontier_provocateur"
  heroPose: "open_welcome"
  wardrobeColor: "#263945"
  accentColor: "#65D8E7"
}
