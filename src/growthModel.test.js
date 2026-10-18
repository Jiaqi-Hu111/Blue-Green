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
    width: 384,
    height: 264,
  });
  assert.deepEqual(visualQuality({ width: 390, memory: 2 }), {
    width: 256,
    height: 176,
  });
  assert.deepEqual(visualQuality({ width: 1440, memory: 8 }), {
    width: 512,
    height: 352,
  });
});

// Topology regression for the visual coarsening bug. This measures the raw
// simulation, before opacity/blur/rendering: more ink alone cannot pass it.
function fieldTopology(network) {
  const { width, height, field } = network;
  const mask = Uint8Array.from(field, (v) => v > 2.5);
  const visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  let loops = 0,
    largest = 0,
    occupied = 0;
  for (let at = 0; at < mask.length; at++) {
    occupied += mask[at];
    if (visited[at]) continue;
    let head = 0,
      tail = 1,
      boundary = false;
    const trail = mask[at];
    queue[0] = at;
    visited[at] = 1;
    while (head < tail) {
      const i = queue[head++],
        x = i % width,
        y = (i / width) | 0;
      if (!x || x === width - 1 || !y || y === height - 1) boundary = true;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          // 8-connected trails, 4-connected gaps; no diagonal corner leaks.
          if ((!dx && !dy) || (!trail && dx && dy)) continue;
          const nx = x + dx,
            ny = y + dy,
            j = ny * width + nx;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          if (!visited[j] && mask[j] === trail) {
            visited[j] = 1;
            queue[tail++] = j;
          }
        }
      }
    }
    if (trail) largest = Math.max(largest, tail);
    else if (!boundary && tail >= 6) loops++;
  }
  return {
    loops,
    occupied: occupied / field.length,
    connected: largest / occupied,
  };
}

test("even the mobile fallback sustains a connected fine mesh through extended observation, without filling into fog", () => {
  const n = new TrailNetwork({ seed: 1363509514, width: 256, height: 176 });
  for (const step of [720, 3000]) {
    n.advanceTo(step);
    const shape = fieldTopology(n);
    assert.ok(shape.loops > 80, `fine loops at ${step}: ${shape.loops}`);
    assert.ok(shape.connected > 0.85, `connected trail share: ${shape.connected}`);
    assert.ok(
      shape.occupied > 0.25 && shape.occupied < 0.48,
      `open mesh rather than sparse routes or a solid field: ${shape.occupied}`,
    );
  }
});
