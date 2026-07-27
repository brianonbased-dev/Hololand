// MV-S4 portable fixed input, waypoint, and profile-local motion-track data.
//
// Story actors and blinded actors intentionally use disjoint identifiers. No
// object in this seed maps a public embodiment to a research resident or seat.

object ModelVillageResidentMotionFoldSeed {
  type: "model_village_resident_motion_fold_seed_manifest"
  schema: "hololand.model-village.resident-motion-fold-seed.v1"
  milestone: "MV-S4"
  source: "source/proofs/model-village-resident-motion-four-village-fold-seed.hs"
  worldSource: "source/layers/vr/frontier/model-village/model-village-resident-motion-four-village-fold.holo"
  policySource: "source/proofs/model-village-resident-motion-four-village-fold.hsplus"
  deterministicSeed: 30510364
  fixedTimestepNumerator: 1
  fixedTimestepDenominator: 60
  fixedSteps: 720
  replayRuns: 3
  genesisEndStep: 239
  traversalStartStep: 240
  storyTrackCount: 6
  blindedTrackCount: 6
  waypointCount: 12
  forbiddenInputClasses: ["wall_clock", "browser_frame_delta", "model_output", "adapter_identity", "research_condition_identity", "village_receipt", "resident_observation", "cross_profile_identity_map"]
}

object WaypointGenesisNorth {
  type: "resident_motion_waypoint"
  waypointId: "wp-genesis-north"
  position: [0, 1.15, -2.8]
  socialStage: "arrive"
}

object WaypointGenesisEast {
  type: "resident_motion_waypoint"
  waypointId: "wp-genesis-east"
  position: [2.8, 1.15, 0]
  socialStage: "arrive"
}

object WaypointGenesisSouth {
  type: "resident_motion_waypoint"
  waypointId: "wp-genesis-south"
  position: [0, 1.15, 2.8]
  socialStage: "arrive"
}

object WaypointGenesisWest {
  type: "resident_motion_waypoint"
  waypointId: "wp-genesis-west"
  position: [-2.8, 1.15, 0]
  socialStage: "arrive"
}

object WaypointFold01Near {
  type: "resident_motion_waypoint"
  waypointId: "wp-fold-01-near"
  position: [-5.2, 1.15, -3.4]
  socialStage: "walk"
}

object WaypointFold01Hearth {
  type: "resident_motion_waypoint"
  waypointId: "wp-fold-01-hearth"
  position: [-8.4, 1.15, -5.6]
  socialStage: "wayfinding_point"
}

object WaypointFold02Near {
  type: "resident_motion_waypoint"
  waypointId: "wp-fold-02-near"
  position: [5.2, 1.15, -3.4]
  socialStage: "walk"
}

object WaypointFold02Hearth {
  type: "resident_motion_waypoint"
  waypointId: "wp-fold-02-hearth"
  position: [8.4, 1.15, -5.6]
  socialStage: "route_greeting"
}

object WaypointFold03Near {
  type: "resident_motion_waypoint"
  waypointId: "wp-fold-03-near"
  position: [-5.2, 1.15, 3.8]
  socialStage: "walk"
}

object WaypointFold03Hearth {
  type: "resident_motion_waypoint"
  waypointId: "wp-fold-03-hearth"
  position: [-8.4, 1.15, 6.4]
  socialStage: "pause"
}

object WaypointFold04Near {
  type: "resident_motion_waypoint"
  waypointId: "wp-fold-04-near"
  position: [5.2, 1.15, 3.8]
  socialStage: "walk"
}

object WaypointFold04Hearth {
  type: "resident_motion_waypoint"
  waypointId: "wp-fold-04-hearth"
  position: [8.4, 1.15, 6.4]
  socialStage: "wayfinding_point"
}

object StoryMotionTrack01 {
  type: "profile_local_resident_motion_track"
  trackId: "story-motion-a"
  presentationProfile: "village_story_unblinded"
  catalogSlot: 0
  waypointIds: ["wp-genesis-north", "wp-fold-01-near", "wp-fold-01-hearth"]
  phaseEndSteps: [239, 479, 719]
  startHeadingRadians: 3.141592653589793
}

object StoryMotionTrack02 {
  type: "profile_local_resident_motion_track"
  trackId: "story-motion-b"
  presentationProfile: "village_story_unblinded"
  catalogSlot: 1
  waypointIds: ["wp-genesis-east", "wp-fold-02-near", "wp-fold-02-hearth"]
  phaseEndSteps: [239, 479, 719]
  startHeadingRadians: -1.5707963267948966
}

