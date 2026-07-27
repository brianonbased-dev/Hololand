// Model Village STUDY-LANE turn policy manifest (mv-study-policy-v1).
//
// WHY THIS FILE EXISTS AS A NEW SOURCE RATHER THAN A PATCH.
// source/proofs/model-village-turn-policy.hs (mv-b2-turn-policy-v1) is FROZEN
// and its receipts are live evidence. Its laneStatement freezes the sentence
// "no blinded alias assignment is performed, claimed, or receipted under this
// policy", and scripts/model-village-turn-scheduler.mjs ENFORCES that the
// statement says so at manifest load. MV-B2's policy is therefore structurally
// SEALED AGAINST the MV-B3 sealed alias vault: no edit to that file could admit
// a blinded study run without invalidating the evidence it already carries.
// This manifest is the inverse policy — it REQUIRES sealed alias assignment —
// and the two are mutually inadmissible on purpose. A run is governed by
// exactly one of them.
//
// AUTHORING CONVENTIONS are inherited from mv-b2-turn-policy-v1: flat scalars,
// escaped-JSON strings for structures, no computed hashes embedded here
// (computed hashes belong in verified execution receipts), and the proposal
// vocabulary reused BY REFERENCE from the MV-B1 custody drill manifest via
// vocabularyRef — its values are never duplicated here.
//
// LANE SCOPE. This manifest declares STUDY-LANE policy DATA. Declaring it is
// not executing it: a run under this policy is a live study run only when it
// is executed against certified live adapters under the frozen study calendar.
// scripts/model-village-run-conductor.mjs executes this policy against
// CAPTURED responses with zero provider calls (the T-7 dress rehearsal in
// docs/specs/HOLOLAND_MODEL_VILLAGE_PRODUCTION_PLAN.md line 726), and its
// receipt pins liveStudyRunClaimed false.
object "ModelVillageStudyPolicy" {
  type: "study_turn_policy"
  schemaId: "hololand.model-village-study-policy.v1"
  policyId: "mv-study-policy-v1"
  residentsPerTurn: 6
  turnsPerRun: 6
  concurrencyLimit: 2
  turnTimeoutMs: 90000
  retryCount: 0
  barrierRule: "all-turns-resolved-before-any-adjudication"
  adjudicationDefault: "deny"
  laneStatement: "This turn policy governs the Model Village STUDY lane, not the MV-B2 engineering tracer lane. Sealed alias assignment is REQUIRED under this policy: every resident seat is bound to an adapter alias through the sealed MV-B3 alias-assignment vault, and no resident-to-route mapping may be declared openly, published, or receipted under this policy. That requirement is the exact inverse of mv-b2-turn-policy-v1, whose own laneStatement freezes the ABSENCE of blinded alias assignment for the engineering tracer lane; a run admissible under this policy is inadmissible under that one, and the reverse, by construction. Live model proposals gate pre-authorized deterministic actions; they never mutate the world directly."
  vocabularyRef: "model-village-adapter-custody-drill.hs#ModelVillageProposalVocabulary"
  conditionOrderRef: "model-village-trial-kernel.hs#ModelVillageConditionOrder"
  assignmentMatrixRef: "model-village-trial-kernel.hs#ModelVillageStudyMatrix"
}

object "ModelVillageStudyBlockOrder" {
  type: "study_block_order"
  orderId: "mv-study-block-order-v1"
  seedBlockCount: 3
  conditionsPerBlock: 4
  villageRunCount: 12
  block1: "[\"mixed\", \"adapter_a_only\", \"adapter_b_only\", \"adapter_c_only\"]"
  block2: "[\"adapter_b_only\", \"adapter_c_only\", \"mixed\", \"adapter_a_only\"]"
  block3: "[\"adapter_c_only\", \"adapter_b_only\", \"adapter_a_only\", \"mixed\"]"
  orderStatement: "The three block orders restate the frozen condition order in docs/specs/HOLOLAND_MODEL_VILLAGE_PRODUCTION_PLAN.md lines 735-739 (block1 mixed -> A -> B -> C, block2 B -> C -> mixed -> A, block3 C -> B -> A -> mixed). They are DERIVED evidence, never an independent authority: the loader re-reads ModelVillageConditionOrder from the frozen trial kernel and REFUSES to load this manifest if the two disagree, so this restatement can never silently drift away from the kernel it mirrors. Three seed blocks of four conditions is twelve village-runs, one four-condition seed block per day in the frozen order and the same UTC window."
  dayOneBlockId: "block1"
  dayTwoBlockId: "block2"
  dayThreeBlockId: "block3"
}

object "ModelVillageStudySnapshotFixture" {
  type: "study_snapshot_fixture"
  fixtureId: "mv-study-snapshot-fixture-v1"
  publicState: "{\"water\": 2}"
  location: "commons"
}

object "ModelVillageStudyPreauthorizedActionCatalog" {
  type: "study_preauthorized_action_catalog"
  catalogId: "mv-study-preauthorized-action-catalog-v1"
  primaryAction: "contribute_water"
  primaryTarget: "commons_cistern"
  primaryAmount: 1
  sourceLane: "phase0b-v4-deterministic"
  actions: "[{\"action\": \"contribute_water\", \"target\": \"commons_cistern\", \"amount\": 1, \"effect\": \"gates_deterministic_lane\"}, {\"action\": \"abstain\", \"target\": null, \"amount\": null, \"effect\": \"admitted_no_preauthorized_action_no_mutation\"}]"
  catalogStatement: "Two actions are pre-authorized under this catalog, both drawn from the MV-B1 proposal vocabulary referenced by vocabularyRef. An ADMITTED live proposal matching contribute_water on commons_cistern with amount 1 gates the execution of the frozen phase0b V4 deterministic lane, and canonical world mutation comes only from that lane's verified receipt through the existing atomic admission path. An ADMITTED abstain is the deny case: it is receipted admitted_no_preauthorized_action and never mutates. A denied proposal never mutates. Live proposals gate; deterministic receipts mutate. STATED HONESTLY, because it bounds every behavioral claim a study run under this policy can make: catalog width is exactly how much of a resident's behavior can reach the world under the v4 receipt family. A resident whose proposal is outside this catalog is receipted and discarded, so a run under this policy measures which of two frozen outcomes a resident selects, not what a resident would freely do. A truly open outcome requires the open-outcome receipt tier (idea-seeds/2026-07-26-open-outcome-receipt-tier.md), which does not exist yet; until it does, widening this catalog widens the choice set but never removes the frozen-outcome bound. FURTHER LIMIT, observed in the executing scheduler rather than asserted: scripts/model-village-turn-scheduler.mjs matches preauthorizedMatch against a SINGLE catalog action, so only the primary entry above can ever set preauthorizedMatch true. The abstain entry needs no scheduler support because it is non-mutating by definition, but a future third mutating entry would require the scheduler's match rule to become set-valued before this catalog's width became real."
}
