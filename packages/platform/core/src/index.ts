/**
 * @hololand/platform-runtime
 *
 * HoloLand platform runtime: the frame loop, trait wiring, physics safety
 * envelope, hot reload, and cross-validation that turn HoloScript-authored
 * worlds into a running HoloLand.
 *
 * This package deliberately does NOT re-export the HoloScript language surface.
 * Parsers, the runtime, the validator, the debugger and the trait registry all
 * come from @holoscript/core (MIT) - import them from there directly. HoloLand
 * is a consumer of HoloScript, not a gateway to it, and anyone can build their
 * own platform on the same public language packages.
 *
 * Platform code here is Elastic License 2.0.
 */

// =============================================================================
// Hololand Platform (Elastic License 2.0)
// =============================================================================

// Hololand version (platform version, separate from HoloScript language version)
export const HOLOLAND_VERSION = '1.0.0-alpha.1';

// HoloScript-to-World Bridge (connects HoloScript runtime to Hololand world)
export {
  HoloScriptBridge,
  createBridge,
  type BridgeConfig,
  type BridgeState,
} from './HoloScriptBridge';

// Trait Context Factory — creates real TraitContext backed by Hololand runtime APIs
export {
  TraitContextFactory,
  createTraitContextFactory,
  type TraitContextFactoryConfig,
  type PhysicsProvider,
  type AudioProvider,
  type HapticsProvider,
  type AccessibilityProvider,
  type VRProvider,
  type NetworkProvider,
  type RendererProvider,
} from './TraitContextFactory';

// Trait Runtime Integration — wires VRTraitRegistry into Hololand's frame loop
export {
  TraitRuntimeIntegration,
  createTraitRuntime,
  type TrackedNode,
  type TraitRuntimeStats,
} from './TraitRuntimeIntegration';

export * from './HoloScriptBridge';
export * from './TraitContextFactory';
export * from './TraitRuntimeIntegration';
export * from './PlatformRuntime';

// Physics Safety Envelope — immutable platform-level physics bounds
export {
  PHYSICS_SAFETY_ENVELOPE,
  clampSymmetric,
  clampRange,
  vectorMagnitude,
  clampVectorMagnitude,
  enforceLinearVelocity,
  enforceAngularVelocity,
  enforceForce,
  enforceImpulse,
  enforceGravityScale,
  enforceMass,
  enforcePosition,
  validateEnvelope,
  type PhysicsSafetyBounds,
  type ClampEvent,
} from './PhysicsSafetyEnvelope';

export {
  PhysicsSafetyEnforcer,
  createPhysicsSafetyEnforcer,
  wrapWithSafetyEnvelope,
  type ClampEventHandler,
  type PhysicsSafetyEnforcerConfig,
  type SafetyEnforcerStats,
} from './PhysicsSafetyEnforcer';

// Phase 5: Self-Building World — Hot-reload & Git integration
export {
  HoloScriptHotReloader,
  createHotReloader,
  type HotReloaderConfig,
  type FileChange,
  type PatchResult,
  type HotReloaderStats,
} from './HoloScriptHotReloader';

export {
  VRGitIntegration,
  createVRGitIntegration,
  type GitConfig,
  type CommitInfo,
  type GitOperationResult,
  type RollbackResult,
  type SnapshotResult,
} from './VRGitIntegration';

// Cross-Validation Protocol — 3-validator consensus for multi-agent world creation
export {
  // Engine
  CrossValidationEngine,
  createCrossValidationEngine,
  createCustomCrossValidationEngine,
  createStateDelta,
  // Validators
  PhysicsValidator,
  createPhysicsValidator,
  MaterialsValidator,
  createMaterialsValidator,
  SchemaValidator,
  createSchemaValidator,
} from './validation';

export type {
  // Core Types
  ValidatorId,
  ValidationVerdict,
  StateDeltaCategory,
  StateDelta,
  StateDeltaPayload,
  PhysicsDeltaPayload,
  MaterialDeltaPayload,
  TraitDeltaPayload,
  TransformDeltaPayload,
  WorldDeltaPayload,
  CompositeDeltaPayload,
  ValidationResult,
  ValidationViolation,
  ConsensusResult,
  Validator,
  CrossValidationConfig,
  CrossValidationStats,
} from './validation';
