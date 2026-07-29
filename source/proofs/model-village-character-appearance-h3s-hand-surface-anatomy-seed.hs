// H3S flat deterministic V5 hand-surface seed.

object H3SHandSurfaceSeedManifest {
  type: "native_webgpu_v5_hand_surface_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3s-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3S_HAND_SURFACE_ANATOMY"
  source: "source/proofs/model-village-character-appearance-h3s-hand-surface-anatomy-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3s-hand-surface-anatomy.holo"
  policySource: "source/proofs/model-village-character-appearance-h3s-hand-surface-anatomy-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3R_POSED_DEFORMATION"
  upstreamHoloScriptCommit: "8f1555f8a8ccf16a3745b9f021bcc21cf87e2b96"
  compilerTarget: "character-webgpu"
  rendererEntrypoint: "renderCharacter"
  rendererBackend: "webgpu"
  authoredProfile: "coherent-hand-surface-v5"
  counterfactualProfile: "coherent-deforming-hands-v4"
  handSurfaceReceiptSchema: "holoscript.agent-avatar-hand-surface.v1"
  handSurfaceGeometryReceiptSchema: "holoscript.agent-avatar-hand-surface-geometry.v1"
  handSurfaceProfile: "tapered-digit-commissure-cuticle-wrist-v1"
  expectedVertexDeltaOverV4: 1336
  secondaryInfluencedVertexCount: 1008
  uniqueJointPairCount: 38
  fixedLightDirection: [0.32, 0.72, 0.61]
  fixedClearColor: [2, 8, 17]
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  nativeDawnGpuReadbackClaimed: true
  browserWebgpuMeasured: false
  gpuTimestampFrameTimeClaimed: false
  freshRtxBenchmarkClaimed: false
  measuredTissueModelClaimed: false
  photorealismClaimed: false
  forbiddenInputClasses: ["runtime_pose_mutation", "wall_clock_as_gpu_time", "webgl_bridge_as_native_webgpu", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object OpenAIHandSurfaceSeed {
  type: "named_model_family_v5_hand_surface_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
  poseName: "measured-open-palm"
  poseBoneCount: 8
}

object ClaudeHandSurfaceSeed {
  type: "named_model_family_v5_hand_surface_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
  poseName: "considered-listening"
  poseBoneCount: 8
}

object GeminiHandSurfaceSeed {
  type: "named_model_family_v5_hand_surface_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
  poseName: "asymmetric-visual-framing"
  poseBoneCount: 8
}

object GrokHandSurfaceSeed {
  type: "named_model_family_v5_hand_surface_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
  poseName: "direct-broad-challenge"
  poseBoneCount: 8
}
