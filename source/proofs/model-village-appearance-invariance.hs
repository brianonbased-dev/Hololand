// Model Village resident appearance-invariance manifest.
//
// Declarative .hs source makes the adapter-permutation proof portable. The
// HoloLand art-direction checker parses these objects, recomputes the neutral
// research-appearance digest from the canonical resident-kit fields, and fails
// if any adapter or condition changes a resident's research presentation. The
// public family-embodiment digest is separate and cannot enter live prompts,
// observations, canonical hashes, or projections.

object "ModelVillageAppearanceInvarianceGate" {
  type: "model_village_appearance_invariance_gate"
  version: "1.1.0"
  source: "source/proofs/model-village-appearance-invariance.hs"
  residentKitSource: "source/layers/vr/frontier/model-village/model-village-resident-kit.holo"
  publicEmbodimentOverlaySource: "source/layers/vr/frontier/model-village/model-village-public-embodiments.holo"
  artDirectionSource: "source/domains/agents/model-village-art-direction.hsplus"
  residentCount: 6
  adapterAliases: ["adapter_a", "adapter_b", "adapter_c"]
  conditions: ["mixed", "adapter_a_only", "adapter_b_only", "adapter_c_only"]
  appearanceDigestAlgorithm: "sha256_canonical_json"
  appearanceDigestFields: ["residentId", "personaId", "seatId", "researchAlias", "villageRole", "silhouetteId", "glyphId", "accentColor", "roleProp", "neutralSeatMantleId", "appearanceManifestId"]
  researchAppearanceDigestFields: ["residentId", "personaId", "seatId", "researchAlias", "villageRole", "silhouetteId", "glyphId", "accentColor", "roleProp", "neutralSeatMantleId", "appearanceManifestId"]
  publicEmbodimentDigestFields: ["publicEmbodimentId", "publicDisplayName", "familyId", "agentSurfaceId", "modelFamily", "familyEmbodimentManifestId", "familyMantleId", "familyMantlePatternId", "familyMantleGlyphId", "familyMantleAccentColor"]
  forbiddenDigestFields: ["adapterAlias", "provider", "publicEmbodimentId", "publicStoryOrdinal", "publicDisplayName", "familyId", "agentSurfaceId", "modelFamily", "modelRevision", "exactModelRevision", "familyEmbodimentManifestId", "familyMantleId", "familyMantlePatternId", "familyMantleGlyphId", "embodimentBinding", "embodimentBindingReceiptHash", "condition", "performance", "outcome"]
  forbiddenResearchDigestFields: ["adapterAlias", "provider", "publicEmbodimentId", "publicStoryOrdinal", "publicDisplayName", "familyId", "agentSurfaceId", "modelFamily", "modelRevision", "exactModelRevision", "familyEmbodimentManifestId", "familyMantleId", "familyMantlePatternId", "familyMantleGlyphId", "familyMantleAccentColor", "embodimentBinding", "embodimentBindingReceiptHash", "condition", "performance", "outcome"]
  adapterPermutationMustPreserveAppearanceDigest: true
  conditionPermutationMustPreserveAppearanceDigest: true
  publicEmbodimentDigestExcludedFromLivePrompt: true
  publicEmbodimentDigestExcludedFromLiveObservation: true
  publicEmbodimentDigestExcludedFromCanonicalHashes: true
  publicEmbodimentDigestExcludedFromLiveProjection: true
  publicEmbodimentImpliesAdapterAssignment: false
  publicCatalogHasStaticResearchJoin: false
  publicCatalogSerialization: "keyed_by_public_embodiment_id"
  publicCatalogOrderDefinesResearchSeat: false
  publicCatalogOrderDefinesAdapterAssignment: false
  publicMantlePaletteDisjointFromResearchAccentPalette: true
  publicMantleRoleSemanticBinding: "none"
  publicMantlePatternRoleSemanticsAllowed: false
  publicCatalogStaticSpatialBindingsAllowed: false
  publicCatalogRestPosition: [0, 0, 0]
  villageStoryPlacementSource: "public_gallery_layout_manifest"
  postlockPlacementSource: "verified_family_binding_receipt_resident_target"
  publicEmbodimentIdDefinesResearchSeat: false
  publicEmbodimentIdDefinesAdapterAssignment: false
  uniqueSilhouetteRequired: true
  uniqueGlyphRequired: true
  colorAloneSufficient: false
  currentProofStatus: "evaluated_by_hololand_art_direction_checker"
  nativeHsExecutionClaimed: false
}

object "PublicEmbodimentOverlayIsolationGate" {
  type: "model_village_public_embodiment_overlay_isolation_gate"
  source: "source/layers/vr/frontier/model-village/model-village-public-embodiments.holo"
  allowedPresentationProfiles: ["village_story_unblinded", "research_replay_postlock"]
  forbiddenPresentationProfiles: ["research_live_blinded"]
  villageStoryRequirements: ["verified_family_embodiment_manifest", "independent_project_disclosure"]
  postlockReplayRequirements: ["verified_terminal_commitment", "verified_family_binding_receipt", "verified_unblinding_receipt", "verified_family_embodiment_manifest", "independent_project_disclosure", "trusted_signer_verification", "canonical_hash_verification", "receipt_chain_verification", "exact_binding_match", "fail_neutral_mismatch_denial"]
  exactModelRevisionSource: "sealed_run_manifest_only"
  familyEmbodimentMayDefineAdapterAssignment: false
  publicCatalogHasStaticResearchJoin: false
  publicCatalogSerialization: "keyed_by_public_embodiment_id"
  publicCatalogOrderDefinesResearchSeat: false
  publicCatalogOrderDefinesAdapterAssignment: false
  publicMantlePaletteDisjointFromResearchAccentPalette: true
  publicMantleRoleSemanticBinding: "none"
  publicMantlePatternRoleSemanticsAllowed: false
  publicCatalogStaticSpatialBindingsAllowed: false
  publicCatalogRestPosition: [0, 0, 0]
  villageStoryPlacementSource: "public_gallery_layout_manifest"
  postlockPlacementSource: "verified_family_binding_receipt_resident_target"
  postlockResearchJoinSource: "verified_family_binding_receipt_only"
  currentProofStatus: "evaluated_by_hololand_art_direction_checker"
}

