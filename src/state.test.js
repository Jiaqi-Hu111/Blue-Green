import test from "node:test";
import assert from "node:assert/strict";
import {
  loadState,
  freshDraft,
  changePortion,
  draftFromEntry,
  STORAGE_KEY,
  LEGACY_KEY,
  sanitizeDraft,
} from "./state.js";
import { percentages } from "./simulation.js";
const storage = (entries) => ({ getItem: (key) => entries[key] || null });
test("migrates previous experiments and preserves their recorded outcome", () => {
  const old = {
    step: 5,
    recipe: { sawdust: 65, coffee: 35 },
    moisture: 62,
    temperature: 24,
    history: [
      {
        id: 123,
        recipe: { sawdust: 65, coffee: 35 },
        moisture: 62,
        temperature: 24,
        outcome: "success",
        reasons: ["Original recorded explanation."],
      },
    ],
  };
  const state = loadState(storage({ [LEGACY_KEY]: JSON.stringify(old) }));
  assert.equal(state.step, 7);
  assert.deepEqual(percentages(state.draft.portions), old.recipe);
  assert.equal(state.history[0].id, "123");
  assert.equal(state.history[0].modelVersion, 1);
  assert.equal(state.history[0].reasons[0], "Original recorded explanation.");
  assert.equal(state.nextNumber, 2);
  assert.equal(state.history[0].days, null);
  assert.equal(state.history[0].treated, null);
});
test("v2 restores unfinished mixing, conditions, growth and records", () => {
  const raw = {
    step: 4,
    draft: {
      portions: { sawdust: 2, straw: 1 },
      mixing: true,
      mixProgress: 1,
      growthProgress: 47,
      runId: "test-run",
      days: 22,
      treated: false,
      moisture: 60,
      temperature: 23,
    },
    history: [
      {
        id: "past",
        number: 9,
        recipe: { sawdust: 50, straw: 50 },
        outcome: "incomplete",
      },
    ],
    resultId: "past",
  };
  const result = loadState(storage({ [STORAGE_KEY]: JSON.stringify(raw) }));
  assert.equal(result.draft.growthProgress, 47);
  assert.equal(result.draft.days, 22);
  assert.equal(result.draft.treated, false);
  assert.equal(result.resultId, "past");
  assert.equal(result.nextNumber, 10);
});
test("invalid, blocked and corrupted storage fall back safely", () => {
  for (const input of ["bad-json", "null", "42"])
    assert.deepEqual(loadState(storage({ [STORAGE_KEY]: input })).history, []);
  assert.equal(
    loadState({
      getItem() {
        throw Error("denied");
      },
    }).step,
    0,
  );
  assert.equal(sanitizeDraft(null).moisture, 62);
});
test("portion changes invalidate blending while preserving conditions", () => {
  let d = { ...freshDraft(), moisture: 67, days: 20, mixProgress: 1 };
  d = changePortion(d, "sawdust", 1);
  d = changePortion(d, "straw", 1);
  assert.equal(d.mixProgress, 0);
  assert.equal(d.moisture, 67);
  assert.equal(d.days, 20);
  d = changePortion(d, "straw", -1);
  assert.deepEqual(d.portions, { sawdust: 1 });
});
test("duplication preserves proportions and conditions but begins a separate run", () => {
  const d = draftFromEntry({
    recipe: { sawdust: 67, straw: 33 },
    days: 14,
    moisture: 66,
    temperature: 26,
    treated: false,
    id: "old",
  });
  assert.deepEqual(percentages(d.portions), { sawdust: 67, straw: 33 });
  assert.equal(d.mixProgress, 1);
  assert.equal(d.runId, null);
  assert.equal(d.days, 14);
  assert.equal(d.treated, false);
});
