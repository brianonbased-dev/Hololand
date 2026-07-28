// H3I flat deterministic anatomy, crown-flow, skin-response, and temporal input manifest.

object H3IAnatomySurfaceSeedManifest {
  type: "native_anatomy_surface_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3i-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3I_ANATOMY_SURFACE"
  source: "source/proofs/model-village-character-appearance-h3i-anatomy-surface-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3i-anatomy-surface.holo"
  policySource: "source/proofs/model-village-character-appearance-h3i-anatomy-surface-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3H_TEMPORAL_LOD"
  upstreamHoloScriptCommit: "96b8f4afc811caff5438a74e7246c02eab3e7898"
  compilerTarget: "character-webgpu"
  anatomyReceiptSchema: "holoscript.agent-avatar-anatomy.v1"
  skinReceiptSchema: "holoscript.agent-avatar-skin-material.v1"
  skinMicrodetailProfile: "analytic-pore-v1"
  groomProfile: "scalp-flow-v1"
  personaCount: 3
  lodLevelCount: 3
  nativeBundleCount: 9
  anatomyReceiptCount: 9
  skinReceiptCount: 9
  crownWhorlReceiptCount: 9
  sharedRendererCount: 1
  sharedSceneCount: 1
  temporalComposerCount: 1
  internalRenderWidth: 1360
  internalRenderHeight: 448
  presentationWidth: 1680
  presentationHeight: 554
  internalRenderScale: 0.81
  temporalBridge: "three-taarenderpass-v1"
  temporalAccumulationFrames: 32
  temporalHistoryPolicy: "invalidate-on-motion-or-lod-change-v1"
  motionReprojectionClaimed: false
  nativeWebgpuTaaClaimed: false
  presentationShaderOverrideUsed: false
  presentationMaterialBridgeUsed: true
  presentationSkinMicrodetailBridgeUsed: true
  externalSkinTextureUsed: false
  externalHairTextureUsed: false
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object HearthKeeperAnatomySurfaceSeed {
  type: "native_anatomy_surface_seed"
  order: 0
  objectId: "HearthKeeper"
  personaId: "hearth_keeper"
  faceWidth: 0.94
  faceLength: 1.07
  jawTaper: 0.3
  shoulderScale: 1.12
  torsoScale: 0.96
  crownWhorl: 0.42
  microdetailProfile: "analytic-pore-v1"
  microdetailScale: 94
  microdetailStrength: 0.075
}

object PathTenderAnatomySurfaceSeed {
  type: "native_anatomy_surface_seed"
  order: 1
  objectId: "PathTender"
  personaId: "path_tender"
  faceWidth: 0.96
  faceLength: 1.05
  jawTaper: 0.28
  shoulderScale: 1.1
  torsoScale: 0.94
  crownWhorl: -0.28
  microdetailProfile: "analytic-pore-v1"
  microdetailScale: 102
  microdetailStrength: 0.085
}

object RecordStewardAnatomySurfaceSeed {
  type: "native_anatomy_surface_seed"
  order: 2
  objectId: "RecordSteward"
  personaId: "record_steward"
  faceWidth: 0.93
  faceLength: 1.08
  jawTaper: 0.32
  shoulderScale: 1.08
  torsoScale: 0.97
  crownWhorl: 0.34
  microdetailProfile: "analytic-pore-v1"
  microdetailScale: 88
  microdetailStrength: 0.065
}