object "ResidentAppearanceInvariant01" {
  type: "resident_appearance_invariant"
  residentId: "resident-01"
  personaId: "persona-01"
  seatId: "seat-01"
  researchAlias: "Resident 01"
  neutralSeatMantleId: "neutral-seat-mantle-01"
  appearanceManifestId: "stormglass-appearance-01-v1"
  mixedBlock1Appearance: "stormglass-appearance-01-v1"
  mixedBlock2Appearance: "stormglass-appearance-01-v1"
  mixedBlock3Appearance: "stormglass-appearance-01-v1"
  adapterAOnlyAppearance: "stormglass-appearance-01-v1"
  adapterBOnlyAppearance: "stormglass-appearance-01-v1"
  adapterCOnlyAppearance: "stormglass-appearance-01-v1"
}

object "ResidentAppearanceInvariant02" {
  type: "resident_appearance_invariant"
  residentId: "resident-02"
  personaId: "persona-02"
  seatId: "seat-02"
  researchAlias: "Resident 02"
  neutralSeatMantleId: "neutral-seat-mantle-02"
  appearanceManifestId: "stormglass-appearance-02-v1"
  mixedBlock1Appearance: "stormglass-appearance-02-v1"
  mixedBlock2Appearance: "stormglass-appearance-02-v1"
  mixedBlock3Appearance: "stormglass-appearance-02-v1"
  adapterAOnlyAppearance: "stormglass-appearance-02-v1"
  adapterBOnlyAppearance: "stormglass-appearance-02-v1"
  adapterCOnlyAppearance: "stormglass-appearance-02-v1"
}

object "ResidentAppearanceInvariant03" {
  type: "resident_appearance_invariant"
  residentId: "resident-03"
  personaId: "persona-03"
  seatId: "seat-03"
  researchAlias: "Resident 03"
  neutralSeatMantleId: "neutral-seat-mantle-03"
  appearanceManifestId: "stormglass-appearance-03-v1"
  mixedBlock1Appearance: "stormglass-appearance-03-v1"
  mixedBlock2Appearance: "stormglass-appearance-03-v1"
  mixedBlock3Appearance: "stormglass-appearance-03-v1"
  adapterAOnlyAppearance: "stormglass-appearance-03-v1"
  adapterBOnlyAppearance: "stormglass-appearance-03-v1"
  adapterCOnlyAppearance: "stormglass-appearance-03-v1"
}

object "ResidentAppearanceInvariant04" {
  type: "resident_appearance_invariant"
  residentId: "resident-04"
  personaId: "persona-04"
  seatId: "seat-04"
  researchAlias: "Resident 04"
  neutralSeatMantleId: "neutral-seat-mantle-04"
  appearanceManifestId: "stormglass-appearance-04-v1"
  mixedBlock1Appearance: "stormglass-appearance-04-v1"
  mixedBlock2Appearance: "stormglass-appearance-04-v1"
  mixedBlock3Appearance: "stormglass-appearance-04-v1"
  adapterAOnlyAppearance: "stormglass-appearance-04-v1"
  adapterBOnlyAppearance: "stormglass-appearance-04-v1"
  adapterCOnlyAppearance: "stormglass-appearance-04-v1"
}

object "ResidentAppearanceInvariant05" {
  type: "resident_appearance_invariant"
  residentId: "resident-05"
  personaId: "persona-05"
  seatId: "seat-05"
  researchAlias: "Resident 05"
  neutralSeatMantleId: "neutral-seat-mantle-05"
  appearanceManifestId: "stormglass-appearance-05-v1"
  mixedBlock1Appearance: "stormglass-appearance-05-v1"
  mixedBlock2Appearance: "stormglass-appearance-05-v1"
  mixedBlock3Appearance: "stormglass-appearance-05-v1"
  adapterAOnlyAppearance: "stormglass-appearance-05-v1"
  adapterBOnlyAppearance: "stormglass-appearance-05-v1"
  adapterCOnlyAppearance: "stormglass-appearance-05-v1"
}

object "ResidentAppearanceInvariant06" {
  type: "resident_appearance_invariant"
  residentId: "resident-06"
  personaId: "persona-06"
  seatId: "seat-06"
  researchAlias: "Resident 06"
  neutralSeatMantleId: "neutral-seat-mantle-06"
  appearanceManifestId: "stormglass-appearance-06-v1"
  mixedBlock1Appearance: "stormglass-appearance-06-v1"
  mixedBlock2Appearance: "stormglass-appearance-06-v1"
  mixedBlock3Appearance: "stormglass-appearance-06-v1"
  adapterAOnlyAppearance: "stormglass-appearance-06-v1"
  adapterBOnlyAppearance: "stormglass-appearance-06-v1"
  adapterCOnlyAppearance: "stormglass-appearance-06-v1"
}
