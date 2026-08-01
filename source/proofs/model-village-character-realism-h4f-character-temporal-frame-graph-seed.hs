// H4F deterministic resident-frame schedule and claim boundary.

object H4FCharacterTemporalSeedManifest {
  type: "browser_webgpu_character_temporal_frame_graph_seed_manifest"
  schema: "hololand.model-village.character-realism-h4f-seed.v1"
  milestone: "MV_CHARACTER_REALISM_H4F_CHARACTER_TEMPORAL_FRAME_GRAPH"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-realism-h4f-character-temporal-frame-graph.holo"
  policySource: "source/proofs/model-village-character-realism-h4f-character-temporal-frame-graph-policy.hsplus"
  upstreamHoloScriptCommit: "345b85c87ef5a97bcad11cd39be8ece59358a319"
  residentNames: ["OpenAI", "Claude", "Gemini", "Grok"]
  deterministicSeed: 3107314
  characterTargetWidth: 512
  characterTargetHeight: 512
  warmupFramesPerResident: 4
  measuredFramesPerResident: 16
  totalMeasuredSamples: 64
  temporalFeedback: 0.75
  disocclusionDepthThreshold: 0.01
  timestampQueryRequired: true
  timestampQueryCount: 6
  timestampScope: "character-color-through-temporal-resolve-gpu-scope"
  persistentGpuResourcesRequired: true
  fixedTopologyRequired: true
  singleCommandBufferPerCharacterFrameRequired: true
  singleQueueSubmissionPerCharacterFrameRequired: true
  intermediateFrameReadbackCountRequired: 0
  boundedPerCharacterRtxBenchmarkClaimed: true
  fourCharactersInOneSubmissionClaimed: false
  productionWholeFrameTimeClaimed: false
  questHeadsetMeasured: false
  photorealismClaimed: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "browser_profile_as_quest_device", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object H4FResidentFrameSchedule {
  type: "deterministic_source_compiled_micro_motion_schedule"
  frameStateOffsetsSeconds: [0, 0.84]
  alternateSourceStates: true
  warmupFramesPerResident: 4
  measuredFramesPerResident: 16
  finalEvidenceFramesPerResident: 1
  measuredCapturePixels: false
  finalEvidenceCapturePixels: true
}
