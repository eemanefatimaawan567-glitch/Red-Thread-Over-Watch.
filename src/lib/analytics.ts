const EVENTS = [
  'mission_started',
  'signal_collected',
  'enemy_defeated',
  'mission_completed',
  'mission_failed',
  'outfit_selected',
  'purchase_started',
  'purchase_completed',
  'purchase_cancelled',
  'purchase_restore_started',
  'purchase_restore_succeeded',
  'purchase_restore_empty',
] as const;

export type GameEventName = typeof EVENTS[number];
type EventValue = string | number | boolean | null;
type EventMetadata = Record<string, EventValue>;

type GameEvent = {
  event_id: string;
  event_name: GameEventName;
  anonymous_player_id: string;
  session_id: string;
  occurred_at: string;
  metadata: EventMetadata;
};

const PLAYER_KEY = 'red-thread-analytics-player';
const QUEUE_KEY = 'red-thread-analytics-queue';
const EVENT_NAMES = new Set<string>(EVENTS);

// randomUUID is restricted to secure contexts in some mobile browsers. Local
// phone testing commonly uses a LAN http:// address, so analytics must not be
// allowed to crash otherwise offline-safe gameplay.
const id = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};

const SESSION_ID = id();

function playerId() {
  const saved = window.localStorage.getItem(PLAYER_KEY);
  if (saved) return saved;
  const created = `player_${id()}`;
  window.localStorage.setItem(PLAYER_KEY, created);
  return created;
}

function sanitizeMetadata(metadata: EventMetadata) {
  return Object.fromEntries(Object.entries(metadata).slice(0, 20).map(([key, value]) => [
    key.replace(/[^a-z0-9_]/gi, '_').slice(0, 40),
    typeof value === 'string' ? value.slice(0, 120) : value,
  ]));
}

function readQueue(): GameEvent[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(-100) : [];
  } catch {
    return [];
  }
}

function saveQueue(events: GameEvent[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-100)));
}

async function send(events: GameEvent[]) {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key || events.length === 0) return false;
  const response = await fetch(`${url}/rest/v1/game_events`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(events),
    keepalive: true,
  });
  return response.ok;
}

export async function flushGameEvents() {
  const queued = readQueue();
  if (!queued.length) return;
  try {
    if (await send(queued)) saveQueue([]);
  } catch {
    // Offline play is supported; queued events are retried later.
  }
}

export function trackGameEvent(eventName: GameEventName, metadata: EventMetadata = {}) {
  try {
  if (!EVENT_NAMES.has(eventName)) return;
  const event: GameEvent = {
    event_id: id(),
    event_name: eventName,
    anonymous_player_id: playerId(),
    session_id: SESSION_ID,
    occurred_at: new Date().toISOString(),
    metadata: sanitizeMetadata(metadata),
  };
  saveQueue([...readQueue(), event]);
  void flushGameEvents();
  } catch { /* Storage restrictions must never interrupt gameplay. */ }
}
