// Deterministic flat inputs for Stormglass Character Appearance H0/H1.

object "AppearanceProfileVillageStory" {
  type: "appearance_profile_seed"
  profileId: "village_story_unblinded"
  bodyId: "shared_faceless_craftfolk"
  familyIdentityAdmission: "detachable_mantle_glyph_caption_only"
  familyIdentityVisible: false
  researchSeatBinding: "absent"
}

object "AppearanceProfileResearchLive" {
  type: "appearance_profile_seed"
  profileId: "research_live_blinded"
  bodyId: "resident_01_06_neutral_persona"
  familyIdentityAdmission: "absent"
  assignmentInvariantRequired: true
  researchSeatBinding: "absent"
}

object "AppearanceProfileReplayPostlock" {
  type: "appearance_profile_seed"
  profileId: "research_replay_postlock"
  bodyId: "same_neutral_terminal_replay_body"
  familyIdentityAdmission: "verified_binding_after_terminal_commitment_only"
  readOnlyReplayRequired: true
  researchSeatBinding: "absent"
}

object "AppearanceProfileVisitor" {
  type: "appearance_profile_seed"
  profileId: "visitor_player"
  bodyId: "later_separate_player_authored_avatar"
  familyIdentityAdmission: "never_research_seat_identity"
  status: "deferred"
}

object "AppearanceAssignmentVectorA" {
  type: "appearance_assignment_invariance_seed"
  vectorId: "assignment_vector_a"
  seatOrder: ["seat-01", "seat-02", "seat-03", "seat-04", "seat-05", "seat-06"]
  adapterOrder: ["anthropic", "openai", "google", "xai", "ollama", "sovereign"]
  appearanceDigestInput: "neutral_persona_manifest_only"
  expectedFamilyIdentityVisible: false
}

object "AppearanceAssignmentVectorB" {
  type: "appearance_assignment_invariance_seed"
  vectorId: "assignment_vector_b"
  seatOrder: ["seat-01", "seat-02", "seat-03", "seat-04", "seat-05", "seat-06"]
  adapterOrder: ["sovereign", "ollama", "xai", "google", "openai", "anthropic"]
  appearanceDigestInput: "neutral_persona_manifest_only"
  expectedFamilyIdentityVisible: false
}

object "SurfaceAtlasSeed" {
  type: "surface_atlas_seed"
  algorithm: "stormglass_shared_surface_atlas_v1"
  seed: 271828
  regions: ["woven_teal", "woven_charcoal", "weathered_leather", "aged_bronze"]
  albedoSize: [2048, 2048]
  normalSize: [2048, 2048]
  surfaceMaskSize: [1024, 1024]
  externalUris: []
}

object "SurfaceLod0Seed" {
  type: "surface_lod_seed"
  level: 0
  distanceMeters: 0
  radialSegments: 24
  capSegments: 8
  roundedBoxSegments: 4
  maximumTriangles: 15000
}

object "SurfaceLod1Seed" {
  type: "surface_lod_seed"
  level: 1
  distanceMeters: 12
  radialSegments: 14
  capSegments: 5
  roundedBoxSegments: 2
  maximumTriangles: 6000
}

object "SurfaceLod2Seed" {
  type: "surface_lod_seed"
  level: 2
  distanceMeters: 28
  radialSegments: 8
  capSegments: 3
  roundedBoxSegments: 1
  maximumTriangles: 2000
}

object "SurfaceHistoryResetCamera" {
  type: "surface_history_reset_seed"
  event: "camera_cut"
  required: true
}

object "SurfaceHistoryResetLod" {
  type: "surface_history_reset_seed"
  event: "lod_change"
  required: true
}

object "SurfaceHistoryResetProfile" {
  type: "surface_history_reset_seed"
  event: "profile_change"
  required: true
}

object "SurfaceHistoryResetTopology" {
  type: "surface_history_reset_seed"
  event: "topology_change"
  required: true
}

object "AppearanceTruthBoundarySeed" {
  type: "appearance_truth_boundary_seed"
  canonicalWritesAllowed: false
  residentObservationWritesAllowed: false
  modelCallsAllowed: false
  networkFetchesAllowed: false
  liveResearchJoinAllowed: false
  familySeatJoinAllowed: false
  familyIdentityVisible: false
  clothSimulationClaimed: false
  motionRetargetingClaimed: false
  hairStyleGeometryClaimed: false
  facsMorphTargetsClaimed: false
  photorealismClaimed: false
  fullWorldConvergenceClaimed: false
}
