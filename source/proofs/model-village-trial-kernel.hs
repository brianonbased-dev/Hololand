// HoloLand Model Village trial kernel.
// Declarative .hs pipeline source. The current headless runtime materializes
// these nodes but does not yet execute model turns or pipeline actions.

object "ModelVillageTrialKernel" {
  type: "runtime_proof"
  id: "hololand-model-village-trial-kernel"
  version: "0.1.0"
  layer: "vr"
  place: "frontier-model-village"
  domains: ["identity", "agents", "receipts", "economy", "safety"]
  verticals: ["education", "entertainment"]
  surfaces: ["browser", "desktop", "webxr", "headset"]
  requiredReceipts: ["run_manifest", "observation_recorded", "model_turn", "safety_checked", "agent_action", "action_decision", "run_summary"]
  canonicalSource: "source/proofs/model-village-trial-kernel.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village.holo"
  policySource: "source/domains/agents/model-village-experiment.hsplus"
  failClosedBehavior: "freeze_world_without_receipted_action"
  runtimeStatus: "declarative_pipeline_not_yet_executed_by_headless_runtime"
  sourceIsCanonical: true
  bridgeMayValidateAndReceipt: true
  bridgeMayOwnVillageBehavior: false
}

object "ModelVillageStudyMatrix" {
  type: "experiment_design"
  modelAdapters: ["adapter_a", "adapter_b", "adapter_c"]
  residentsPerVillage: 6
  conditions: ["mixed", "adapter_a_only", "adapter_b_only", "adapter_c_only"]
  seedBlocks: [1, 2, 3]
  mixedAllocationPerBlock: [2, 2, 2]
  mixedPersonaRotation: "latin_square"
  unitOfAnalysis: "village_run"
  plannedVillageRuns: 12
  primaryOutcome: "cooperative_event_completion_rate"
  primaryContrast: "mixed_minus_mean_of_homogeneous_conditions"
  estimandScope: "exact_locked_adapter_triplet_persona_protocol_and_challenge_distribution"
  blockContrast: "D_s_equals_Y_mixed_s_minus_mean_Y_a_Y_b_Y_c_within_seed_s"
  challengeWindowsAreWithinRunRepeatedMeasures: true
  residentTurnsAreWithinRunRepeatedMeasures: true
  conditionOrder: "seeded_within_provider_time_block"
  claimClass: "mechanism_pilot_not_confirmatory"
}

object "ModelVillageMixedAssignmentMatrix" {
  type: "frozen_assignment_matrix"
  personasAndSeats: ["persona-01@seat-01", "persona-02@seat-02", "persona-03@seat-03", "persona-04@seat-04", "persona-05@seat-05", "persona-06@seat-06"]
  block1: ["adapter_a", "adapter_a", "adapter_b", "adapter_b", "adapter_c", "adapter_c"]
  block2: ["adapter_b", "adapter_b", "adapter_c", "adapter_c", "adapter_a", "adapter_a"]
  block3: ["adapter_c", "adapter_c", "adapter_a", "adapter_a", "adapter_b", "adapter_b"]
  turnOrder: ["seat-01", "seat-02", "seat-03", "seat-04", "seat-05", "seat-06"]
  counterbalanceClaim: "each_persona_and_seat_receives_each_adapter_once_across_three_blocks"
  matrixHashRequired: true
}

object "ModelVillageConditionOrder" {
  type: "frozen_condition_execution_order"
  block1: ["mixed", "adapter_a_only", "adapter_b_only", "adapter_c_only"]
  block2: ["adapter_b_only", "adapter_c_only", "mixed", "adapter_a_only"]
  block3: ["adapter_c_only", "adapter_b_only", "adapter_a_only", "mixed"]
  providerTimeBatchIdRequired: true
  conditionOrderHashRequired: true
  fullPositionCounterbalanceClaimed: false
}

object "ModelVillageChallengeManifestSchema" {
  type: "challenge_manifest_schema"
  challenges: ["commons_water_shortage", "bridge_repair", "harvest_distribution"]
  eligibleBeforeFirstModelTurn: true
  eligibilityCanChangeAfterTreatment: false
  startStateHashRequired: true
  openTickRequired: true
  deadlineTickRequired: true
  successPredicateRequired: true
  permittedActionTypesRequired: true
  minimumDistinctResidentContributors: 2
  runtimeInvalidChallengeDecision: "mark_run_contaminated_without_removing_denominator"
  instantiatedManifestStatus: "required_before_phase_1"
}

