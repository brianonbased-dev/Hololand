// Deterministic flat inputs for Character Appearance H2.

object "ClaudeMantleSeed" {
  type: "production_family_mantle_seed"
  publicDisplayName: "Claude"
  familyId: "anthropic"
  primaryNonColorCue: "quiet_nested_open_arcs"
  atlasCell: [0, 0]
  wearMaskSeed: 3101
  expectedResearchSeatBinding: "absent"
}

object "OpenAIMantleSeed" {
  type: "production_family_mantle_seed"
  publicDisplayName: "OpenAI"
  familyId: "openai"
  primaryNonColorCue: "recursive_interlock"
  atlasCell: [1, 0]
  wearMaskSeed: 3203
  expectedResearchSeatBinding: "absent"
}

object "GeminiMantleSeed" {
  type: "production_family_mantle_seed"
  publicDisplayName: "Gemini"
  familyId: "google"
  primaryNonColorCue: "paired_prism_panels"
  atlasCell: [2, 0]
  wearMaskSeed: 3307
  expectedResearchSeatBinding: "absent"
}

object "GrokMantleSeed" {
  type: "production_family_mantle_seed"
  publicDisplayName: "Grok"
  familyId: "xai"
  primaryNonColorCue: "off_axis_signal_bands"
  atlasCell: [0, 1]
  wearMaskSeed: 3407
  expectedResearchSeatBinding: "absent"
}

object "GLMMantleSeed" {
  type: "production_family_mantle_seed"
  publicDisplayName: "GLM"
  familyId: "ollama"
  primaryNonColorCue: "modular_phase_lattice"
  atlasCell: [1, 1]
  wearMaskSeed: 3511
  expectedResearchSeatBinding: "absent"
}

object "BrittneyMantleSeed" {
  type: "production_family_mantle_seed"
  publicDisplayName: "Brittney"
  familyId: "sovereign"
  primaryNonColorCue: "sovereign_locality_mesh"
  atlasCell: [2, 1]
  wearMaskSeed: 3607
  expectedResearchSeatBinding: "absent"
}

object "MantleAtlasSeed" {
  type: "mantle_atlas_seed"
  algorithm: "stormglass_six_mantle_atlas_v1"
  seed: 314159
  grid: [3, 2]
  albedoSize: [2048, 2048]
  normalSize: [2048, 2048]
  surfaceMaskSize: [1024, 1024]
  externalUris: []
}

object "MantleLod0Seed" {
  type: "mantle_lod_seed"
  level: 0
  distanceMeters: 0
  radialSegments: 20
  meshNodeRadialSegments: 12
  roundedSegments: 3
  maximumMantleTriangles: 2200
}

object "MantleLod1Seed" {
  type: "mantle_lod_seed"
  level: 1
  distanceMeters: 12
  radialSegments: 12
  meshNodeRadialSegments: 8
  roundedSegments: 2
  maximumMantleTriangles: 900
}

object "MantleLod2Seed" {
  type: "mantle_lod_seed"
  level: 2
  distanceMeters: 28
  radialSegments: 6
  meshNodeRadialSegments: 6
  roundedSegments: 1
  maximumMantleTriangles: 320
}

object "MantleDryStateSeed" {
  type: "mantle_weather_state_seed"
  state: "dry"
  roughnessScale: 1
  colorScale: 1
  topologyMutationAllowed: false
}

object "MantleWetStateSeed" {
  type: "mantle_weather_state_seed"
  state: "wet"
  roughnessScale: 0.38
  colorScale: 0.82
  topologyMutationAllowed: false
}

object "MantleHistoryResetCamera" {
  type: "mantle_history_reset_seed"
  event: "camera_cut"
  required: true
}

object "MantleHistoryResetLod" {
  type: "mantle_history_reset_seed"
  event: "lod_change"
  required: true
}

object "MantleHistoryResetWeather" {
  type: "mantle_history_reset_seed"
  event: "weather_state_change"
  required: true
}

object "MantleHistoryResetProfile" {
  type: "mantle_history_reset_seed"
  event: "profile_change"
  required: true
}

object "H2TruthBoundarySeed" {
  type: "h2_truth_boundary_seed"
  familyIdentityChannel: "detachable_mantle_glyph_caption_only"
  liveResearchFamilyIdentityVisible: false
  researchSeatBinding: "absent"
  canonicalWritesAllowed: false
  residentObservationWritesAllowed: false
  modelCallsAllowed: false
  networkFetchesAllowed: false
  clothSimulationClaimed: false
  productionBodyCompleteClaimed: false
  h5DrawGroupConsolidationClaimed: false
  photorealismClaimed: false
  fullWorldConvergenceClaimed: false
}
