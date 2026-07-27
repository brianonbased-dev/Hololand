/* global Buffer, URL, process, structuredClone */

// Model Village RUN CONDUCTOR — the T-7 twelve-run dress rehearsal.
//
// docs/specs/HOLOLAND_MODEL_VILLAGE_PRODUCTION_PLAN.md line 726 requires, at
// T-7: "Complete a full twelve-run dress rehearsal using captured responses and
// zero provider calls." This module executes the run-day lifecycle (plan lines
// 764-782) twelve times — three seed blocks of four conditions in the frozen
// order (plan lines 735-739) — against CAPTURED responses read back out of
// sealed custody, with a measured provider-call count of zero.
//
// The rehearsal needs no live models and no open-outcome receipt tier: replayed
// captures make the final state predetermined, so the run is sealable by the
// EXISTING v4 receipt family. That is precisely why it is the cheapest
// falsification available to this lane, and why it is the first thing that
// should have been built.
//
// ===========================================================================
// WHAT THIS MODULE IS FOR: composing five slices that were islands
// ===========================================================================
// MV-B1 model-turn receipt shape + proposal vocabulary  (adapter runtime)
// MV-B2 turn scheduler + per-run isolation              (scheduler + bridge)
// MV-B3 sealed alias-assignment vault                   (alias vault)
// MV-B4 validator custody + trust registry publication  (custody + registry)
// MV-B5 conductor (this file)                           the run that executes
//
// Before this file, model-village-alias-vault.mjs and
// model-village-trust-registry.mjs had ZERO production consumers — only their
// own checkers and tests imported them. This module is their first consumer,
// and it consumes them on the executing path, not in an assertion.
//
// ===========================================================================
// THE THREE-LAYER EXECUTOR CONTRACT (the structural conflict, resolved)
// ===========================================================================
// MV-B2's createTurnScheduler and MV-B3's captureResponseUnderCustody BOTH
// claim the `turnExecutor` slot on MV-B1's executeCertifiedModelTurn. They
// cannot both hold it: the scheduler injects an executor per resident per
// round, while the capture lane wraps an executor to seal what it returns.
// Resolved here explicitly, with the conductor owning the slot:
//
//   Layer 1 — SHAPE is MV-B1's.   The replay executor returns a receipt that
//             satisfies verifyModelTurnReceipt unchanged: same 22 closed keys,
//             same schema, same engine pin, same zero-retry rule, same bounded
//             parsedProposal projection produced by MV-B1's exported
//             parseProposal over MV-B1's `.hs` vocabulary. Nothing about the
//             receipt contract is re-authored here.
//   Layer 2 — BYTES are MV-B3's.  The response bytes are read back OUT of the
//             run's sealed custody store by custodyId on every single turn
//             (custodyStore.readObject), never from an in-memory copy, and the
//             plaintext is re-hashed against the pinned responseHash before it
//             is parsed. That is a genuine custody round-trip, which is
//             exactly what MV-B3's capture lane exists to make possible.
//   Layer 3 — SLOT is MV-B2's, filled by the conductor. The scheduler keeps
//             every guarantee it enforces (frozen snapshot, bounded
//             concurrency, dispatch-relative deadline, zero retry, proposal
//             barrier before any adjudication, hash-chained adjudication); the
//             conductor merely supplies what it calls.
//
// The seam is one-directional: the conductor hands the scheduler an executor,
// and the executor reads MV-B3-sealed bytes. MV-B3's captureResponseUnderCustody
// is NOT wrapped around the scheduler's executor, because doing so would put a
// live provider call inside a rehearsal whose whole point is that there is
// none. Capture (write) and replay (read) are separate phases of the same
// custody, and this module is the read phase.
//
// ===========================================================================
// FOUR STRUCTURAL CONFLICTS FOUND BY RUNNING THE COMPOSITION, NOT BY READING IT
// ===========================================================================
// (1) MV-B2's policy is SEALED AGAINST MV-B3. source/proofs/
//     model-village-turn-policy.hs freezes "no blinded alias assignment is
//     performed, claimed, or receipted under this policy", and the scheduler's
//     loader ENFORCES that the laneStatement says so. A blinded study run can
//     therefore never be governed by mv-b2-turn-policy-v1. Resolved by a NEW
//     frozen source, source/proofs/model-village-study-policy.hs
//     (mv-study-policy-v1), whose laneStatement REQUIRES sealed alias
//     assignment. The frozen MV-B2 policy is untouched.
//
// (2) The scheduler's POLICY BUNDLE shape is closed. validatePolicyBundle
//     asserts EXACT keys on the bundle, the policy, the snapshot fixture, the
//     pre-authorized catalog, and the vocabulary. A study bundle carrying the
//     study block order and the wider action catalog is therefore inadmissible
//     as-is. Resolved by PROJECTION, not by relaxing the scheduler: the study
//     manifest carries everything, and `schedulerPolicyBundle` is the exact
//     eight-key projection the scheduler accepts, with its own recomputed
//     manifestHash/policyHash. Nothing in MV-B2 is edited or bypassed.
//
// (3) turnsPerRun 6 does NOT mean one scheduler round. executeTurnRound
//     hard-codes the opportunity id as `${runId}-t1-${residentId}` and refuses
//     to execute a runId twice on one scheduler. Six deterministic turns per
//     village-run are therefore six ROUNDS under six derived runIds on ONE
//     scheduler, so the scheduler-scoped nonce and opportunity registries span
//     the whole run and replay stays refused across turns. The rounds are
//     hash-chained end to end: round 1 chains from the SIGNED run manifest
//     hash, round n+1 chains from round n's terminal adjudication receipt.
//
// (4) MV-B4's issue() CANNOT sign a village run manifest, and that is why the
//     lane looked composed when it was not. createCustodyBackedValidator's
//     issue() self-verifies through the shipped verifyRuntimeInjectedValidator,
//     which calls assertRunManifest — and that pins
//     runId === 'mv-phase0b-tracer-001' and the frozen phase0b two-action
//     shape. B4 was signing the pre-existing tracer's manifest because that is
//     the ONLY manifest it can sign. Its verifyValidatorSignature likewise pins
//     payload.domain to the phase0b domain.
//     Resolved WITHOUT editing MV-B4 (its handle's key set is pinned by an
//     existing test, so a new method there would break it): the conductor
//     provisions the key through MV-B4's REAL custody path
//     (provisionValidatorKey seals the PKCS8 into the run's sealed store),
//     publishes it through MV-B4's REAL trust-registry lane
//     (createTrustRegistry/appendEntry), and signs the VILLAGE run manifest
//     under a DISTINCT domain — STUDY_RUN_MANIFEST_DOMAIN — so a study
//     signature can never be replayed as a phase0b run-manifest signature or
//     the reverse. Verification runs through MV-B4's own fleet primitive,
//     verifyRunManifestAgainstRegistry, with the adapter supplied HERE rather
//     than in a checker. The manifest that is signed and verified is the
//     conductor's own run manifest, which is the composition the audit found
//     missing.
//
// ===========================================================================
// CLAIM BOUNDARY — observed{} vs declared{}, and why they are separated
// ===========================================================================
// The audit that preceded this file found 570 pinned claim flags across the
// lane of which only 7 had a load-bearing test, and checkers that verified a
// receipt against the same constant they wrote it from. This module therefore
// splits its boundary in two, and only one half is allowed to matter:
//
//   observed{}  — measured during execution ONLY: counters that increment,
//                 lengths of arrays of recorded incidents, values re-derived
//                 from the per-run entries. Nothing here is an author's
//                 sentence. verifyRehearsalReceipt gates on these.
//   declared{}  — author assertions. EXPLICITLY NON-LOAD-BEARING. The verifier
//                 checks their SHAPE and checks that they do not shadow an
//                 observed key; it never treats one as evidence.
//
// verifyRehearsalReceipt compares observed{} against REHEARSAL_EXPECTATIONS,
// which is authored independently of every value the receipt is written from
// (the receipt's numbers come from live counters and from re-derivation over
// receipt.runs), and it RECOMPUTES `passed` rather than reading it. It also
// recomputes the entire aggregate from receipt.runs, so a single flipped
// number cannot survive: forging a clean rehearsal requires rewriting twelve
// run entries and seventy-two round entries consistently AND satisfying the
// expectation table AND the cross-bindings (for example
// observed.custodyResponseReadsObserved must equal the number of resolved
// turns derived from the runs).
//
// HONEST LIMIT, stated rather than buried: this receipt is tamper-EVIDENT, not
// tamper-PROOF. It carries no signature over itself, so a party who can rewrite
// the whole artifact can produce a self-consistent clean one. What the split
// buys is that no single edit, and no re-signed single edit, passes — which is
// exactly the property the previous claim boundary did not have.
//
// PROVIDER-CALL MEASUREMENT — the one number that must never be a literal.
// The conductor installs a counting FENCE over globalThis.fetch for the
// duration of the rehearsal and hands the SAME fence down to every turn
// executor as `fetchImpl`. Every call increments a real counter and records its
// target; a call to an ABSOLUTE http/https URL is additionally counted as a
// PROVIDER call and REFUSED by throwing. Both halves matter: the count is a
// measurement, and the throw means a provider call that does happen also
// corrupts the turn it happened in, so the incident shows up in the per-run
// entries as well as in the counter.
//
// THE CLASSIFICATION RULE, stated because it was written in response to a real
// observation rather than in anticipation of one. The first fenced run recorded
// exactly one call, to `/holoscript_wasm_bg.wasm` — the HoloScript core parser
// initializing its own WASM binary while loading the frozen `.hs` sources. That
// is not a provider call and cannot become one: Node's fetch rejects a relative
// URL outright, so a non-absolute target has no network to reach. The fence
// therefore counts it, PUBLISHES it in nonProviderFetchCallTargets, delegates it
// to the original fetch so the parser's behavior is not perturbed by the
// measurement, and excludes it from providerFetchCallsObserved by a stated rule
// rather than by omission. Only providerFetchCallsObserved is gated to zero.
//
// Coverage limit, stated plainly: the fence covers the global `fetch` binding
// (which is what MV-B1's executeCertifiedModelTurn resolves at call time, via
// its `fetchImpl = globalThis.fetch` default parameter) and the injected
// handle. It does NOT cover a module that captured a reference to fetch before
// installation, a raw node:http/https socket, or a child process. This module
// claims a measured zero over absolute-http fetch, and only that.

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  randomInt,
  sign,
  verify,
} from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  ADAPTER_CERTIFICATION_SCHEMA,
  ADAPTER_RUNTIME_ENGINE,
  GENESIS_RECEIPT_HASH,
  MODEL_TURN_RECEIPT_SCHEMA,
  loadAdapterCustodyDrillManifest,
  parseProposal,
  verifyAdapterCertificationReceipt,
  verifyModelTurnReceipt,
} from './model-village-adapter-runtime.mjs';
import {
  issueUnblindingReceipt,
  loadFrozenAssignmentMatrix,
  sealAliasAssignment,
  verifyAliasAssignmentCommitment,
  verifyUnblindingReceipt,
} from './model-village-alias-vault.mjs';
import { provisionIsolatedRun } from './model-village-admission-bridge.mjs';
import { createSealedCustodyStore } from './model-village-custody-store.mjs';
import {
  canonicalDigest,
  canonicalJson,
} from './model-village-phase0b-runtime.mjs';
import {
  RUN_ID_PATTERN,
  createTurnScheduler,
  verifyRoundReceiptChain,
} from './model-village-turn-scheduler.mjs';
import {
  createTrustRegistry,
  trustRegistryKeyFingerprint,
  verifyRunManifestAgainstRegistry,
  verifyTrustRegistry,
} from './model-village-trust-registry.mjs';
import {
  createValidatorTrustRegistry,
  provisionValidatorKey,
} from './model-village-validator-custody.mjs';

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const CONDUCTOR_ENGINE = 'hololand-model-village-run-conductor-v1';
export const STUDY_POLICY_SCHEMA = 'hololand.model-village-study-policy.v1';
export const STUDY_BLOCK_ORDER_SCHEMA =
  'hololand.model-village-study-block-order.v1';
export const RUN_MANIFEST_SCHEMA = 'hololand.model-village-run-manifest.v1';
export const REHEARSAL_RECEIPT_SCHEMA = 'hololand.model-village-rehearsal.v1';
export const REHEARSAL_RUN_ENTRY_SCHEMA =
  'hololand.model-village-rehearsal-run.v1';

