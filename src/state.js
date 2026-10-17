import { MATERIALS, percentages, rebalance } from "./simulation.js";
// Old keys are read-only migration sources. Never clear them or replace their records.
export const STORAGE_KEY = "bluegreen-lab-v2";
export const LEGACY_KEY = "bluegreen-lab-v1";
export const HISTORY_KEY = "bluegreen-history-v3";
export const ACTIVE_KEY = "bluegreen-active-v3";
export const SESSION_HISTORY_KEY = "bluegreen-session-history-v3";
export const PRIVACY_KEY = "bluegreen-notebook-privacy";
const clamp = (n, a, b, f) =>
  Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : f;
export function freshDraft() {
  return {
    portions: {},
    moisture: 62,
    temperature: 24,
    days: 18,
    treated: true,
    mixing: false,
    mixProgress: 0,
    growthProgress: 0,
    runId: null,
  };
}
// Enter/Begin is a visitor boundary, even when this tab recovered an active run.
// Keep the notebook, its privacy mode and numbering; replace only active work.
export function startVisitor(state, step = 1) {
  return {
    ...state,
    step,
    draft: freshDraft(),
    resultId: null,
    resumeDraft: null,
  };
}
const read = (storage, key, fallback = null) => {
  try {
    return JSON.parse(storage?.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};
const selected = (raw = {}) =>
  Object.fromEntries(
    MATERIALS.filter((m) => Object.hasOwn(raw || {}, m.id)).map((m) => [
      m.id,
      clamp(Number(raw[m.id]), 0, 100000, 0),
    ]),
  );
export function sanitizeDraft(raw = {}) {
  raw = raw && typeof raw === "object" ? raw : {};
  return {
    ...freshDraft(),
    portions: selected(raw.portions),
    moisture: clamp(raw.moisture, 30, 90, 62),
    temperature: clamp(raw.temperature, 10, 38, 24),
    days: Math.round(clamp(raw.days, 3, 35, 18)),
    treated: raw.treated !== false,
    mixing: raw.mixing === true,
    mixProgress: clamp(raw.mixProgress, 0, 1, 0),
    growthProgress: clamp(raw.growthProgress, 0, 100, 0),
    runId: typeof raw.runId === "string" ? raw.runId : null,
  };
}
export function sanitizeEntry(raw, index = 0) {
  if (!raw || typeof raw !== "object" || !raw.recipe) return null;
  const recipe = percentages(selected(raw.recipe));
  if (!Object.keys(recipe).length) return null;
  return {
    ...raw,
    id: String(raw.id ?? `legacy-${index}`),
    number:
      Number.isInteger(raw.number) && raw.number > 0 ? raw.number : index + 1,
    date:
      typeof raw.date === "string" && Number.isFinite(Date.parse(raw.date))
        ? raw.date
        : null,
    recipe,
    portions: selected(raw.portions || recipe),
    moisture: clamp(raw.moisture, 30, 90, 62),
    temperature: clamp(raw.temperature, 10, 38, 24),
    days: Number.isFinite(raw.days)
      ? Math.round(clamp(raw.days, 3, 35, 18))
      : null,
    treated: typeof raw.treated === "boolean" ? raw.treated : null,
    outcome: ["success", "incomplete", "failed", "unverified"].includes(
      raw.outcome,
    )
      ? raw.outcome
      : "unverified",
    reasons: Array.isArray(raw.reasons)
      ? raw.reasons.filter((r) => typeof r === "string")
      : [],
    modelVersion: raw.modelVersion || 1,
    pinned: raw.pinned === true,
  };
}
export function mergeRecords(...lists) {
  const records = new Map();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    list.forEach((entry, index) => {
      if (entry && typeof entry === "object") {
        const id = String(entry.id ?? `legacy-${index}`);
        const old = records.get(id);
        records.set(
          id,
          old
            ? { ...old, pinned: entry.pinned ?? old.pinned }
            : { ...entry, id },
        );
      }
    });
  }
  return [...records.values()].sort(
    (a, b) =>
      (b.number || 0) - (a.number || 0) ||
      String(b.date || "").localeCompare(String(a.date || "")),
  );
}
export function deviceRecords(storage) {
  const v1 = read(storage, LEGACY_KEY, {}),
    v2 = read(storage, STORAGE_KEY, {});
  return mergeRecords(
    Array.isArray(v1.history)
      ? v1.history.map((h, i) => ({
          ...h,
          number: h.number || v1.history.length - i,
        }))
      : [],
    v2.history,
    read(storage, HISTORY_KEY, []),
  );
}
export function loadState(local, session) {
  const rawDevice = deviceRecords(local),
    sessionRecords = read(session, SESSION_HISTORY_KEY, []);
  const history = mergeRecords(rawDevice, sessionRecords)
    .map(sanitizeEntry)
    .filter(Boolean);
  const active = read(session, ACTIVE_KEY),
    old = read(local, STORAGE_KEY, {});
  const empty = {
    step: 0,
    draft: freshDraft(),
    history,
    resultId: null,
    nextNumber: Math.max(0, ...history.map((h) => h.number)) + 1,
    privacy:
      read(local, PRIVACY_KEY, "device") === "session" ? "session" : "device",
    resumeDraft: null,
  };
  // Same-tab reload preserves progress. A fresh tab never auto-loads a local recipe.
  if (active?.draft)
    return {
      ...empty,
      step: Math.round(clamp(active.step, 0, 7, 0)),
      draft: sanitizeDraft(active.draft),
      resultId: typeof active.resultId === "string" ? active.resultId : null,
    };
  const candidate = old.draft || read(local, LEGACY_KEY, {});
  const resume = sanitizeDraft({
    ...candidate,
    portions: candidate.portions || candidate.recipe,
  });
  if (
    Object.values(resume.portions).some((n) => n > 0) &&
    !history.some((h) => h.id === resume.runId)
  )
    empty.resumeDraft = resume;
  return empty;
}
function writeChanged(storage, key, value) {
  const old = storage.getItem(key);
  if (key === HISTORY_KEY && old !== null) {
    try {
      JSON.parse(old);
    } catch {
      throw new Error(
        "Notebook data is unreadable; preserving the original data.",
      );
    }
  }
  const next = JSON.stringify(value);
  if (old !== next) storage.setItem(key, next);
}
export function persistState(state, local, session) {
  // Device records are append/merge-only. Completed entries are not reevaluated or truncated.
  const existing = deviceRecords(local);
  const known = new Set(existing.map((h) => String(h.id)));
  const newRecords = state.history.filter((h) => !known.has(h.id));
  const deviceNew = newRecords.filter((h) => h.storageMode !== "session");
  const pinUpdates = existing.map((h) => {
    const view = state.history.find((v) => v.id === String(h.id));
    return view ? { ...h, pinned: view.pinned } : h;
  });
  // Save the active tab and pending completions first, even if device storage is full/corrupt.
  writeChanged(session, ACTIVE_KEY, {
    step: state.step,
    draft: state.draft,
    resultId: state.resultId,
  });
  writeChanged(
    session,
    SESSION_HISTORY_KEY,
    mergeRecords(read(session, SESSION_HISTORY_KEY, []), newRecords),
  );
  writeChanged(
    local,
    HISTORY_KEY,
    mergeRecords(existing, pinUpdates, deviceNew),
  );
  writeChanged(local, PRIVACY_KEY, state.privacy);
}
export function positiveIngredientCount(recipe) {
  return Object.values(recipe).filter((n) => n > 0).length;
}
function changedRecipe(draft, portions) {
  return {
    ...draft,
    portions,
    mixProgress: 0,
    mixing: false,
    growthProgress: 0,
    runId: null,
  };
}
export function addIngredient(draft, id) {
  const recipe = percentages(draft.portions);
  if (!Object.keys(recipe).length) return changedRecipe(draft, { [id]: 100 });
  if (Object.hasOwn(draft.portions, id))
    return setIngredientPercent(
      draft,
      id,
      Math.min(100, (recipe[id] || 0) + 10),
    );
  const n = Object.keys(draft.portions).length + 1;
  const next = { ...recipe, [id]: 0 };
  return changedRecipe(draft, rebalance(next, id, Math.round(100 / n)));
}
export function setIngredientPercent(draft, id, value) {
  if (!Object.hasOwn(draft.portions, id)) return draft;
  const recipe = percentages(draft.portions);
  const next = rebalance(
    Object.keys(recipe).length ? recipe : draft.portions,
    id,
    value,
  );
  return JSON.stringify(next) === JSON.stringify(draft.portions)
    ? draft
    : changedRecipe(draft, next);
}
export function removeIngredient(draft, id) {
  const next = { ...draft.portions };
  delete next[id];
  return changedRecipe(draft, percentages(next));
}
export function changePortion(draft, id, delta) {
  return delta > 0 ? addIngredient(draft, id) : removeIngredient(draft, id);
}
export function draftFromEntry(entry) {
  return sanitizeDraft({
    ...entry,
    portions: entry.recipe,
    mixProgress: 1,
    mixing: false,
    runId: null,
    growthProgress: 0,
  });
}
export function referenceDraft() {
  return { ...freshDraft(), portions: { sawdust: 60, straw: 40 } };
}
