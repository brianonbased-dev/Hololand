// Model Village resident appearance-invariance manifest.
//
// Declarative .hs source makes the adapter-permutation proof portable. The
// HoloLand art-direction checker parses these objects, recomputes appearance
// digests from the canonical resident-kit fields, and fails if any adapter or
// condition changes a resident's presentation identity.

object "ModelVillageAppearanceInvarianceGate" {
  type: "model_village_appearance_invariance_gate"
  version: "1.0.0"
  source: "source/proofs/model-village-appearance-invariance.hs"
  residentKitSource: "source/layers/vr/frontier/model-village/model-village-resident-kit.holo"
  artDirectionSource: "source/domains/agents/model-village-art-direction.hsplus"
  residentCount: 6
  adapterAliases: ["adapter_a", "adapter_b", "adapter_c"]
  conditions: ["mixed", "adapter_a_only", "adapter_b_only", "adapter_c_only"]
  appearanceDigestAlgorithm: "sha256_canonical_json"
  appearanceDigestFields: ["residentId", "personaId", "seatId", "displayName", "villageRole", "silhouetteId", "glyphId", "accentColor", "roleProp", "appearanceManifestId"]
  forbiddenDigestFields: ["adapterAlias", "provider", "modelFamily", "modelRevision", "condition", "performance", "outcome"]
  adapterPermutationMustPreserveAppearanceDigest: true
  conditionPermutationMustPreserveAppearanceDigest: true
  uniqueSilhouetteRequired: true
  uniqueGlyphRequired: true
  colorAloneSufficient: false
  currentProofStatus: "evaluated_by_hololand_art_direction_checker"
  nativeHsExecutionClaimed: false
}

object "ResidentAppearanceInvariant01" {
  type: "resident_appearance_invariant"
  residentId: "resident-01"
  personaId: "persona-01"
  seatId: "seat-01"
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
  appearanceManifestId: "stormglass-appearance-06-v1"
  mixedBlock1Appearance: "stormglass-appearance-06-v1"
  mixedBlock2Appearance: "stormglass-appearance-06-v1"
  mixedBlock3Appearance: "stormglass-appearance-06-v1"
  adapterAOnlyAppearance: "stormglass-appearance-06-v1"
  adapterBOnlyAppearance: "stormglass-appearance-06-v1"
  adapterCOnlyAppearance: "stormglass-appearance-06-v1"
}
