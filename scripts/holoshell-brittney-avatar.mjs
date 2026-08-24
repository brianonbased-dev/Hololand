#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_VERSION = 'hololand.holoshell.brittney-avatar.v0.1.0';
const DAIMON_SCHEMA_VERSION = 'hololand.holoshell.daimon-avatar.v0.1.0';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_HOLOSCRIPT_ROOT = process.env.HOLOSCRIPT_REPO || path.resolve(REPO_ROOT, '..', 'HoloScript');
const DEFAULT_OUTPUT = path.join('.tmp', 'holoshell', 'brittney-avatar.json');
const DEFAULT_JS_OUTPUT = path.join('.tmp', 'holoshell', 'brittney-avatar.js');
const DEFAULT_DAIMON_OUTPUT = path.join('.tmp', 'holoshell', 'daimon-avatar.json');
const DEFAULT_DAIMON_JS_OUTPUT = path.join('.tmp', 'holoshell', 'daimon-avatar.js');
const DEFAULT_TMP = path.join('.tmp', 'holoshell');

function parseArgs(argv) {
  const args = {
    json: false,
    selfTest: false,
    holoscriptRoot: DEFAULT_HOLOSCRIPT_ROOT,
    tmpDir: DEFAULT_TMP,
    output: DEFAULT_OUTPUT,
    jsOutput: DEFAULT_JS_OUTPUT,
    daimonOutput: DEFAULT_DAIMON_OUTPUT,
    daimonJsOutput: DEFAULT_DAIMON_JS_OUTPUT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') args.json = true;
    else if (arg === '--self-test') args.selfTest = true;
    else if (arg === '--holoscript-root') args.holoscriptRoot = argv[++index];
    else if (arg === '--tmp-dir') args.tmpDir = argv[++index];
    else if (arg === '--output') args.output = argv[++index];
    else if (arg === '--js-output') args.jsOutput = argv[++index];
    else if (arg === '--daimon-output') args.daimonOutput = argv[++index];
    else if (arg === '--daimon-js-output') args.daimonJsOutput = argv[++index];
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`HoloShell Brittney avatar manifest

Usage:
  node scripts/holoshell-brittney-avatar.mjs [options]

Options:
  --json                       Print manifest JSON.
  --self-test                  Assert manifest invariants.
  --holoscript-root <path>     HoloScript repo path. Defaults to sibling repo or HOLOSCRIPT_REPO.
  --tmp-dir <path>             Read HoloShell feed context. Defaults to .tmp/holoshell.
  --output <path>              Write JSON output. Defaults to .tmp/holoshell/brittney-avatar.json.
  --js-output <path>           Write browser bootstrap JS. Defaults to .tmp/holoshell/brittney-avatar.js.
  -h, --help                   Show this help.
`);
}

function resolveRepoPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(REPO_ROOT, filePath);
}

function resolveHoloScriptPath(root, filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
}

function readJson(filePath, fallback = null) {
  const resolved = resolveRepoPath(filePath);
  if (!existsSync(resolved)) return fallback;
  try {
    return JSON.parse(readFileSync(resolved, 'utf8'));
  } catch (error) {
    return {
      schemaVersion: 'hololand.holoshell.read-error.v0.1.0',
      generatedAt: new Date().toISOString(),
      path: resolved,
      error: error.message,
    };
  }
}

function readHoloScriptJson(root, filePath, fallback = null) {
  const resolved = resolveHoloScriptPath(root, filePath);
  if (!existsSync(resolved)) return fallback;
  try {
    return JSON.parse(readFileSync(resolved, 'utf8'));
  } catch (error) {
    return {
      error: error.message,
      path: resolved,
    };
  }
}

function readText(root, filePath) {
  const resolved = resolveHoloScriptPath(root, filePath);
  return existsSync(resolved) ? readFileSync(resolved, 'utf8') : '';
}

function fileAnchor(root, filePath) {
  const resolved = resolveHoloScriptPath(root, filePath);
  return {
    path: filePath,
    absolutePath: resolved,
    present: existsSync(resolved),
  };
}

function classifyOllamaHost(host) {
  try {
    const url = new URL(host);
    const localNames = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
    if (localNames.has(url.hostname)) return 'local';
    if (
      url.hostname.startsWith('192.168.') ||
      url.hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname)
    ) {
      return 'lan';
    }
    return 'remote';
  } catch {
    return 'unknown';
  }
}

