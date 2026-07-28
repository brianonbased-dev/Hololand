// Stormglass Character Appearance H3B flat deterministic input manifest.
//
// .hs carries portable persona order, native style ids, exact per-tier hair
// budgets, expression probe weights, and temporal reset events. It contains no
// wall clock, live model output, research identity, wallet, or canonical state.

object H3BNativeAppearanceSeedManifest {
  type: "native_character_appearance_seed_manifest"
  schema: "hololand.model-village.character-appearance-h3b-seed.v1"
  milestone: "MV_CHARACTER_APPEARANCE_H3B_NATIVE_CHANNEL_ADMISSION"
  source: "source/proofs/model-village-character-appearance-h3b-native-channels-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-character-appearance-h3b-native-channels.holo"
  policySource: "source/proofs/model-village-character-appearance-h3b-native-channels-policy.hsplus"
  upstreamHoloScriptCommit: "2986b458e7aa13fc9d3a04bfbb4a6deb7e1b5f01"
  compilerTarget: "character-webgpu"
  personaCount: 3
  lodLevelCount: 3
  nativeBundleCount: 9
  expressionProbeCount: 6
  temporalHistorySamples: 32
  forbiddenInputClasses: ["wall_clock", "model_output", "live_research_state", "resident_observation", "adapter_assignment", "research_seat", "wallet_identity", "biometric_sample"]
}

object HearthKeeperSeed {
  type: "native_neutral_persona_seed"
  order: 0
  objectId: "HearthKeeper"
  personaId: "hearth_keeper"
  civicRole: "keeper"
  nativeHairStyleId: "cropped_coils"
  h3aShadowStyleId: "cropped_coils"
  nativeStyleParityClaimed: true
  dermalAtlasCell: [0, 0]
}

object PathTenderSeed {
  type: "native_neutral_persona_seed"
  order: 1
  objectId: "PathTender"
  personaId: "path_tender"
  civicRole: "wayfinder"
  nativeHairStyleId: "swept_ridge"
  h3aShadowStyleId: "swept_ridge"
  nativeStyleParityClaimed: true
  dermalAtlasCell: [1, 0]
}

object RecordStewardSeed {
  type: "native_neutral_persona_seed"
  order: 2
  objectId: "RecordSteward"
  personaId: "record_steward"
  civicRole: "archivist"
  nativeHairStyleId: "long"
  h3aShadowStyleId: "braided_crown"
  nativeStyleParityClaimed: false
  nativeStyleSubstitutionReason: "braided_crown_not_yet_in_native_catalog"
  dermalAtlasCell: [2, 0]
}

object HearthKeeperLod0 {
  type: "native_hair_lod_seed"
  personaId: "hearth_keeper"
  level: 0
  distanceMeters: 0
  hairGuides: 168
  hairCardsPerGuide: 2
  hairSegments: 7
}

object HearthKeeperLod1 {
  type: "native_hair_lod_seed"
  personaId: "hearth_keeper"
  level: 1
  distanceMeters: 8
  hairGuides: 92
  hairCardsPerGuide: 1
  hairSegments: 5
}

object HearthKeeperLod2 {
  type: "native_hair_lod_seed"
  personaId: "hearth_keeper"
  level: 2
  distanceMeters: 20
  hairGuides: 48
  hairCardsPerGuide: 1
  hairSegments: 3
}

object PathTenderLod0 {
  type: "native_hair_lod_seed"
  personaId: "path_tender"
  level: 0
  distanceMeters: 0
  hairGuides: 126
  hairCardsPerGuide: 2
  hairSegments: 6
}

object PathTenderLod1 {
  type: "native_hair_lod_seed"
  personaId: "path_tender"
  level: 1
  distanceMeters: 8
  hairGuides: 72
  hairCardsPerGuide: 1
  hairSegments: 4
}

object PathTenderLod2 {
  type: "native_hair_lod_seed"
  personaId: "path_tender"
  level: 2
  distanceMeters: 20
  hairGuides: 40
  hairCardsPerGuide: 1
  hairSegments: 3
}

object RecordStewardLod0 {
  type: "native_hair_lod_seed"
  personaId: "record_steward"
  level: 0
  distanceMeters: 0
  hairGuides: 160
  hairCardsPerGuide: 2
  hairSegments: 8
}

object RecordStewardLod1 {
  type: "native_hair_lod_seed"
  personaId: "record_steward"
  level: 1
  distanceMeters: 8
  hairGuides: 88
  hairCardsPerGuide: 1
  hairSegments: 5
}

object RecordStewardLod2 {
  type: "native_hair_lod_seed"
  personaId: "record_steward"
  level: 2
  distanceMeters: 20
  hairGuides: 44
  hairCardsPerGuide: 1
  hairSegments: 3
}

object ExpressionNeutralSeed {
  type: "native_morph_expression_seed"
  expressionId: "neutral"
  weights: { smile: 0, jawOpen: 0, blink: 0 }
}

object ExpressionSoftSmileSeed {
  type: "native_morph_expression_seed"
  expressionId: "soft_smile"
  weights: { smile: 0.62 }
}

object ExpressionBlinkSeed {
  type: "native_morph_expression_seed"
  expressionId: "blink"
  weights: { blink: 1 }
}

object ExpressionAASeed {
  type: "native_morph_expression_seed"
  expressionId: "viseme_aa"
  weights: { aa: 0.84, jawOpen: 0.28 }
}

object ExpressionEESeed {
  type: "native_morph_expression_seed"
  expressionId: "viseme_ee"
  weights: { ee: 0.88, smile: 0.18 }
}

object ExpressionOHSeed {
  type: "native_morph_expression_seed"
  expressionId: "viseme_oh"
  weights: { oh: 0.9, jawOpen: 0.2 }
}

object CameraCutResetSeed {
  type: "h3b_history_reset_seed"
  order: 0
  event: "camera_cut"
}

object LodChangeResetSeed {
  type: "h3b_history_reset_seed"
  order: 1
  event: "lod_change"
}

object ExpressionChangeResetSeed {
  type: "h3b_history_reset_seed"
  order: 2
  event: "expression_change"
}

object PersonaChangeResetSeed {
  type: "h3b_history_reset_seed"
  order: 3
  event: "persona_change"
}

object ProfileChangeResetSeed {
  type: "h3b_history_reset_seed"
  order: 4
  event: "profile_change"
}

object ResizeResetSeed {
  type: "h3b_history_reset_seed"
  order: 5
  event: "resize"
}
