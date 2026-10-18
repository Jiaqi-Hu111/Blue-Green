import test from "node:test";
import assert from "node:assert/strict";
import {
  TrailNetwork,
  growthTarget,
  visualQuality,
  ASSESSMENT_STEPS,
} from "./growthModel.js";
test("preparation is empty; stage recovery is bounded and playing is not capped by its milestone", () => {
  const n = new TrailNetwork({ seed: 77, width: 192, height: 136 });
  assert.equal(growthTarget(19), 0);
  assert.equal(n.coverage(), 0);
  n.advanceTo(growthTarget(40));
  assert.ok(n.coverage() > 0);
  n.advanceTo(ASSESSMENT_STEPS);
  const earlier = n.field.slice();
  n.advanceTo(ASSESSMENT_STEPS + 120);
  assert.notDeepEqual(n.field, earlier);
  assert.equal(n.iteration, ASSESSMENT_STEPS + 120);
});
test("same seeded replay is exact; all profiles retain living bounded agents and finite fields", () => {
  const coverage = [];
  for (const outcome of ["success", "incomplete", "failed", "unverified"]) {
    const a = new TrailNetwork({ seed: 42, outcome, width: 192, height: 136 });
    const b = new TrailNetwork({ seed: 42, outcome, width: 192, height: 136 });
    a.advanceTo(ASSESSMENT_STEPS);
    b.advanceTo(ASSESSMENT_STEPS);
    assert.deepEqual(a.field, b.field);
    assert.deepEqual(a.heading, b.heading);
    assert.ok(a.x.every((x) => x >= 0 && x < a.width));
    assert.ok(a.y.every((y) => y >= 0 && y < a.height));
    assert.ok(a.field.every((v) => Number.isFinite(v) && v >= 0));
    assert.ok(a.count > 1500);
    coverage.push(a.coverage());
  }
  assert.equal(new Set(coverage).size, 4);
  assert.ok(coverage[0] > coverage[1]);
  assert.ok(coverage[1] > coverage[2]);
});
test("initial quality tiers are bounded without altering the evaluator or swapping state during observation", () => {
  assert.deepEqual(visualQuality({ width: 390, memory: 8 }), {
    width: 320,
    height: 224,
  });
  assert.deepEqual(visualQuality({ width: 390, memory: 2 }), {
    width: 256,
    height: 176,
  });
  assert.deepEqual(visualQuality({ width: 1440, memory: 8 }), {
    width: 448,
    height: 304,
  });
});
