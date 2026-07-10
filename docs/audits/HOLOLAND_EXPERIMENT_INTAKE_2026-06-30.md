# HoloLand Experiment Intake - 2026-06-30

Status: read-only classification, refreshed against the live worktree on
2026-06-30. No archive, delete, move, or ignore rule was executed.

Resolution follow-up:
[`HOLOLAND_EXPERIMENT_RESOLUTION_2026-06-30.md`](HOLOLAND_EXPERIMENT_RESOLUTION_2026-06-30.md)
records the semantic decisions. Archive follow-up:
[`HOLOLAND_EXPERIMENT_ARCHIVE_PLAN_2026-06-30.md`](HOLOLAND_EXPERIMENT_ARCHIVE_PLAN_2026-06-30.md)
and
[`hololand-experiment-archive-plan-2026-06-30.json`](hololand-experiment-archive-plan-2026-06-30.json)
record the plan-only Jetson candidate manifest.

Commands:

```powershell
node scripts/hololand-experiment-intake.mjs --summary
node scripts/hololand-experiment-intake.mjs --json
```

## Summary

The Human OS frontier experiment folder currently contains 12 workflow groups
and 36 HoloScript-family source files.

| Status | Count | Meaning |
| --- | ---: | --- |
| `promoted-drift` | 7 | Promoted app source exists under `apps/holoshell/source/**`, but at least one experiment file differs. For asset-shard-2, local-codebase-trust-gate, and partial-download-recovery this is intentional path canonicalization after promotion. |
| `promote-or-archive` | 1 | Full untracked trio with no exact promoted source; it is now treated as superseded by the promoted asset-shard-2 lane, but archive remains blocked on the visual witness receipt. |
| `tracked-intake` | 4 | Full tracked trio still visible in `experiments/**`; keep visible until promoted, boarded, or intentionally archived. |
| `utility-watch` | 2 | Tracked helper scripts that should move or archive only with their parent workflow receipt. |

Tracked source files: 14.

Untracked source files: 22.

## Validation

The full Human OS frontier source set validates:

```powershell
node scripts\holoshell-source-validation.mjs --source-dir experiments\holoshell-human-os-frontier --output .tmp\holoshell\experiment-source-validation.json --js-output .tmp\holoshell\experiment-source-validation.js --compile-output-dir .tmp\holoshell\experiment-source-validation-compiled --overall-timeout-ms 180000 --timeout-ms 30000
```

Result: pass. Sources: 36/36 passed, with 12 `.holo`, 12 `.hs`, and
12 `.hsplus` files.

## Promoted Drift

These workflows have promoted app-source paths but are not entirely
byte-identical to the experiment copies:

| Workflow | Experiment state | Promoted app source | Current decision |
| --- | --- | --- | --- |
| `asset-shard-2` | full trio untracked | `holoshell-asset-shard-2-*` | Promoted as creator asset-shard v2. Room and policy match; pipeline drift is source-path canonicalization. |
| `browser-account-export` | pipeline tracked, policy tracked, room untracked | `holoshell-browser-account-export-*` | Keep promoted app source canonical; archive experiment variant after checksum receipt. |
| `cloud-drive-permission-cleanup` | full trio untracked | `holoshell-cloud-drive-permission-cleanup-*` | Keep promoted app source canonical; archive experiment variant after checksum receipt. |
| `downloads-import-shelf` | full trio untracked | `holoshell-downloads-import-shelf-*` | Keep promoted app source canonical; policy matches, room/pipeline drift. |
| `family-photo-backup-custody` | full trio untracked | `holoshell-family-photo-backup-custody-*` | Keep promoted app source canonical; policy matches after receipt-field restoration, room/pipeline drift. |
| `local-codebase-trust-gate` | full trio untracked | `holoshell-local-codebase-trust-gate-*` | Promoted as world-build cockpit local-codebase trust subgate; drift is path canonicalization. |
| `partial-download-recovery` | full trio untracked | `holoshell-partial-download-recovery-*` | Promoted as downloads recovery subgate. Room and policy match; pipeline drift is path canonicalization. |

Recommended next action: treat the promoted app-source copies as canonical per
the resolution receipt. Do not merge experiment variants backward unless a
future diff names a missing HoloScript semantic. Archive only after the Jetson
archive receipt exists.

## Promote Or Archive

| Workflow | Files | Current decision |
| --- | --- | --- |
| `asset-folder-playable-shard` | room, policy, pipeline | Superseded by `asset-shard-2`; archive is blocked until asset-shard-2 has visual witness/gate evidence. |

Board follow-up:

- `task_1782803168047_x79q` - verify asset-shard-2 visual witness before Human OS archive.

## Tracked Intake

These workflows remain tracked experiment source:

- `account-task-custody`
- `install-update-tool`
- `slow-computer-clinic`
- `target-device-proof`

Recommended next action: keep visible while HoloShell source and enterprise gate
coverage is reconciled. Do not hide them with ignore rules.

## Utility Watch

Tracked helper scripts:

- `slow-computer-clinic-guarded-stop-dry-run`
- `slow-computer-clinic-remediation-fixture`

Recommended next action: move or archive only with the parent
`slow-computer-clinic` workflow receipt.

## Archive Follow-Up

The archive plan is decision-ready, not deletion-ready. The live board now has:

- `task_1782803168047_djor` - execute the Human OS experiment Jetson archive receipt.

That task should create and verify the Jetson tarball/manifest under:

```text
/mnt/nvme/archives/hololand/2026-06-30-experiment-intake
```

It must not delete or hide repo paths. Tracked removals require a separate
explicit approval/commit after the archive receipt.

## Boundary

This receipt is classification only. The reboot plan still requires explicit
approval before:

- moving anything to Jetson,
- deleting repo paths,
- removing tracked package-lock files,
- archiving `.proprietary/**`,
- retiring any path with active deployment evidence,
- retiring any path needed by the current render/run proof.
