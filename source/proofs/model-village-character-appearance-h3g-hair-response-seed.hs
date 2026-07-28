// H3G flat deterministic hair-response input manifest.

object H3GHairResponseSeedManifest {
  type: "native_hair_response_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3g-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3G_HAIR_RESPONSE"
  source: "source/proofs/model-village-character-appearance-h3g-hair-response-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3g-hair-response.holo"
  policySource: "source/proofs/model-village-character-appearance-h3g-hair-response-policy.hsplus"
  upstreamHoloScriptCommit: "5a828db7f9fa54b805741e0997e1e98bb4e48926"
  compilerTarget: "character-webgpu"
  groomProfile: "scalp-flow-v1"
  coverageProfile: "alpha-to-coverage-v1"
  opaqueComparisonProfile: "opaque-v1"
  tangentAttribute: "strand-flow"
  cardUvAttribute: "card-width"
  multisampleCount: 4
  personaCount: 3
  lodLevelCount: 3
  nativeBundleCount: 9
  presentationShaderOverrideUsed: false
  presentationMaterialBridgeUsed: true
  presentationAlphaMapUsed: true
  externalHairTextureUsed: false
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object HearthKeeperHairResponseSeed {
  type: "native_hair_response_seed"
  order: 0
  objectId: "HearthKeeper"
  personaId: "hearth_keeper"
  hairColor: "#563A30"
  cardWidth: 0.0052
  rootLift: 0.0025
  tipTaper: 0.08
  hairlineBias: 0.17
  coverageProfile: "alpha-to-coverage-v1"
  strandCoverage: 0.84
  edgeSoftness: 0.12
  anisotropyStrength: 0.86
  longitudinalShift: 0.08
}

object PathTenderHairResponseSeed {
  type: "native_hair_response_seed"
  order: 1
  objectId: "PathTender"
  personaId: "path_tender"
  hairColor: "#303641"
  cardWidth: 0.0058
  rootLift: 0.002
  tipTaper: 0.14
  hairlineBias: 0.18
  coverageProfile: "alpha-to-coverage-v1"
  strandCoverage: 0.8
  edgeSoftness: 0.14
  anisotropyStrength: 0.9
  longitudinalShift: 0.12
}

object RecordStewardHairResponseSeed {
  type: "native_hair_response_seed"
  order: 2
  objectId: "RecordSteward"
  personaId: "record_steward"
  hairColor: "#82563A"
  cardWidth: 0.0052
  rootLift: 0.0025
  tipTaper: 0.08
  hairlineBias: 0.15
  coverageProfile: "alpha-to-coverage-v1"
  strandCoverage: 0.86
  edgeSoftness: 0.1
  anisotropyStrength: 0.84
  longitudinalShift: 0.06
}