function eventKindsFromAgentSource(source) {
  const kinds = ['thinking', 'tool-call', 'tool-result', 'final', 'error'];
  return kinds.filter((kind) => source.includes(`'${kind}'`) || source.includes(`"${kind}"`));
}

function maxIterationsFromAgentSource(source) {
  const match = source.match(/DEFAULT_MAX_ITERATIONS\s*=\s*(\d+)/);
  return match ? Number(match[1]) : 0;
}

function visualStateFromContext({ processHealth, stopPlans }) {
  const risk = processHealth?.summary?.riskState || 'unknown';
  if (risk === 'critical') {
    return { emotion: 'concerned', voiceState: 'quiet', pipelineStage: 'idle', mouthState: 'rest' };
  }
  if (risk === 'warn' || stopPlans.length > 0) {
    return { emotion: 'focused', voiceState: 'ready', pipelineStage: 'idle', mouthState: 'rest' };
  }
  if (risk === 'pass') {
    return { emotion: 'calm', voiceState: 'ready', pipelineStage: 'idle', mouthState: 'rest' };
  }
  return { emotion: 'attentive', voiceState: 'ready', pipelineStage: 'idle', mouthState: 'rest' };
}

function buildManifest(args) {
  const holoscriptRoot = path.resolve(args.holoscriptRoot);
  const tmpDir = resolveRepoPath(args.tmpDir);
  const packageJson = readHoloScriptJson(holoscriptRoot, 'packages/aibrittney/package.json', {});
  const agentSource = readText(holoscriptRoot, 'packages/aibrittney/src/agent.ts');
  const sessionSource = readText(holoscriptRoot, 'packages/aibrittney/src/session.ts');
  const processHealth = readJson(path.join(tmpDir, 'process-health.json'), {});
  const stopPlans = [
    ...(Array.isArray(processHealth?.stopPlans) ? processHealth.stopPlans : []),
    ...(processHealth?.stopPlan ? [processHealth.stopPlan] : []),
  ].filter(Boolean);

  const runtimePackagePresent = packageJson?.name === '@holoscript/aibrittney';
  const toolLoopSourcePresent = agentSource.includes('runAgentTurn');
  const sessionSourcePresent = sessionSource.includes('DEFAULT_SYSTEM_PROMPT');
  const eventKinds = eventKindsFromAgentSource(agentSource);
  const maxIterations = maxIterationsFromAgentSource(agentSource);
  const model = process.env.AIBRITTNEY_MODEL || 'qwen2.5-coder:7b';
  const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  const ollamaHostKind = classifyOllamaHost(ollamaHost);

  const traitAnchors = [
    ['avatar_embodiment', 'packages/core/src/traits/AvatarEmbodimentTrait.ts'],
    ['ai_companion', 'packages/core/src/traits/AICompanionTrait.ts'],
    ['avatar_intent', 'packages/core/src/traits/AvatarIntentTrait.ts'],
    ['voice_proximity', 'packages/core/src/traits/VoiceProximityTrait.ts'],
  ].map(([id, filePath]) => ({
    ...fileAnchor(holoscriptRoot, filePath),
    id,
  }));

  const voiceHooks = [
    fileAnchor(holoscriptRoot, 'packages/studio/src/hooks/useBrittneyVoice.ts'),
    fileAnchor(holoscriptRoot, 'packages/studio/src/hooks/useVoiceAuthoring.ts'),
  ];

  const visualState = visualStateFromContext({ processHealth, stopPlans });
  const runtimeStatus = runtimePackagePresent && toolLoopSourcePresent && sessionSourcePresent ? 'available' : 'partial';
  const avatarStatus = traitAnchors.filter((trait) => trait.present).length >= 3 ? 'embodied-contract-ready' : 'partial';

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    sourceAnchors: {
      holoshellAvatarSource: 'apps/holoshell/source/holoshell-brittney-avatar.hsplus',
      holoshellPresenceSource: 'apps/holoshell/source/holoshell-brittney-presence.hsplus',
      holoshellHomeSource: 'apps/holoshell/source/holoshell-home.hsplus',
      holoshellPrototype: 'apps/holoshell/prototype/local-capability-room.html',
      holoscriptRoot,
      holoscriptPackage: fileAnchor(holoscriptRoot, 'packages/aibrittney/package.json'),
      agentRuntime: fileAnchor(holoscriptRoot, 'packages/aibrittney/src/agent.ts'),
      sessionRuntime: fileAnchor(holoscriptRoot, 'packages/aibrittney/src/session.ts'),
      avatarStudioBridge: resolveRepoPath('packages/ar/avatar-studio/src/HoloScriptAvatarBridge.ts'),
    },
    runtime: {
      packageName: packageJson?.name || '@holoscript/aibrittney',
      packageVersion: packageJson?.version || 'unknown',
      binary: packageJson?.bin?.aibrittney || './bin/aibrittney.cjs',
      status: runtimeStatus,
      entrypoint: 'runAgentTurn',
      model,
      ollamaHostKind,
      apiKeyConfigured: Boolean(process.env.OLLAMA_API_KEY),
      eventKinds,
      maxIterations,
      secretsExposedToShell: false,
      sessionPromptPresent: sessionSourcePresent,
    },
    avatar: {
      id: 'brittney-holoshell-avatar',
      displayName: 'Brittney',
      lineage: 'brittney_seed_pattern',
      visualForm: 'holographic_face_and_bust',
      bodyPlan: 'upper_body',
      renderMode: 'procedural_preview_then_vrm',
      traitAnchors,
      voiceHooks,
      visualState,
      expressionSet: ['neutral', 'calm', 'focused', 'attentive', 'concerned', 'speaking'],
      lipSync: {
        enabled: true,
        driver: 'AgentEvent.final or voice output',
        mouthStates: ['rest', 'listening', 'speaking', 'thinking'],
      },
    },
    accessibility: {
      keyboardReachable: true,
      screenReaderReachable: true,
      ariaRole: 'button',
      ariaLabel: 'Open Brittney avatar',
      keyboardShortcut: 'Alt+B',
      liveRegion: 'polite',
      reducedMotionAware: true,
      focusAction: 'open_conversation',
    },
    accessContract: {
      supportedModes: ['holoscript_cli_mcp', 'local_lan_ollama', 'in_world_npc_steward'],
      unsupportedModes: [
        {
          mode: 'microphone_voice_input',
          reason: 'requires an explicit user gesture and browser speech support in the current shell host',
          unblockCondition: 'voice permission prompt and receipt lane are wired in the native host',
        },
      ],
      receiptBehavior: {
        actor: 'brittney-holoshell-avatar',
        source: 'apps/holoshell/source/holoshell-brittney-avatar.hsplus',
        route: ollamaHostKind,
        worldEffect: 'proposal_or_preview',
        storage: '.tmp/holoshell/brittney-avatar.json',
      },
      privacyBoundary: ollamaHostKind === 'local' ? 'local-only' : ollamaHostKind,
    },
    actions: [
      { id: 'focus_avatar', permissionEnvelope: 'read_only', receiptRequired: true },
      { id: 'open_chat', permissionEnvelope: 'read_only', receiptRequired: true },
      { id: 'start_voice', permissionEnvelope: 'user_initiated_microphone', receiptRequired: true },
      { id: 'mute_voice', permissionEnvelope: 'read_only', receiptRequired: true },
      { id: 'explain_receipts', permissionEnvelope: 'read_only', receiptRequired: true },
      { id: 'propose_shell_action', permissionEnvelope: 'guarded_execute', receiptRequired: true },
    ],
    summary: {
      avatarStatus,
      runtimeStatus,
      runtimePackagePresent,
      toolLoopSourcePresent,
      sessionSourcePresent,
      traitCount: traitAnchors.filter((trait) => trait.present).length,
      voiceHookCount: voiceHooks.filter((hook) => hook.present).length,
      eventKindCount: eventKinds.length,
      emotion: visualState.emotion,
      voiceState: visualState.voiceState,
      ollamaHostKind,
      secretFree: true,
    },
  };
}

