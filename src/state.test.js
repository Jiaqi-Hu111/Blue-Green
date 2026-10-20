import test from "node:test";
import assert from "node:assert/strict";
import {
  loadState,
  persistState,
  freshDraft,
  startVisitor,
  referenceDraft,
  setIngredientPercent,
  addIngredient,
  removeIngredient,
  draftFromEntry,
  positiveIngredientCount,
  STORAGE_KEY,
  LEGACY_KEY,
  HISTORY_KEY,
  ACTIVE_KEY,
  SESSION_HISTORY_KEY,
} from "./state.js";
import { percentages, evaluate } from "./simulation.js";
function memory(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    data,
  };
}
const record = (id, number = 1) => ({
  id,
  number,
  recipe: { sawdust: 60, straw: 40 },
  moisture: 62,
  temperature: 24,
  days: 18,
  treated: true,
  outcome: "success",
  reasons: ["Original recorded reason."],
  customField: "preserve-me",
});
test("Entering clears every active field while retaining notebook records and privacy", () => {
  const state = {
    ...loadState(memory(), memory()),
    step: 0,
    draft: {
      ...referenceDraft(),
      temperature: 30,
      moisture: 77,
      days: 30,
      treated: false,
      mixing: true,
      mixProgress: 1,
      growthProgress: 100,
      runId: "previous-visitor",
    },
    resultId: "previous-visitor",
    resumeDraft: referenceDraft(),
    resumeStep: 4,
    resumeResultId: "previous-visitor",
    history: [record("previous-visitor", 10)],
    nextNumber: 11,
    privacy: "session",
  };
  for (const step of [1, 2]) {
    const fresh = startVisitor(state, step);
    assert.equal(fresh.step, 2);
    assert.deepEqual(fresh.draft, freshDraft());
    assert.equal(fresh.resultId, null);
    assert.equal(fresh.resumeDraft, null);
    assert.equal(fresh.resumeStep, null);
    assert.equal(fresh.resumeResultId, null);
    assert.equal(fresh.history, state.history);
    assert.equal(fresh.nextNumber, 11);
    assert.equal(fresh.privacy, "session");
  }
});
test("fresh visitor starts empty while all legacy records and raw data survive", () => {
  const raw = JSON.stringify({
    step: 5,
    draft: { ...referenceDraft(), mixProgress: 1, runId: "done" },
    history: [record("done")],
  });
  const local = memory({ [STORAGE_KEY]: raw }),
    session = memory();
  const state = loadState(local, session);
  assert.deepEqual(state.draft.portions, {});
  assert.equal(state.step, 0);
  assert.equal(state.history.length, 1);
  persistState(state, local, session);
  assert.equal(local.getItem(STORAGE_KEY), raw);
  assert.equal(
    JSON.parse(local.getItem(HISTORY_KEY))[0].customField,
    "preserve-me",
  );
});
test("unfinished legacy draft is offered for explicit resume, never auto-loaded", () => {
  const state = loadState(
    memory({
      [STORAGE_KEY]: JSON.stringify({ draft: referenceDraft(), history: [] }),
    }),
    memory(),
  );
  assert.deepEqual(state.draft.portions, {});
  assert.deepEqual(state.resumeDraft.portions, { sawdust: 60, straw: 40 });
});
test("same-tab refresh offers explicit resume, keeps the landing draft empty and retains the checkpoint", () => {
  const local = memory(),
    session = memory();
  let state = loadState(local, session);
  state = {
    ...state,
    step: 4,
    draft: {
      ...referenceDraft(),
      mixProgress: 1,
      growthProgress: 45,
      runId: "active",
    },
  };
  persistState(state, local, session);
  const restored = loadState(local, session);
  assert.equal(restored.step, 0);
  assert.deepEqual(restored.draft, freshDraft());
  assert.equal(restored.resumeStep, 4);
  assert.equal(restored.resumeDraft.growthProgress, 45);
  assert.equal(restored.resumeDraft.temperature, 24);
  // Persisting the empty landing page must not overwrite the pending snapshot.
  persistState(restored, local, session);
  const again = loadState(local, session);
  assert.deepEqual(again.resumeDraft, restored.resumeDraft);
  assert.equal(again.resumeStep, 4);
  persistState(startVisitor(again), local, session);
  assert.equal(loadState(local, session).resumeDraft, null);
  assert.deepEqual(loadState(local, memory()).draft.portions, {});
});
test("retired introduction checkpoints resume in mixing, and fresh starts do not revive a legacy draft", () => {
  const local = memory({ [STORAGE_KEY]: JSON.stringify({ draft: referenceDraft() }) });
  const session = memory({ [ACTIVE_KEY]: JSON.stringify({ step: 1, draft: referenceDraft() }) });
  const recovered = loadState(local, session);
  assert.equal(recovered.step, 0);
  assert.equal(recovered.resumeStep, 2);
  persistState(startVisitor(recovered), local, session);
  assert.equal(loadState(local, session).resumeDraft, null);
  assert.deepEqual(loadState(local, session).draft, freshDraft());
});
test("starting a new recipe and exceeding 24 records never prunes completed history", () => {
  const history = Array.from({ length: 35 }, (_, i) =>
      record(`run-${i}`, i + 1),
    ),
    local = memory({ [HISTORY_KEY]: JSON.stringify(history) }),
    session = memory();
  let state = loadState(local, session);
  state = { ...state, draft: freshDraft(), step: 2, resultId: null };
  persistState(state, local, session);
  assert.equal(loadState(local, session).history.length, 35);
  assert.deepEqual(
    JSON.parse(local.getItem(HISTORY_KEY)).find((r) => r.id === "run-0")
      .reasons,
    ["Original recorded reason."],
  );
});
test("privacy mode keeps prior device records and session-only new entries in their own store", () => {
  const local = memory({ [HISTORY_KEY]: JSON.stringify([record("past")]) }),
    session = memory();
  const state = {
    ...loadState(local, session),
    privacy: "session",
    history: [
      { ...record("private", 2), storageMode: "session" },
      record("past"),
    ],
  };
  persistState(state, local, session);
  assert.equal(JSON.parse(local.getItem(HISTORY_KEY)).length, 1);
  assert.equal(JSON.parse(session.getItem(SESSION_HISTORY_KEY)).length, 1);
  assert.equal(loadState(local, session).history.length, 2);
  assert.equal(loadState(local, memory()).history.length, 1);
});
test("merges another tab’s records instead of overwriting them", () => {
  const local = memory(),
    session = memory();
  const first = loadState(local, session);
  persistState({ ...first, history: [record("other", 2)] }, local, memory());
  persistState({ ...first, history: [record("this", 1)] }, local, session);
  assert.equal(loadState(local, session).history.length, 2);
});
test("percentage edits normalize, keep zeros editable and invalidate completed mixing", () => {
  let d = { ...referenceDraft(), mixProgress: 1, runId: "old" };
  for (let n = 0; n <= 100; n++) {
    d = setIngredientPercent(d, "sawdust", n);
    assert.equal(
      Object.values(percentages(d.portions)).reduce((s, v) => s + v),
      100,
    );
  }
  d = setIngredientPercent(d, "sawdust", 0);
  assert.equal(d.portions.sawdust, 0);
  assert.equal(positiveIngredientCount(percentages(d.portions)), 1);
  assert.equal(d.mixProgress, 0);
  assert.equal(d.runId, null);
  d = removeIngredient(d, "sawdust");
  assert.deepEqual(d.portions, { straw: 100 });
});
test("adding, removing and roundoff preserve a valid recipe", () => {
  let d = freshDraft();
  for (const id of ["sawdust", "coffee", "straw", "paper"]) {
    d = addIngredient(d, id);
    assert.equal(
      Object.values(percentages(d.portions)).reduce((s, v) => s + v),
      100,
    );
  }
  for (let n = 0; n < 100; n++) {
    d = setIngredientPercent(
      d,
      ["sawdust", "coffee", "straw", "paper"][n % 4],
      n,
    );
    assert.equal(
      Object.values(d.portions).reduce((s, v) => s + v),
      100,
    );
    assert.ok(Object.values(d.portions).every((n) => n >= 0));
  }
  assert.deepEqual(
    removeIngredient(addIngredient(freshDraft(), "straw"), "straw").portions,
    {},
  );
});
test("reference recipe flows through actual state and produces Favourable Growth", () => {
  const d = referenceDraft();
  const r = evaluate({ ...d, recipe: percentages(d.portions) });
  assert.equal(r.outcome, "success");
  assert.equal(r.label, "Favourable Growth");
  assert.ok(r.reasons.some((r) => r.includes("60%")));
  assert.ok(r.reasons.some((r) => r.includes("62%")));
  assert.ok(r.reasons.some((r) => r.includes("24°C")));
});
test("duplication preserves conditions but creates a separate active run", () => {
  const d = draftFromEntry(record("old"));
  assert.deepEqual(d.portions, { sawdust: 60, straw: 40 });
  assert.equal(d.mixProgress, 1);
  assert.equal(d.runId, null);
});
test("corrupt history is not overwritten and unavailable storage has a safe blank loader", () => {
  const local = memory({ [HISTORY_KEY]: "broken" });
  assert.throws(() =>
    persistState(loadState(local, memory()), local, memory()),
  );
  assert.equal(local.getItem(HISTORY_KEY), "broken");
  assert.equal(
    loadState({
      getItem() {
        throw Error();
      },
    }).history.length,
    0,
  );
});
