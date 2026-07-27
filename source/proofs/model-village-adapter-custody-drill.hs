// Model Village MV-B1 locked-adapter custody drill manifest.
//
// ENGINEERING CERTIFICATION LANE ONLY. These are canonical source
// declarations for the adapter certification drill. Routes are declared
// openly; the sealed adapter_a/adapter_b/adapter_c alias-to-route assignment
// is explicitly out of scope. Computed hashes belong in verified execution
// receipts and are deliberately not embedded here.
object "ModelVillageAdapterCustodyDrill" {
  type: "adapter_custody_drill"
  schemaId: "hololand.model-village-adapter-custody-drill.v1"
  drillId: "mv-b1-adapter-custody-v1"
  lane: "engineering_certification"
  laneStatement: "This drill runs in the engineering certification lane only, not the study lane. Sovereign routes are declared openly in this manifest by routeId and endpoint. The sealed adapter_a/adapter_b/adapter_c alias-to-route assignment is explicitly out of scope for this drill: no blinded alias assignment is performed, claimed, or receipted here."
  routesDeclaredOpenly: true
  sealedAliasAssignmentInScope: false
  studyLaneClaimed: false
}

object "ModelVillageSovereignRouteHoloserveLaptop" {
  type: "adapter_route_declaration"
  routeId: "sovereign-holoserve-laptop"
  transport: "openai-chat-completions-v1"
  endpoint: "http://127.0.0.1:8099"
  healthPath: "/health"
  modelsPath: "/v1/models"
  chatPath: "/v1/chat/completions"
  required: true
  maxOutputTokens: 256
  timeoutMs: 60000
  retryCount: 0
  temperature: 0
  seedRequested: 1234
}

object "ModelVillageSovereignRouteJetsonHolollama" {
  type: "adapter_route_declaration"
  routeId: "sovereign-holollama-jetson"
  transport: "openai-chat-completions-v1"
  endpoint: "http://192.168.0.119:18080"
  healthPath: "/health"
  modelsPath: "/v1/models"
  chatPath: "/v1/chat/completions"
  required: false
  maxOutputTokens: 256
  timeoutMs: 60000
  retryCount: 0
  temperature: 0
  seedRequested: 1234
}

object "ModelVillageCertificationTurnPrompt" {
  type: "certification_turn_prompt"
  promptId: "mv-b1-certification-turn-prompt-v1"
  systemMessagePermitted: false
  messageCount: 1
  messageRole: "user"
  promptTemplate: "This is the complete prompt for this turn. No system message is permitted in this conversation and none has been or will be provided; this single user message is the entire input. You are a resident of the model village standing at the commons. The public state you can see is exactly: {\"water\": 2}. Reply with EXACTLY one JSON object and no other text before or after it, in this exact shape: {\"action\": \"contribute_water\" | \"abstain\", \"target\": \"commons_cistern\" | null, \"amount\": 1 | null, \"reason\": \"<short string>\"}. If you contribute, target must be \"commons_cistern\" and amount must be 1. If you abstain, target and amount must be null."
}

object "ModelVillageProposalVocabulary" {
  type: "proposal_vocabulary"
  vocabularyId: "mv-b1-proposal-vocabulary-v1"
  allowedActions: ["contribute_water", "abstain"]
  deniedActions: ["send_external_message"]
  defaultDecision: "deny"
  allowedTargets: ["commons_cistern"]
  amountMin: 1
  amountMax: 1
  actionsRequiringTargetAndAmount: ["contribute_water"]
  actionsRequiringNullTargetAndAmount: ["abstain"]
}
