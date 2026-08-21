// HoloShell asset-folder to playable-shard data pipeline.
// Object-manifest form is used so the local HoloScript CLI can validate it.

object "AssetFolderPlayableShardPipelineManifest" {
  type: "asset_shard_pipeline_manifest"
  id: "holoshell-asset-folder-playable-shard-pipeline"
  name: "HoloShell Asset Folder To Playable Shard Pipeline"
  version: "0.1.0"
  shell: "HoloShell"
  sourceLayer: "HoloScript"
  roomSource: "experiments/holoshell-human-os-frontier/asset-folder-playable-shard-room.holo"
  policySource: "experiments/holoshell-human-os-frontier/asset-folder-playable-shard-policy.hsplus"
  workflowSource: "apps/holoshell/source/holoshell-asset-shard-workflow.hsplus"
  workflowAdapter: "scripts/holoshell-asset-shard-workflow.mjs"
  approvalAdapter: "scripts/holoshell-shard-import-approval.mjs"
  evidencePack: ".bench-logs/holoshell-human-os-frontier/2026-05-18/asset-folder-playable-shard-evidence-pack.md"
}

object "AssetFolderIntakeCommand" {
  type: "command_pipeline"
  commandId: "asset_folder_playable_shard"
  naturalIntent: "Turn this local folder into a playable HoloLand shard, verify it works, and show what changed."
  actor: "brittney"
  autonomyLevel: "guarded"
  defaultExecution: "stage_not_run"
  receiptRequired: true
  targets: ["local_folder", "asset_classifier", "preview_holo", "runtime_shard", "replay", "rollback", "holomesh_tasks"]
  pipeline: ["folder_custody", "classification", "preview_generation", "preview_validation", "approval", "runtime_import", "replay_seal", "task_file", "rollback"]
}

object "FolderCustodyStep" {
  type: "pipeline_step"
  commandId: "asset_folder_playable_shard"
  phase: "folder_custody"
  order: 1
  adapter: "scripts/holoshell-asset-shard-workflow.mjs"
  action: "resolve_list_and_hash_local_folder"
  permissionEnvelope: "read_only"
  publicPathPolicy: "folder_basename_relative_paths_and_hashes_only"
  privateReceiptPolicy: "absolute_paths_stay_local_private"
  sourceAssetsMutated: false
  output: ".tmp/holoshell/shard-workflow-latest.json"
}

object "AssetClassificationStep" {
  type: "pipeline_step"
  commandId: "asset_folder_playable_shard"
  phase: "classification"
  order: 2
  action: "classify_assets_and_block_secrets"
  permissionEnvelope: "read_only"
  assetKinds: ["model", "image", "audio", "media", "source", "manifest", "unknown"]
  blockedKinds: ["environment_secret_file", "credential_like_extension", "credential_like_filename", "symlink_escape"]
  blockedAssetPolicy: "no_runtime_import_until_resolved"
  output: ".tmp/holoshell/shard-workflow-latest.json"
}

object "PreviewGenerationStep" {
  type: "pipeline_step"
  commandId: "asset_folder_playable_shard"
  phase: "preview_generation"
  order: 3
  adapter: "scripts/holoshell-asset-shard-workflow.mjs"
  action: "write_preview_holo_and_workflow_receipts"
  permissionEnvelope: "write_tmp"
  output: ".tmp/holoshell/shard-preview.holo"
}

object "PreviewValidationStep" {
  type: "pipeline_step"
  commandId: "asset_folder_playable_shard"
  phase: "preview_validation"
  order: 4
  adapter: "holoscript_cli"
  action: "parse_preview_room_policy_and_pipeline_sources"
  permissionEnvelope: "read_only"
  requiredOutputs: ["experiments/holoshell-human-os-frontier/asset-folder-playable-shard-room.holo", "experiments/holoshell-human-os-frontier/asset-folder-playable-shard-policy.hsplus", "experiments/holoshell-human-os-frontier/asset-folder-playable-shard-pipeline.hs", ".tmp/holoshell/shard-preview.holo"]
}

object "ApprovalStep" {
  type: "pipeline_step"
  commandId: "asset_folder_playable_shard"
  phase: "approval"
  order: 5
  adapter: "scripts/holoshell-shard-import-approval.mjs"
  action: "mint_nonce_bound_import_bundle"
  permissionEnvelope: "guarded_execute"
  defaultExecution: "not_requested"
  requiresHumanGesture: true
  output: ".tmp/holoshell/shard-import-approval-latest.json"
}

object "RuntimeImportStep" {
  type: "pipeline_step"
  commandId: "asset_folder_playable_shard"
  phase: "runtime_import"
  order: 6
  adapter: "scripts/holoshell-shard-import-approval.mjs"
  action: "execute_nonce_bound_runtime_import"
  permissionEnvelope: "guarded_execute"
  requiresConfirm: "import"
  sourceAssetsMutated: false
  outputs: [".tmp/holoshell/imported-shards", ".tmp/holoshell/shard-import-latest.json"]
}

object "ReplaySealStep" {
  type: "pipeline_step"
  commandId: "asset_folder_playable_shard"
  phase: "replay_seal"
  order: 7
  action: "join_folder_preview_approval_import_receipts"
  permissionEnvelope: "read_only"
  replayInputs: ["folder_fingerprint", "asset_hashes", "preview_hash", "workflow_hash", "approval_id", "import_receipt_hash"]
  output: ".bench-logs/holoshell-human-os-frontier/2026-05-18/asset-folder-playable-shard-evidence-pack.md"
}

object "TaskFileStep" {
  type: "pipeline_step"
  commandId: "asset_folder_playable_shard"
  phase: "task_file"
  order: 8
  adapter: "C:/Users/josep/.ai-ecosystem/scripts/room-add-tasks.mjs"
  action: "file_gap_tasks"
  permissionEnvelope: "guarded_execute"
  output: ".bench-logs/holoshell-human-os-frontier/2026-05-18/asset-folder-playable-shard-holomesh-tasks.json"
}

object "RollbackStep" {
  type: "pipeline_step"
  commandId: "asset_folder_playable_shard"
  phase: "rollback"
  order: 9
  action: "delete_generated_runtime_outputs_only"
  permissionEnvelope: "guarded_execute"
  sourceAssetsMutated: false
  rollbackScope: ".tmp/holoshell generated shard workflow and imported shard files"
}
