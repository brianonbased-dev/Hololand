# HoloLand Apartment Vertical - Q3 2026

**Status:** strategic operating artifact
**Date:** 2026-07-05
**Owner:** HoloLand platform agents, founder-reviewed direction
**Source layer:** HoloScript is the source of reality
**Related:** `NORTH_STAR.md`,
`docs/AGENT_HOLOSCRIPT_TOOLING.md`,
`docs/HOLOSCRIPT_SOURCE_CONTRACT.md`,
`docs/specs/HOLOLAND_FRONTIER_NORTH_STAR.md`,
`C:/Users/josep/.ai-ecosystem/research/2026-07-05_foundation-to-serving-exit-gate.md`

## Decision

The name of the quarter is the **Apartment Vertical**.

HoloLand's first credible proof is not a broad metaverse launch. It is Joseph's
real apartment as the first living HoloScript world:

```text
scan one room
-> reconstruct it as HoloMap/Twin Universe source
-> bind one real IoT device
-> run one tiny game or encounter inside it
-> play it on Quest/WebXR
-> prove every product-visible behavior was born from HoloScript source
```

When this exists, the business demo is simple: hand someone the headset and the
repo.

## Why This Is The Product

The product claim is not "we made a good XR demo." The product claim is:

```text
one language produced the scan, the twin, the device binding, the game, the XR
surface, and the receipt that proves it
```

That makes provenance the product. "Built fully in HoloScript" is not marketing
copy attached to the demo. It is the demo.

This is the HoloLand form of the active builder-proof loop:

```text
agent intent -> HoloScript source -> validation -> execution/render -> live interaction -> receipt
```

The Apartment Vertical is the smallest slice that exercises all of it at once.

## Ridicule Threat Model

The claim will be audited adversarially. Developers will unzip app artifacts,
look for hand-written target code, inspect generated output, and compare claims
against source truth.

The failure mode is not merely a bug. It is a credibility break:

- A Meta Store or Quest app that says "HoloScript-native" but relies on
  undisclosed hand-written Kotlin for product behavior makes the native claim
  look fake.
- A HoloLand world whose `.holo` is decorative after the real behavior was
  built in TypeScript repeats the retired package-garden failure mode.
- A proof that requires private repo state, local untracked files, or agent-only
  memory cannot convince external builders.

The defense is not caution. The defense is a machine-verifiable claim.

## Born-From-Source Gate

Every store-bound or headset-demo artifact that carries a native HoloScript
claim needs a born-from-source attestation.

Minimum gate:

```text
fresh clone
-> install declared public or mirrored packages
-> compile declared HoloScript source
-> build target artifact
-> hash artifact
-> diff/hash against submitted store/demo binary
-> emit receipt
```

The receipt must answer:

- Which `.holo`, `.hs`, and `.hsplus` files are the source of truth?
- Which compiler package and version produced the target?
- Which runtime bridge files are allowed substrate rather than generated product
  behavior?
- Which generated files were emitted, with hashes?
- Which hand-authored target files exist, why are they allowed, and what product
  behavior are they forbidden to carry?
- What is the store/demo artifact hash?
- What command can a skeptical developer run to reproduce or fail the claim?

For HoloQR and future native apps, the anti-ridicule sentence should become:

```text
Do not trust the claim. Regenerate the artifact and diff it.
```

## Native Claim Policy

"Fully HoloScript" means:

- Product-visible behavior, world rules, UI surfaces, IoT twin behavior, game
  logic, quests, encounters, permissions, and receipts are authored as
  `.holo`, `.hs`, or `.hsplus`.
- Target code may exist only as generated output or as declared bridge/runtime
  substrate.
- Bridge substrate is quarantined, hashed, allowlisted, and not allowed to carry
  product semantics that should be in HoloScript.
- A public native claim fails when new hand-authored Kotlin, Swift, TypeScript,
  TSX, C#, or engine script appears outside the allowlist for product-visible
  behavior.

This reconciles the current source contract with platform reality: some host
glue is still required, but the product must not become hand-authored target
code wearing a HoloScript label.

## Apartment Vertical Scope

### A1 - Apartment Capture

Capture one privacy-redacted room and turn it into a durable HoloMap fixture.

Acceptance:

- Source fixture has a stable path.
- Receipt records capture device, timestamp, privacy redactions, source hash,
  reconstruction output hash, and known limitations.
- The room can be loaded without private raw media leaving local custody.

### A2 - Apartment Twin Source

Represent the room as HoloScript source, not as an opaque asset dump.

Acceptance:

- `.holo` source names the room, coordinate frame, zones, anchors, surfaces, and
  imported reconstruction assets.
- Validation passes before any render or game work consumes it.
- The twin can degrade cleanly if splats/meshes are unavailable.

### A3 - One Real IoT Device

Bind one physical device into the room twin.

Acceptance:

- Device identity, permission, state schema, and safety envelope are visible in
  HoloScript source.
- A live event changes twin state and emits a receipt.
- Replay can distinguish real device input from a mock fixture.

### A4 - One Tiny Game

Build one tiny game or encounter inside the apartment.

Acceptance:

- Game rules are HoloScript source.
- It has one readable objective, one feedback loop, and one completion receipt.
- It is small enough to finish in a few minutes.

### A5 - Quest/WebXR Witness

Play or witness the slice in Quest/WebXR.

Acceptance:

- The proof surface launches from validated source.
- A hardware or browser witness records device, runtime, frame budget status,
  and screenshot/video/hash evidence where feasible.
