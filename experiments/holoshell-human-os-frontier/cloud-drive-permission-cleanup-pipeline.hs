// HoloShell cloud-drive permission cleanup data-flow.

environment {
  skybox: "night"
  ambient_light: 0.25
}

object "provider_account_receipt" {
  geometry: "cube"
  color: "#1f6feb"
  position: { x: -4.5, y: 2, z: -2 }
  scale: { x: 0.8, y: 0.3, z: 0.12 }

  input_path: "input.permission_subject_receipt"
  format: "json"
  schema: "PermissionSubjectReceipt"
}

object "shared_inventory_reader" {
  geometry: "cube"
  color: "#2ea043"
  position: { x: -3, y: 2, z: -2 }
  scale: { x: 0.8, y: 0.3, z: 0.12 }

  reads: "shared files; folders; link visibility; direct subjects; inherited permission chain"
  redacts: "raw account labels; absolute local paths; file contents; raw OAuth tokens"
  emits: "CloudShareInventoryReceipt"
  permissionEnvelope: "read_only"
}

object "exposure_diff_classifier" {
  geometry: "cube"
  color: "#d29922"
  position: { x: -1.5, y: 2, z: -2 }
  scale: { x: 0.8, y: 0.3, z: 0.12 }

  reads: "inventory receipt; intended sharing policy; provider org boundary"
  emits: "public links; external editors; unknown groups; inherited access; domain-wide access"
  validation: "risk classes must be itemized before any revoke action"
}

object "revoke_plan_builder" {
  geometry: "cube"
  color: "#e0af68"
  position: { x: 0, y: 2, z: -2 }
  scale: { x: 0.8, y: 0.3, z: 0.12 }

  reads: "exposure diff; selected items; approval nonce; rollback limits"
  blocks: "bulk revoke without item review; delete; move; owner transfer; org policy mutation"
  emits: "CloudPermissionRevokePlanReceipt"
  permissionEnvelope: "guarded_execute"
}

object "provider_revocation_executor" {
  geometry: "cube"
  color: "#f7768e"
  position: { x: 1.5, y: 2, z: -2 }
  scale: { x: 0.8, y: 0.3, z: 0.12 }

  reads: "fresh approval; command preview hash; provider consent state"
  writes: "revoked links; removed viewers; removed editors; revocation receipt"
  blocks: "silent OAuth; cookie scrape; token copy; background consent"
}

object "verification_and_residual_access" {
  geometry: "cube"
  color: "#9ece6a"
  position: { x: 3, y: 2, z: -2 }
  scale: { x: 0.8, y: 0.3, z: 0.12 }

  reads: "post-revoke inventory; provider audit page; residual inherited access"
  emits: "PermissionRevocationReceipt; CloudResidualAccessReceipt; ReplayLessonReceipt"
  validation: "clean claim requires zero residual risky access and replay-ready receipts"
}

object "holomesh_task_filer" {
  geometry: "cube"
  color: "#8aadf4"
  position: { x: 4.5, y: 2, z: -2 }
  scale: { x: 0.8, y: 0.3, z: 0.12 }

  reads: "blocked cleanup gaps; receipt validation failures; provider adapter drift"
  emits: "actionable HoloMesh tasks"
  validation: "tasks include evidence, affected repo path, expected behavior, and owner surface"
}
