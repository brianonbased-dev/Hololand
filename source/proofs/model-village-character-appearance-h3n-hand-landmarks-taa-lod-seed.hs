// H3N flat deterministic witness manifest.

object H3NHandLandmarkTaaLodSeedManifest {
  type: "native_hand_landmark_taa_lod_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3n-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3N_HAND_LANDMARKS_TAA_LOD"
  source: "source/proofs/model-village-character-appearance-h3n-hand-landmarks-taa-lod-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3n-hand-landmarks-taa-lod.holo"
  policySource: "source/proofs/model-village-character-appearance-h3n-hand-landmarks-taa-lod-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3M_ANATOMICAL_HANDS"
  upstreamHoloScriptCommit: "15113b292b811f6f4a287eacea048a8c12c9a4e6"
  compilerTarget: "character-webgpu"
  authoredProfile: "coherent-hand-landmarks-v3"
  upperBodyProfile: "anatomical-hand-landmarks-v3"
  limbProfile: "anatomical-landmark-hand-v3"
  landmarkProfile: "anatomical-hand-landmark-v1"
  landmarkCountPerHand: 18
  landmarkCountTotal: 144
  webCountTotal: 32
  knuckleCountTotal: 40
  tendonCountTotal: 32
  nailCountTotal: 40
  connectedSurfaceCountPerLimb: 24
  connectedSurfaceCountTotal: 192
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  lodLevels: [0, 1, 2]
  taaReferenceImplementation: "holoscript_screen_space_cpu_reference"
  taaSampleCount: 16
  nativeSceneTaaClaimed: false
  freshRtxBenchmarkClaimed: false
  historicalRtxEvidenceMayBeReusedAsCurrent: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object OpenAIHandLandmarkSeed {
  type: "named_model_family_hand_landmark_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
  nailTone: "#E6BEB2"
  nailRoughness: 0.24
}

object ClaudeHandLandmarkSeed {
  type: "named_model_family_hand_landmark_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
  nailTone: "#EDC7B6"
  nailRoughness: 0.28
}

object GeminiHandLandmarkSeed {
  type: "named_model_family_hand_landmark_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
  nailTone: "#C9A094"
  nailRoughness: 0.31
}

object GrokHandLandmarkSeed {
  type: "named_model_family_hand_landmark_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
  nailTone: "#F1CCBB"
  nailRoughness: 0.22
}