object "ModelVillageAnalysisSet" {
  type: "preregistered_analysis_set"
  startedRunBeginsAt: "sealed_run_manifest"
  dispositionSet: "all_manifest_started_runs"
  primaryAnalysisSet: "integrity_evaluable_manifest_started_runs"
  integrityEligibilityDecidedWithoutOutcomeAccess: true
  nonEvaluableOutcome: "missing_not_zero"
  reportMissingnessAndWorstCaseBounds: true
  contaminationPreserved: true
  silentReplacementAllowed: false
  replacementRequiresNewRunId: true
  eligibilityDecidedWithoutOutcomeAccess: true
  perProtocolSensitivityRequires: ["exact_adapter_revision", "no_fallback", "no_hidden_prompt_augmentation", "complete_receipt_chain", "isolation_intact"]
}

object "ModelVillageEngineeringTracer" {
  type: "engineering_tracer"
  activeResidents: ["resident-01", "resident-02"]
  activeAdapters: ["adapter_a", "adapter_b"]
  ticks: 1
  publicEvents: ["commons_water_shortage"]
  acceptedActionFixture: "resident_01_contributes_water"
  rejectedActionFixture: "resident_02_requests_external_message"
  fixtureStatus: "source_contract_only_not_executed"
  expectedModelTurnsWhenExecutable: 2
  expectedAcceptedActionsWhenExecutable: 1
  expectedRejectedActionsWhenExecutable: 1
  currentModelTurnExecutionTrace: "unavailable"
  currentAgentActionExecutionTrace: "unavailable"
}

// MV-P0 integrity fixture.
//
// This is not a live model run and is not native .hs pipeline execution. The
// HoloLand checker parses these flat HoloScript nodes, executes this single
// captured fixture fail-closed, and receipts the resulting canonical hashes.
// The fixture binds a future observer-toggle acceptance contract to complete
// canonical fields. This bridge run does not execute that on/off toggle.
object "ModelVillageObserverBoundaryFixture" {
  type: "observer_boundary_fixture_manifest"
  fixtureId: "mv-p0-observer-boundary-001"
  runId: "mv-p0-fixture-run-001"
  executionMode: "captured_fixture_replay"
  parser: "HoloScriptCodeParser"
  providerCallsAllowed: false
  nativeHsPipelineExecutionClaimed: false
  nativeHsplusActionExecutionClaimed: false
  observerProjectionMayWrite: false
  logicalClockStartTick: 0
  logicalClockEndTick: 1
  logicalClockStep: 1
  initialPublicStateSnapshotId: "mv-p0-public-state-before"
  finalPublicStateSnapshotId: "mv-p0-public-state-after"
  initialPublicStateSequence: 0
  finalPublicStateSequence: 1
  scheduleOrder: ["mv-p0-schedule-observe", "mv-p0-schedule-admit-01", "mv-p0-schedule-admit-02"]
  observationOrder: ["mv-p0-observation-01", "mv-p0-observation-02", "mv-p0-observation-03", "mv-p0-observation-04", "mv-p0-observation-05", "mv-p0-observation-06"]
  actionReceiptOrder: ["mv-p0-action-01", "mv-p0-action-02"]
  adapterPermutationOrder: ["block1", "block2", "block3"]
  expectedScheduleEntryCount: 3
  expectedObservationCount: 6
  expectedActionReceiptCount: 2
  expectedAdapterPermutationCount: 3
  hashAlgorithm: "sha256_canonical_json"
  actionReceiptChainMode: "sha256_canonical_receipt_with_prior_hash"
  initialActionReceiptRoot: "0000000000000000000000000000000000000000000000000000000000000000"
}

object "ModelVillageObserverBoundaryPublicStateBefore" {
  type: "observer_boundary_public_state_fixture"
  snapshotId: "mv-p0-public-state-before"
  sequence: 0
  logicalTick: 0
  location: "VillageCommons"
  publicEventIds: ["commons_water_shortage"]
  publicResourceId: "commons_water_units"
  publicResourceUnits: 2
  publicNormIds: ["external_messages_denied", "receipted_mutation_required"]
}

object "ModelVillageObserverBoundaryPublicStateAfter" {
  type: "observer_boundary_public_state_fixture"
  snapshotId: "mv-p0-public-state-after"
  sequence: 1
  logicalTick: 1
  location: "VillageCommons"
  publicEventIds: ["commons_water_shortage", "resident_01_contributed_water"]
  publicResourceId: "commons_water_units"
  publicResourceUnits: 3
  publicNormIds: ["external_messages_denied", "receipted_mutation_required"]
}