export const STUDY_POLICY_SOURCE_PATH =
  'source/proofs/model-village-study-policy.hs';
export const TRIAL_KERNEL_SOURCE_PATH =
  'source/proofs/model-village-trial-kernel.hs';

/**
 * Domain separation for the study run-manifest signature.
 *
 * MV-B4's phase0b domain is 'hololand:model-village:phase0b:trusted-validator:v1'
 * and its verifyValidatorSignature REFUSES any payload carrying a different
 * domain. A study signature must therefore be unmistakable for a phase0b one in
 * BOTH directions: this domain string cannot be verified by MV-B4's phase0b
 * verifier, and a phase0b signature cannot be verified by this lane's.
 */
export const STUDY_RUN_MANIFEST_DOMAIN =
  'hololand:model-village:study:run-manifest:v1';

export const REHEARSAL_RECEIPT_OUTPUT_PATH =
  '.tmp/hololand/model-village/rehearsal-receipt.json';

/** The three frozen seed blocks (plan lines 735-739 / kernel condition order). */
export const STUDY_BLOCK_IDS = Object.freeze(['block1', 'block2', 'block3']);
export const STUDY_CONDITIONS = Object.freeze([
  'mixed',
  'adapter_a_only',
  'adapter_b_only',
  'adapter_c_only',
]);
export const STUDY_ALIASES = Object.freeze([
  'adapter_a',
  'adapter_b',
  'adapter_c',
]);

/**
 * INDEPENDENT expectation table.
 *
 * These values are authored HERE, from the study design (3 seed blocks x 4
 * conditions = 12 village-runs; 6 deterministic turns per run; 6 residents per
 * turn), and are NEVER the source of any value the receipt is written from —
 * every observed number comes from a live counter or from re-derivation over
 * receipt.runs. That separation is the whole point: a checker that verifies a
 * receipt against the same constant it wrote the receipt from proves only that
 * it can copy a number.
 */
export const REHEARSAL_EXPECTATIONS = Object.freeze({
  aliasBlocksSealed: 3,
  aliasCommitmentVerificationFailures: 0,
  aliasUnblindingsVerified: 3,
  chainVerificationFailures: 0,
  crossRunStateFindings: 0,
  distinctRunDirectoryCount: 12,
  distinctRunIdCount: 12,
  distinctValidatorIdCount: 12,
  modelTurnsResolved: 432,
  providerFetchCallsObserved: 0,
  runManifestSignatureFailures: 0,
  runManifestSignaturesVerified: 12,
  schedulerFrozenRounds: 0,
  trustRegistryEntriesAppended: 12,
  trustRegistryVerified: true,
  turnRoundsExecuted: 72,
  turnsCompleted: 432,
  turnsFailed: 0,
  turnsTimedOut: 0,
  villageRunsExecuted: 12,
});

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * Bound on each recorded fetch-incident log. Shared by the fence (which writes
 * them) and evaluateRehearsal (which cross-binds against them) so the two can
 * never disagree about where saturation begins — a disagreement there is
 * exactly where a zeroed counter could hide.
 */
const FETCH_TARGET_LOG_LIMIT = 32;

/**
 * Mirrors of MV-B1 module-private constants that its verifiers pin. They are
 * restated (not imported — they are not exported) and every one of them is
 * checked immediately by verifyModelTurnReceipt /
 * verifyAdapterCertificationReceipt, so drift fails loud on the first turn
 * rather than silently.
 */
const MV_B1_FALLBACK_EVIDENCE = 'no-fallback-code-path-single-endpoint';
const MV_B1_HIDDEN_PROMPT_ENHANCEMENT = 'none-request-bytes-hashed';
const MV_B1_CACHE_STATE_EVIDENCE = Object.freeze({
  providerCacheControlProbed: false,
  state: 'unknown_contamination_receipted',
});

const STUDY_POLICY_OBJECT_NAMES = Object.freeze([
  'ModelVillageStudyPolicy',
  'ModelVillageStudyBlockOrder',
  'ModelVillageStudySnapshotFixture',
  'ModelVillageStudyPreauthorizedActionCatalog',
]);
const STUDY_POLICY_KEYS = Object.freeze([
  'adjudicationDefault',
  'assignmentMatrixRef',
  'barrierRule',
  'conditionOrderRef',
  'concurrencyLimit',
  'laneStatement',
  'policyId',
  'residentsPerTurn',
  'retryCount',
  'schemaId',
  'turnTimeoutMs',
  'turnsPerRun',
  'type',
  'vocabularyRef',
]);
const STUDY_BLOCK_ORDER_KEYS = Object.freeze([
  'block1',
  'block2',
  'block3',
  'conditionsPerBlock',
  'dayOneBlockId',
  'dayThreeBlockId',
  'dayTwoBlockId',
  'orderId',
  'orderStatement',
  'seedBlockCount',
  'type',
  'villageRunCount',
]);
const STUDY_SNAPSHOT_FIXTURE_KEYS = Object.freeze([
  'fixtureId',
  'location',
  'publicState',
  'type',
]);
const STUDY_CATALOG_KEYS = Object.freeze([
  'actions',
  'catalogId',
  'catalogStatement',
  'primaryAction',
  'primaryAmount',
  'primaryTarget',
  'sourceLane',
  'type',
]);

/** The EXACT eight-key bundle scripts/model-village-turn-scheduler.mjs takes. */
const SCHEDULER_BUNDLE_KEYS = Object.freeze([
  'manifestHash',
  'policy',
  'policyHash',
  'preauthorizedCatalog',
  'promptTemplate',
  'snapshotFixture',
  'vocabulary',
  'vocabularyHash',
]);

const REHEARSAL_RECEIPT_KEYS = Object.freeze([
  'aggregate',
  'declared',
  'engine',
  'generatedAt',
  'observed',
  'passed',
  'receiptHash',
  'runs',
  'schema',
  'studyManifestHash',
  'studyPolicyId',
]);
const REHEARSAL_RUN_KEYS = Object.freeze([
  'aliasCommitmentReceiptHash',
  'blockId',
  'chainVerified',
  'condition',
  'conditionIndex',
  'crossRunStateFindings',
  'dayIndex',
  'decisionCounts',
  'entryHash',
  'receiptChainRoot',
  'runDirectory',
  'runId',
  'runManifestHash',
  'runManifestSignatureVerified',
  'schema',
  'seatBindingHash',
  'turnOutcomeCounts',
  'turnRounds',
  'validatorId',
]);
const REHEARSAL_ROUND_KEYS = Object.freeze([
  'barrierHash',
  'chainVerified',
  'decisionCounts',
  'frozen',
  'priorReceiptHash',
  'resolvedCounts',
  'roundRunId',
  'terminalReceiptHash',
  'turnIndex',
]);
const AGGREGATE_KEYS = Object.freeze([
  'blockChainRoots',
  'chainVerificationFailures',
  'crossRunStateFindings',
  'decisionCounts',
  'distinctRunDirectoryCount',
  'distinctRunIdCount',
  'distinctValidatorIdCount',
  'modelTurnsResolved',
  'rehearsalRoot',
  'runManifestSignatureFailures',
  'runManifestSignaturesVerified',
  'schedulerFrozenRounds',
  'turnOutcomeCounts',
  'turnRoundsExecuted',
  'villageRunsExecuted',
]);
const OBSERVED_KEYS = Object.freeze([
  'aliasBlocksSealed',
  'aliasCommitmentVerificationFailures',
  'aliasUnblindingsVerified',
  'custodyResponseReadsObserved',
  'fetchCallsObserved',
  'nonProviderFetchCallTargets',
  'providerFetchCallTargets',
  'providerFetchCallsObserved',
  'rehearsalWallClockMs',
  'runDirectoryPreexistingRefusals',
  'trustRegistryEntriesAppended',
  'trustRegistryVerified',
]);
const DECISION_COUNT_KEYS = Object.freeze([
  'admitted',
  'denied',
  'noPreauthorizedMatch',
  'preauthorizedMatch',
]);
const OUTCOME_COUNT_KEYS = Object.freeze(['completed', 'failed', 'timedOut']);

// ---------------------------------------------------------------------------
// Errors + primitives
// ---------------------------------------------------------------------------

export class ModelVillageRunConductorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ModelVillageRunConductorError';
  }
}

/** Raised by the provider-call fence. A rehearsal that sees one has failed. */
export class ProviderCallAttemptedError extends Error {
  constructor(target) {
    super(
      'a provider call was attempted during a zero-provider-call rehearsal; '
      + 'the call was refused and counted',
    );
    this.name = 'ProviderCallAttemptedError';
    this.target = target;
  }
}

function fail(message) {
  throw new ModelVillageRunConductorError(message);
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) deepFreeze(entry);
  return Object.freeze(value);
}

function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function normalizeSource(value) {
  return String(value).replace(/\r\n?/g, '\n');
}

function sourceDigest(value) {
  return sha256Hex(Buffer.from(normalizeSource(value), 'utf8'));
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
}

function assertExactKeys(value, expectedKeys, label) {
  assertObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    const missing = expected.filter((key) => !actual.includes(key));
    const unexpected = actual.filter((key) => !expected.includes(key));
    fail(
      `${label} keys differ; missing=${canonicalJson(missing)} `
      + `unexpected=${canonicalJson(unexpected)}`,
    );
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    fail(`${label} must be a non-empty string`);
  }
}

function assertSha256(value, label) {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    fail(`${label} must be lowercase sha256 hex`);
  }
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    fail(`${label} must be a non-negative integer`);
  }
}

function sealHashed(unsigned, hashKey) {
  return deepFreeze({ ...unsigned, [hashKey]: canonicalDigest(unsigned) });
}

function conditionSlug(condition) {
  return condition.replace(/_/g, '-');
}

function defaultHololandRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

// ---------------------------------------------------------------------------
// Study policy manifest loading
// ---------------------------------------------------------------------------

function resolveHoloScriptCorePath(hololandRoot) {
  const candidate = process.env.HOLOSCRIPT_ROOT
    ? path.resolve(process.env.HOLOSCRIPT_ROOT)
    : path.resolve(hololandRoot, '..', 'HoloScript');
  const corePath = path.join(candidate, 'packages', 'core', 'dist', 'index.js');
  return corePath;
}

function scanManifestObjectBlocks(source) {
  const blocks = [];
  const pattern = /\bobject\s+"([^"]+)"\s*\{/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    let cursor = pattern.lastIndex;
    let depth = 1;
    let inString = false;
    let escaped = false;
    let lineComment = false;
    for (; cursor < source.length && depth > 0; cursor += 1) {
      const character = source[cursor];
      const next = source[cursor + 1];
      if (lineComment) {
        if (character === '\n') lineComment = false;
        continue;
      }
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '/' && next === '/') {
        lineComment = true;
        cursor += 1;
        continue;
      }
      if (character === '"') inString = true;
      else if (character === '{') depth += 1;
      else if (character === '}') depth -= 1;
    }
    if (depth !== 0) fail(`study policy object ${match[1]} is unclosed`);
    blocks.push({ body: source.slice(pattern.lastIndex, cursor - 1), name: match[1] });
    pattern.lastIndex = cursor;
  }
  return blocks;
}

function assertNoDuplicateManifestProperties(source, label) {
  const blocks = scanManifestObjectBlocks(source);
  for (const block of blocks) {
    const seen = new Set();
    for (const line of block.body.split('\n')) {
      const lineMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/);
      if (!lineMatch) continue;
      if (seen.has(lineMatch[1])) {
        fail(`${label} object ${block.name} duplicates property ${lineMatch[1]}`);
      }
      seen.add(lineMatch[1]);
    }
  }
  return blocks.map((block) => block.name);
}

function manifestNodeMap(parseResult, source, label) {
  if (
    !parseResult?.success
    || !Array.isArray(parseResult.ast)
    || (parseResult.errors?.length ?? 0) > 0
  ) {
    fail(
      `${label} failed HoloScript parsing: `
      + `${canonicalJson(parseResult?.errors ?? [])}`,
    );
  }
  const sourceNames = assertNoDuplicateManifestProperties(source, label);
  const parsedNames = parseResult.ast.map((node) => node.name);
  if (
    new Set(sourceNames).size !== sourceNames.length
    || new Set(parsedNames).size !== parsedNames.length
    || canonicalJson(sourceNames) !== canonicalJson(parsedNames)
  ) {
    fail(`${label} source/AST object identities differ`);
  }
  return new Map(parseResult.ast.map((node) => [node.name, node.properties]));
}

