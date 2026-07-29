// H3R flat deterministic source-pose and deformation seed.

object H3RPosedDeformationSeedManifest {
  type: "native_webgpu_source_pose_deformation_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3r-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3R_POSED_DEFORMATION"
  source: "source/proofs/model-village-character-appearance-h3r-posed-deformation-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3r-posed-deformation.holo"
  policySource: "source/proofs/model-village-character-appearance-h3r-posed-deformation-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3Q_MATERIAL_CALIBRATION"
  upstreamHoloScriptCommit: "ad577ed2238d0e8a7302badd5656b7bf791aefc9"
  compilerTarget: "character-webgpu"
  rendererEntrypoint: "renderCharacter"
  rendererBackend: "webgpu"
  authoredProfile: "coherent-deforming-hands-v4"
  sourcePoseReceiptSchema: "holoscript.character-source-pose.v1"
  jointDeformationReceiptSchema: "holoscript.agent-avatar-joint-deformation.v1"
  jointDeformationProfile: "dual-influence-upper-limb-v1"
  secondaryInfluencedVertexCount: 1008
  uniqueJointPairCount: 38
  maxSecondaryWeight: 0.55
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

object OpenAIPosedDeformationSeed {
  type: "named_model_family_source_pose_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
  poseName: "measured-open-palm"
  gestureMeaning: "measured_open_palm"
  poseBoneCount: 8
}

object ClaudePosedDeformationSeed {
  type: "named_model_family_source_pose_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
  poseName: "considered-listening"
  gestureMeaning: "considered_listening"
  poseBoneCount: 8
}

object GeminiPosedDeformationSeed {
  type: "named_model_family_source_pose_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
  poseName: "asymmetric-visual-framing"
  gestureMeaning: "asymmetric_visual_framing"
  poseBoneCount: 8
}

object GrokPosedDeformationSeed {
  type: "named_model_family_source_pose_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
  poseName: "direct-broad-challenge"
  gestureMeaning: "direct_broad_challenge"
  poseBoneCount: 8
}
