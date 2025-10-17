// room.js
// Session controller for BIGO DJ App.
// Owns room lifecycle, emits domain events, and bridges core/audio with integrations.

import { initCapture } from '../audio/capture.js';

// super tiny event bus so we don't drag in a library
const listeners = new Map(); // event -> Set<fn>
function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event).delete(fn); // unsubscribe
}
function emit(event, payload) {
  const subs = listeners.get(event);
  if (subs) for (const fn of subs) try { fn(payload); } catch (e) { console.error(e); }
}

// Room state is intentionally boring and serializable
const state = {
  id: null,
  status: 'idle', // idle | starting | live | stopping | error
  startedAt: null,
  stoppedAt: null,
  audio: null,    // { stream, audioCtx, analyser }
};

export function getState() {
  return { ...state, // shallow copy
           uptimeMs: state.startedAt && state.status === 'live'
             ? Date.now() - state.startedAt
             : 0 };
}

export async function startRoom(meta = {}) {
  if (state.status === 'live' || state.status === 'starting') return state;
  state.status = 'starting';
  emit('room:status', getState());

  try {
    // later, generate a real ID from your backend; for now, timestamp
    state.id = state.id || `room_${Date.now()}`;
    state.audio = await initCapture();
    state.startedAt = Date.now();
    state.stoppedAt = null;
    state.status = 'live';

    emit('room:started', { id: state.id, meta });
    emit('room:status', getState());
    return getState();
  } catch (err) {
    state.status = 'error';
    emit('room:error', { error: err });
    throw err;
  }
}

export async function stopRoom() {
  if (state.status !== 'live') return getState();
  state.status = 'stopping';
  emit('room:status', getState());

  try {
    // tidy up audio resources
    if (state.audio?.stream) {
      for (const track of state.audio.stream.getTracks()) track.stop();
    }
    if (state.audio?.audioCtx?.state !== 'closed') {
      await state.audio.audioCtx.close();
    }
  } catch (e) {
    console.warn('Audio cleanup warning:', e);
  } finally {
    state.stoppedAt = Date.now();
    state.audio = null;
    state.status = 'idle';
    emit('room:stopped', { id: state.id, durationMs: state.stoppedAt - state.startedAt });
    emit('room:status', getState());
  }

  return getState();
}

// subscribe API for UI/integrations
export const events = { on, emit };