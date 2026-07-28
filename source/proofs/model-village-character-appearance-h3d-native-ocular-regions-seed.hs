// H3D flat deterministic native-ocular input manifest.

object H3DOcularSeedManifest {
  type: "native_ocular_region_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3d-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3D_NATIVE_OCULAR_REGIONS"
  source: "source/proofs/model-village-character-appearance-h3d-native-ocular-regions-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3d-native-ocular-regions.holo"
  policySource: "source/proofs/model-village-character-appearance-h3d-native-ocular-regions-policy.hsplus"
  upstreamHoloScriptCommit: "ac44ce5fbdb93c4a78e17a3c535138de49978bbd"
  compilerTarget: "character-webgpu"
  faceTopology: "neutral-anatomical-v2"
  ocularProfile: "layered-ocular-v1"
  ocularRegions: ["sclera", "iris", "pupil", "cornea"]
  groupsPerRegion: 2
  ocularGroupsPerBundle: 8
  personaCount: 3
  lodLevelCount: 3
  nativeBundleCount: 9
  presentationShaderOverrideUsed: false
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object HearthKeeperOcularSeed {
  type: "native_ocular_seed"
  order: 0
  objectId: "HearthKeeper"
  personaId: "hearth_keeper"
  irisColor: "#6B8C82"
  scleraColor: "#EEE9DF"
  irisScale: 0.5
  pupilScale: 0.38
  corneaIor: 1.376
}

object PathTenderOcularSeed {
  type: "native_ocular_seed"
  order: 1
  objectId: "PathTender"
  personaId: "path_tender"
  irisColor: "#A58B52"
  scleraColor: "#F0EADF"
  irisScale: 0.48
  pupilScale: 0.4
  corneaIor: 1.376
}

object RecordStewardOcularSeed {
  type: "native_ocular_seed"
  order: 2
  objectId: "RecordSteward"
  personaId: "record_steward"
  irisColor: "#526D91"
  scleraColor: "#F2EBE4"
  irisScale: 0.52
  pupilScale: 0.36
  corneaIor: 1.376
}
