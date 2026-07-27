// Receipt Loom Performance / LOD / TAA Convergence G flat input manifest.
//
// .hs carries portable data only: exact quality profile, resident order,
// authored LOD distances, deterministic camera probes, benchmark counts, and
// admitted history-reset events. No wall clock, model output, live research
// state, wallet identity, or canonical receipt is an input.

object PerformanceConvergenceSeedManifest {
  type: "model_village_performance_convergence_seed_manifest"
  schema: "hololand.model-village.performance-convergence-seed.v1"
  milestone: "MV_V1_PERFORMANCE_CONVERGENCE_G"
  source: "source/proofs/model-village-receipt-loom-performance-convergence-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-receipt-loom-performance-convergence.holo"
  policySource: "source/proofs/model-village-receipt-loom-performance-convergence-policy.hsplus"
  inheritedPhysicalSource: "source/layers/vr/frontier/model-village/model-village-receipt-loom-physical-convergence.holo"
  familyMantleSource: "source/layers/vr/frontier/model-village/model-village-family-mantle-catalog.holo"
  qualityProfile: "desktop_cinematic_g1"
  warmupFrames: 600
  measuredFrames: 1800
  residentCount: 6
  lodLevelCount: 3
  authoredFamilyTierCount: 18
  temporalHistorySamples: 32
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "canonical_village_receipt", "adapter_assignment", "wallet_identity"]
}

object LodLevel0Seed {
  type: "family_lod_level_seed"
  level: 0
  distanceMeters: 0
  garmentSegments: 24
  polygonRatio: 1.0
  textureScale: 1.0
  staticSettledPresentationOnly: true
}

object LodLevel1Seed {
  type: "family_lod_level_seed"
  level: 1
  distanceMeters: 12
  garmentSegments: 14
  polygonRatio: 0.78
  textureScale: 1.0
  staticSettledPresentationOnly: true
}

object LodLevel2Seed {
  type: "family_lod_level_seed"
  level: 2
  distanceMeters: 28
  garmentSegments: 8
  polygonRatio: 0.66
  textureScale: 1.0
  staticSettledPresentationOnly: true
}

object NearLodProbe {
  type: "lod_distance_probe"
  id: "near"
  distanceMeters: 8
  expectedLevel: 0
}

object MidLodProbe {
  type: "lod_distance_probe"
  id: "mid"
  distanceMeters: 18
  expectedLevel: 1
}

object FarLodProbe {
  type: "lod_distance_probe"
  id: "far"
  distanceMeters: 36
  expectedLevel: 2
}

object CameraCutHistoryReset {
  type: "temporal_history_reset_seed"
  event: "camera_cut"
  required: true
}

object LodChangeHistoryReset {
  type: "temporal_history_reset_seed"
  event: "lod_change"
  required: true
}

object ProfileChangeHistoryReset {
  type: "temporal_history_reset_seed"
  event: "profile_change"
  required: true
}

object ResizeHistoryReset {
  type: "temporal_history_reset_seed"
  event: "resize"
  required: true
}

object ClaudePerformanceSeed {
  type: "resident_performance_seed"
  order: 0
  publicDisplayName: "Claude"
  familyId: "anthropic"
  residentObjectName: "ResidentConvergence:Claude"
}

object OpenAIPerformanceSeed {
  type: "resident_performance_seed"
  order: 1
  publicDisplayName: "OpenAI"
  familyId: "openai"
  residentObjectName: "ResidentConvergence:OpenAI"
}

object GeminiPerformanceSeed {
  type: "resident_performance_seed"
  order: 2
  publicDisplayName: "Gemini"
  familyId: "google"
  residentObjectName: "ResidentConvergence:Gemini"
}

object GrokPerformanceSeed {
  type: "resident_performance_seed"
  order: 3
  publicDisplayName: "Grok"
  familyId: "xai"
  residentObjectName: "ResidentConvergence:Grok"
}

object GLMPerformanceSeed {
  type: "resident_performance_seed"
  order: 4
  publicDisplayName: "GLM"
  familyId: "ollama"
  residentObjectName: "ResidentConvergence:GLM"
}

object BrittneyPerformanceSeed {
  type: "resident_performance_seed"
  order: 5
  publicDisplayName: "Brittney"
  familyId: "sovereign"
  residentObjectName: "ResidentConvergence:Brittney"
}

object PerformanceSeedAcceptanceGate {
  type: "model_village_performance_seed_gate"
  expectedResidentCount: 6
  expectedLodLevelCount: 3
  expectedAuthoredFamilyTierCount: 18
  expectedHistoryResetEventCount: 4
  exactResidentOrderRequired: true
  exactLodDistancesRequired: true
  finiteNumbersRequired: true
  duplicateResidentBehavior: "throw_before_browser"
  crossLaneInputsAllowed: false
}
