// H3M flat deterministic anatomy witness manifest.

object H3MAnatomicalHandsSeedManifest {
  type: "native_anatomical_hands_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3m-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3M_ANATOMICAL_HANDS"
  source: "source/proofs/model-village-character-appearance-h3m-anatomical-hands-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3m-anatomical-hands.holo"
  policySource: "source/proofs/model-village-character-appearance-h3m-anatomical-hands-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3L_UPPER_LIMB_TAILORING"
  upstreamHoloScriptCommit: "7ed46ad627d5b9582216f008aa82021ef4e85152"
  compilerTarget: "character-webgpu"
  authoredProfile: "coherent-anatomical-limbs-v2"
  upperBodyProfile: "anatomical-shoulder-neck-torso-v2"
  upperBodyRingCount: 12
  limbProfile: "anatomical-deltoid-hand-v2"
  limbCountPerResident: 2
  digitProfile: "articulated-three-phalanx-v1"
  digitNames: ["thumb", "index", "middle", "ring", "pinky"]
  digitCountPerResident: 10
  digitCountTotal: 40
  connectedSurfaceCountPerLimb: 6
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  poseCount: 3
  poseNames: ["civic_rest", "open_welcome", "dialogue_reach"]
  poseResidentPairCount: 12
  freshRtxBenchmarkClaimed: false
  historicalRtxEvidenceMayBeReusedAsCurrent: false
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object OpenAIAnatomySeed {
  type: "named_model_family_anatomy_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
}

object ClaudeAnatomySeed {
  type: "named_model_family_anatomy_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
}

object GeminiAnatomySeed {
  type: "named_model_family_anatomy_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
}

object GrokAnatomySeed {
  type: "named_model_family_anatomy_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
}