function parseEscapedJsonArray(value, label) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    fail(`${label} is not valid escaped JSON`);
  }
  if (!Array.isArray(parsed)) fail(`${label} must encode a JSON array`);
  return parsed;
}

/**
 * Loads and closed-key validates the frozen study policy manifest, then binds
 * it to the two frozen sources it references BY REFERENCE:
 *
 *  - the MV-B1 proposal vocabulary + prompt template (via vocabularyRef,
 *    loaded through MV-B1's own loader so both arrive fully validated rather
 *    than re-authored here), and
 *  - the frozen trial kernel's ModelVillageConditionOrder (via
 *    conditionOrderRef). The study manifest's block orders are DERIVED
 *    evidence: they are compared element-by-element against the kernel and a
 *    disagreement REFUSES the load. A restatement that cannot drift is data;
 *    one that can is a second authority (D.134).
 *
 * Returns a frozen study bundle plus `schedulerPolicyBundle` — the exact
 * eight-key projection scripts/model-village-turn-scheduler.mjs accepts, with
 * its own recomputed manifestHash/policyHash.
 */
export async function loadStudyPolicyManifest({
  hololandRoot = defaultHololandRoot(),
} = {}) {
  const corePath = resolveHoloScriptCorePath(hololandRoot);
  let core;
  try {
    core = await import(pathToFileURL(corePath).href);
  } catch (error) {
    fail(
      `HoloScript core build is unavailable at ${corePath}; set HOLOSCRIPT_ROOT `
      + `to the built HoloScript repository (${error?.message ?? error})`,
    );
  }
  if (typeof core.HoloScriptCodeParser !== 'function') {
    fail('HoloScript core is missing HoloScriptCodeParser');
  }
  const { readFileSync } = await import('node:fs');
  const policySourceRaw = readFileSync(
    path.resolve(hololandRoot, ...STUDY_POLICY_SOURCE_PATH.split('/')),
    'utf8',
  );
  const policySource = normalizeSource(policySourceRaw);
  const parser = new core.HoloScriptCodeParser();
  const nodes = manifestNodeMap(
    parser.parse(policySource),
    policySource,
    'study policy manifest',
  );
  if (
    canonicalJson([...nodes.keys()])
    !== canonicalJson([...STUDY_POLICY_OBJECT_NAMES])
  ) {
    fail('study policy manifest object set/order is not canonical');
  }

  const policy = structuredClone(nodes.get(STUDY_POLICY_OBJECT_NAMES[0]));
  assertExactKeys(policy, STUDY_POLICY_KEYS, 'study policy');
  if (
    policy.type !== 'study_turn_policy'
    || policy.schemaId !== STUDY_POLICY_SCHEMA
    || policy.policyId !== 'mv-study-policy-v1'
    || policy.residentsPerTurn !== 6
    || policy.turnsPerRun !== 6
    || policy.concurrencyLimit !== 2
    || policy.turnTimeoutMs !== 90000
    || policy.retryCount !== 0
    || policy.barrierRule !== 'all-turns-resolved-before-any-adjudication'
    || policy.adjudicationDefault !== 'deny'
    || policy.vocabularyRef
      !== 'model-village-adapter-custody-drill.hs#ModelVillageProposalVocabulary'
    || policy.conditionOrderRef
      !== 'model-village-trial-kernel.hs#ModelVillageConditionOrder'
  ) {
    fail('study policy identity/frozen values are invalid');
  }
  assertNonEmptyString(policy.laneStatement, 'study policy laneStatement');
  // The inverse of mv-b2-turn-policy-v1, enforced rather than intended: this
  // lane REQUIRES sealed alias assignment, and must not be confusable with the
  // engineering tracer policy that forbids it.
  if (
    !/sealed alias assignment is REQUIRED/i.test(policy.laneStatement)
    || !/STUDY lane/i.test(policy.laneStatement)
    || /no blinded alias assignment is performed/i.test(policy.laneStatement)
  ) {
    fail(
      'study policy laneStatement must REQUIRE sealed alias assignment and must '
      + "not restate mv-b2-turn-policy-v1's no-blinded-assignment clause",
    );
  }

  const blockOrder = structuredClone(nodes.get(STUDY_POLICY_OBJECT_NAMES[1]));
  assertExactKeys(blockOrder, STUDY_BLOCK_ORDER_KEYS, 'study block order');
  if (
    blockOrder.type !== 'study_block_order'
    || blockOrder.orderId !== 'mv-study-block-order-v1'
    || blockOrder.seedBlockCount !== 3
    || blockOrder.conditionsPerBlock !== 4
    || blockOrder.villageRunCount !== 12
    || blockOrder.dayOneBlockId !== 'block1'
    || blockOrder.dayTwoBlockId !== 'block2'
    || blockOrder.dayThreeBlockId !== 'block3'
  ) {
    fail('study block order identity/frozen values are invalid');
  }
  const declaredOrder = Object.fromEntries(
    STUDY_BLOCK_IDS.map((blockId) => [
      blockId,
      parseEscapedJsonArray(blockOrder[blockId], `study block order ${blockId}`),
    ]),
  );
  for (const blockId of STUDY_BLOCK_IDS) {
    const conditions = declaredOrder[blockId];
    if (
      conditions.length !== 4
      || canonicalJson([...conditions].sort())
        !== canonicalJson([...STUDY_CONDITIONS].sort())
    ) {
      fail(`study block order ${blockId} is not a permutation of the four conditions`);
    }
  }

  // DERIVED, NEVER AUTHORED: cross-check against the frozen trial kernel.
  const kernelSourceRaw = readFileSync(
    path.resolve(hololandRoot, ...TRIAL_KERNEL_SOURCE_PATH.split('/')),
    'utf8',
  );
  const kernelSource = normalizeSource(kernelSourceRaw);
  const kernelNodes = manifestNodeMap(
    new core.HoloScriptCodeParser().parse(kernelSource),
    kernelSource,
    'frozen trial kernel',
  );
  const kernelOrder = kernelNodes.get('ModelVillageConditionOrder');
  if (!kernelOrder) {
    fail('frozen trial kernel does not declare ModelVillageConditionOrder');
  }
  for (const blockId of STUDY_BLOCK_IDS) {
    const kernelConditions = kernelOrder[blockId];
    if (!Array.isArray(kernelConditions)) {
      fail(`frozen trial kernel ModelVillageConditionOrder.${blockId} is not an array`);
    }
    if (canonicalJson(kernelConditions) !== canonicalJson(declaredOrder[blockId])) {
      fail(
        `study block order ${blockId} disagrees with the frozen trial kernel `
        + 'condition order; the study policy restates kernel data and may never '
        + 'drift from it',
      );
    }
  }

  const snapshotFixture = structuredClone(nodes.get(STUDY_POLICY_OBJECT_NAMES[2]));
  assertExactKeys(
    snapshotFixture,
    STUDY_SNAPSHOT_FIXTURE_KEYS,
    'study snapshot fixture',
  );
  if (
    snapshotFixture.type !== 'study_snapshot_fixture'
    || snapshotFixture.fixtureId !== 'mv-study-snapshot-fixture-v1'
    || snapshotFixture.location !== 'commons'
  ) {
    fail('study snapshot fixture identity is invalid');
  }
  let fixturePublicState;
  try {
    fixturePublicState = JSON.parse(snapshotFixture.publicState);
  } catch {
    fail('study snapshot fixture publicState is not valid JSON');
  }
  assertObject(fixturePublicState, 'study snapshot fixture publicState');

  const catalog = structuredClone(nodes.get(STUDY_POLICY_OBJECT_NAMES[3]));
  assertExactKeys(catalog, STUDY_CATALOG_KEYS, 'study action catalog');
  if (
    catalog.type !== 'study_preauthorized_action_catalog'
    || catalog.catalogId !== 'mv-study-preauthorized-action-catalog-v1'
    || catalog.primaryAction !== 'contribute_water'
    || catalog.primaryTarget !== 'commons_cistern'
    || catalog.primaryAmount !== 1
    || catalog.sourceLane !== 'phase0b-v4-deterministic'
  ) {
    fail('study action catalog identity/frozen values are invalid');
  }
  const catalogActions = parseEscapedJsonArray(
    catalog.actions,
    'study action catalog actions',
  );
  if (catalogActions.length < 2) {
    fail(
      'the study action catalog must pre-authorize more than one action; a '
      + 'one-action catalog is a permission check, not a choice set',
    );
  }
  assertNonEmptyString(catalog.catalogStatement, 'catalogStatement');
  if (
    !/open-outcome/i.test(catalog.catalogStatement)
    || !/idea-seeds\/2026-07-26-open-outcome-receipt-tier\.md/.test(
      catalog.catalogStatement,
    )
    || !/catalog width/i.test(catalog.catalogStatement)
  ) {
    fail(
      'catalogStatement must state honestly that catalog width bounds how much '
      + 'resident behavior can reach the world, and must name the open-outcome '
      + 'receipt tier as the thing a truly open outcome requires',
    );
  }

  // MV-B1 vocabulary + prompt template BY REFERENCE (never duplicated).
  const drillBundle = await loadAdapterCustodyDrillManifest({ hololandRoot });
  const vocabulary = structuredClone(drillBundle.vocabulary);
  const promptTemplate = drillBundle.prompt.promptTemplate;
  assertNonEmptyString(promptTemplate, 'referenced promptTemplate');
  if (!promptTemplate.includes(snapshotFixture.publicState)) {
    fail(
      'referenced prompt template does not embed the frozen study snapshot '
      + 'fixture publicState',
    );
  }
  for (const entry of catalogActions) {
    assertObject(entry, 'study catalog action');
    if (!vocabulary.allowedActions.includes(entry.action)) {
      fail(`study catalog action ${entry.action} is outside the referenced vocabulary`);
    }
  }
  if (
    !vocabulary.allowedActions.includes(catalog.primaryAction)
    || !vocabulary.allowedTargets.includes(catalog.primaryTarget)
    || catalog.primaryAmount < vocabulary.amountMin
    || catalog.primaryAmount > vocabulary.amountMax
  ) {
    fail('study catalog primary action is outside the referenced vocabulary');
  }

  const vocabularyHash = canonicalDigest(vocabulary);

  // The exact eight-key bundle MV-B2's scheduler accepts. The scheduler's
  // policy shape has its own closed key set, so the STUDY scalars are
  // projected into it: everything the scheduler enforces (zero retry, default
  // deny, barrier rule, concurrency <= residents) is carried across unchanged.
  const schedulerPolicy = {
    adjudicationDefault: policy.adjudicationDefault,
    barrierRule: policy.barrierRule,
    concurrencyLimit: policy.concurrencyLimit,
    laneStatement: policy.laneStatement,
    policyId: policy.policyId,
    residentsPerTurn: policy.residentsPerTurn,
    retryCount: policy.retryCount,
    schemaId: policy.schemaId,
    turnTimeoutMs: policy.turnTimeoutMs,
    turnsPerRun: policy.turnsPerRun,
    type: policy.type,
    vocabularyRef: policy.vocabularyRef,
  };
  const schedulerContent = {
    policy: schedulerPolicy,
    preauthorizedCatalog: {
      action: catalog.primaryAction,
      amount: catalog.primaryAmount,
      catalogId: catalog.catalogId,
      catalogStatement: catalog.catalogStatement,
      sourceLane: catalog.sourceLane,
      target: catalog.primaryTarget,
      type: 'preauthorized_action_catalog',
    },
    promptTemplate,
    snapshotFixture: {
      fixtureId: snapshotFixture.fixtureId,
      location: snapshotFixture.location,
      publicState: snapshotFixture.publicState,
      type: 'turn_snapshot_fixture',
    },
    vocabulary,
    vocabularyHash,
  };
  const schedulerManifestHash = canonicalDigest(schedulerContent);
  const schedulerPolicyBundle = {
    ...schedulerContent,
    manifestHash: schedulerManifestHash,
    policyHash: schedulerManifestHash,
  };
  assertExactKeys(
    schedulerPolicyBundle,
    SCHEDULER_BUNDLE_KEYS,
    'schedulerPolicyBundle',
  );

  const content = {
    blockOrder,
    catalog,
    catalogActions,
    conditionOrder: declaredOrder,
    drillManifestHash: drillBundle.manifestHash,
    policy,
    promptTemplate,
    routes: structuredClone(drillBundle.routes),
    schedulerPolicyBundle,
    snapshotFixture,
    studyPolicySourceHash: sourceDigest(policySource),
    vocabulary,
    vocabularyHash,
  };
  return deepFreeze({ ...content, studyManifestHash: canonicalDigest(content) });
}

