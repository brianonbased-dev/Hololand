// Deterministic flat inputs for Character Appearance H3A.

object "HearthKeeperPersonaSeed" {
  type: "neutral_civic_persona_seed"
  personaId: "hearth_keeper"
  civicRole: "keeper"
  silhouetteProfile: "cropped_coil_crown"
  dermalAtlasCell: [0, 0]
  hairStyleId: "cropped_coils"
  adapterFamilyBinding: "absent"
  researchSeatBinding: "absent"
}

object "PathTenderPersonaSeed" {
  type: "neutral_civic_persona_seed"
  personaId: "path_tender"
  civicRole: "wayfinder"
  silhouetteProfile: "swept_ridge"
  dermalAtlasCell: [1, 0]
  hairStyleId: "swept_ridge"
  adapterFamilyBinding: "absent"
  researchSeatBinding: "absent"
}

object "RecordStewardPersonaSeed" {
  type: "neutral_civic_persona_seed"
  personaId: "record_steward"
  civicRole: "archivist"
  silhouetteProfile: "braided_crown"
  dermalAtlasCell: [2, 0]
  hairStyleId: "braided_crown"
  adapterFamilyBinding: "absent"
  researchSeatBinding: "absent"
}

object "NeutralDermalAtlasSeed" {
  type: "neutral_dermal_atlas_seed"
  algorithm: "stormglass_neutral_dermal_atlas_v1"
  seed: 271828
  grid: [3, 1]
  albedoSize: [2048, 2048]
  normalSize: [2048, 2048]
  surfaceMaskSize: [1024, 1024]
  externalUris: []
}

object "NeutralPersonaLod0Seed" {
  type: "neutral_persona_lod_seed"
  level: 0
  distanceMeters: 0
  faceRadialSegments: 28
  faceHeightSegments: 20
  hairRadialSegments: 18
  maximumPersonaTriangles: 12000
}

object "NeutralPersonaLod1Seed" {
  type: "neutral_persona_lod_seed"
  level: 1
  distanceMeters: 8
  faceRadialSegments: 18
  faceHeightSegments: 12
  hairRadialSegments: 12
  maximumPersonaTriangles: 5000
}

object "NeutralPersonaLod2Seed" {
  type: "neutral_persona_lod_seed"
  level: 2
  distanceMeters: 20
  faceRadialSegments: 10
  faceHeightSegments: 8
  hairRadialSegments: 6
  maximumPersonaTriangles: 1800
}

object "ExpressionNeutralSeed" {
  type: "neutral_persona_expression_seed"
  expressionId: "neutral"
  nativeMorphTargetClaimed: false
}

object "ExpressionSoftSmileSeed" {
  type: "neutral_persona_expression_seed"
  expressionId: "soft_smile"
  nativeMorphTargetClaimed: false
}

object "ExpressionBlinkSeed" {
  type: "neutral_persona_expression_seed"
  expressionId: "blink"
  nativeMorphTargetClaimed: false
}

object "VisemeAASeed" {
  type: "neutral_persona_expression_seed"
  expressionId: "viseme_aa"
  nativeMorphTargetClaimed: false
}

object "VisemeEESeed" {
  type: "neutral_persona_expression_seed"
  expressionId: "viseme_ee"
  nativeMorphTargetClaimed: false
}

object "VisemeOHSeed" {
  type: "neutral_persona_expression_seed"
  expressionId: "viseme_oh"
  nativeMorphTargetClaimed: false
}

object "H3ANativeHairAdmissionSeed" {
  type: "h3a_native_admission_seed"
  channel: "hair_style_geometry"
  upstreamPath: "packages/engine/src/character-render/CharacterHostFromComposition.ts"
  currentOperative: false
  fullH3Required: true
  expectedAdmission: false
}

object "H3ANativeMorphAdmissionSeed" {
  type: "h3a_native_admission_seed"
  channel: "morph_facs"
  upstreamPath: "packages/engine/src/character-render/CharacterHostFromComposition.ts"
  currentOperative: false
  fullH3Required: true
  expectedAdmission: false
}

object "H3AHistoryResetCamera" {
  type: "h3a_history_reset_seed"
  event: "camera_cut"
  required: true
}

object "H3AHistoryResetLod" {
  type: "h3a_history_reset_seed"
  event: "lod_change"
  required: true
}

object "H3AHistoryResetExpression" {
  type: "h3a_history_reset_seed"
  event: "expression_change"
  required: true
}

object "H3AHistoryResetPersona" {
  type: "h3a_history_reset_seed"
  event: "persona_change"
  required: true
}

object "H3AHistoryResetProfile" {
  type: "h3a_history_reset_seed"
  event: "profile_change"
  required: true
}

object "H3ATruthBoundarySeed" {
  type: "h3a_truth_boundary_seed"
  fullH3Claimed: false
  nativeHairStyleChannelClaimed: false
  nativeMorphTargetChannelClaimed: false
  adapterFamilyBinding: "absent"
  researchSeatBinding: "absent"
  liveResearchJoinAllowed: false
  canonicalWritesAllowed: false
  residentObservationWritesAllowed: false
  modelCallsAllowed: false
  networkFetchesAllowed: false
  biometricPersistenceAllowed: false
  productionFaceCompleteClaimed: false
  photorealismClaimed: false
  fullWorldConvergenceClaimed: false
}
