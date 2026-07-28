// H3C flat deterministic face-foundation input manifest.

object H3CFaceFoundationSeedManifest {
  type: "native_face_foundation_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3c-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3C_FACE_FOUNDATION"
  source: "source/proofs/model-village-character-appearance-h3c-face-foundation-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3c-face-foundation.holo"
  policySource: "source/proofs/model-village-character-appearance-h3c-face-foundation-policy.hsplus"
  upstreamHoloScriptCommit: "faf90ec8cbac992c6ca0ed9ffafb9033fa9bd127"
  compilerTarget: "character-webgpu"
  faceTopology: "neutral-anatomical-v2"
  radialSegments: 22
  verticalSegments: 16
  tearlineRimTopology: true
  personaCount: 3
  lodLevelCount: 3
  nativeBundleCount: 9
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object HearthKeeperFaceSeed {
  type: "native_neutral_face_seed"
  order: 0
  objectId: "HearthKeeper"
  personaId: "hearth_keeper"
  nativeHairStyleId: "cropped_coils"
  irisColor: "#6B8C82"
}

object PathTenderFaceSeed {
  type: "native_neutral_face_seed"
  order: 1
  objectId: "PathTender"
  personaId: "path_tender"
  nativeHairStyleId: "swept_ridge"
  irisColor: "#A58B52"
}

object RecordStewardFaceSeed {
  type: "native_neutral_face_seed"
  order: 2
  objectId: "RecordSteward"
  personaId: "record_steward"
  nativeHairStyleId: "long"
  irisColor: "#526D91"
}
