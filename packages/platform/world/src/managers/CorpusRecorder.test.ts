/**
 * CorpusRecorder tests — run with the repo's tsx:  npx tsx <this file>
 *
 * Verifies the load-bearing safety properties: default-off without consent,
 * correct capture + anonymization + PII redaction with consent, mid-session
 * revoke + dispose release listeners, and deterministic rows.
 */
import assert from 'node:assert/strict';

import { EventBus } from '../EventBus';
import {
  CorpusRecorder,
  buildCorpusRow,
  defaultRedact,
  CORPUS_SCHEMA,
  type CorpusRow,
} from './CorpusRecorder';

function emitDialogueSequence(bus: EventBus): void {
  bus.emit({ type: 'npc:interact', timestamp: 1000, data: { npcId: 'guard-1', dialogId: 'intro' } });
  bus.emit({
    type: 'dialog:start',
    timestamp: 1001,
    data: { id: 'intro', text: 'Halt! Reach me at guard@castle.io', options: [{ text: 'ok' }] },
  });
  bus.emit({ type: 'dialog:option', timestamp: 1002, data: { nextId: 'next' } });
  bus.emit({ type: 'dialog:end', timestamp: 1003 });
}

// 1. DEFAULT-OFF — no consent => nothing captured (the load-bearing safety property).
{
  const bus = new EventBus();
  const rows: CorpusRow[] = [];
  new CorpusRecorder({
    eventBus: bus,
    participantId: 'anon_x',
    sessionId: 's1',
    worldId: 'w1',
    consentGate: () => false,
    sink: (r) => rows.push(r),
  });
  emitDialogueSequence(bus);
  assert.equal(rows.length, 0, 'default-off: zero rows without consent');
  assert.equal(bus.getStats().totalHandlers, 0, 'no listeners attached without consent');
}

// 2. CONSENT ON — all 4 events captured, anon id preserved, provenance captured, PII redacted.
{
  const bus = new EventBus();
  const rows: CorpusRow[] = [];
  new CorpusRecorder({
    eventBus: bus,
    participantId: 'anon_abc',
    sessionId: 's1',
    worldId: 'castle',
    consentGate: () => true,
    sink: (r) => rows.push(r),
  });
  emitDialogueSequence(bus);
  assert.equal(rows.length, 4, 'captures all four dialogue events');
  assert.deepEqual(
    rows.map((r) => r.eventType),
    ['npc_interact', 'dialog_start', 'dialog_option', 'dialog_end']
  );
  for (const r of rows) {
    assert.equal(r.schema, CORPUS_SCHEMA);
    assert.equal(r.provenance, 'captured', 'provenance is captured, never verified');
    assert.equal(r.participantId, 'anon_abc', 'uses the caller-anonymized id, never a raw id');
    assert.equal(r.worldId, 'castle');
    assert.ok(r.timestamp.endsWith('Z'), 'timestamp normalized to ISO');
  }
  const start = rows.find((r) => r.eventType === 'dialog_start')!;
  assert.ok(!String(start.payload.text).includes('guard@castle.io'), 'email scrubbed from dialogue text');
  assert.ok(start.redactions.includes('email'), 'redaction class recorded on the row');
  assert.equal(start.payload.dialogId, 'intro');
  assert.equal(start.payload.optionCount, 1);
}

// 3. MID-SESSION REVOKE — setConsent(false) stops capture immediately.
{
  const bus = new EventBus();
  const rows: CorpusRow[] = [];
  const rec = new CorpusRecorder({
    eventBus: bus,
    participantId: 'anon_x',
    sessionId: 's',
    worldId: 'w',
    consentGate: () => true,
    sink: (r) => rows.push(r),
  });
  bus.emit({ type: 'dialog:end', timestamp: 1 });
  const afterFirst = rows.length;
  assert.equal(afterFirst, 1, 'captured while consented');
  rec.setConsent(false);
  bus.emit({ type: 'dialog:end', timestamp: 2 });
  assert.equal(rows.length, afterFirst, 'no capture after consent revoked');
  assert.equal(rec.enabled, false, 'recorder reports disabled');
}

// 4. dispose() releases every listener.
{
  const bus = new EventBus();
  const rows: CorpusRow[] = [];
  const rec = new CorpusRecorder({
    eventBus: bus,
    participantId: 'a',
    sessionId: 's',
    worldId: 'w',
    consentGate: () => true,
    sink: (r) => rows.push(r),
  });
  rec.dispose();
  emitDialogueSequence(bus);
  assert.equal(rows.length, 0, 'no capture after dispose');
  assert.equal(bus.getStats().totalHandlers, 0, 'all listeners removed on dispose');
}

// 5. defaultRedact scrubs email / wallet / phone.
{
  const r = defaultRedact(`mail a@b.co wallet 0x${'a'.repeat(40)} phone +1 415 555 1234`);
  assert.ok(r.redactions.includes('email'), 'email detected');
  assert.ok(r.redactions.includes('wallet'), 'wallet detected');
  assert.ok(!r.text.includes('a@b.co'), 'email removed');
  assert.ok(!r.text.includes('0x' + 'a'.repeat(40)), 'wallet removed');
}

// 6. buildCorpusRow is deterministic (idempotent capture).
{
  const e = { type: 'dialog:end', timestamp: 5 } as const;
  const a = buildCorpusRow({ participantId: 'p', sessionId: 's', worldId: 'w' }, 'dialog_end', e, {});
  const b = buildCorpusRow({ participantId: 'p', sessionId: 's', worldId: 'w' }, 'dialog_end', e, {});
  assert.equal(a.eventId, b.eventId, 'same inputs => same eventId');
  assert.notEqual(
    a.eventId,
    buildCorpusRow({ participantId: 'p2', sessionId: 's', worldId: 'w' }, 'dialog_end', e, {}).eventId,
    'different participant => different eventId'
  );
}

console.log(
  'PASS CorpusRecorder — default-off (no consent => 0 rows, 0 listeners); consent-on captures all 4 dialogue ' +
    'events with the anonymized id, provenance=captured, and PII redacted; mid-session revoke + dispose stop ' +
    'capture and release listeners; redaction + deterministic eventId verified'
);