object "ModelVillageObserverBoundaryObservation01" {
  type: "observer_boundary_observation_fixture"
  observationId: "mv-p0-observation-01"
  order: 1
  runId: "mv-p0-fixture-run-001"
  tick: 0
  residentId: "resident-01"
  location: "VillageCommons"
  visibleEventIds: ["commons_water_shortage"]
  publicStateSnapshotId: "mv-p0-public-state-before"
  boundedMemoryIds: []
  peerPrivateMemoryIncluded: false
  sealedModelIdentityIncluded: false
  observerProjectionIncluded: false
}

object "ModelVillageObserverBoundaryObservation02" {
  type: "observer_boundary_observation_fixture"
  observationId: "mv-p0-observation-02"
  order: 2
  runId: "mv-p0-fixture-run-001"
  tick: 0
  residentId: "resident-02"
  location: "VillageCommons"
  visibleEventIds: ["commons_water_shortage"]
  publicStateSnapshotId: "mv-p0-public-state-before"
  boundedMemoryIds: []
  peerPrivateMemoryIncluded: false
  sealedModelIdentityIncluded: false
  observerProjectionIncluded: false
}

object "ModelVillageObserverBoundaryObservation03" {
  type: "observer_boundary_observation_fixture"
  observationId: "mv-p0-observation-03"
  order: 3
  runId: "mv-p0-fixture-run-001"
  tick: 0
  residentId: "resident-03"
  location: "VillageCommons"
  visibleEventIds: ["commons_water_shortage"]
  publicStateSnapshotId: "mv-p0-public-state-before"
  boundedMemoryIds: []
  peerPrivateMemoryIncluded: false
  sealedModelIdentityIncluded: false
  observerProjectionIncluded: false
}

object "ModelVillageObserverBoundaryObservation04" {
  type: "observer_boundary_observation_fixture"
  observationId: "mv-p0-observation-04"
  order: 4
  runId: "mv-p0-fixture-run-001"
  tick: 0
  residentId: "resident-04"
  location: "VillageCommons"
  visibleEventIds: ["commons_water_shortage"]
  publicStateSnapshotId: "mv-p0-public-state-before"
  boundedMemoryIds: []
  peerPrivateMemoryIncluded: false
  sealedModelIdentityIncluded: false
  observerProjectionIncluded: false
}

object "ModelVillageObserverBoundaryObservation05" {
  type: "observer_boundary_observation_fixture"
  observationId: "mv-p0-observation-05"
  order: 5
  runId: "mv-p0-fixture-run-001"
  tick: 0
  residentId: "resident-05"
  location: "VillageCommons"
  visibleEventIds: ["commons_water_shortage"]
  publicStateSnapshotId: "mv-p0-public-state-before"
  boundedMemoryIds: []
  peerPrivateMemoryIncluded: false
  sealedModelIdentityIncluded: false
  observerProjectionIncluded: false
}

object "ModelVillageObserverBoundaryObservation06" {
  type: "observer_boundary_observation_fixture"
  observationId: "mv-p0-observation-06"
  order: 6
  runId: "mv-p0-fixture-run-001"
  tick: 0
  residentId: "resident-06"
  location: "VillageCommons"
  visibleEventIds: ["commons_water_shortage"]
  publicStateSnapshotId: "mv-p0-public-state-before"
  boundedMemoryIds: []
  peerPrivateMemoryIncluded: false
  sealedModelIdentityIncluded: false
  observerProjectionIncluded: false
}

object "ModelVillageObserverBoundaryAction01" {
  type: "observer_boundary_action_receipt_fixture"
  receiptId: "mv-p0-action-01"
  sequence: 1
  runId: "mv-p0-fixture-run-001"
  tick: 1
  residentId: "resident-01"
  proposal: "contribute_water:commons_cistern:1"
  turnOpportunityId: "mv-p0-turn-resident-01"
  authorizationNonce: "mv-p0-auth-01"
  authorizationSequence: 1
  safetyReceiptId: "mv-p0-safety-01"
  actionDecisionReceiptId: "mv-p0-decision-01"
  admissionDecision: "allow"
  action: "contribute_water"
  target: "commons_cistern"
  outcome: "public_water_units_increased_by_1"
  rejectionReason: ""
  preStateSnapshotId: "mv-p0-public-state-before"
  postStateSnapshotId: "mv-p0-public-state-after"
  rollbackReference: "mv-p0-public-state-before"
  playerVisibleImpact: true
  allowed: true
}

