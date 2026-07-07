#!/usr/bin/env node
// HoloShell natural-layer surface — NATIVE build step.
//
// This does NOT render anything itself. It invokes the HoloScript compiler's
// `webgpu-html` target, which compiles `holoshell-shell-world.holo` (the source
// of truth) into a complete, self-contained, browser-runnable WebGPU page. The
// scene, geometry, materials, camera, and render loop are 100% compiler-owned;
// there is no hand-authored rendering or host here. serve.mjs serves the emitted
// page at GET / (operator cockpit lives at /operator).
//
// Build:  node packages/holoshell/compile-shell-world-surface.mjs
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CWD = process.cwd();
const SOURCE = process.env.SHELL_WORLD_SOURCE
  || path.join(CWD, 'apps', 'holoshell', 'source', 'holoshell-shell-world.holo');
const OUT_HTML = path.join(CWD, 'packages', 'holoshell', 'dist', 'shell-world-surface.html');

function findHoloScriptCli() {
  const roots = [
    process.env.HOLOSCRIPT_ROOT,
    path.resolve(CWD, '..', 'HoloScript'),
    'C:/Users/Josep/Documents/GitHub/HoloScript',
  ].filter(Boolean);
  for (const root of roots) {
    for (const rel of ['packages/cli/dist/cli.js', 'packages/cli/bin/holoscript.cjs']) {
      const cli = path.join(root, rel);
      if (existsSync(cli)) return cli;
    }
  }
  return null;
}

const cli = findHoloScriptCli();
if (!cli) {
  console.error('[shell-world-surface] HoloScript CLI not found. Set HOLOSCRIPT_ROOT or build ../HoloScript packages/cli.');
  process.exit(1);
}
if (!existsSync(SOURCE)) {
  console.error('[shell-world-surface] source not found: ' + SOURCE);
  process.exit(1);
}

const result = spawnSync(process.execPath, [cli, 'compile', SOURCE, '--target', 'webgpu-html', '--output', OUT_HTML], {
  stdio: 'inherit',
  windowsHide: true,
});
if (result.status !== 0) {
  console.error('[shell-world-surface] native compile failed (exit ' + result.status + ')');
  process.exit(result.status || 1);
}
console.log('[shell-world-surface] native WebGPU page compiled -> ' + OUT_HTML);
