// Model Village MV-B2 live turn scheduler frozen policy manifest.
//
// ENGINEERING TRACER LANE ONLY. These are canonical source declarations for
// the MV-B2 turn scheduler: the frozen concurrency+timeout policy, the frozen
// public snapshot fixture the tracer distributes, and the pre-authorized
// action catalog that admission gating matches against. The resident-to-route
// mapping consumed by the scheduler is openly declared tracer configuration,
// NOT the sealed adapter_a/adapter_b/adapter_c alias assignment. Computed
// hashes belong in verified execution receipts and are deliberately not
// embedded here. The proposal vocabulary is reused BY REFERENCE from the
// MV-B1 custody drill manifest (see vocabularyRef); its values are not
// duplicated here.
object "ModelVillageTurnPolicy" {
  type: "turn_policy"
  schemaId: "hololand.model-village-turn-policy.v1"
  policyId: "mv-b2-turn-policy-v1"
  residentsPerTurn: 6
  turnsPerRun: 1
  concurrencyLimit: 2
  turnTimeoutMs: 90000
  retryCount: 0
  barrierRule: "all-turns-resolved-before-any-adjudication"
  adjudicationDefault: "deny"
  laneStatement: "This turn policy governs the MV-B2 engineering tracer lane only, not the study lane. The resident-to-route mapping consumed by the scheduler is openly declared tracer configuration, NOT the sealed adapter_a/adapter_b/adapter_c alias assignment: no blinded alias assignment is performed, claimed, or receipted under this policy. Live model proposals gate pre-authorized deterministic actions; they never mutate the world directly."
  vocabularyRef: "model-village-adapter-custody-drill.hs#ModelVillageProposalVocabulary"
}

object "ModelVillageTurnSnapshotFixture" {
  type: "turn_snapshot_fixture"
  fixtureId: "mv-b2-turn-snapshot-fixture-v1"
  publicState: "{\"water\": 2}"
  location: "commons"
}

object "ModelVillagePreauthorizedActionCatalog" {
  type: "preauthorized_action_catalog"
  catalogId: "mv-b2-preauthorized-action-catalog-v1"
  action: "contribute_water"
  target: "commons_cistern"
  amount: 1
  sourceLane: "phase0b-v4-deterministic"
  catalogStatement: "Exactly one action is pre-authorized under this catalog: an ADMITTED live proposal that exactly matches action contribute_water on target commons_cistern with amount 1 gates the execution of the frozen phase0b V4 deterministic lane, and canonical world mutation comes only from that lane's verified receipt through the existing atomic admission path. An admitted proposal that does not match this catalog is receipted admitted_no_preauthorized_action and never mutates. A denied proposal never mutates. Live proposals gate; deterministic receipts mutate."
}
