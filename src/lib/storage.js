export const STORAGE_KEY = "adversarial-red-team-state-v2";

export function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

export function loadStoredState(defaultState) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneState(defaultState);
    }

    const parsed = JSON.parse(raw);
    return {
      ...cloneState(defaultState),
      ...parsed,
      scores: { ...defaultState.scores, ...(parsed.scores || {}) },
      providerConfig: { ...defaultState.providerConfig, ...(parsed.providerConfig || {}) },
      memories: {
        artemis: parsed.memories?.artemis || [],
        aegis: parsed.memories?.aegis || [],
        judge: parsed.memories?.judge || [],
      },
      log: Array.isArray(parsed.log) ? parsed.log : [],
    };
  } catch {
    return cloneState(defaultState);
  }
}

export function saveStoredState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
