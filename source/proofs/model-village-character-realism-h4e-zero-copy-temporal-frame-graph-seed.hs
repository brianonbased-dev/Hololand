// H4E flat deterministic temporal benchmark and LOD-stress seed.

object H4EZeroCopyTemporalSeedManifest {
  type: "browser_webgpu_temporal_frame_graph_seed_manifest"
  schema: "hololand.model-village.character-realism-h4e-seed.v1"
  milestone: "MV_CHARACTER_REALISM_H4E_ZERO_COPY_TEMPORAL_FRAME_GRAPH"
  source: "source/proofs/model-village-character-realism-h4e-zero-copy-temporal-frame-graph-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-realism-h4e-zero-copy-temporal-frame-graph.holo"
  policySource: "source/proofs/model-village-character-realism-h4e-zero-copy-temporal-frame-graph-policy.hsplus"
  inheritedMilestone: "MV_CHARACTER_REALISM_H4D_PRODUCTION_TEMPORAL_CONVERGENCE"
  upstreamHoloScriptCommit: "b72544464b2054797c7a73a0de2150da45621b1a"
  deterministicSeed: 310731
  benchmarkWidth: 1400
  benchmarkHeight: 900
  temporalWarmupFrameCount: 8
  temporalMeasuredFrameCount: 40
  lodHistoryStressFrameCount: 24
  temporalFeedbackCeiling: 0.875
  disocclusionDepthThreshold: 0.01
  timestampQueryRequired: true
  timestampScope: "temporal_resolve_compute_pass"
  persistentPipelineRequired: true
  persistentColorHistoryRequired: true
  persistentDepthHistoryRequired: true
  singleCommandBufferPerFrameRequired: true
  singleQueueSubmissionPerFrameRequired: true
  intermediateFrameReadbackCountRequired: 0
  readbackExcludedFromTimedScope: true
  boundedRtxTemporalKernelBenchmarkClaimed: true
  generalRtxPerformanceClaimed: false
  productionFrameTimeClaimed: false
  questHeadsetMeasured: false
  photorealismClaimed: false
  forbiddenInputClasses: ["wall_clock_as_gpu_time", "browser_profile_as_quest_device", "model_output", "resident_observation", "adapter_assignment", "wallet_identity", "biometric_sample"]
}

object H4ETemporalWarmupSchedule {
  type: "deterministic_temporal_frame_schedule"
  phase: "warmup"
  frameCount: 8
  lodLevel: 0
  capturePixels: false
}

object H4ETemporalMeasuredSchedule {
  type: "deterministic_temporal_frame_schedule"
  phase: "gpu_timestamp_measurement"
  frameCount: 40
  lodLevel: 0
  capturePixels: false
}

object H4ELodHistoryStressSchedule {
  type: "deterministic_lod_history_stress_schedule"
  phase: "lod_history_stress"
  frameCount: 24
  lodLevels: [0, 2]
  framesPerLod: 3
  expectedHistoryPolicy: "reject_on_lod_change"
  capturePixels: false
}
