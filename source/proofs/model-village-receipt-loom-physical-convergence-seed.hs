// Receipt Loom Physical Convergence F flat deterministic input manifest.
//
// .hs carries portable data only: exact resident order, mantle group binding,
// terrain contact heights, phase offsets, shared wind, and collision profile.
// No wall clock, model output, live research state, or canonical receipt is an
// input.

object PhysicalConvergenceSeedManifest {
  type: "model_village_physical_convergence_seed_manifest"
  schema: "hololand.model-village.physical-convergence-seed.v1"
  milestone: "MV_V1_PHYSICAL_CONVERGENCE_F"
  source: "source/proofs/model-village-receipt-loom-physical-convergence-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-receipt-loom-physical-convergence.holo"
  policySource: "source/proofs/model-village-receipt-loom-physical-convergence-policy.hsplus"
  residentSource: "source/layers/vr/frontier/model-village/model-village-receipt-loom-resident-convergence.holo"
  fixedTimestepNumerator: 1
  fixedTimestepDenominator: 120
  durationSeconds: 1.6
  sampleTimesSeconds: [0, 0.8, 1.6]
  replayRuns: 3
  residentCount: 6
  forbiddenInputClasses: ["wall_clock", "browser_frame_delta", "model_output", "live_research_state", "resident_observation", "canonical_village_receipt"]
}

object ClaudePhysicalSeed {
  type: "resident_physical_seed"
  order: 0
  publicDisplayName: "Claude"
  familyId: "anthropic"
  residentObjectName: "ResidentConvergence:Claude"
  mantleMaterialGroupIndex: 3
  groundYMeters: 0.42
  soleProbeLocalX: [-0.0538857132, 0.0538857132]
  phaseOffsetRadians: 0.00
}

object OpenAIPhysicalSeed {
  type: "resident_physical_seed"
  order: 1
  publicDisplayName: "OpenAI"
  familyId: "openai"
  residentObjectName: "ResidentConvergence:OpenAI"
  mantleMaterialGroupIndex: 3
  groundYMeters: 0.42
  soleProbeLocalX: [-0.0538857132, 0.0538857132]
  phaseOffsetRadians: 0.37
}

object GeminiPhysicalSeed {
  type: "resident_physical_seed"
  order: 2
  publicDisplayName: "Gemini"
  familyId: "google"
  residentObjectName: "ResidentConvergence:Gemini"
  mantleMaterialGroupIndex: 3
  groundYMeters: 0.42
  soleProbeLocalX: [-0.0538857132, 0.0538857132]
  phaseOffsetRadians: 0.74
}

object GrokPhysicalSeed {
  type: "resident_physical_seed"
  order: 3
  publicDisplayName: "Grok"
  familyId: "xai"
  residentObjectName: "ResidentConvergence:Grok"
  mantleMaterialGroupIndex: 3
  groundYMeters: 0.42
  soleProbeLocalX: [-0.0538857132, 0.0538857132]
  phaseOffsetRadians: 1.11
}

object GLMPhysicalSeed {
  type: "resident_physical_seed"
  order: 4
  publicDisplayName: "GLM"
  familyId: "ollama"
  residentObjectName: "ResidentConvergence:GLM"
  mantleMaterialGroupIndex: 3
  groundYMeters: 0.42
  soleProbeLocalX: [-0.0538857132, 0.0538857132]
  phaseOffsetRadians: 1.48
}

object BrittneyPhysicalSeed {
  type: "resident_physical_seed"
  order: 5
  publicDisplayName: "Brittney"
  familyId: "sovereign"
  residentObjectName: "ResidentConvergence:Brittney"
  mantleMaterialGroupIndex: 3
  groundYMeters: 0.42
  soleProbeLocalX: [-0.0538857132, 0.0538857132]
  phaseOffsetRadians: 1.85
}

object StormglassSharedWindSeed {
  type: "shared_wind_seed"
  fieldId: "stormglass_commons_shared_wind_f1"
  baseMetersPerSecond: [0.34, 0.02, 0.20]
  gustFloor: 0.65
  gustAmplitude: 0.35
  primaryFrequencyHz: 1.35
  secondaryFrequencyScale: 0.47
  secondaryPhaseRadians: 0.73
  coupledSystems: ["resident_mantles", "rain_streaks", "wind_foliage", "chimney_smoke", "cistern_ripples"]
}

object ResidentBodyCollisionSeed {
  type: "resident_body_collision_profile"
  profile: "y_axis_capsule_profile"
  baseRadiusMeters: 0.24
  shoulderRadiusAddMeters: 0.045
  shoulderCenterYMeters: 1.47
  shoulderHalfWidthMeters: 0.34
  surfaceOffsetMeters: 0.012
  maximumAllowedPenetrationMeters: 0.0001
}

object TerrainContactSeed {
  type: "terrain_contact_seed"
  groundYMeters: 0.42
  soleProbesPerResident: 2
  totalSoleProbes: 12
  rootVerticalMotionAllowed: false
  maximumAllowedPenetrationMeters: 0.0001
}

object PhysicalSeedAcceptanceGate {
  type: "model_village_physical_seed_gate"
  expectedResidentCount: 6
  expectedMantleVerticesPerResident: 91
  expectedDynamicMantleVerticesPerResident: 78
  expectedTotalDynamicMantleVertices: 468
  expectedCoupledSystemCount: 5
  exactResidentOrderRequired: true
  exactMantleGroupRequired: true
  exactGroundHeightRequired: true
  finiteNumbersRequired: true
  duplicateResidentBehavior: "throw_before_simulation"
  crossLaneInputsAllowed: false
}
