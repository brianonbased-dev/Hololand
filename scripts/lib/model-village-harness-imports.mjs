// Makes a DERIVED model-village harness loadable from wherever it is written.
//
// WHAT THIS FIXES, AND WHO BROKE IT. Several character gates do not run their own file: they
// read `scripts/check-hololand-model-village-character-appearance-h3x.mjs`, string-substitute
// it into a gate-specific runner, write that runner into an output directory such as
// `.tmp/hololand/model-village/character-realism-h4c/frame-0/`, and import() it.
//
// While h3x imported only node builtins that was invisible. The reproducibility repair added
//
//     import { resolveHoloScriptRoot }     from './lib/model-village-holoscript-root.mjs';
//     import { validateUpstreamCommitPin } from './lib/model-village-upstream-commit-pin.mjs';
//
// to h3x -- and a relative specifier resolves against the HARNESS's location, not against
// `scripts/`. There is no `lib/` beside the materialized harness, so every derived gate began
// dying at import time:
//
//     ERR_MODULE_NOT_FOUND  .../character-realism-h4c/frame-0/lib/model-village-holoscript-root.mjs
//
// That reads like a missing file. It is not -- the file is in `scripts/lib/`; the harness moved
// away from it.
//
// TWO FUNCTIONS, DELIBERATELY NOT ONE. Two agents found this defect independently and wrote
// different helpers. They were merged into a single implementation on the first integration
// attempt, and that BROKE FOUR GATES: h4c asserts `rewritten.length === 2` -- exactly its two
// lib imports -- while the general form also rewrites sibling `./check-*.mjs` specifiers, so
// the count no longer matched. The contracts are genuinely different:
//
//   absolutizeHarnessLibImports  narrow  only './lib/*.mjs', reports WHICH it rewrote
//   absolutizeHarnessImports     broad   any './x' in an import/export from-clause
//
// Keep them apart. A caller that counts what was rewritten is asserting something a broader
// rewrite silently changes.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const absUrl = (scriptsDir, relative) => pathToFileURL(path.join(scriptsDir, relative)).href;

/** A bare quoted './lib/x.mjs' -- also covers dynamic import() and string-built specifiers. */
const LIB_SPECIFIER = /(['"])\.\/lib\/([A-Za-z0-9._-]+\.mjs)\1/g;

/**
 * Narrow: rewrite only `./lib/*.mjs`, and report which files were rewritten so a caller can
 * assert the expected set did not change underneath it.
 *
 * @param {string} source     Materialized harness source.
 * @param {string} scriptsDir Absolute path of the real `scripts/` directory.
 * @returns {{ source: string, rewritten: string[] }}
 */
export function absolutizeHarnessLibImports(source, scriptsDir) {
  const rewritten = [];
  const next = source.replace(LIB_SPECIFIER, (_match, quote, file) => {
    rewritten.push(file);
    return `${quote}${absUrl(scriptsDir, path.join('lib', file))}${quote}`;
  });
  return { source: next, rewritten };
}

/** import/export ... from './x' -- the general from-clause form. */
const FROM_SPECIFIER = /^(\s*(?:import|export)\s[^;]*?\sfrom\s+)'\.\/([^']+)'/gm;

/**
 * Broad: rewrite every relative from-clause, so a harness that imports siblings as well as
 * `./lib/*` also resolves. Returns the source only.
 *
 * @param {string} source
 * @param {string} scriptsDir
 * @returns {string}
 */
export function absolutizeHarnessImports(source, scriptsDir) {
  return source.replace(FROM_SPECIFIER, (match, head, relative) => {
    // Only rewrite specifiers that actually resolve under scriptsDir. A derived entry file can
    // also carry relative imports into the HoloScript tree ('./packages/engine/...'); rewriting
    // those produced `<Hololand>/scripts/packages/engine/...`, which does not exist, and esbuild
    // failed with "Could not resolve". Leaving a non-resolving specifier untouched keeps the
    // rewrite to the problem it was written for.
    if (!existsSync(path.join(scriptsDir, relative))) return match;
    return `${head}'${absUrl(scriptsDir, relative)}'`;
  });
}
