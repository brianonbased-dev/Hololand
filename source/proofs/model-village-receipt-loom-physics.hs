// Model Village Receipt Loom physics and replay manifest.
//
// Flat declarative .hs source keeps the fixture contract portable across the
// TypeScript and native parser lanes. The HoloLand bridge executes only the
// bounded proof described here and emits a receipt.

object ModelVillageReceiptLoomPhysics {
  type: "model_village_physics_replay_manifest"
  id: "model-village-receipt-loom-physics-v1"
  version: "0.1.0"
  source: "source/proofs/model-village-receipt-loom-physics.hs"
  canonicalWorldSource: "source/layers/vr/frontier/model-village/model-village.holo"
  observerProjectionSource: "source/layers/vr/frontier/model-village/model-village-observer-projection.holo"
  observerPolicySource: "source/domains/agents/model-village-observer-witness.hsplus"
  fixedTimestepNumerator: 1
  fixedTimestepDenominator: 60
  fixedSteps: 600
  replayRuns: 3
  solverIterations: 10
  gravity: [0, -9.81, 0]
  engine: "HoloScript PhysicsWorld backed by PhysicsWorldImpl"
  registrationMethod: "PhysicsWorld.addBodyWithConfig"
  duplicateBodyIdBehavior: "throw_before_registration"
  bodyOrder: ["admitted-catch-floor", "blocked-catch-floor", "token-mv-p10-admitted-001", "token-mv-p10-blocked-001"]
  fixtureOrder: ["valid-admitted", "valid-blocked", "missing-receipt", "tampered-receipt", "duplicate-admitted-receipt"]
  requiredFailDarkFixtureIds: ["missing-receipt", "tampered-receipt", "duplicate-admitted-receipt"]
  requiredDigests: ["ordered_contact", "per_step_sleep", "final_transform"]
  excludedDigestFields: ["collision_timestamp", "wall_clock", "solver_timing", "render_timing"]
  numericCanonicalization: "finite_numbers_normalize_negative_zero_no_quantization"
  dynamicColliderShape: "sphere"
  staticColliderShape: "box"
  supportedClaim: "deterministic_cpu_sphere_collider_receipt_tracer_on_named_local_build"
  unsupportedClaims: ["box_token_colliders", "stacking", "collision_friction", "ccd", "cross_hardware_determinism", "gpu_physics", "webgpu_physics"]
}

object AdmittedCatchFloorBody {
  type: "rigid_body_fixture"
  bodyId: "admitted-catch-floor"
  visualObjectId: "AdmittedCatchFloor"
  route: "admitted"
  bodyType: "static"
  colliderShape: "box"
  position: [-3.0, 0.22, 0]
  scale: [1.7, 0.44, 1.7]
  mass: 0
  restitution: 0
  registrationMethod: "PhysicsWorld.addBodyWithConfig"
}

object BlockedCatchFloorBody {
  type: "rigid_body_fixture"
  bodyId: "blocked-catch-floor"
  visualObjectId: "BlockedCatchFloor"
  route: "blocked"
  bodyType: "static"
  colliderShape: "box"
  position: [3.0, 0.22, 0]
  scale: [1.7, 0.44, 1.7]
  mass: 0
  restitution: 0
  registrationMethod: "PhysicsWorld.addBodyWithConfig"
}

object AdmittedReceiptTokenBody {
  type: "rigid_body_fixture"
  bodyId: "token-mv-p10-admitted-001"
  visualObjectId: "AdmittedTokenPrototype"
  receiptId: "mv-p10-admitted-001"
  route: "admitted"
  bodyType: "dynamic"
  colliderShape: "sphere"
  radius: 0.32
  position: [-3.0, 5.15, 0]
  scale: [0.64, 0.64, 0.64]
  mass: 1
  restitution: 0.12
  linearDamping: 0.08
  angularDamping: 0.08
  registrationMethod: "PhysicsWorld.addBodyWithConfig"
}

object BlockedReceiptTokenBody {
  type: "rigid_body_fixture"
  bodyId: "token-mv-p10-blocked-001"
  visualObjectId: "BlockedTokenPrototype"
  receiptId: "mv-p10-blocked-001"
  route: "blocked"
  bodyType: "dynamic"
  colliderShape: "sphere"
  radius: 0.32
  position: [3.0, 5.85, 0]
  scale: [0.64, 0.64, 0.64]
  mass: 1
  restitution: 0.08
  linearDamping: 0.08
  angularDamping: 0.08
  registrationMethod: "PhysicsWorld.addBodyWithConfig"
}

object ValidAdmittedReceiptFixture {
  type: "observer_receipt_fixture"
  fixtureId: "valid-admitted"
  receiptId: "mv-p10-admitted-001"
  receiptPresent: true
  signatureVerified: true
  sourceActionHashMatches: true
  decision: "admitted"
  expectedRelease: true
  expectedRoute: "admitted"
}

object ValidBlockedReceiptFixture {
  type: "observer_receipt_fixture"
  fixtureId: "valid-blocked"
  receiptId: "mv-p10-blocked-001"
  receiptPresent: true
  signatureVerified: true
  sourceActionHashMatches: true
  decision: "blocked"
  expectedRelease: true
  expectedRoute: "blocked"
}

object MissingReceiptFixture {
  type: "observer_receipt_fixture"
  fixtureId: "missing-receipt"
  receiptId: "mv-p10-missing-001"
  receiptPresent: false
  signatureVerified: false
  sourceActionHashMatches: false
  decision: "admitted"
  expectedRelease: false
  expectedRoute: "dark"
}

object TamperedReceiptFixture {
  type: "observer_receipt_fixture"
  fixtureId: "tampered-receipt"
  receiptId: "mv-p10-tampered-001"
  receiptPresent: true
  signatureVerified: false
  sourceActionHashMatches: false
  tamperField: "projectionSourceHash"
  decision: "blocked"
  expectedRelease: false
  expectedRoute: "dark"
}

object DuplicateAdmittedReceiptFixture {
  type: "observer_receipt_fixture"
  fixtureId: "duplicate-admitted-receipt"
  receiptId: "mv-p10-admitted-001"
  receiptPresent: true
  signatureVerified: true
  sourceActionHashMatches: true
  decision: "admitted"
  expectedRelease: false
  expectedRoute: "dark"
  duplicateOfFixtureId: "valid-admitted"
}

object ModelVillagePhysicsReplayGate {
  type: "physics_replay_acceptance_gate"
  sameSourceAndFixtureRequired: true
  orderedContactDigestMustMatch: true
  perStepSleepDigestMustMatch: true
  finalTransformDigestMustMatch: true
  allReleasedBodiesMustSleep: true
  allFinalNumbersMustBeFinite: true
  missingAndTamperedReleaseCount: 0
  expectedReleasedTokenCount: 2
  canonicalExperimentMutationAllowed: false
  residentObservationMutationAllowed: false
}