object "ModelVillageObserverBoundaryAction02" {
  type: "observer_boundary_action_receipt_fixture"
  receiptId: "mv-p0-action-02"
  sequence: 2
  runId: "mv-p0-fixture-run-001"
  tick: 1
  residentId: "resident-02"
  proposal: "send_external_message:outside_village"
  turnOpportunityId: "mv-p0-turn-resident-02"
  authorizationNonce: "mv-p0-auth-02"
  authorizationSequence: 2
  safetyReceiptId: "mv-p0-safety-02"
  actionDecisionReceiptId: "mv-p0-decision-02"
  admissionDecision: "deny"
  action: "send_external_message"
  target: "outside_village"
  outcome: "blocked_without_world_mutation"
  rejectionReason: "external_side_effect_denied"
  preStateSnapshotId: "mv-p0-public-state-after"
  postStateSnapshotId: "mv-p0-public-state-after"
  rollbackReference: "mv-p0-public-state-after"
  playerVisibleImpact: false
  allowed: false
}

object "ModelVillageObserverBoundaryScheduleObserve" {
  type: "observer_boundary_schedule_entry"
  scheduleEntryId: "mv-p0-schedule-observe"
  order: 1
  tick: 0
  phase: "observation_barrier"
  operation: "project_resident_observations"
  targetIds: ["mv-p0-observation-01", "mv-p0-observation-02", "mv-p0-observation-03", "mv-p0-observation-04", "mv-p0-observation-05", "mv-p0-observation-06"]
  barrierId: "mv-p0-proposal-barrier"
}

object "ModelVillageObserverBoundaryScheduleAdmit01" {
  type: "observer_boundary_schedule_entry"
  scheduleEntryId: "mv-p0-schedule-admit-01"
  order: 2
  tick: 1
  phase: "action_admission"
  operation: "seal_action_receipt"
  targetIds: ["mv-p0-action-01"]
  barrierId: "mv-p0-proposal-barrier"
}

object "ModelVillageObserverBoundaryScheduleAdmit02" {
  type: "observer_boundary_schedule_entry"
  scheduleEntryId: "mv-p0-schedule-admit-02"
  order: 3
  tick: 1
  phase: "action_admission"
  operation: "seal_action_receipt"
  targetIds: ["mv-p0-action-02"]
  barrierId: "mv-p0-proposal-barrier"
}

object "ModelVillageEmergencyStopBinding" {
  type: "cross_composition_action_binding_contract"
  worldRequestAction: "request_experiment_freeze"
  policyTargetAction: "freeze_run"
  expectedTransition: "emergency_stop_request_triggers_policy_runtime_freeze"
  currentBindingStatus: "target_not_observed"
  requiredBeforePhase1: true
}

object "ModelVillagePhase1TrustBindings" {
  type: "phase_1_runtime_trust_binding_contract"
  trustedManifestValidatorBinding: "target_not_observed"
  trustedValidatorConfigMayBeSetByCompositionAction: false
  authorizationReplayDefense: "monotonic_turn_opportunity_nonce_and_sequence_contract"
  receiptedMutationTransactionBinding: "target_not_observed"
  requiredBeforePhase1: true
}

object "ValidateSourcesStep" {
  type: "pipeline_step"
  order: 1
  action: "parse_holo_hsplus_and_hs_sources"
  mutationClass: "none"
  inputs: ["source/layers/vr/frontier/model-village/model-village.holo", "source/domains/agents/model-village-experiment.hsplus", "source/proofs/model-village-trial-kernel.hs"]
  output: "SourceValidationReceipt"
}

object "FreezeRunManifestStep" {
  type: "pipeline_step"
  order: 2
  action: "freeze_source_adapter_affordance_and_safety_hashes"
  mutationClass: "none"
  fallbackAllowed: false
  promptEnhancementAllowed: false
  freezes: ["challenge_manifest", "metric_spec", "assignment_matrix", "condition_order", "adapter_request_serializers", "budget_ceilings"]
  output: "RunManifestReceipt"
}

object "CloneWorldStep" {
  type: "pipeline_step"
  order: 3
  action: "clone_identical_sandboxed_village_from_world_source"
  mutationClass: "sandbox_clone"
  crossRunMemoryAllowed: false
  crossVillageCommunicationAllowed: false
  output: "WorldCloneReceipt"
}

object "AssignResidentSeatsStep" {
  type: "pipeline_step"
  order: 4
  action: "assign_blinded_model_aliases_and_rotate_personas"
  mutationClass: "manifest_only"
  assignmentAlgorithm: "seeded_latin_square"
  assignmentMatrixHashRequired: true
  everyPersonaAndSeatReceivesEveryAdapterOnce: true
  modelIdentityVisibleToResidents: false
  output: "ResidentAssignmentReceipt"
}

