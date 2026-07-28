// H3E flat deterministic native-orbital input manifest.

object H3EOrbitalSeedManifest {
  type: "native_orbital_fit_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3e-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3E_ORBITAL_FIT"
  source: "source/proofs/model-village-character-appearance-h3e-orbital-fit-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3e-orbital-fit.holo"
  policySource: "source/proofs/model-village-character-appearance-h3e-orbital-fit-policy.hsplus"
  upstreamHoloScriptCommit: "444d39491600856ac4cb305ad40680a212ed2a06"
  compilerTarget: "character-webgpu"
  faceTopology: "neutral-anatomical-v2"
  ocularProfile: "layered-ocular-v1"
  orbitalProfile: "recessed-lids-v1"
  orbitalVerticesPerBundle: 152
  orbitalIndicesPerBundle: 432
  personaCount: 3
  lodLevelCount: 3
  nativeBundleCount: 9
  presentationShaderOverrideUsed: false
  eyelidTextureMaskUsed: false
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object HearthKeeperOrbitalSeed {
  type: "native_orbital_fit_seed"
  order: 0
  objectId: "HearthKeeper"
  personaId: "hearth_keeper"
  eyeRecess: 0.3
  lidOpening: 0.46
  canthalTilt: 0.14
}

object PathTenderOrbitalSeed {
  type: "native_orbital_fit_seed"
  order: 1
  objectId: "PathTender"
  personaId: "path_tender"
  eyeRecess: 0.27
  lidOpening: 0.49
  canthalTilt: 0.1
}

object RecordStewardOrbitalSeed {
  type: "native_orbital_fit_seed"
  order: 2
  objectId: "RecordSteward"
  personaId: "record_steward"
  eyeRecess: 0.32
  lidOpening: 0.44
  canthalTilt: 0.16
}
