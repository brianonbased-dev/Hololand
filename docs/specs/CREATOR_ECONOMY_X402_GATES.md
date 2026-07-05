# Creator Economy x402 Gates

Status: source contract, not payout-parity claim.

HoloLand now has a source-owned minimum for paid worlds and creator earnings:

| Surface | Source | What it owns |
|---|---|---|
| Creator economy room | `apps/holoshell/source/hololand-creator-economy-room.holo` | Player and creator-facing panels for x402 gates, earnings, sales ledger, refund reserve, and payout readiness. |
| Creator economy policy | `apps/holoshell/source/hololand-creator-economy-policy.hsplus` | Gate packets, settlement receipts, earnings snapshots, payout receipts, policies, channels, and workflow state. |
| API contract | `docs/api.openapi.yaml` | REST shape for x402 gate configuration, x402 settlement capture, and the expanded creator earnings dashboard. |
| Commerce vertical | `source/verticals/commerce/commerce-vertical.hsplus` | Required receipt anchors for paid-world commerce. |
| Verification | `scripts/check-hololand-creator-economy.mjs` | Local parser and source-contract assertions. |

## Product Boundary

This contract narrows the Roblox creator economy gap by making paid-world gates
and a creator earnings dashboard source-owned. It does not claim Roblox-scale
DevEx parity. Real payout language requires a live settlement backend, transfer
custody proof, payout wallet checks, refund reserve handling, sanctions/KYC
status where required, and an append-only payout receipt.

Until those are present, product copy may say:

- "x402 paid-world gates are source-defined."
- "Creator earnings snapshots distinguish gross, fees, net, pending, available,
  and refund reserve."
- "Payout readiness is pending backend proof."

Product copy may not say:

- "Creators can cash out today."
- "HoloLand has DevEx parity."
- "Available earnings are withdrawable" unless the payout receipt proves an
  actual transfer rail.

## Required Receipts

Every paid-world sale must produce or reference:

| Receipt | Required fields |
|---|---|
| `WorldX402GatePacket` | `worldId`, `creatorId`, `worldSourceHash`, `priceUsd`, `currency`, `chain`, `paymentProtocol`, `recipientWallet`. |
| `X402SettlementReceipt` | `transactionId`, `worldId`, `creatorId`, `payerId`, `paymentHash`, `amountCents`, `platformFeeCents`, `creatorNetCents`, `sourceHash`, `entitlementGranted`. |
| `CreatorEarningsSnapshot` | `grossSalesCents`, `platformFeeCents`, `creatorNetCents`, `pendingPayoutCents`, `availablePayoutCents`, `refundReserveCents`, `transactionCount`, `payoutWallet`, `payoutStatus`, `settlementBackendStatus`. |
| `CreatorPayoutReceipt` | `payoutId`, `creatorId`, `payoutWallet`, `amountCents`, `currency`, `chain`, `transferHash`, `kycStatus`, `sanctionsStatus`, `livePayoutRailProof`. |

## Validation

Run:

```powershell
pnpm run check:hololand-creator-economy
```

The check parses the `.holo` and `.hsplus` sources through the local HoloScript
parser, verifies the dashboard and policy anchors, confirms the OpenAPI paths,
and records a receipt under `.tmp/hololand-creator-economy/receipt.json`.