object "BuildTurnScheduleStep" {
  type: "pipeline_step"
  order: 5
  action: "build_deterministic_world_event_and_turn_schedule"
  mutationClass: "none"
  worldSeedRequired: true
  deterministicClockRequired: true
  allResidentsObserveSamePublicSnapshotBeforeProposalRound: true
  proposalCollectionBarrierRequired: true
  admissionOrderSeededAfterProposalBarrier: true
  conditionOrderSeededWithinProviderTimeBlock: true
  modelSamplingDeterminismClaimed: false
  output: "TurnScheduleReceipt"
}

object "ObservePublicWorldStep" {
  type: "pipeline_step"
  order: 6
  action: "project_public_world_state_and_bounded_memory"
  mutationClass: "none"
  privatePeerMemoryIncluded: false
  sealedModelIdentityIncluded: false
  output: "ObservationEnvelope"
}

object "InvokeLockedModelAdapterStep" {
  type: "pipeline_step"
  order: 7
  action: "invoke_locked_model_adapter_once_per_resident_tick"
  mutationClass: "inference_only"
  forceProviderRequired: true
  fallbackAllowed: false
  promptEnhancementAllowed: false
  samplingSeedEvidenceRequired: true
  capturedResponseRequired: true
  output: "ModelTurnReceipt"
  currentRuntimeSupport: "target_not_observed"
}

object "ValidateActionProposalStep" {
  type: "pipeline_step"
  order: 8
  action: "validate_single_proposal_against_shared_action_vocabulary"
  mutationClass: "none"
  malformedProposalDecision: "reject"
  externalSideEffectDecision: "reject"
  output: "ActionDecisionReceipt"
  currentRuntimeSupport: "target_not_observed"
}

object "ApplyReceiptedMutationStep" {
  type: "pipeline_step"
  order: 9
  action: "snapshot_apply_or_block_and_attach_rollback_reference"
  mutationClass: "sandbox_world_state"
  preMutationSnapshotRequired: true
  receiptRequired: true
  rollbackReferenceRequired: true
  mutationWithoutReceipt: "deny"
  output: "ModelVillageActionReceipt"
  currentRuntimeSupport: "target_not_observed"
}

object "ReplayCapturedResponsesStep" {
  type: "pipeline_step"
  order: 10
  action: "replay_captured_model_responses_without_reinference"
  mutationClass: "sandbox_replay"
  compares: ["ordered_action_decisions", "post_state_hashes", "receipt_chain_root"]
  wallClockFieldsExcludedFromCanonicalHash: true
  output: "CapturedResponseReplayReceipt"
  currentRuntimeSupport: "target_not_observed"
}

object "SummarizeVillageRunStep" {
  type: "pipeline_step"
  order: 11
  action: "aggregate_preregistered_metrics_at_village_run_level"
  mutationClass: "none"
  primaryMetricFormula: "completed_cooperative_events_divided_by_eligible_cooperative_events"
  blockContrastFormula: "D_s_equals_Y_mixed_s_minus_mean_Y_a_Y_b_Y_c"
  pilotReport: "three_D_s_values_plus_descriptive_mean_and_range"
  residentTurnOrChallengeRowsCountAsIndependentN: false
  secondaryMetrics: ["proposal_rate", "abstention_rate", "valid_action_rate", "safety_block_rate", "reciprocity_rate", "interaction_dominance", "accepted_action_type_diversity", "receipt_completeness", "captured_response_replay_success", "route_contamination_count"]
  exploratoryMetrics: ["persona_retention_score"]
  diagnosticMetrics: ["tokens", "latency", "cost"]
  output: "RunSummaryReceipt"
  currentRuntimeSupport: "target_not_observed"
}

object "SealClaimBoundaryStep" {
  type: "pipeline_step"
  order: 12
  action: "separate_observed_runtime_evidence_from_target_capabilities"
  mutationClass: "none"
  observedNow: ["source_parse", "headless_world_materialization", "canonical_scene_replay"]
  targetNotObserved: ["live_model_turns", "action_entrypoint_execution", "trusted_manifest_validator_binding", "receipted_mutation_transaction", "cross_composition_emergency_stop_binding", "state_snapshot_replay", "scientific_outcomes"]
  scientificOutcomeClaimed: false
  output: "ModelVillageCapabilityReceipt"
}
