import test from "node:test";
import assert from "node:assert/strict";
import { percentages, evaluate, rebalance, RULES } from "./simulation.js";
test("repeated portions, removals and unequal shares always produce 100%", () => {
  const portions = {};
  for (let i = 0; i < 157; i++) {
    const id = ["sawdust", "coffee", "straw", "paper"][i % 4];
    portions[id] = (portions[id] || 0) + 1;
    const result = percentages(portions);
    assert.equal(
      Object.values(result).reduce((s, n) => s + n, 0),
      100,
    );
    assert.ok(
      Object.values(result).every((n) => Number.isInteger(n) && n >= 0),
    );
  }
  assert.deepEqual(percentages({ sawdust: 1, coffee: 1, straw: 1 }), {
    sawdust: 34,
    coffee: 33,
    straw: 33,
  });
  assert.deepEqual(percentages({ sawdust: 0 }), {});
  assert.deepEqual(percentages({ sawdust: 2, straw: 1 }), {
    sawdust: 67,
    straw: 33,
  });
});
const base = {
  recipe: { sawdust: 60, straw: 40 },
  moisture: 62,
  temperature: 24,
  days: 18,
  treated: true,
};
test("all four outcomes are deterministic and linked to user inputs", () => {
  assert.equal(evaluate(base).outcome, "success");
  assert.equal(evaluate({ ...base, moisture: 45 }).outcome, "incomplete");
  assert.equal(evaluate({ ...base, temperature: 36 }).outcome, "failed");
  assert.equal(
    evaluate({
      ...base,
      recipe: { sawdust: 25, coffee: 25, straw: 25, paper: 25 },
    }).outcome,
    "unverified",
  );
  assert.deepEqual(evaluate(base), evaluate(base));
});
test("incubation duration and preparation influence outcomes and explanations", () => {
  assert.equal(evaluate({ ...base, days: 5 }).outcome, "incomplete");
  assert.equal(evaluate({ ...base, days: 32 }).outcome, "unverified");
  const risk = evaluate({ ...base, treated: false });
  assert.equal(risk.outcome, "failed");
  assert.ok(risk.reasons.some((r) => r.includes("Untreated")));
});
test("model boundaries, density assumptions and risk precedence", () => {
  assert.equal(
    evaluate({ ...base, moisture: 55, temperature: 20, days: 10 }).outcome,
    "success",
  );
  assert.equal(
    evaluate({ ...base, moisture: 70, temperature: 28, days: 28 }).outcome,
    "success",
  );
  assert.equal(evaluate({ ...base, moisture: 39 }).outcome, "failed");
  assert.equal(evaluate({ ...base, moisture: 81 }).outcome, "failed");
  assert.equal(
    evaluate({ ...base, recipe: { coffee: 60, straw: 40 } }).outcome,
    "incomplete",
  );
  assert.equal(
    evaluate({ ...base, recipe: { paper: 60, straw: 40 } }).outcome,
    "incomplete",
  );
  assert.equal(
    evaluate({ ...base, days: 32, treated: false }).outcome,
    "failed",
  );
  assert.equal(
    evaluate({ ...base, moisture: 45, temperature: 18, days: 5 }).outcome,
    "failed",
  );
});
test("legacy rebalance keeps integer totals", () => {
  let r = { sawdust: 34, coffee: 33, straw: 33 };
  for (let n = 0; n <= 100; n++) {
    r = rebalance(r, ["sawdust", "coffee", "straw"][n % 3], n);
    assert.equal(
      Object.values(r).reduce((a, b) => a + b),
      100,
    );
    assert.ok(Object.values(r).every((x) => x >= 0));
  }
});

test("normalized positive recipe shares determine coverage, not stale raw portion selections", () => {
  const result = evaluate({
    ...base,
    recipe: { sawdust: 60, straw: 40, coffee: 0, paper: 0 },
    portions: { sawdust: 60, straw: 40, coffee: 100, paper: 100 },
  });
  assert.equal(result.outcome, "success");
  assert.equal(result.label, "Favourable Growth");
});
