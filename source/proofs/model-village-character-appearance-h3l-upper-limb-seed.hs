// H3L flat deterministic upper-limb and fresh-RTX admission manifest.

object H3LUpperLimbTailoringSeedManifest {
  type: "native_upper_limb_tailoring_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3l-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3L_UPPER_LIMB_TAILORING"
  source: "source/proofs/model-village-character-appearance-h3l-upper-limb-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3l-upper-limb.holo"
  policySource: "source/proofs/model-village-character-appearance-h3l-upper-limb-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3K_UPPER_BODY_OCCLUSION"
  upstreamHoloScriptCommit: "7d7ebaefb1dcfe7bba15525d6f261cc216aab793"
  compilerTarget: "character-webgpu"
  upperLimbReceiptSchema: "holoscript.agent-avatar-upper-limb-geometry.v1"
  upperLimbProfile: "coherent-arm-palm-v1"
  upperLimbSideCountPerResident: 2
  upperLimbRadialSegments: 24
  upperLimbRingCount: 8
  upperLimbVertexCountPerSide: 193
  upperLimbIndexCountPerSide: 1080
  upperLimbContinuityScope: "shoulder_to_palm_per_side"
  garmentReceiptSchema: "holoscript.agent-avatar-garment-geometry.v1"
  garmentStyle: "stormglass-open-civic-tunic"
  garmentFitProfile: "coherent-upper-body-clearance-v1"
  garmentCollarProfile: "tailored-open-v-collar-v1"
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  poseCount: 3
  poseNames: ["civic_rest", "open_welcome", "dialogue_reach"]
  poseResidentPairCount: 12
  freshRtxBenchmarkClaimed: false
  historicalRtxEvidenceMayBeReusedAsCurrent: false
  browserProbeRequiredForHero: true
  sceneCaptureRequiredForHero: true
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object OpenAIUpperLimbSeed {
  type: "named_model_family_upper_limb_seed"
  order: 0
  inheritedObjectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
}

object ClaudeUpperLimbSeed {
  type: "named_model_family_upper_limb_seed"
  order: 1
  inheritedObjectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
}

object GeminiUpperLimbSeed {
  type: "named_model_family_upper_limb_seed"
  order: 2
  inheritedObjectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
}

object GrokUpperLimbSeed {
  type: "named_model_family_upper_limb_seed"
  order: 3
  inheritedObjectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
}
