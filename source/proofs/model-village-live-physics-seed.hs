// MV-S3 flat deterministic seed manifest.
//
// .hs carries only portable data: fixed inputs, particle lattice recipes,
// fluid boundaries, and rigid bodies. No wall clock, browser state, model
// output, village receipt, or resident observation is an input.

object ModelVillageLivePhysicsSeed {
  type: "model_village_live_physics_seed_manifest"
  schema: "hololand.model-village.live-physics-seed.v1"
  milestone: "MV-S3"
  source: "source/proofs/model-village-live-physics-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-live-weather-fluid-physics.holo"
  policySource: "source/proofs/model-village-live-physics-contract.hsplus"
  deterministicSeed: 641031
  fixedTimestepNumerator: 1
  fixedTimestepDenominator: 120
  fixedSteps: 360
  replayRuns: 3
  domainOrder: ["fluid_sph", "cloth_pbd", "rigid_collision"]
  forbiddenInputClasses: ["wall_clock", "browser_frame_delta", "model_output", "village_receipt", "resident_observation"]
}

object CisternFluidSeed {
  type: "fluid_particle_lattice_seed"
  targetObjectId: "CisternSPH"
  shape: "rectilinear_lattice"
  columns: 6
  rows: 4
  layers: 4
  particleCount: 96
  origin: [-3.1, 1.1, -0.18]
  spacing: [0.22, 0.18, 0.22]
  initialVelocity: [0.34, 0.0, 0.08]
  jitterMode: "seeded_xorshift32"
  jitterAmplitude: 0.008
  order: "layer_row_column"
}

object CisternFluidBoundary {
  type: "fluid_boundary_fixture"
  targetObjectId: "CisternSPH"
  boundaryType: "box"
  position: [-2.55, 1.0, 0.15]
  boxSize: [2.9, 1.55, 1.95]
  restitution: 0.12
  semantics: "enclosing_volume"
}

object StormglassCollisionPlinthSeed {
  type: "rigid_body_fixture"
  bodyId: "mv-s3-collision-plinth"
  visualObjectId: "StormglassCollisionPlinth"
  bodyType: "static"
  colliderShape: "box"
  position: [2.35, 0.3, 0.8]
  scale: [2.2, 0.6, 2.2]
  mass: 0
  restitution: 0.08
  linearDamping: 0
  angularDamping: 0
  registrationMethod: "PhysicsWorld.addBodyWithConfig"
}

object StormglassCollisionOrbSeed {
  type: "rigid_body_fixture"
  bodyId: "mv-s3-collision-orb"
  visualObjectId: "StormglassCollisionOrb"
  bodyType: "dynamic"
  colliderShape: "sphere"
  radius: 0.33
  position: [2.35, 5.2, 0.8]
  scale: [0.66, 0.66, 0.66]
  mass: 1
  restitution: 0.18
  linearDamping: 0.06
  angularDamping: 0.06
  registrationMethod: "PhysicsWorld.addBodyWithConfig"
}

object LivePhysicsSeedAcceptanceGate {
  type: "model_village_live_physics_seed_gate"
  expectedFluidParticleCount: 96
  expectedClothParticleCount: 140
  expectedRigidBodyCount: 2
  expectedDynamicRigidBodyCount: 1
  expectedStaticRigidBodyCount: 1
  exactParticleOrderRequired: true
  exactBodyOrderRequired: true
  finiteNumbersRequired: true
  duplicateBodyIdBehavior: "throw_before_registration"
  crossLaneInputsAllowed: false
}
