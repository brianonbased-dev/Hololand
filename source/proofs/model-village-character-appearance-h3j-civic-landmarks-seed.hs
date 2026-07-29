// H3J flat deterministic civic-landmark input manifest.

object H3JCivicLandmarkSeedManifest {
  type: "native_civic_landmark_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3j-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3J_CIVIC_LANDMARKS"
  source: "source/proofs/model-village-character-appearance-h3j-civic-landmarks-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3j-civic-landmarks.holo"
  policySource: "source/proofs/model-village-character-appearance-h3j-civic-landmarks-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3I_ANATOMY_SURFACE"
  upstreamHoloScriptCommit: "1bc81ee7e02fade1095dc1c1548d7879e27a2800"
  compilerTarget: "character-webgpu"
  facialLandmarkReceiptSchema: "holoscript.agent-avatar-facial-landmarks.v1"
  garmentReceiptSchema: "holoscript.agent-avatar-garment-geometry.v1"
  groomReceiptSchema: "holoscript.agent-avatar-groom-geometry.v1"
  faceProfile: "civic-landmarks-v1"
  garmentStyle: "stormglass-open-civic-tunic"
  groomProfile: "scalp-flow-v1"
  personaCount: 3
  nativeBundleCount: 3
  facialLandmarkReceiptCount: 3
  garmentReceiptCount: 3
  clusteredGroomReceiptCount: 3
  sharedRendererCount: 1
  sharedSceneCount: 1
  temporalComposerCount: 1
  internalRenderWidth: 1458
  internalRenderHeight: 486
  presentationWidth: 1800
  presentationHeight: 720
  internalRenderScale: 0.81
  temporalBridge: "three-taarenderpass-v1"
  temporalAccumulationFrames: 32
  temporalHistoryPolicy: "invalidate-on-camera-motion-v1"
  motionReprojectionClaimed: false
  nativeWebgpuTaaClaimed: false
  presentationShaderOverrideUsed: false
  presentationMaterialBridgeUsed: true
  presentationWardrobeBridgeUsed: false
  presentationNativeTorsoClipUsed: false
  externalSkinTextureUsed: false
  externalHairTextureUsed: false
  externalWardrobeTextureUsed: false
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object HearthKeeperCivicLandmarkSeed {
  type: "native_civic_landmark_seed"
  order: 0
  objectId: "HearthKeeper"
  personaId: "hearth_keeper"
  eyeScale: 0.82
  browHeight: 1.24
  browThickness: 0.18
  earScale: 1.04
  mouthDepth: 0.88
  clusterCount: 14
  clusterSpread: 0.42
  wardrobeColor: "#355F69"
}

object PathTenderCivicLandmarkSeed {
  type: "native_civic_landmark_seed"
  order: 1
  objectId: "PathTender"
  personaId: "path_tender"
  eyeScale: 0.84
  browHeight: 1.16
  browThickness: 0.17
  earScale: 1
  mouthDepth: 0.76
  clusterCount: 12
  clusterSpread: 0.36
  wardrobeColor: "#384A55"
}

object RecordStewardCivicLandmarkSeed {
  type: "native_civic_landmark_seed"
  order: 2
  objectId: "RecordSteward"
  personaId: "record_steward"
  eyeScale: 0.8
  browHeight: 1.3
  browThickness: 0.2
  earScale: 1.08
  mouthDepth: 0.94
  clusterCount: 16
  clusterSpread: 0.48
  wardrobeColor: "#6B4A3D"
}
