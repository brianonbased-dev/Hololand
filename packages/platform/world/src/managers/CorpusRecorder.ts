/**
 * CorpusRecorder — consent-gated runtime dialogue/interaction corpus capture (D.116).
 *
 * Subscribes to the world EventBus dialogue events (`npc:interact`, `dialog:start`,
 * `dialog:option`, `dialog:end`) and hands each as a normalized corpus row to a
 * pluggable SINK (IndexedDB, a POST endpoint, a server-side NDJSON writer — the
 * caller decides). It captures the runtime interactions the world already emits so
 * gameplay can become a training corpus, WITHOUT the world engine taking on any
 * persistence concern.
 *
 * Safety by construction:
 *   - DEFAULT-OFF. Nothing is captured unless `consentGate()` returns true, and
 *     consent is re-checked at every capture — a mid-session revoke stops capture
 *     immediately. Player data is never persisted without explicit consent.
 *   - The recorder never sees a RAW player id: the caller passes an already
 *     anonymized `participantId` (e.g. `anon_<hash>`), keyed off the player's
 *     HoloKey / session identity.
 *   - Free text is PII-redacted (email / phone / wallet) before it leaves the
 *     recorder, and which classes were scrubbed is recorded on the row.
 *   - Provenance is `captured` — a runtime SAMPLE, never `verified` (these are not
 *     re-runnable proofs like CAEL solve traces). Downstream must keep it that way.
 *
 * Row fields (eventType / timestamp / sessionId / participantId / worldId / eventId)
 * align with `scripts/cael-trace-corpus-exporter.mjs` (`hololand.cael_trace_corpus.v1`)
 * so captured rows normalize cleanly into the study/training corpus.
 */

import { EventBus, type WorldEvent } from '../EventBus';

export const CORPUS_SCHEMA = 'hololand.runtime_dialogue_corpus.v1';

export type CorpusEventType = 'npc_interact' | 'dialog_start' | 'dialog_option' | 'dialog_end';

export interface CorpusRow {
  schema: string;
  /** A runtime capture, NOT a re-runnable proof. Never upgrade to `verified`. */
  provenance: 'captured';
  eventId: string;
  eventType: CorpusEventType;
  timestamp: string; // ISO 8601
  sessionId: string;
  /** Caller-anonymized — the recorder never receives a raw player id. */
  participantId: string;
  worldId: string;
  payload: Record<string, unknown>;
  /** PII classes scrubbed from the payload (empty if none). */
  redactions: string[];
}

export type CorpusSink = (row: CorpusRow) => void | Promise<void>;

export interface CorpusRecorderConfig {
  eventBus: EventBus;
  /**
   * MUST be pre-anonymized by the caller (e.g. `anon_<hash of holokey id>`).
   * The recorder does not hash it — anonymization is the identity layer's job.
   */
  participantId: string;
  sessionId: string;
  worldId: string;
  /**
   * Capture happens ONLY when this returns true. If absent-equivalent (returns
   * false or throws) the recorder is default-off and captures nothing.
   */
  consentGate: () => boolean;
  /** Where rows go (IndexedDB write, POST to a corpus ingest endpoint, etc.). */
  sink: CorpusSink;
  /** Optional override for free-text redaction. Defaults to `defaultRedact`. */
  redactText?: (text: string) => { text: string; redactions: string[] };
}

const PII_PATTERNS: Array<[string, RegExp]> = [
  ['email', /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi],
  ['wallet', /0x[a-fA-F0-9]{40}/g],
  ['phone', /\+?\d[\d\s().-]{7,}\d/g],
];

/** Scrub email / wallet / phone from free text, reporting which classes fired. */
export function defaultRedact(text: string): { text: string; redactions: string[] } {
  let out = String(text ?? '');
  const redactions: string[] = [];
  for (const [name, re] of PII_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(out)) {
      redactions.push(name);
      re.lastIndex = 0;
      out = out.replace(re, `[redacted:${name}]`);
    }
  }
  return { text: out, redactions };
}

