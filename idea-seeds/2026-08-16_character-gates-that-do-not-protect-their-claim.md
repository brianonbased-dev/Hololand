# Character gates that do not protect their claim

**Date:** 2026-08-16
**Class:** deferred-repair
**Status:** seed
**Repository:** Hololand
**Source context:** e713078, f4cb27c; decisions/2026-08-16_two-of-twenty-four.md

## What Might Be Valuable

Twelve H3 character gates — H3B, H3D, H3E, H3F, H3J, H3K, H3M, H3P, H3Q, H3R, H3S,
H3T — were each handed to an adversary who mutated the upstream character source and
required the gate to go red. All twelve stayed green. Their pin values are correct and
recorded; a one-line hash change turns each one green today. That is exactly why they
were left red.

The recoverable value is not the gates as written. It is the **gap between what each one
names and what it actually holds down**, which the adversaries mapped precisely and which
would otherwise have to be rediscovered by mutation from scratch:

- Several prove *compile determinism* and *material separation* — real properties, real
  teeth — while the headline geometric or perceptual claim in the gate's title is
  unprotected.
- H3K's compile-side assertions bite; its **pose** half does not, and five of its six
  upstream pins witness files the gate never executes. A pin over an unexecuted file is
  provenance, not proof, and the distinction is worth making structural.
- H3L is the counter-example that shows the shape a good one takes: a genuine BFS over
  triangle adjacency that caught an orphaned palm-centre vertex while every shape
  assertion (`vertexCount === 193`, `indexCount === 1080`) still passed. Connectivity
  survived a fault that counting could not see. That pattern — assert the *topological
  invariant*, not the *tally* — is the thing to port into the other twelve.

Three upstream findings sit alongside them and are independently valuable:

- The hair material receipt now carries `sourceColorWeight = 0.55`, an upstream-hardcoded
  chroma blend (`CharacterHost.ts:683`) that nothing downstream authors or validates.
  Either HoloLand should author it explicitly and prove it round-trips, or HoloScript
  should stop defaulting it nonzero. It is a live authoring-ownership question, not a
  bug report.
- Blink moved v1→v2 and now closes the authored orbital lid rather than deforming only
  the globe. H3C's face goldens were witnessed under v1.
- H3I pins a skin receipt schema no upstream code path emits any more.

## Why Not Now

Making the twelve green is an hour's work and would be worthless — the adversarial runs
prove the green would not mean anything. Making them *right* means re-deriving, per gate,
which invariant would actually fail if the property broke, and that is a genuine
authoring pass per gate, not a repair.

It is also sequenced behind two decisions that are not mine to guess: whether H3A is
superseded by H3B and should be retired rather than restated, and who owns the chroma
blend. Both are recorded on the board rather than settled here.

The harness blocker is already gone — `e713078` restored all ten gates that could not
build their own subject — so whoever picks this up starts from gates that can answer,
which was not true this morning.