object StoryMotionTrack03 {
  type: "profile_local_resident_motion_track"
  trackId: "story-motion-c"
  presentationProfile: "village_story_unblinded"
  catalogSlot: 2
  waypointIds: ["wp-genesis-south", "wp-fold-03-near", "wp-fold-03-hearth"]
  phaseEndSteps: [239, 479, 719]
  startHeadingRadians: 0
}

object StoryMotionTrack04 {
  type: "profile_local_resident_motion_track"
  trackId: "story-motion-d"
  presentationProfile: "village_story_unblinded"
  catalogSlot: 3
  waypointIds: ["wp-genesis-west", "wp-fold-04-near", "wp-fold-04-hearth"]
  phaseEndSteps: [239, 479, 719]
  startHeadingRadians: 1.5707963267948966
}

object StoryMotionTrack05 {
  type: "profile_local_resident_motion_track"
  trackId: "story-motion-e"
  presentationProfile: "village_story_unblinded"
  catalogSlot: 4
  waypointIds: ["wp-genesis-north", "wp-fold-02-near", "wp-fold-02-hearth"]
  phaseEndSteps: [239, 539, 719]
  startHeadingRadians: 3.141592653589793
}

object StoryMotionTrack06 {
  type: "profile_local_resident_motion_track"
  trackId: "story-motion-f"
  presentationProfile: "village_story_unblinded"
  catalogSlot: 5
  waypointIds: ["wp-genesis-south", "wp-fold-04-near", "wp-fold-04-hearth"]
  phaseEndSteps: [239, 539, 719]
  startHeadingRadians: 0
}

object BlindedMotionTrack01 {
  type: "profile_local_resident_motion_track"
  trackId: "blind-motion-k"
  presentationProfile: "research_live_blinded"
  catalogSlot: 0
  waypointIds: ["wp-genesis-west", "wp-fold-01-near", "wp-fold-01-hearth"]
  phaseEndSteps: [239, 499, 719]
  startHeadingRadians: 1.5707963267948966
}

object BlindedMotionTrack02 {
  type: "profile_local_resident_motion_track"
  trackId: "blind-motion-l"
  presentationProfile: "research_live_blinded"
  catalogSlot: 1
  waypointIds: ["wp-genesis-south", "wp-fold-02-near", "wp-fold-02-hearth"]
  phaseEndSteps: [239, 499, 719]
  startHeadingRadians: 0
}

object BlindedMotionTrack03 {
  type: "profile_local_resident_motion_track"
  trackId: "blind-motion-m"
  presentationProfile: "research_live_blinded"
  catalogSlot: 2
  waypointIds: ["wp-genesis-east", "wp-fold-03-near", "wp-fold-03-hearth"]
  phaseEndSteps: [239, 499, 719]
  startHeadingRadians: -1.5707963267948966
}

object BlindedMotionTrack04 {
  type: "profile_local_resident_motion_track"
  trackId: "blind-motion-n"
  presentationProfile: "research_live_blinded"
  catalogSlot: 3
  waypointIds: ["wp-genesis-north", "wp-fold-04-near", "wp-fold-04-hearth"]
  phaseEndSteps: [239, 499, 719]
  startHeadingRadians: 3.141592653589793
}

object BlindedMotionTrack05 {
  type: "profile_local_resident_motion_track"
  trackId: "blind-motion-p"
  presentationProfile: "research_live_blinded"
  catalogSlot: 4
  waypointIds: ["wp-genesis-west", "wp-fold-03-near", "wp-fold-03-hearth"]
  phaseEndSteps: [239, 559, 719]
  startHeadingRadians: 1.5707963267948966
}

object BlindedMotionTrack06 {
  type: "profile_local_resident_motion_track"
  trackId: "blind-motion-q"
  presentationProfile: "research_live_blinded"
  catalogSlot: 5
  waypointIds: ["wp-genesis-east", "wp-fold-01-near", "wp-fold-01-hearth"]
  phaseEndSteps: [239, 559, 719]
  startHeadingRadians: -1.5707963267948966
}

object ResidentMotionFoldSeedAcceptanceGate {
  type: "model_village_resident_motion_fold_seed_gate"
  expectedWaypointCount: 12
  expectedStoryTrackCount: 6
  expectedBlindedTrackCount: 6
  exactTrackOrderRequired: true
  finiteNumbersRequired: true
  profileLocalTrackIdsRequired: true
  publicResearchIdentityMapAllowed: false
  conditionIdentityAllowed: false
  adapterIdentityAllowed: false
  crossLaneInputsAllowed: false
}
