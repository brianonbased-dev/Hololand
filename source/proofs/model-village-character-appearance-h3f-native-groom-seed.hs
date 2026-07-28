// H3F flat deterministic native-groom input manifest.

object H3FGroomSeedManifest {
  type: "native_groom_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3f-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3F_NATIVE_GROOM"
  source: "source/proofs/model-village-character-appearance-h3f-native-groom-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3f-native-groom.holo"
  policySource: "source/proofs/model-village-character-appearance-h3f-native-groom-policy.hsplus"
  upstreamHoloScriptCommit: "1203b06bd0e857b26c874479ea9e6b6cdc521896"
  compilerTarget: "character-webgpu"
  groomProfile: "scalp-flow-v1"
  legacyComparisonProfile: "radial-cards-v1"
  scalpSurface: "neutral-anatomical-ellipsoid"
  personaCount: 3
  lodLevelCount: 3
  nativeBundleCount: 9
  presentationShaderOverrideUsed: false
  hairAlphaMaskUsed: false
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object HearthKeeperGroomSeed {
  type: "native_groom_seed"
  order: 0
  objectId: "HearthKeeper"
  personaId: "hearth_keeper"
  cardWidth: 0.0052
  rootLift: 0.0025
  tipTaper: 0.08
  hairlineBias: 0.17
}

object PathTenderGroomSeed {
  type: "native_groom_seed"
  order: 1
  objectId: "PathTender"
  personaId: "path_tender"
  cardWidth: 0.0058
  rootLift: 0.002
  tipTaper: 0.14
  hairlineBias: 0.18
}

object RecordStewardGroomSeed {
  type: "native_groom_seed"
  order: 2
  objectId: "RecordSteward"
  personaId: "record_steward"
  cardWidth: 0.0052
  rootLift: 0.0025
  tipTaper: 0.08
  hairlineBias: 0.15
}