function traitNamesFromCategorySource(source) {
  const names = [];
  const re = /'([a-z][a-z0-9_]*)'/g;
  let match;
  while ((match = re.exec(source)) !== null) names.push(match[1]);
  return names;
}

function expressionZonesFromTraitSource(source) {
  const zones = [];
  const re = /\{ name: '([a-z]+)',[^}]*color: '(#[0-9a-f]{6})' \}/g;
  let match;
  while ((match = re.exec(source)) !== null) zones.push({ name: match[1], color: match[2] });
  return zones;
}

function buildDaimonManifest(args) {
  // The daimon is the OWNER'S companion face (D.053), not Brittney: Brittney
  // is the field, the daimon is the per-soul presence that draws from it
  // (apps/holoshell/docs/BRITTNEY_FIELD_AND_USER_DAEMONS.md +
  // DAIMON_COMPANION_EMBODIMENT.md). This manifest carries the face CONTRACT
  // presence; live affect state arrives when the runtime loop is wired
  // (stateSource marks that honestly). The raw ownerScopeKey never appears
  // in any manifest — owner-scoped privacy is the fold's hardest rule.
  const holoscriptRoot = path.resolve(args.holoscriptRoot);

  const composition = fileAnchor(holoscriptRoot, 'compositions/daimon-embodiment.holo');
  const brain = fileAnchor(holoscriptRoot, 'compositions/daimon-brain.hsplus');
  const rfc = fileAnchor(holoscriptRoot, 'proposals/daimon-embodiment-trait-family.md');
  const presenceRuntime = fileAnchor(
    holoscriptRoot,
    'packages/core/src/traits/CompanionPresenceTrait.ts'
  );
  const affectRuntime = fileAnchor(holoscriptRoot, 'packages/core/src/traits/AffectStateTrait.ts');
  const categoryAnchor = fileAnchor(
    holoscriptRoot,
    'packages/core/src/traits/constants/companionship.ts'
  );
  const faceContract = fileAnchor(
    holoscriptRoot,
    'packages/core/src/daemon/ConversationDaemon.ts'
  );

  const categorySource = readText(holoscriptRoot, 'packages/core/src/traits/constants/companionship.ts');
  const affectSource = readText(holoscriptRoot, 'packages/core/src/traits/AffectStateTrait.ts');
  const registeredTraits = traitNamesFromCategorySource(categorySource);
  const expressionZones = expressionZonesFromTraitSource(affectSource);

  const runtimeTraits = [
    { name: 'companion_presence', runtime: presenceRuntime.present },
    { name: 'affect_state', runtime: affectRuntime.present },
  ];
  const runtimeTraitCount = runtimeTraits.filter((t) => t.runtime).length;
  const daimonStatus =
    composition.present && categoryAnchor.present && runtimeTraitCount === 2
      ? 'face-contract-ready'
      : 'partial';

  return {
    schemaVersion: DAIMON_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    sourceAnchors: {
      holoshellRoutingDoc: 'apps/holoshell/docs/DAIMON_COMPANION_EMBODIMENT.md',
      holoshellPrototype: 'apps/holoshell/prototype/local-capability-room.html',
      holoscriptRoot,
      composition,
      brain,
      rfc,
      presenceRuntime,
      affectRuntime,
      categoryAnchor,
      faceContract,
    },
    presence: {
      id: 'daimon-companion-presence',
      // Recognition, not onboarding: before the emergence threshold the
      // presence is UNNAMED. The owner names her by knowing her, not in a
      // settings panel. displayName stays honest until phase=manifested.
      displayName: null,
      phase: 'accumulating',
      attention: 'idle',
      named: false,
      ownerBinding: 'unbound-preview',
      stateSource: 'contract-static',
      visualForm: 'soft_orb_presence',
      expression: 'neutral',
      expressionZones,
      registeredTraits,
      runtimeTraits,
    },
    accessibility: {
      keyboardReachable: true,
      screenReaderReachable: true,
      ariaRole: 'button',
      ariaLabel: 'Your companion presence (accumulating)',
      liveRegion: 'polite',
      reducedMotionAware: true,
      focusAction: 'open_conversation',
    },
    privacy: {
      ownerScopeKeyInManifest: false,
      transcriptDestination: 'owner-corpus-only',
      note: 'Companion conversations feed only the owner corpus; never relay exam, prompt genome, or shared training sets (fold ruling section 3).',
    },
    actions: [
      { id: 'focus_presence', permissionEnvelope: 'read_only', receiptRequired: true },
      { id: 'open_conversation', permissionEnvelope: 'read_only', receiptRequired: true },
      { id: 'explain_receipts', permissionEnvelope: 'read_only', receiptRequired: true },
    ],
    summary: {
      daimonStatus,
      phase: 'accumulating',
      expression: 'neutral',
      named: false,
      registeredTraitCount: registeredTraits.length,
      runtimeTraitCount,
      expressionZoneCount: expressionZones.length,
      compositionPresent: composition.present,
      brainPresent: brain.present,
      secretFree: true,
    },
  };
}