/**
 * The twelve village-runs, in the frozen order: three seed blocks (one per
 * day) of four conditions each.
 */
export function buildVillageRunPlan(studyBundle) {
  assertObject(studyBundle, 'studyBundle');
  const runs = [];
  STUDY_BLOCK_IDS.forEach((blockId, blockIndex) => {
    const conditions = studyBundle.conditionOrder[blockId];
    conditions.forEach((condition, conditionIndex) => {
      const runId = `mv-b2-study-${blockId}-${conditionSlug(condition)}`;
      if (!RUN_ID_PATTERN.test(runId)) {
        fail(
          `derived village runId ${runId} violates the shared MV-B2 runId law; `
          + 'the isolation and scheduler primitives are namespaced to that lane',
        );
      }
      runs.push(Object.freeze({
        blockId,
        condition,
        conditionIndex,
        dayIndex: blockIndex + 1,
        runId,
      }));
    });
  });
  if (runs.length !== 12) fail('the village run plan must contain twelve runs');
  return deepFreeze(runs);
}

// ---------------------------------------------------------------------------
// Provider-call fence — the ONLY honest way to publish a zero
// ---------------------------------------------------------------------------

/** True only for a target that could actually reach a network provider. */
export function isProviderFetchTarget(target) {
  try {
    const parsed = new URL(target);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Installs a counting fence over globalThis.fetch and returns the same function
 * for injection as `fetchImpl`. Every call increments a real counter and records
 * a bounded projection of its target. An absolute http/https target is counted
 * as a PROVIDER call and refused by throwing; anything else is counted,
 * published, and delegated to the original fetch so the measurement does not
 * perturb what it measures (see the classification rule in the module header).
 *
 * The counters are what the receipt publishes. There is no literal zero
 * anywhere on this path.
 */
export function installProviderCallFence() {
  const original = globalThis.fetch;
  const state = {
    calls: 0,
    nonProviderTargets: [],
    providerCalls: 0,
    providerTargets: [],
  };
  const fence = async (...args) => {
    state.calls += 1;
    const target = String(
      args?.[0]?.url ?? args?.[0] ?? 'unknown-target',
    ).slice(0, 200);
    if (isProviderFetchTarget(target)) {
      state.providerCalls += 1;
      if (state.providerTargets.length < FETCH_TARGET_LOG_LIMIT) {
        state.providerTargets.push(target);
      }
      throw new ProviderCallAttemptedError(target);
    }
    if (state.nonProviderTargets.length < FETCH_TARGET_LOG_LIMIT) {
      state.nonProviderTargets.push(target);
    }
    if (typeof original !== 'function') {
      throw new TypeError('fetch is not available in this runtime');
    }
    return original(...args);
  };
  globalThis.fetch = fence;
  return Object.freeze({
    fetch: fence,
    restore() {
      if (globalThis.fetch === fence) globalThis.fetch = original;
    },
    state,
  });
}

// ---------------------------------------------------------------------------
// Rehearsal fixtures (T-7 has no certified adapters BY DESIGN)
// ---------------------------------------------------------------------------

/**
 * Builds an MV-B1-SHAPED certification receipt for the rehearsal.
 *
 * WHY A FIXTURE IS CORRECT HERE, not a shortcut: the production calendar puts
 * "Certify adapters" at T-3 (plan line 727), AFTER the T-7 dress rehearsal
 * (line 726). At T-7 there are no live certifications to hold, and producing
 * one requires probing a live route — which is precisely what a zero-provider-
 * call rehearsal must not do. The rehearsal therefore runs on fixture
 * certifications and SAYS SO: the emitted rehearsal receipt pins
 * declared.certificationProvenance to 'rehearsal-fixture-not-live-probe'.
 *
 * `revisionEvidence.tier` is 'server-reported' because MV-B1's verifier pins
 * that value; it is a SHAPE requirement of the receipt family, not a claim by
 * this module that a server reported anything.
 */
export function buildRehearsalCertification({ route, promptTemplate }) {
  assertObject(route, 'route');
  assertNonEmptyString(promptTemplate, 'promptTemplate');
  const unsigned = {
    at: new Date().toISOString(),
    cacheStateEvidence: { ...MV_B1_CACHE_STATE_EVIDENCE },
    ceilings: { ...route.ceilings },
    certified: true,
    endpoint: route.endpoint,
    engine: ADAPTER_RUNTIME_ENGINE,
    failureReason: null,
    fallbackDisabled: true,
    fallbackEvidence: MV_B1_FALLBACK_EVIDENCE,
    hiddenPromptEnhancement: MV_B1_HIDDEN_PROMPT_ENHANCEMENT,
    priorReceiptHash: GENESIS_RECEIPT_HASH,
    probeLatencyMs: 0,
    promptTemplateHash: sourceDigest(promptTemplate),
    revisionEvidence: {
      evidenceCustodyIds: [],
      modelIdReported: null,
      packageVersionReported: null,
      processInstanceId: null,
      tier: 'server-reported',
    },
    routeId: route.routeId,
    schema: ADAPTER_CERTIFICATION_SCHEMA,
    serializerHash: canonicalDigest({
      serializerVersion: 'mv-b1-serializer-v1',
      transport: route.transport,
    }),
    transport: route.transport,
  };
  const receipt = sealHashed(unsigned, 'receiptHash');
  const check = verifyAdapterCertificationReceipt(receipt);
  if (!check.ok) {
    fail(`rehearsal certification fixture does not verify: ${check.failureReason}`);
  }
  return receipt;
}

/**
 * Deterministic captured-response envelopes for one village-run.
 *
 * Shape mirrors the provider envelope MV-B3's capture lane reads
 * (choices[0].message.content carrying the proposal as strict JSON), so the
 * replay path exercises the same derivation the live path would.
 *
 * Residents alternate between contribute_water and abstain so BOTH catalog
 * entries are exercised every turn: the contribute proposals reach
 * preauthorizedMatch true, the abstain proposals reach the deny case
 * (admitted_no_preauthorized_action, no mutation).
 */
export function buildRunCaptures({ runId, residentIds, turnsPerRun, blockId, condition }) {
  const captures = [];
  for (let turnIndex = 1; turnIndex <= turnsPerRun; turnIndex += 1) {
    residentIds.forEach((residentId, seatIndex) => {
      const abstains = (seatIndex + turnIndex) % 3 === 0;
      const proposal = abstains
        ? {
          action: 'abstain',
          amount: null,
          reason: `holding water at turn ${turnIndex}`,
          target: null,
        }
        : {
          action: 'contribute_water',
          amount: 1,
          reason: `commons first at turn ${turnIndex}`,
          target: 'commons_cistern',
        };
      const envelope = {
        choices: [{ finish_reason: 'stop', index: 0, message: { content: JSON.stringify(proposal), role: 'assistant' } }],
        id: `rehearsal-${runId}-t${turnIndex}-${residentId}`,
        object: 'chat.completion',
      };
      captures.push(Object.freeze({
        blockId,
        bytes: Buffer.from(JSON.stringify(envelope), 'utf8'),
        condition,
        residentId,
        responseId: `${runId}-t${turnIndex}-${residentId}`,
        turnIndex,
      }));
    });
  }
  return captures;
}

// ---------------------------------------------------------------------------
// The replay turn executor (layer 1 shape + layer 2 bytes)
// ---------------------------------------------------------------------------

/**
 * Builds the executor the scheduler calls. It NEVER touches the network: the
 * `fetchImpl` handed down is the counting fence, and it is deliberately left
 * unused so that any call at all is somebody else's, and is counted.
 *
 * @param {object} options
 * @param {Map} options.captureIndex  key -> { requestCustodyId, promptHash,
 *   responseCustodyId, responseHash }
 * @param {{index:number}} options.turnCursor  bumped by the conductor between
 *   rounds; rounds are strictly sequential (the scheduler refuses a concurrent
 *   round), so a cursor is sufficient and no ambient state is shared.
 * @param {{reads:number}} options.readCounter  incremented on every custody
 *   round-trip; the rehearsal receipt cross-binds this out-of-band counter to
 *   the number of resolved turns derived from the run entries.
 */
export function createReplayTurnExecutor({
  captureIndex,
  turnCursor,
  readCounter,
  vocabulary,
}) {
  if (!(captureIndex instanceof Map)) fail('captureIndex must be a Map');
  assertObject(turnCursor, 'turnCursor');
  assertObject(readCounter, 'readCounter');
  assertObject(vocabulary, 'vocabulary');

  return async function replayTurnExecutor({
    route,
    certification,
    custodyStore,
    priorReceiptHash,
  }) {
    const startedAt = Date.now();
    const seat = route?.studySeat;
    if (!seat || typeof seat.residentId !== 'string') {
      fail('replay executor received a route without a study seat binding');
    }
    const key = `t${turnCursor.index}|${seat.residentId}`;
    const capture = captureIndex.get(key);
    if (!capture) fail(`no sealed capture for ${key}`);

    // LAYER 2: a real custody round-trip, every turn. The store re-verifies
    // plaintext-hash === custodyId on read; the pinned hash is re-checked here
    // too so a substituted object fails before it is parsed.
    const read = custodyStore.readObject(capture.responseCustodyId);
    readCounter.reads += 1;
    const bytes = read.bytes;
    const responseHash = sha256Hex(bytes);
    if (responseHash !== capture.responseHash) {
      fail('sealed captured response does not match its pinned responseHash');
    }

    let envelope;
    try {
      envelope = JSON.parse(bytes.toString('utf8'));
    } catch {
      fail('sealed captured response is not valid JSON');
    }
    const content = envelope?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
      fail('sealed captured response carries no choices[0].message.content');
    }

    // LAYER 1: MV-B1's own parser over MV-B1's own `.hs` vocabulary. No
    // proposal rule is authored here.
    const parsed = parseProposal(content, vocabulary);
    const proposalDecision = parsed.decision;
    const parsedProposal = parsed.decision === 'valid_proposal'
      ? {
        action: parsed.parsed.action,
        amount: parsed.parsed.amount,
        reasonLength: parsed.parsed.reason.length,
        reasonSha256: sha256Hex(Buffer.from(parsed.parsed.reason, 'utf8')),
        target: parsed.parsed.target,
      }
      : null;

    const receipt = sealHashed({
      at: new Date().toISOString(),
      cacheStateEvidence: { ...MV_B1_CACHE_STATE_EVIDENCE },
      custodyRefs: {
        requestCustodyId: capture.requestCustodyId,
        responseCustodyId: capture.responseCustodyId,
      },
      endpoint: route.endpoint,
      engine: ADAPTER_RUNTIME_ENGINE,
      errorClass: null,
      fallbackEvidence: MV_B1_FALLBACK_EVIDENCE,
      generationParameters: {
        maxOutputTokens: route.ceilings.maxOutputTokens,
        seedAcceptedEvidence: 'unverified',
        seedRequested: route.ceilings.seedRequested,
        temperature: route.ceilings.temperature,
      },
      latencyMs: Math.max(0, Date.now() - startedAt),
      parsedProposal,
      priorReceiptHash,
      promptHash: capture.promptHash,
      proposalDecision,
      proposalReason: parsed.decision === 'valid_proposal' ? null : parsed.reason,
      responseHash,
      retries: 0,
      revisionEvidence: structuredClone(certification.revisionEvidence),
      routeId: route.routeId,
      schema: MODEL_TURN_RECEIPT_SCHEMA,
      turnCompleted: true,
      usageReported: null,
    }, 'receiptHash');

    // Self-verify through MV-B1's SHIPPED verifier: the layer-1 claim is only
    // real if the receipt this executor emits satisfies the contract unchanged.
    const check = verifyModelTurnReceipt(receipt);
    if (!check.ok) {
      fail(`replayed model-turn receipt does not verify: ${check.failureReason}`);
    }
    return receipt;
  };
}

// ---------------------------------------------------------------------------
// Fleet verification adapter (owned HERE, not in a checker)
// ---------------------------------------------------------------------------

/**
 * The injected verifier MV-B4's verifyRunManifestAgainstRegistry expects.
 *
 * Both halves of the signing payload are RECOMPUTED from public material — the
 * manifest object itself and the study config hash — never read off a pinned
 * field, so this proves "THIS manifest was signed", not "some manifest was".
 * The verdict is a strict boolean; anything else is a failure by the registry's
 * own contract.
 */
export function createStudyFleetVerifier({ studyConfigHash }) {
  assertSha256(studyConfigHash, 'studyConfigHash');
  const observations = [];
  const verifySignature = ({ keyFingerprint, manifest, publicKeyPem, signature }) => {
    try {
      if (trustRegistryKeyFingerprint(publicKeyPem) !== keyFingerprint) {
        observations.push({ failureReason: 'key-fingerprint-mismatch', ok: false });
        return false;
      }
      const payload = {
        configHash: studyConfigHash,
        domain: STUDY_RUN_MANIFEST_DOMAIN,
        manifestHash: canonicalDigest(manifest),
      };
      const ok = verify(
        null,
        Buffer.from(canonicalJson(payload), 'utf8'),
        createPublicKey(publicKeyPem),
        Buffer.from(signature, 'base64'),
      );
      observations.push({
        failureReason: ok === true ? null : 'signature-verification-failed',
        ok: ok === true,
      });
      return ok === true;
    } catch {
      observations.push({ failureReason: 'verifier-error', ok: false });
      return false;
    }
  };
  return Object.freeze({ observations, verifySignature });
}

/**
 * Signs the CONDUCTOR'S run manifest with the MV-B4 custody-held key.
 *
 * The key is read out of the sealed custody store for this one signature and
 * the plaintext buffer is zeroed on every path — the same read-per-signature
 * discipline MV-B4's own signer uses, for the same reason (the process holds
 * decrypted key material for microseconds, not for a handle lifetime).
 *
 * See structural conflict (4) in the module header for why MV-B4's issue()
 * cannot be called here and why this signature carries its own domain.
 */
function signStudyRunManifest({ custodyStore, privateKeyCustodyId, studyConfigHash, manifest }) {
  const payload = {
    configHash: studyConfigHash,
    domain: STUDY_RUN_MANIFEST_DOMAIN,
    manifestHash: canonicalDigest(manifest),
  };
  const opened = custodyStore.readObject(privateKeyCustodyId);
  try {
    const privateKey = createPrivateKey({
      format: 'der',
      key: opened.bytes,
      type: 'pkcs8',
    });
    return sign(
      null,
      Buffer.from(canonicalJson(payload), 'utf8'),
      privateKey,
    ).toString('base64');
  } finally {
    opened.bytes.fill(0);
  }
}

// ---------------------------------------------------------------------------
// Seat bindings (MV-B3 frozen matrix + condition)
// ---------------------------------------------------------------------------

/**
 * Derives the six seat -> alias bindings for one village-run.
 *
 * The seat -> ALIAS binding is PUBLIC study vocabulary (it is declared openly
 * in the frozen trial kernel). The alias -> ROUTE map is the sealed secret and
 * never appears here or in any emitted artifact.
 *
 * `mixed` takes the block's frozen latin-square row; a homogeneous condition
 * (`adapter_X_only`) assigns that single alias to all six seats, which is what
 * makes the primary contrast mixed - mean(homogeneous) well defined.
 */
export function buildSeatAliasBindings({ matrix, blockId, condition }) {
  const personaSeats = matrix.personasAndSeats;
  const row = matrix.blocks[blockId];
  return personaSeats.map((personaSeat, index) => {
    const [personaId, seatId] = String(personaSeat).split('@');
    if (!personaId || !seatId) fail('frozen persona/seat entry is not persona@seat');
    let adapterAlias;
    if (condition === 'mixed') {
      adapterAlias = row[index];
    } else {
      const alias = condition.replace(/_only$/, '');
      if (!STUDY_ALIASES.includes(alias)) {
        fail(`condition ${condition} does not name a frozen study alias`);
      }
      adapterAlias = alias;
    }
    return Object.freeze({
      adapterAlias,
      personaId,
      residentId: `resident-${String(index + 1).padStart(2, '0')}`,
      seatId,
    });
  });
}

// ---------------------------------------------------------------------------
// The rehearsal
// ---------------------------------------------------------------------------

function emptyDecisionCounts() {
  return { admitted: 0, denied: 0, noPreauthorizedMatch: 0, preauthorizedMatch: 0 };
}

function emptyOutcomeCounts() {
  return { completed: 0, failed: 0, timedOut: 0 };
}

function addCounts(target, source, keys) {
  for (const key of keys) target[key] += source[key];
  return target;
}

/**
 * Recomputes the aggregate from the per-run entries ALONE.
 *
 * This is the anti-ritual core of the claim boundary: emission and verification
 * both call this function over `runs`, so the aggregate is never an
 * independently-writable field. Forging a clean aggregate requires forging
 * every run entry it is derived from.
 */
export function deriveAggregate(runs) {
  if (!Array.isArray(runs)) fail('runs must be an array');
  const decisionCounts = emptyDecisionCounts();
  const turnOutcomeCounts = emptyOutcomeCounts();
  let turnRoundsExecuted = 0;
  let chainVerificationFailures = 0;
  let schedulerFrozenRounds = 0;
  let crossRunStateFindings = 0;
  let runManifestSignaturesVerified = 0;
  const runIds = new Set();
  const runDirectories = new Set();
  const validatorIds = new Set();
  const byBlock = new Map();

  for (const run of runs) {
    runIds.add(run.runId);
    runDirectories.add(run.runDirectory);
    validatorIds.add(run.validatorId);
    if (run.runManifestSignatureVerified === true) runManifestSignaturesVerified += 1;
    if (run.chainVerified !== true) chainVerificationFailures += 1;
    crossRunStateFindings += Array.isArray(run.crossRunStateFindings)
      ? run.crossRunStateFindings.length
      : 1;
    addCounts(decisionCounts, run.decisionCounts, DECISION_COUNT_KEYS);
    addCounts(turnOutcomeCounts, run.turnOutcomeCounts, OUTCOME_COUNT_KEYS);
    for (const round of run.turnRounds) {
      turnRoundsExecuted += 1;
      if (round.chainVerified !== true) chainVerificationFailures += 1;
      if (round.frozen === true) schedulerFrozenRounds += 1;
    }
    if (!byBlock.has(run.blockId)) byBlock.set(run.blockId, []);
    byBlock.get(run.blockId).push(run.receiptChainRoot);
  }

  const blockChainRoots = {};
  for (const blockId of STUDY_BLOCK_IDS) {
    const roots = byBlock.get(blockId) ?? [];
    blockChainRoots[blockId] = canonicalDigest({ blockId, runChainRoots: roots });
  }

  const modelTurnsResolved =
    turnOutcomeCounts.completed + turnOutcomeCounts.failed + turnOutcomeCounts.timedOut;

  const aggregate = {
    blockChainRoots,
    chainVerificationFailures,
    crossRunStateFindings,
    decisionCounts,
    distinctRunDirectoryCount: runDirectories.size,
    distinctRunIdCount: runIds.size,
    distinctValidatorIdCount: validatorIds.size,
    modelTurnsResolved,
    rehearsalRoot: canonicalDigest({
      blockChainRoots,
      schema: REHEARSAL_RECEIPT_SCHEMA,
    }),
    runManifestSignatureFailures: runs.length - runManifestSignaturesVerified,
    runManifestSignaturesVerified,
    schedulerFrozenRounds,
    turnOutcomeCounts,
    turnRoundsExecuted,
    villageRunsExecuted: runs.length,
  };
  assertExactKeys(aggregate, AGGREGATE_KEYS, 'aggregate');
  return aggregate;
}

/**
 * Evaluates observed{} + aggregate against REHEARSAL_EXPECTATIONS and the
 * cross-bindings. Returns a list of failure strings; empty means passed.
 *
 * Called by BOTH runRehearsal (to set `passed`) and verifyRehearsalReceipt (to
 * RECOMPUTE `passed` rather than read it). Sharing this function is safe and
 * deliberate: it reads only the receipt's measured values and the independent
 * expectation table, so it cannot launder a value the receipt did not measure.
 */
export function evaluateRehearsal({ aggregate, observed, expectations = REHEARSAL_EXPECTATIONS }) {
  const failures = [];
  const expect = (label, actual, wanted) => {
    if (actual !== wanted) {
      failures.push(`${label} observed ${canonicalJson(actual)} != expected ${canonicalJson(wanted)}`);
    }
  };

  expect('observed.providerFetchCallsObserved', observed.providerFetchCallsObserved, expectations.providerFetchCallsObserved);
  expect('observed.aliasBlocksSealed', observed.aliasBlocksSealed, expectations.aliasBlocksSealed);
  expect('observed.aliasUnblindingsVerified', observed.aliasUnblindingsVerified, expectations.aliasUnblindingsVerified);
  expect('observed.aliasCommitmentVerificationFailures', observed.aliasCommitmentVerificationFailures, expectations.aliasCommitmentVerificationFailures);
  expect('observed.trustRegistryEntriesAppended', observed.trustRegistryEntriesAppended, expectations.trustRegistryEntriesAppended);
  expect('observed.trustRegistryVerified', observed.trustRegistryVerified, expectations.trustRegistryVerified);

  expect('aggregate.villageRunsExecuted', aggregate.villageRunsExecuted, expectations.villageRunsExecuted);
  expect('aggregate.turnRoundsExecuted', aggregate.turnRoundsExecuted, expectations.turnRoundsExecuted);
  expect('aggregate.modelTurnsResolved', aggregate.modelTurnsResolved, expectations.modelTurnsResolved);
  expect('aggregate.turnOutcomeCounts.completed', aggregate.turnOutcomeCounts.completed, expectations.turnsCompleted);
  expect('aggregate.turnOutcomeCounts.failed', aggregate.turnOutcomeCounts.failed, expectations.turnsFailed);
  expect('aggregate.turnOutcomeCounts.timedOut', aggregate.turnOutcomeCounts.timedOut, expectations.turnsTimedOut);
  expect('aggregate.chainVerificationFailures', aggregate.chainVerificationFailures, expectations.chainVerificationFailures);
  expect('aggregate.schedulerFrozenRounds', aggregate.schedulerFrozenRounds, expectations.schedulerFrozenRounds);
  expect('aggregate.crossRunStateFindings', aggregate.crossRunStateFindings, expectations.crossRunStateFindings);
  expect('aggregate.runManifestSignaturesVerified', aggregate.runManifestSignaturesVerified, expectations.runManifestSignaturesVerified);
  expect('aggregate.runManifestSignatureFailures', aggregate.runManifestSignatureFailures, expectations.runManifestSignatureFailures);
  expect('aggregate.distinctRunDirectoryCount', aggregate.distinctRunDirectoryCount, expectations.distinctRunDirectoryCount);
  expect('aggregate.distinctRunIdCount', aggregate.distinctRunIdCount, expectations.distinctRunIdCount);
  expect('aggregate.distinctValidatorIdCount', aggregate.distinctValidatorIdCount, expectations.distinctValidatorIdCount);

  // CROSS-BINDINGS: an out-of-band counter tied to a value derived from the
  // run entries. Flipping either one alone breaks the identity.
  //
  // The FLOOR rule below is the one that matters, and it was added because a
  // test found the hole rather than because it was anticipated: the incident
  // logs are BOUNDED at FETCH_TARGET_LOG_LIMIT entries, so an exact-equality
  // check has to be skipped once a log saturates — and a saturated log was
  // therefore a place to hide a zeroed counter. A run that recorded 432
  // provider calls could be rewritten to claim 0 while still carrying 32
  // recorded provider targets, and every other rule passed. The floor closes
  // it: a counter can never be smaller than its own incident log.
  if (observed.providerFetchCallsObserved < observed.providerFetchCallTargets.length) {
    failures.push(
      'observed.providerFetchCallsObserved is smaller than its own incident '
      + 'log; a counter can never be below the number of calls it recorded',
    );
  }
  if (observed.providerFetchCallTargets.length < FETCH_TARGET_LOG_LIMIT
    && observed.providerFetchCallsObserved !== observed.providerFetchCallTargets.length) {
    failures.push(
      'observed.providerFetchCallsObserved does not equal the number of recorded '
      + 'provider-call targets; the counter and its incident log disagree',
    );
  }
  if (observed.fetchCallsObserved < observed.nonProviderFetchCallTargets.length) {
    failures.push(
      'observed.fetchCallsObserved is smaller than its own non-provider '
      + 'incident log',
    );
  }
  if (observed.providerFetchCallsObserved > observed.fetchCallsObserved) {
    failures.push(
      'observed.providerFetchCallsObserved exceeds the total fetch calls the '
      + 'fence saw; the provider count is a subset of the total by construction',
    );
  }
  if (
    observed.fetchCallsObserved
    < observed.providerFetchCallTargets.length + observed.nonProviderFetchCallTargets.length
  ) {
    failures.push(
      'observed.fetchCallsObserved is smaller than the number of recorded fetch '
      + 'targets; the total counter and its incident logs disagree',
    );
  }
  for (const target of observed.providerFetchCallTargets) {
    if (!isProviderFetchTarget(target)) {
      failures.push(
        'a recorded provider-call target is not an absolute http(s) URL; the '
        + 'provider/non-provider classification was not applied as stated',
      );
      break;
    }
  }
  for (const target of observed.nonProviderFetchCallTargets) {
    if (isProviderFetchTarget(target)) {
      failures.push(
        'an absolute http(s) target was recorded as a NON-provider call; a '
        + 'provider call cannot be reclassified out of the gated count',
      );
      break;
    }
  }
  if (observed.custodyResponseReadsObserved !== aggregate.modelTurnsResolved) {
    failures.push(
      'observed.custodyResponseReadsObserved does not equal the number of '
      + 'resolved model turns derived from the run entries; every replayed turn '
      + 'is exactly one sealed-custody read',
    );
  }
  if (
    aggregate.decisionCounts.admitted
    !== aggregate.decisionCounts.preauthorizedMatch + aggregate.decisionCounts.noPreauthorizedMatch
  ) {
    failures.push(
      'aggregate.decisionCounts.admitted does not split into preauthorized and '
      + 'non-preauthorized admissions',
    );
  }
  if (
    aggregate.decisionCounts.admitted + aggregate.decisionCounts.denied
    !== aggregate.modelTurnsResolved
  ) {
    failures.push(
      'adjudicated decisions do not account for every resolved model turn',
    );
  }
  // Both catalog entries must actually have been exercised, or the wider
  // catalog is decorative.
  if (aggregate.decisionCounts.preauthorizedMatch <= 0) {
    failures.push('no proposal ever matched the pre-authorized action');
  }
  if (aggregate.decisionCounts.noPreauthorizedMatch <= 0) {
    failures.push(
      'the deny case was never exercised; a catalog whose second entry never '
      + 'occurs is decorative width',
    );
  }
  return failures;
}

/**
 * Executes the twelve-run dress rehearsal.
 *
 * Run-day lifecycle (plan lines 764-782) per village-run, in order:
 *   (1) verify source/policy/kernel/vocabulary/assignment hashes  [study load]
 *   (4) validate and seal only the next run manifest              [sign + fleet-verify]
 *   (5) clone a clean shard and prove no cross-run state          [measured]
 *   (6) stage six unique resident and seat IDs                    [seat bindings]
 *   (7) execute with no prompt edits, fallback, or enhancement    [frozen template]
 *   (8) close the run and verify receipt completeness + chain root
 *   (9) replay captured responses                                 [layer 2]
 *  (10) tear down the shard
 *  (11) decide integrity disposition while outcomes stay blinded
 *
 * `runLimit` exists ONLY for a bounded smoke (a fast structural probe of the
 * composition) and it cannot forge a full rehearsal: the twelve-run plan is
 * still built and validated at twelve before it is sliced, and a receipt with
 * fewer than twelve runs is REFUSED by verifyRehearsalReceipt under the default
 * REHEARSAL_EXPECTATIONS — aggregate.villageRunsExecuted is derived from
 * receipt.runs.length, so a short run is self-identifying and no caller can
 * pass one off as the acceptance artifact.
 */
export async function runRehearsal({
  hololandRoot = defaultHololandRoot(),
  scratchRoot = null,
  operator = 'model-village-run-conductor',
  turnExecutorFactory = null,
  writeReceipt = true,
  runLimit = null,
  expectations = REHEARSAL_EXPECTATIONS,
} = {}) {
  const startedAtMs = Date.now();
  const root = path.resolve(hololandRoot);
  // `ownsScratchRoot` decides who is responsible for destroying the tree. A
  // caller-supplied scratchRoot belongs to the caller (the test suite cleans up
  // its own base); a path this function invented belongs to this function.
  const ownsScratchRoot = !scratchRoot;
  const scratch = scratchRoot
    ? path.resolve(scratchRoot)
    : path.join(root, '.tmp', 'hololand', 'model-village', `rehearsal-${Date.now().toString(36)}`);

  const fence = installProviderCallFence();
  const readCounter = { reads: 0 };
  let runDirectoryPreexistingRefusals = 0;
  let aliasBlocksSealed = 0;
  let aliasUnblindingsVerified = 0;
  let aliasCommitmentVerificationFailures = 0;
  let trustRegistryEntriesAppended = 0;
  let trustRegistryVerified = false;
  const runEntries = [];
  const teardowns = [];
  let studyCustody = null;

  try {
    const studyBundle = await loadStudyPolicyManifest({ hololandRoot: root });
    // The FULL plan is built and validated at twelve first, every time. The
    // slice below never reaches buildVillageRunPlan's own twelve-run law.
    const fullPlan = buildVillageRunPlan(studyBundle);
    if (runLimit !== null) {
      if (!Number.isInteger(runLimit) || runLimit < 1 || runLimit > fullPlan.length) {
        fail(
          `runLimit must be an integer in 1..${fullPlan.length} when supplied; `
          + `received ${canonicalJson(runLimit)}`,
        );
      }
    }
    const plan = runLimit === null ? fullPlan : fullPlan.slice(0, runLimit);
    const matrixBundle = loadFrozenAssignmentMatrix({ hololandRoot: root });
    const publicSnapshot = JSON.parse(studyBundle.snapshotFixture.publicState);

    // Study-level custody: the alias-assignment vault is a STUDY secret held
    // across runs by the data custodian, not per-run state. Per-run stores
    // (below) hold only the run's own material.
    mkdirSync(scratch, { recursive: true });
    studyCustody = createSealedCustodyStore({
      operator,
      retentionPolicy: {
        description:
          'Model Village T-7 rehearsal study custody; sealed alias assignment '
          + 'only, deletable by content-key destruction at any time.',
        frozenAt: new Date().toISOString(),
        policyId: 'mv-study-rehearsal-custody-retention-v1',
      },
      rootDir: path.join(scratch, 'study-custody'),
      runLabel: 'mv-study-rehearsal',
    });

    const routes = studyBundle.routes;
    const certifications = routes.map((route) => buildRehearsalCertification({
      promptTemplate: studyBundle.promptTemplate,
      route,
    }));
    const certificationByRoute = new Map(
      routes.map((route, index) => [route.routeId, certifications[index]]),
    );

    // MV-B3: seal one alias -> route assignment per block. The map is drawn
    // with a CSPRNG because the vault's own precondition requires an assignment
    // that is NOT a deterministic function of public source.
    const aliasCommitments = new Map();
    const aliasRouteMaps = new Map();
    for (const blockId of STUDY_BLOCK_IDS) {
      const aliasRouteMap = Object.fromEntries(
        STUDY_ALIASES.map((alias) => [alias, routes[randomInt(routes.length)].routeId]),
      );
      const commitment = sealAliasAssignment({
        allowRouteReuse: true,
        aliasRouteMap,
        blockId,
        certifications,
        custodyStore: studyCustody,
        matrixBundle,
        operator,
      });
      const check = verifyAliasAssignmentCommitment(commitment);
      if (!check.ok) aliasCommitmentVerificationFailures += 1;
      aliasCommitments.set(blockId, commitment);
      aliasRouteMaps.set(blockId, aliasRouteMap);
      aliasBlocksSealed += 1;
    }

    // MV-B4 publication half: ONE local trust registry for the rehearsal, with
    // a provision entry per village-run validator. This is the first
    // production consumer of scripts/model-village-trust-registry.mjs.
    const registryPath = path.join(scratch, 'trust-registry', 'study-trust-registry.json');
    const trustRegistryHandle = createTrustRegistry({
      operator,
      registryId: 'mv-study-rehearsal-trust-registry',
      registryPath,
    });
    // MV-B4 custody half: the in-memory validator record registry the custody
    // lane requires.
    const custodyRegistry = createValidatorTrustRegistry({
      operator,
      registryId: 'mv-study-rehearsal-registry',
    });

    const studyConfigHash = canonicalDigest({
      drillManifestHash: studyBundle.drillManifestHash,
      policyId: studyBundle.policy.policyId,
      schedulerPolicyHash: studyBundle.schedulerPolicyBundle.policyHash,
      studyManifestHash: studyBundle.studyManifestHash,
    });
    const fleetVerifier = createStudyFleetVerifier({ studyConfigHash });

    const nowMs = Date.now();
    const notBefore = new Date(nowMs - 3_600_000).toISOString();
    const notAfter = new Date(nowMs + 86_400_000).toISOString();

    for (const planned of plan) {
      const { blockId, condition, conditionIndex, dayIndex, runId } = planned;
      const crossRunStateFindings = [];

      // (5) Clone a clean shard. provisionIsolatedRun REFUSES a pre-existing
      // run directory by construction, so reuse fails loud rather than leaking
      // state; the emptiness of the fresh shard is then MEASURED, not assumed.
      let context;
      try {
        context = provisionIsolatedRun({
          hololandRoot: root,
          operator,
          runId,
          scratchRoot: scratch,
        });
      } catch (error) {
        runDirectoryPreexistingRefusals += 1;
        throw error;
      }
      teardowns.push(context);
      if (readdirSync(context.storeDir).length !== 0) {
        crossRunStateFindings.push('persistent store directory was not empty at provision');
      }
      if (context.custodyStore.listObjects().length !== 0) {
        crossRunStateFindings.push('sealed custody store was not empty at provision');
      }
      if (runEntries.some((entry) => entry.runDirectory === path.join(scratch, runId))) {
        crossRunStateFindings.push('run directory collides with an earlier run');
      }

      // (9) Seal this run's captured responses into ITS OWN store. Replay then
      // reads them back out of custody, one read per turn.
      const seatBindings = buildSeatAliasBindings({
        blockId,
        condition,
        matrix: matrixBundle.matrix,
      });
      const residentIds = seatBindings.map((binding) => binding.residentId);
      const promptBytes = Buffer.from(
        JSON.stringify({
          messages: [{ content: studyBundle.promptTemplate, role: 'user' }],
          runId,
        }),
        'utf8',
      );
      const requestCustodyId = context.custodyStore.sealObject({
        bytes: promptBytes,
        kind: 'model-turn-request',
        label: `${runId}:turn-request`,
      }).custodyId;
      const promptHash = sha256Hex(promptBytes);

      const captureIndex = new Map();
      for (const capture of buildRunCaptures({
        blockId,
        condition,
        residentIds,
        runId,
        turnsPerRun: studyBundle.policy.turnsPerRun,
      })) {
        const sealed = context.custodyStore.sealObject({
          bytes: capture.bytes,
          kind: 'model-turn-response',
          label: `${capture.responseId}:raw`,
        });
        captureIndex.set(`t${capture.turnIndex}|${capture.residentId}`, Object.freeze({
          promptHash,
          requestCustodyId,
          responseCustodyId: sealed.custodyId,
          responseHash: sha256Hex(capture.bytes),
        }));
      }

      // MV-B4: provision this run's validator key INTO the run's sealed store.
      const validatorId = `mv-study-val-${blockId}-${conditionSlug(condition)}`;
      const provision = provisionValidatorKey({
        custodyStore: context.custodyStore,
        notAfter,
        notBefore,
        operator,
        trustRegistry: custodyRegistry,
        validatorId,
      });
      trustRegistryHandle.appendEntry({
        kind: 'provision',
        notAfter,
        notBefore,
        operator,
        publicKeyPem: provision.publicKeyPem,
        sourceReceiptHash: provision.receipt.receiptHash,
        validatorId,
      });
      trustRegistryEntriesAppended += 1;

      // (4) Validate and seal only the NEXT run manifest — the conductor's own
      // village run manifest, which is the artifact MV-B4's key signs.
      const aliasCommitment = aliasCommitments.get(blockId);
      const runManifest = deepFreeze({
        assignmentManifestHash: aliasCommitment.assignmentManifestHash,
        aliasCommitmentReceiptHash: aliasCommitment.receiptHash,
        blockId,
        condition,
        conditionIndex,
        dayIndex,
        drillManifestHash: studyBundle.drillManifestHash,
        engine: CONDUCTOR_ENGINE,
        kernelSourceHash: matrixBundle.kernelSourceHash,
        promptTemplateHash: sourceDigest(studyBundle.promptTemplate),
        residentsPerTurn: studyBundle.policy.residentsPerTurn,
        runId,
        schema: RUN_MANIFEST_SCHEMA,
        seatBindings: seatBindings.map((binding) => ({ ...binding })),
        snapshotHash: canonicalDigest(publicSnapshot),
        studyManifestHash: studyBundle.studyManifestHash,
        studyPolicyHash: studyBundle.schedulerPolicyBundle.policyHash,
        turnsPerRun: studyBundle.policy.turnsPerRun,
        vocabularyHash: studyBundle.vocabularyHash,
      });
      const runManifestHash = canonicalDigest(runManifest);
      const signature = signStudyRunManifest({
        custodyStore: context.custodyStore,
        manifest: runManifest,
        privateKeyCustodyId: provision.receipt.privateKeyCustodyId,
        studyConfigHash,
      });
      const fleetResult = verifyRunManifestAgainstRegistry({
        manifest: runManifest,
        registrySnapshot: trustRegistryHandle.snapshot(),
        signature,
        signedAt: new Date().toISOString(),
        validatorId,
        verifySignature: fleetVerifier.verifySignature,
      });

      // (6) Stage six unique resident and seat IDs. The route object carries a
      // `studySeat` extension so the replay executor can identify which seat a
      // dispatch belongs to — the scheduler passes a structuredClone, so object
      // identity is not preserved and the seat must travel in the value. The
      // extension carries the residentId and seatId (public) and never the
      // alias -> route map (sealed).
      const aliasRouteMap = aliasRouteMaps.get(blockId);
      const residents = seatBindings.map((binding) => {
        const routeId = aliasRouteMap[binding.adapterAlias];
        const route = routes.find((candidate) => candidate.routeId === routeId);
        if (!route) fail('sealed alias assignment names an undeclared route');
        return {
          certification: certificationByRoute.get(routeId),
          residentId: binding.residentId,
          route: {
            ...structuredClone(route),
            studySeat: { residentId: binding.residentId, seatId: binding.seatId },
          },
        };
      });

      const turnCursor = { index: 1 };
      const buildExecutor = turnExecutorFactory ?? (() => createReplayTurnExecutor({
        captureIndex,
        readCounter,
        turnCursor,
        vocabulary: studyBundle.vocabulary,
      }));
      const executor = buildExecutor({
        captureIndex,
        readCounter,
        runId,
        turnCursor,
        vocabulary: studyBundle.vocabulary,
      });
      // The conductor hands the counting fence DOWN to every executor call.
      const schedulerExecutor = (args) => executor({ ...args, fetchImpl: fence.fetch });

      const scheduler = createTurnScheduler({
        custodyStore: context.custodyStore,
        operator,
        policyBundle: studyBundle.schedulerPolicyBundle,
        residents,
        turnExecutor: schedulerExecutor,
      });

      // (7)+(8) Six deterministic turns as six hash-chained rounds. Round 1
      // chains from the SIGNED run manifest hash, so the whole adjudication
      // chain is anchored on the artifact MV-B4's key attested.
      let chainPrior = runManifestHash;
      const turnRounds = [];
      const runDecisionCounts = emptyDecisionCounts();
      const runOutcomeCounts = emptyOutcomeCounts();
      let runChainVerified = true;

      for (let turnIndex = 1; turnIndex <= studyBundle.policy.turnsPerRun; turnIndex += 1) {
        turnCursor.index = turnIndex;
        const roundRunId = `${runId}-r${turnIndex}`;
        let round;
        try {
          round = await scheduler.executeTurnRound({
            priorReceiptHash: chainPrior,
            publicSnapshot,
            runId: roundRunId,
          });
        } catch (error) {
          fail(`turn round ${roundRunId} did not complete: ${error?.message ?? error}`);
        }
        const chainCheck = verifyRoundReceiptChain({
          actionDecisionReceipts: round.actionDecisionReceipts,
          barrierReceipt: round.barrierReceipt,
          safetyCheckReceipts: round.safetyCheckReceipts,
        });
        const chainVerified = chainCheck.ok === true
          && round.barrierReceipt.priorReceiptHash === chainPrior;
        if (!chainVerified) runChainVerified = false;

        const roundDecisions = emptyDecisionCounts();
        for (const decision of round.actionDecisionReceipts) {
          if (decision.decision === 'admit') {
            roundDecisions.admitted += 1;
            if (decision.preauthorizedMatch === true) roundDecisions.preauthorizedMatch += 1;
            else roundDecisions.noPreauthorizedMatch += 1;
          } else {
            roundDecisions.denied += 1;
          }
        }
        addCounts(runDecisionCounts, roundDecisions, DECISION_COUNT_KEYS);
        addCounts(runOutcomeCounts, {
          completed: round.barrierReceipt.resolvedCounts.completed,
          failed: round.barrierReceipt.resolvedCounts.failed,
          timedOut: round.barrierReceipt.resolvedCounts.timedOut,
        }, OUTCOME_COUNT_KEYS);

        const terminalReceiptHash = round.actionDecisionReceipts.length > 0
          ? round.actionDecisionReceipts[round.actionDecisionReceipts.length - 1].receiptHash
          : round.barrierReceipt.barrierHash;
        turnRounds.push(Object.freeze({
          barrierHash: round.barrierReceipt.barrierHash,
          chainVerified,
          decisionCounts: roundDecisions,
          frozen: round.barrierReceipt.frozen === true,
          priorReceiptHash: chainPrior,
          resolvedCounts: { ...round.barrierReceipt.resolvedCounts },
          roundRunId,
          terminalReceiptHash,
          turnIndex,
        }));
        chainPrior = terminalReceiptHash;
      }

      const receiptChainRoot = canonicalDigest({
        roundTerminalHashes: turnRounds.map((round) => round.terminalReceiptHash),
        runId,
      });

      runEntries.push(sealHashed({
        aliasCommitmentReceiptHash: aliasCommitment.receiptHash,
        blockId,
        chainVerified: runChainVerified,
        condition,
        conditionIndex,
        crossRunStateFindings,
        dayIndex,
        decisionCounts: runDecisionCounts,
        receiptChainRoot,
        runDirectory: path.join(scratch, runId),
        runId,
        runManifestHash,
        runManifestSignatureVerified: fleetResult.ok === true
          && fleetResult.manifestHash === runManifestHash,
        schema: REHEARSAL_RUN_ENTRY_SCHEMA,
        seatBindingHash: canonicalDigest(seatBindings.map((b) => ({ ...b }))),
        turnOutcomeCounts: runOutcomeCounts,
        turnRounds,
        validatorId,
      }, 'entryHash'));

      // (10) Tear down the shard.
      context.teardown();
    }

    // (11) Integrity disposition. The sealed alias assignment is opened ONLY
    // now, per block, with the block's own receipt-chain root as the terminal
    // commitment — the strongest available proof that the vault round-trips:
    // MV-B3 re-derives every public commitment from the sealed record and
    // refuses to reveal on any mismatch. The revealed map is deliberately
    // DISCARDED; it never reaches a variable that outlives this block.
    const draftAggregate = deriveAggregate(runEntries);
    for (const blockId of STUDY_BLOCK_IDS) {
      const commitment = aliasCommitments.get(blockId);
      const { receipt } = issueUnblindingReceipt({
        authorization: {
          dataCustodian: 'rehearsal-data-custodian',
          protocolLead: 'rehearsal-protocol-lead',
        },
        commitment,
        custodyStore: studyCustody,
        operator,
        terminalCommitment: {
          assignmentManifestHash: commitment.assignmentManifestHash,
          canonicalHash: draftAggregate.blockChainRoots[blockId],
          commitmentId: commitment.receiptHash,
          runId: `mv-b3-${blockId}`,
        },
      });
      if (
        verifyUnblindingReceipt(receipt).ok === true
        && receipt.failNeutral === false
        && receipt.aliasCommitmentsVerified === true
      ) {
        aliasUnblindingsVerified += 1;
      }
    }

    trustRegistryVerified = verifyTrustRegistry(trustRegistryHandle.snapshot()).ok === true;
    trustRegistryHandle.close();

    const aggregate = deriveAggregate(runEntries);
    const observed = {
      aliasBlocksSealed,
      aliasCommitmentVerificationFailures,
      aliasUnblindingsVerified,
      custodyResponseReadsObserved: readCounter.reads,
      fetchCallsObserved: fence.state.calls,
      nonProviderFetchCallTargets: [...fence.state.nonProviderTargets],
      providerFetchCallTargets: [...fence.state.providerTargets],
      providerFetchCallsObserved: fence.state.providerCalls,
      rehearsalWallClockMs: Math.max(0, Date.now() - startedAtMs),
      runDirectoryPreexistingRefusals,
      trustRegistryEntriesAppended,
      trustRegistryVerified,
    };
    assertExactKeys(observed, OBSERVED_KEYS, 'observed');

    const failures = evaluateRehearsal({ aggregate, expectations, observed });
    const receipt = sealHashed({
      aggregate,
      declared: buildDeclaredBoundary(failures),
      engine: CONDUCTOR_ENGINE,
      generatedAt: new Date().toISOString(),
      observed,
      passed: failures.length === 0,
      runs: runEntries,
      schema: REHEARSAL_RECEIPT_SCHEMA,
      studyManifestHash: studyBundle.studyManifestHash,
      studyPolicyId: studyBundle.policy.policyId,
    }, 'receiptHash');

    if (writeReceipt) {
      const outputPath = path.join(root, ...REHEARSAL_RECEIPT_OUTPUT_PATH.split('/'));
      mkdirSync(path.dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, `${canonicalJson(receipt)}\n`, 'utf8');
    }
    return deepFreeze({ failures, receipt, scratchRoot: scratch });
  } finally {
    for (const context of teardowns) {
      try {
        context.teardown();
      } catch {
        // Teardown is best effort; the run's evidence is already recorded.
      }
    }
    try {
      if (studyCustody) studyCustody.close();
    } catch {
      // As above.
    }
    // CUSTODY HYGIENE, found by looking at the disk after a run rather than by
    // reading the teardown code. context.teardown() and custodyStore.close()
    // release handles; NEITHER removes the store. A completed rehearsal was
    // therefore leaving, per village-run, the sealed objects, the sealed
    // validator PKCS8, AND custody/key/content-key.bin — the decryption key
    // sitting in the same tree as the ciphertext it opens (measured 2026-07-27:
    // 958 files, ~718 KB per rehearsal, one tree accumulating per invocation).
    // A sealed store whose content key is left beside it is not sealed against
    // anyone with filesystem access, so the tree this function created is
    // destroyed here.
    //
    // Best-effort by necessity — Windows can hold a handle briefly after
    // teardown — and deliberately NOT a claim: the checker measures whether the
    // directory is actually gone and fails if it is not, so a silent failure
    // here cannot pass as success.
    if (ownsScratchRoot) {
      try {
        rmSync(scratch, { force: true, recursive: true });
      } catch {
        // Measured by the checker, never asserted here.
      }
    }
    fence.restore();
  }
}

/**
 * declared{} — author assertions, EXPLICITLY NON-LOAD-BEARING.
 *
 * Not one value here is evidence. They exist so a reader does not have to infer
 * the boundary from prose, and verifyRehearsalReceipt checks only their SHAPE
 * and that they do not shadow an observed key. `failureSummary` is a bounded
 * projection of the evaluation, kept here rather than in observed{} precisely
 * because it is prose.
 */
function buildDeclaredBoundary(failures) {
  return {
    capturedResponseProvenance: 'rehearsal-fixture-sealed-into-run-custody',
    certificationProvenance: 'rehearsal-fixture-not-live-probe',
    failureSummary: failures.slice(0, 8).map((entry) => entry.slice(0, 200)),
    laneStatement:
      'T-7 dress rehearsal of the study-lane run-day lifecycle against captured '
      + 'responses. Every value in observed{} and aggregate{} is measured or '
      + 'derived from execution; every value in declared{} is an author '
      + 'assertion and is not evidence for anything.',
    liveStudyRunClaimed: false,
    modelTurnReceiptProvenance: 'conductor-replay-executor-not-live-provider',
    openOutcomeTierClaimed: false,
    operationalBlindingProven: false,
    phase1AdmissionClaimed: false,
    providerCallMeasurementScope:
      'globalThis.fetch plus the injected fetchImpl handle, for the whole '
      + 'rehearsal. A call is counted as a PROVIDER call only when its target is '
      + 'an absolute http(s) URL; every other call is counted and published in '
      + 'nonProviderFetchCallTargets. Raw node:http/https sockets, child '
      + 'processes, and references to fetch captured before the fence was '
      + 'installed are OUT of scope and are not measured.',
    tamperProofReceiptClaimed: false,
    worldMutationPerformedClaimed: false,
  };
}

const DECLARED_KEYS = Object.freeze([
  'capturedResponseProvenance',
  'certificationProvenance',
  'failureSummary',
  'laneStatement',
  'liveStudyRunClaimed',
  'modelTurnReceiptProvenance',
  'openOutcomeTierClaimed',
  'operationalBlindingProven',
  'phase1AdmissionClaimed',
  'providerCallMeasurementScope',
  'tamperProofReceiptClaimed',
  'worldMutationPerformedClaimed',
]);

// ---------------------------------------------------------------------------
// Receipt verification — the gate that bites
// ---------------------------------------------------------------------------

/**
 * Verifies a rehearsal receipt.
 *
 * The load-bearing steps, in order:
 *  1. closed keys + schema/engine pins on the receipt, every run, every round;
 *  2. every run entryHash recomputes;
 *  3. the ENTIRE aggregate is RE-DERIVED from receipt.runs and must match —
 *     so no aggregate field is independently writable;
 *  4. observed{} + aggregate{} are checked against the INDEPENDENT
 *     REHEARSAL_EXPECTATIONS table and the cross-bindings;
 *  5. `passed` is RECOMPUTED from (4), never read;
 *  6. declared{} may not shadow an observed key, and every declared
 *     did-not-happen flag must be false;
 *  7. the receiptHash recomputes.
 *
 * A field edited without re-hashing fails at (7). A field edited AND re-signed
 * fails at (3), (4) or (5) — which is the property the lane's other claim
 * boundaries did not have.
 */
export function verifyRehearsalReceipt(receipt, { expectations = REHEARSAL_EXPECTATIONS } = {}) {
  try {
    assertExactKeys(receipt, REHEARSAL_RECEIPT_KEYS, 'rehearsal receipt');
    if (receipt.schema !== REHEARSAL_RECEIPT_SCHEMA) {
      fail(`rehearsal receipt schema is not ${REHEARSAL_RECEIPT_SCHEMA}`);
    }
    if (receipt.engine !== CONDUCTOR_ENGINE) {
      fail(`rehearsal receipt engine is not ${CONDUCTOR_ENGINE}`);
    }
    if (typeof receipt.generatedAt !== 'string' || !ISO_UTC_PATTERN.test(receipt.generatedAt)) {
      fail('rehearsal receipt generatedAt must be an ISO UTC timestamp');
    }
    assertSha256(receipt.studyManifestHash, 'studyManifestHash');
    assertNonEmptyString(receipt.studyPolicyId, 'studyPolicyId');
    if (receipt.studyPolicyId !== 'mv-study-policy-v1') {
      fail('rehearsal receipt is not governed by mv-study-policy-v1');
    }
    if (typeof receipt.passed !== 'boolean') {
      fail('rehearsal receipt passed must be boolean');
    }
    if (!Array.isArray(receipt.runs)) fail('rehearsal receipt runs must be an array');

    // (1)+(2) per-run and per-round structure, with self-hash recompute.
    for (const [index, run] of receipt.runs.entries()) {
      const label = `runs[${index}]`;
      assertExactKeys(run, REHEARSAL_RUN_KEYS, label);
      if (run.schema !== REHEARSAL_RUN_ENTRY_SCHEMA) {
        fail(`${label} schema is not ${REHEARSAL_RUN_ENTRY_SCHEMA}`);
      }
      if (!STUDY_BLOCK_IDS.includes(run.blockId)) fail(`${label} blockId is not a study block`);
      if (!STUDY_CONDITIONS.includes(run.condition)) {
        fail(`${label} condition is not a study condition`);
      }
      assertNonEmptyString(run.runId, `${label}.runId`);
      if (!RUN_ID_PATTERN.test(run.runId)) fail(`${label}.runId violates the runId law`);
      assertSha256(run.runManifestHash, `${label}.runManifestHash`);
      assertSha256(run.receiptChainRoot, `${label}.receiptChainRoot`);
      assertSha256(run.seatBindingHash, `${label}.seatBindingHash`);
      assertSha256(run.aliasCommitmentReceiptHash, `${label}.aliasCommitmentReceiptHash`);
      assertNonEmptyString(run.validatorId, `${label}.validatorId`);
      assertNonEmptyString(run.runDirectory, `${label}.runDirectory`);
      if (typeof run.chainVerified !== 'boolean') fail(`${label}.chainVerified must be boolean`);
      if (typeof run.runManifestSignatureVerified !== 'boolean') {
        fail(`${label}.runManifestSignatureVerified must be boolean`);
      }
      if (!Array.isArray(run.crossRunStateFindings)) {
        fail(`${label}.crossRunStateFindings must be an array`);
      }
      assertExactKeys(run.decisionCounts, DECISION_COUNT_KEYS, `${label}.decisionCounts`);
      assertExactKeys(run.turnOutcomeCounts, OUTCOME_COUNT_KEYS, `${label}.turnOutcomeCounts`);
      for (const key of DECISION_COUNT_KEYS) {
        assertNonNegativeInteger(run.decisionCounts[key], `${label}.decisionCounts.${key}`);
      }
      for (const key of OUTCOME_COUNT_KEYS) {
        assertNonNegativeInteger(run.turnOutcomeCounts[key], `${label}.turnOutcomeCounts.${key}`);
      }
      if (!Array.isArray(run.turnRounds)) fail(`${label}.turnRounds must be an array`);
      const roundDecisionTotals = emptyDecisionCounts();
      const roundOutcomeTotals = emptyOutcomeCounts();
      for (const [roundIndex, round] of run.turnRounds.entries()) {
        const roundLabel = `${label}.turnRounds[${roundIndex}]`;
        assertExactKeys(round, REHEARSAL_ROUND_KEYS, roundLabel);
        if (round.turnIndex !== roundIndex + 1) {
          fail(`${roundLabel}.turnIndex is not contiguous from 1`);
        }
        assertSha256(round.barrierHash, `${roundLabel}.barrierHash`);
        assertSha256(round.priorReceiptHash, `${roundLabel}.priorReceiptHash`);
        assertSha256(round.terminalReceiptHash, `${roundLabel}.terminalReceiptHash`);
        assertNonEmptyString(round.roundRunId, `${roundLabel}.roundRunId`);
        if (typeof round.chainVerified !== 'boolean') {
          fail(`${roundLabel}.chainVerified must be boolean`);
        }
        if (typeof round.frozen !== 'boolean') fail(`${roundLabel}.frozen must be boolean`);
        assertExactKeys(round.resolvedCounts, OUTCOME_COUNT_KEYS, `${roundLabel}.resolvedCounts`);
        assertExactKeys(round.decisionCounts, DECISION_COUNT_KEYS, `${roundLabel}.decisionCounts`);
        // The round chain must be linear: round 1 anchors on the signed run
        // manifest hash, round n+1 on round n's terminal receipt.
        const expectedPrior = roundIndex === 0
          ? run.runManifestHash
          : run.turnRounds[roundIndex - 1].terminalReceiptHash;
        if (round.priorReceiptHash !== expectedPrior) {
          fail(
            `${roundLabel} does not chain from `
            + `${roundIndex === 0 ? 'the signed run manifest' : 'the previous round'}`,
          );
        }
        addCounts(roundDecisionTotals, round.decisionCounts, DECISION_COUNT_KEYS);
        addCounts(roundOutcomeTotals, round.resolvedCounts, OUTCOME_COUNT_KEYS);
      }
      // The run's own totals must be the sum of its rounds — a run entry
      // cannot restate a total its rounds do not support.
      if (canonicalJson(roundDecisionTotals) !== canonicalJson(run.decisionCounts)) {
        fail(`${label}.decisionCounts does not equal the sum of its rounds`);
      }
      if (canonicalJson(roundOutcomeTotals) !== canonicalJson(run.turnOutcomeCounts)) {
        fail(`${label}.turnOutcomeCounts does not equal the sum of its rounds`);
      }
      if (run.receiptChainRoot !== canonicalDigest({
        roundTerminalHashes: run.turnRounds.map((round) => round.terminalReceiptHash),
        runId: run.runId,
      })) {
        fail(`${label}.receiptChainRoot does not recompute from its round chain`);
      }
      const { entryHash, ...unsignedRun } = run;
      assertSha256(entryHash, `${label}.entryHash`);
      if (canonicalDigest(unsignedRun) !== entryHash) {
        fail(`${label}.entryHash does not recompute`);
      }
    }

    // (3) the aggregate is DERIVED, never read.
    assertExactKeys(receipt.aggregate, AGGREGATE_KEYS, 'aggregate');
    const derived = deriveAggregate(receipt.runs);
    if (canonicalJson(derived) !== canonicalJson(receipt.aggregate)) {
      fail(
        'aggregate does not re-derive from the per-run entries; a rehearsal '
        + 'aggregate is never an independently writable field',
      );
    }

    // (4) observed{} shape, then the independent expectation table.
    assertExactKeys(receipt.observed, OBSERVED_KEYS, 'observed');
    const observed = receipt.observed;
    for (const key of [
      'aliasBlocksSealed',
      'aliasCommitmentVerificationFailures',
      'aliasUnblindingsVerified',
      'custodyResponseReadsObserved',
      'fetchCallsObserved',
      'providerFetchCallsObserved',
      'rehearsalWallClockMs',
      'runDirectoryPreexistingRefusals',
      'trustRegistryEntriesAppended',
    ]) {
      assertNonNegativeInteger(observed[key], `observed.${key}`);
    }
    if (typeof observed.trustRegistryVerified !== 'boolean') {
      fail('observed.trustRegistryVerified must be boolean');
    }
    for (const key of ['nonProviderFetchCallTargets', 'providerFetchCallTargets']) {
      if (!Array.isArray(observed[key]) || observed[key].some((entry) => typeof entry !== 'string')) {
        fail(`observed.${key} must be an array of strings`);
      }
    }

    // (6) declared{} may not shadow observed{} or aggregate{}, and every
    // did-not-happen flag must stay false.
    assertExactKeys(receipt.declared, DECLARED_KEYS, 'declared');
    for (const key of Object.keys(receipt.declared)) {
      if (OBSERVED_KEYS.includes(key) || AGGREGATE_KEYS.includes(key)) {
        fail(`declared.${key} shadows a measured key; declared values are never evidence`);
      }
    }
    for (const flag of [
      'liveStudyRunClaimed',
      'openOutcomeTierClaimed',
      'operationalBlindingProven',
      'phase1AdmissionClaimed',
      'tamperProofReceiptClaimed',
      'worldMutationPerformedClaimed',
    ]) {
      if (receipt.declared[flag] !== false) {
        fail(`declared.${flag} is a pinned claim flag and must be false`);
      }
    }

    // (5) RECOMPUTE passed. Never read it.
    const failures = evaluateRehearsal({
      aggregate: receipt.aggregate,
      expectations,
      observed,
    });
    if (receipt.passed !== (failures.length === 0)) {
      fail(
        `rehearsal receipt passed=${receipt.passed} does not match the `
        + `recomputed verdict (${failures.length} expectation failure(s)`
        + `${failures.length > 0 ? `: ${failures[0]}` : ''})`,
      );
    }

    // (7) self-hash last, so a structural or claim failure is reported as
    // itself rather than as an incidental hash mismatch.
    const { receiptHash, ...unsigned } = receipt;
    assertSha256(receiptHash, 'rehearsal receipt receiptHash');
    if (canonicalDigest(unsigned) !== receiptHash) {
      fail('rehearsal receipt receiptHash does not recompute');
    }
    return { failureReason: null, failures, ok: true };
  } catch (error) {
    return {
      failureReason: error?.message ?? String(error),
      failures: null,
      ok: false,
    };
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const result = await runRehearsal({});
  const verification = verifyRehearsalReceipt(result.receipt);
  const summary = {
    aggregate: result.receipt.aggregate,
    observed: result.receipt.observed,
    passed: result.receipt.passed,
    receiptHash: result.receipt.receiptHash,
    verified: verification.ok,
    verifyFailureReason: verification.failureReason,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (result.receipt.passed !== true || verification.ok !== true) {
    for (const failure of result.failures) process.stderr.write(`${failure}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
