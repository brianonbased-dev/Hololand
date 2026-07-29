// H3P flat deterministic witness manifest.

object H3PHandTopologySeedManifest {
  type: "native_webgpu_hand_topology_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3p-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3P_HAND_TOPOLOGY_CONVERGENCE"
  source: "source/proofs/model-village-character-appearance-h3p-hand-topology-convergence-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3p-hand-topology-convergence.holo"
  policySource: "source/proofs/model-village-character-appearance-h3p-hand-topology-convergence-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_APPEARANCE_H3N_HAND_LANDMARKS_TAA_LOD"
  upstreamHoloScriptCommit: "1a9290762e1c1b1671c0a3ae9fb7d25999f0d0c1"
  compilerTarget: "character-webgpu"
  rendererEntrypoint: "renderCharacter"
  rendererBackend: "webgpu"
  materialReceiptSchema: "holoscript.character-material-plate.v1"
  detailFrameSchema: "holoscript.character-detail-frame.v1"
  authoredProfile: "coherent-hand-landmarks-v3"
  digitProfile: "volume-preserving-three-phalanx-v2"
  digitRadialSegments: 12
  digitRingCount: 9
  jointVolumeBlendRingCount: 4
  minimumJointRadiusRatio: 0.62
  maximumAdjacentRadiusDrop: 0.1
  crossSectionAspectRatio: 0.88
  webProfile: "volumetric-interdigital-web-v2"
  webRadialSegments: 12
  webBlendRingCount: 4
  nailProfile: "surface-conforming-nail-plate-v2"
  nailAttachment: "distal-phalanx-surface-conforming-v1"
  nailAttachmentSampleCount: 25
  watertightNailSkinUnionClaimed: false
  landmarkCountPerRenderedHand: 18
  nailMaterialRole: "keratin-nail"
  nailGroupCountPerResident: 10
  nailGroupCountPerRenderedHand: 5
  residentCount: 4
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  nativeDawnGpuReadbackClaimed: true
  browserWebgpuMeasured: false
  gpuTimestampFrameTimeClaimed: false
  freshRtxBenchmarkClaimed: false
  photorealismClaimed: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "webgl_bridge_as_native_webgpu", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object OpenAIHandMaterialSeed {
  type: "named_model_family_hand_topology_seed"
  order: 0
  objectId: "OpenAIResident"
  modelFamilyId: "openai"
  displayLabel: "OpenAI"
  nailTone: "#E6BEB2"
  nailRoughness: 0.24
}

object ClaudeHandMaterialSeed {
  type: "named_model_family_hand_topology_seed"
  order: 1
  objectId: "ClaudeResident"
  modelFamilyId: "anthropic"
  displayLabel: "Claude"
  nailTone: "#EDC7B6"
  nailRoughness: 0.28
}

object GeminiHandMaterialSeed {
  type: "named_model_family_hand_topology_seed"
  order: 2
  objectId: "GeminiResident"
  modelFamilyId: "google"
  displayLabel: "Gemini"
  nailTone: "#C9A094"
  nailRoughness: 0.31
}

object GrokHandMaterialSeed {
  type: "named_model_family_hand_topology_seed"
  order: 3
  objectId: "GrokResident"
  modelFamilyId: "xai"
  displayLabel: "Grok"
  nailTone: "#F1CCBB"
  nailRoughness: 0.22
}