function assertDaimonSelfTest(manifest) {
  const failures = [];
  if (manifest.schemaVersion !== DAIMON_SCHEMA_VERSION) failures.push('daimon schemaVersion mismatch');
  if (!manifest.summary.compositionPresent) failures.push('expected compositions/daimon-embodiment.holo anchor');
  if (manifest.summary.runtimeTraitCount < 2) failures.push('expected companion_presence + affect_state runtime anchors');
  if (manifest.summary.registeredTraitCount < 7) failures.push('expected 7 registered companionship traits');
  if (manifest.presence.named !== false || manifest.presence.displayName !== null) {
    failures.push('accumulating presence must be unnamed (recognition, not onboarding)');
  }
  if (JSON.stringify(manifest).includes('ownerScopeKey":"')) failures.push('manifest must not carry a raw ownerScopeKey');
  if (!manifest.accessibility.keyboardReachable) failures.push('presence must be keyboard reachable');
  if (!manifest.actions.some((action) => action.id === 'open_conversation')) failures.push('missing open_conversation action');
  if (failures.length) {
    throw new Error(`Daimon self-test failed:\n- ${failures.join('\n- ')}`);
  }
}

function writeJson(filePath, data) {
  const resolved = resolveRepoPath(filePath);
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return resolved;
}

