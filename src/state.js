import { MATERIALS, RULES, percentages } from "./simulation.js";
export const STORAGE_KEY = "bluegreen-lab-v2";
export const LEGACY_KEY = "bluegreen-lab-v1";
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
const clamp = (value, min, max, fallback) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
function sanitizePortions(raw = {}) {
  return Object.fromEntries(
    MATERIALS.map((m) => [
      m.id,
      Math.round(clamp(raw?.[m.id], 0, RULES.maxPortionsPerMaterial, 0)),
    ]).filter(([, n]) => n > 0),
  );
}
export function sanitizeDraft(raw = {}) {
  raw = raw && typeof raw === "object" ? raw : {};
  return {
    ...freshDraft(),
    portions: sanitizePortions(raw.portions),
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
  if (
    !raw ||
    typeof raw !== "object" ||
    !raw.recipe ||
    typeof raw.recipe !== "object"
  )
    return null;
  const recipe = percentages(sanitizePortions(raw.recipe));
  if (!Object.keys(recipe).length) return null;
  const validOutcome = [
    "success",
    "incomplete",
    "failed",
    "unverified",
  ].includes(raw.outcome)
    ? raw.outcome
    : "unverified";
  return {
    id: String(raw.id ?? `legacy-${index}`),
    number:
      Number.isInteger(raw.number) && raw.number > 0 ? raw.number : index + 1,
    date:
      typeof raw.date === "string" && Number.isFinite(Date.parse(raw.date))
        ? raw.date
        : null,
    recipe,
    portions: sanitizePortions(raw.portions || recipe),
    moisture: clamp(raw.moisture, 30, 90, 62),
    temperature: clamp(raw.temperature, 10, 38, 24),
    days: Number.isFinite(raw.days)
      ? Math.round(clamp(raw.days, 3, 35, 18))
      : null,
    treated: typeof raw.treated === "boolean" ? raw.treated : null,
    outcome: validOutcome,
    reasons: Array.isArray(raw.reasons)
      ? raw.reasons.filter((r) => typeof r === "string")
      : [],
    modelVersion: raw.modelVersion || 1,
    pinned: raw.pinned === true,
  };
}
export function loadState(storage) {
  const empty = {
    step: 0,
    draft: freshDraft(),
    history: [],
    resultId: null,
    nextNumber: 1,
  };
  try {
    const current = storage.getItem(STORAGE_KEY);
    if (current) {
      const raw = JSON.parse(current);
      const history = (Array.isArray(raw.history) ? raw.history : [])
        .map(sanitizeEntry)
        .filter(Boolean)
        .slice(0, RULES.maxHistory);
      return {
        ...empty,
        step: Math.round(clamp(raw.step, 0, 7, 0)),
        draft: sanitizeDraft(raw.draft),
        history,
        resultId: typeof raw.resultId === "string" ? raw.resultId : null,
        nextNumber: Math.max(...history.map((h) => h.number), 0) + 1,
      };
    }
    const legacy = JSON.parse(storage.getItem(LEGACY_KEY) || "null");
    if (!legacy || typeof legacy !== "object") return empty;
    const list = Array.isArray(legacy.history) ? legacy.history : [];
    const history = list
      .map((h, i) => sanitizeEntry({ ...h, number: list.length - i }, i))
      .filter(Boolean);
    return {
      ...empty,
      draft: sanitizeDraft({
        ...legacy,
        portions: legacy.recipe,
        mixProgress: Object.keys(legacy.recipe || {}).length ? 1 : 0,
      }),
      history,
      step: legacy.step === 5 ? 7 : 0,
      nextNumber: history.length + 1,
    };
  } catch {
    return empty;
  }
}
export function draftFromEntry(entry) {
  return sanitizeDraft({
    ...entry,
    portions: entry.portions || entry.recipe,
    mixProgress: 1,
    mixing: false,
    runId: null,
    growthProgress: 0,
  });
}
export function changePortion(draft, id, delta) {
  const n = Math.max(
    0,
    Math.min(RULES.maxPortionsPerMaterial, (draft.portions[id] || 0) + delta),
  );
  const portions = { ...draft.portions };
  if (n) portions[id] = n;
  else delete portions[id];
  return {
    ...draft,
    portions,
    mixProgress: 0,
    mixing: false,
    growthProgress: 0,
    runId: null,
  };
}