// Small synchronous, browser-safe hash (FNV-1a) for a deterministic event id.
// This is an identifier, not a security hash — anonymization is the caller's job.
function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Build a normalized, PII-redacted corpus row. Pure + deterministic (same inputs =>
 * same eventId), so re-capturing an identical interaction is idempotent downstream.
 */
export function buildCorpusRow(
  cfg: Pick<CorpusRecorderConfig, 'participantId' | 'sessionId' | 'worldId' | 'redactText'>,
  eventType: CorpusEventType,
  event: WorldEvent,
  rawPayload: Record<string, unknown>
): CorpusRow {
  const redact = cfg.redactText ?? defaultRedact;
  const redactions: string[] = [];
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    if (typeof value === 'string') {
      const r = redact(value);
      payload[key] = r.text;
      redactions.push(...r.redactions);
    } else {
      payload[key] = value;
    }
  }
  const timestamp = new Date(event.timestamp || 0).toISOString();
  const seed = `${cfg.participantId}|${cfg.sessionId}|${cfg.worldId}|${eventType}|${event.timestamp || 0}|${JSON.stringify(payload)}`;
  return {
    schema: CORPUS_SCHEMA,
    provenance: 'captured',
    eventId: `evt_${fnv1a(seed)}`,
    eventType,
    timestamp,
    sessionId: cfg.sessionId,
    participantId: cfg.participantId,
    worldId: cfg.worldId,
    payload,
    redactions: [...new Set(redactions)],
  };
}

export class CorpusRecorder {
  private readonly cfg: CorpusRecorderConfig;
  private unsubscribes: Array<() => void> = [];
  private capturing = false;

  constructor(cfg: CorpusRecorderConfig) {
    this.cfg = cfg;
    if (this.consentAllows()) this.attach();
  }

  /** Whether the recorder is currently capturing. */
  get enabled(): boolean {
    return this.capturing;
  }

  private consentAllows(): boolean {
    try {
      return this.cfg.consentGate() === true;
    } catch {
      return false;
    }
  }

  /**
   * Re-evaluate consent and attach/detach accordingly. Call when the player's
   * consent preference changes (opt-in or revoke).
   */
  setConsent(allowed: boolean): void {
    if (allowed && !this.capturing) this.attach();
    else if (!allowed && this.capturing) this.detach();
  }

  /** Stop capturing and release every EventBus listener. */
  dispose(): void {
    this.detach();
  }

  private attach(): void {
    if (this.capturing) return;
    const bus = this.cfg.eventBus;
    this.unsubscribes.push(
      bus.on('npc:interact', (e) =>
        this.record('npc_interact', e, {
          npcId: (e.data as { npcId?: string })?.npcId,
          dialogId: (e.data as { dialogId?: string })?.dialogId,
        })
      ),
      bus.on('dialog:start', (e) => {
        const d = e.data as { id?: string; text?: string; options?: unknown[] };
        this.record('dialog_start', e, {
          dialogId: d?.id,
          text: d?.text,
          optionCount: Array.isArray(d?.options) ? d!.options.length : 0,
        });
      }),
      bus.on('dialog:option', (e) =>
        this.record('dialog_option', e, {
          nextId: (e.data as { nextId?: string })?.nextId,
          action: (e.data as { action?: string })?.action,
        })
      ),
      bus.on('dialog:end', (e) => this.record('dialog_end', e, {}))
    );
    this.capturing = true;
  }

  private detach(): void {
    for (const unsub of this.unsubscribes) {
      try {
        unsub();
      } catch {
        /* ignore */
      }
    }
    this.unsubscribes = [];
    this.capturing = false;
  }

  private record(eventType: CorpusEventType, event: WorldEvent, payload: Record<string, unknown>): void {
    // Re-check consent at capture time so a mid-session revoke stops capture now.
    if (!this.consentAllows()) {
      if (this.capturing) this.detach();
      return;
    }
    const row = buildCorpusRow(this.cfg, eventType, event, payload);
    // A sink failure must never break the world loop.
    Promise.resolve(this.cfg.sink(row)).catch(() => {
      /* swallow — capture is best-effort, gameplay is authoritative */
    });
  }
}