function writeBrowserBootstrap(filePath, manifest, globalName = 'HOLOSHELL_BRITTNEY_AVATAR') {
  const resolved = resolveRepoPath(filePath);
  mkdirSync(path.dirname(resolved), { recursive: true });
  const payload = JSON.stringify(manifest, null, 2).replace(/<\/script/gi, '<\\/script');
  writeFileSync(resolved, `window.${globalName} = ${payload};\n`, 'utf8');
  return resolved;
}

function assertSelfTest(manifest) {
  const failures = [];
  if (manifest.schemaVersion !== SCHEMA_VERSION) failures.push('schemaVersion mismatch');
  if (!manifest.summary.runtimePackagePresent) failures.push('expected @holoscript/aibrittney package');
  if (!manifest.summary.toolLoopSourcePresent) failures.push('expected runAgentTurn source');
  if (manifest.summary.eventKindCount < 5) failures.push('expected all AgentEvent kinds');
  if (manifest.summary.traitCount < 3) failures.push('expected avatar trait anchors');
  if (!manifest.accessibility.keyboardReachable) failures.push('avatar must be keyboard reachable');
  if (!manifest.accessibility.screenReaderReachable) failures.push('avatar must be screen-reader reachable');
  if (!manifest.actions.some((action) => action.id === 'open_chat')) failures.push('missing open_chat action');
  if (!manifest.actions.some((action) => action.id === 'start_voice')) failures.push('missing start_voice action');
  if (JSON.stringify(manifest).includes(process.env.OLLAMA_API_KEY || '\u0000')) {
    failures.push('manifest appears to expose OLLAMA_API_KEY');
  }
  if (failures.length) {
    throw new Error(`Self-test failed:\n- ${failures.join('\n- ')}`);
  }
}

try {
  const args = parseArgs(process.argv.slice(2));
  const manifest = buildManifest(args);
  const output = writeJson(args.output, manifest);
  const jsOutput = writeBrowserBootstrap(args.jsOutput, manifest);
  const daimonManifest = buildDaimonManifest(args);
  const daimonOutput = writeJson(args.daimonOutput, daimonManifest);
  const daimonJsOutput = writeBrowserBootstrap(
    args.daimonJsOutput,
    daimonManifest,
    'HOLOSHELL_DAIMON_AVATAR'
  );
  if (args.selfTest) {
    assertSelfTest(manifest);
    assertDaimonSelfTest(daimonManifest);
  }

  if (args.json) {
    console.log(JSON.stringify({ brittney: manifest, daimon: daimonManifest }, null, 2));
  } else {
    console.log(`HoloShell Brittney avatar: ${output}`);
    console.log(`HoloShell Brittney avatar bootstrap: ${jsOutput}`);
    console.log(`Runtime: ${manifest.summary.runtimeStatus}`);
    console.log(`Avatar: ${manifest.summary.avatarStatus}`);
    console.log(`Emotion: ${manifest.summary.emotion}`);
    console.log(`Route: ${manifest.summary.ollamaHostKind}`);
    console.log(`HoloShell daimon presence: ${daimonOutput}`);
    console.log(`HoloShell daimon bootstrap: ${daimonJsOutput}`);
    console.log(`Daimon: ${daimonManifest.summary.daimonStatus}`);
    console.log(`Daimon phase: ${daimonManifest.summary.phase}; expression: ${daimonManifest.summary.expression}`);
  }
} catch (error) {
  console.error(`holoshell-brittney-avatar failed: ${error.message}`);
  process.exit(1);
}