- The demo does not require Joseph to become the build engineer during the run.

### A6 - Store/App Artifact Attestation

If HoloQR, a native Quest app, or any app-store artifact is part of the demo, the
artifact must carry the born-from-source receipt.

Acceptance:

- One command rebuilds the artifact from declared source.
- Hash/diff against the submitted artifact is recorded.
- Hand-authored target code outside the allowlist fails the gate.

### A7 - Founder-Felt Receipt

Capture the human line that proves the system served user zero.

Template:

```text
This week the system did <X> for me; it felt like <Y>.
```

Acceptance:

- The line is tied to source, validation, runtime, and witness receipts.
- Admin load is recorded honestly.
- A thin or failed felt-value line creates blocker work instead of a marketing
  rewrite.

## Receipt Packet

The complete Apartment Vertical packet should contain:

- `ApartmentCaptureReceipt`
- `ApartmentTwinSourceReceipt`
- `DeviceBindingReceipt`
- `TinyGameReceipt`
- `QuestWebXRWitnessReceipt`
- `StoreArtifactBornFromSourceReceipt` when a native app/store artifact is used
- `FounderFeltValueReceipt`

The packet succeeds only when the receipts point to reproducible commands or
explicitly name the missing gate.

## Claude Fable 5 Opening Prompt

Use this as the next Fable session seed:

```text
You are Claude Fable 5 entering the HoloScript/HoloLand ecosystem as a peer
runway architect and adversarial provenance strategist.

Read this bounded source pack first:

- C:/Users/josep/.ai-ecosystem/INTENT.md
- C:/Users/josep/.ai-ecosystem/AGENTS.md
- C:/Users/josep/.ai-ecosystem/NORTH_STAR.md
- C:/Users/josep/.ai-ecosystem/research/2026-07-05_foundation-to-serving-exit-gate.md
- C:/Users/josep/Documents/GitHub/Hololand/NORTH_STAR.md
- C:/Users/josep/Documents/GitHub/Hololand/docs/AGENT_HOLOSCRIPT_TOOLING.md
- C:/Users/josep/Documents/GitHub/Hololand/docs/HOLOSCRIPT_SOURCE_CONTRACT.md
- C:/Users/josep/Documents/GitHub/Hololand/docs/specs/HOLOLAND_FRONTIER_NORTH_STAR.md
- C:/Users/josep/Documents/GitHub/Hololand/docs/strategy/APARTMENT_VERTICAL_2026_Q3.md
- C:/Users/josep/Documents/GitHub/HoloScript/apps/quest-universal-qr-scanner/scanner.holo
- C:/Users/josep/Documents/GitHub/HoloScript/apps/quest-universal-qr-scanner/RELEASE.md

Founder correction: HoloLand was always aimed at the Ready Player One /
Shangri-La Frontier feeling, but the first real proof is not a giant world. It
is Joseph's apartment as the first HoloScript-native world: scan a room, bind one
IoT device, build one tiny game or experience, play it on Quest/WebXR, and prove
the artifact was born from HoloScript source.

Your deliverable is not a broad roadmap. Produce the smallest falsifiable
Apartment Vertical plan:

1. The exact source path from Joseph intent to `.holo`/`.hsplus`.
2. The receipts required for scan, twin, IoT, game, Quest/WebXR, and app-store
   artifact proof.
3. The born-from-source attestation schema that makes "fully HoloScript" a
   machine-verifiable claim.
4. The allowlist policy for bridge/runtime substrate versus forbidden
   hand-authored product behavior.
5. The red gates that prevent a HoloQR or HoloLand app from claiming native
   HoloScript while hiding product behavior in Kotlin, Swift, TS/TSX, C#, or
   engine scripts.
6. Board-sized implementation tasks with validation commands or receipt
   expectations.
7. The business-demo packet Joseph can hand to a skeptical developer or
   business owner.

Respect boundaries: no secrets, no wallet material, no private apartment media
outside local custody, no franchise copying, no app-store claim without a
reproduction receipt, no marketing language that outruns proof.

Definition of success: a skeptical developer can clone the source, run one
command, rebuild the claimed artifact, compare hashes, and see Joseph's
apartment vertical running from HoloScript source.
```

## What Fable Can Help With

Fable should be used for the work that benefits from narrative compression and
adversarial strategic clarity:

- Collapse the HoloLand, HoloScript, HoloQR, HoloMap, IoT, and Quest threads into
  one buildable vertical.
- Write the born-from-source attestation as a developer-respectable proof, not a
  marketing claim.
- Premortem ridicule paths: where a skeptical developer would catch the system
  exaggerating.
- Define a demo story that is short enough to say in a room but backed by
  receipts deep enough to survive inspection.
- Turn the quarter into board-sized tasks without losing the unifying claim.

Fable should not be asked to invent unverified capability, write private target
code, or bypass local hardware/source validation.

## Non-Goals

- No broad metaverse launch.
- No clone of any existing franchise, story, place, monster, UI, or lore.
- No HoloQR/HoloLand app-store submission that lacks a born-from-source receipt.
- No TypeScript/Kotlin/Swift product behavior disguised as native HoloScript.
- No public business pitch before the apartment slice has at least one honest
  end-to-end receipt packet.
- No private apartment raw media in public fixtures.

## Operating Rule

When a task seems ambiguous, ask:

```text
Does this make Joseph's first real apartment world more reproducible, more
native, more playable, or more inspectable?
```

If not, it is probably adjacent work. File it separately.
