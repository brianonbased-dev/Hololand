// H3H flat deterministic LOD transition and temporal input manifest.

object H3HTemporalLodSeedManifest {
  type: "native_temporal_lod_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3h-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3H_TEMPORAL_LOD"
  source: "source/proofs/model-village-character-appearance-h3h-temporal-lod-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3h-temporal-lod.holo"
  policySource: "source/proofs/model-village-character-appearance-h3h-temporal-lod-policy.hsplus"
  upstreamHoloScriptCommit: "daf5993dc1c5372bfb79d2fa81b8dbcc6d32ebfb"
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
  lodTransitionReceiptCount: 9
  transitionSelectionMode: "distance"
  transitionMode: "dither"
  transitionDurationMilliseconds: 260
  transitionHysteresisBand: 0.65
  sharedRendererCount: 1
  sharedSceneCount: 1
  temporalComposerCount: 1
  internalRenderWidth: 1360
  internalRenderHeight: 448
  presentationWidth: 1680
  presentationHeight: 554
  internalRenderScale: 0.81
  temporalBridge: "three-taarenderpass-v1"
  temporalSampleLevel: 0
  temporalAccumulationFrames: 32
  temporalHistoryPolicy: "invalidate-on-motion-or-lod-change-v1"
  motionReprojectionClaimed: false
  nativeWebgpuTaaClaimed: false
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
