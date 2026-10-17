import test from "node:test";
import assert from "node:assert/strict";
import { TrailNetwork, growthTarget } from "./growthModel.js";
test("preparation has no trail; later stages add organic trails", () => {
  const n = new TrailNetwork({ seed: 77 });
  assert.equal(growthTarget(19), 0);
  assert.equal(n.coverage(), 0);
  n.advanceTo(growthTarget(40));
  assert.ok(n.coverage() > 0);
  const early = n.coverage();
  n.advanceTo(growthTarget(100));
  assert.ok(n.coverage() > early);
});
test("restart is deterministic and four outcomes have different bounded visual profiles", () => {
  const cover = [];
  for (const outcome of ["success", "incomplete", "failed", "unverified"]) {
    const one = new TrailNetwork({ seed: 42, outcome }),
      two = new TrailNetwork({ seed: 42, outcome });
    one.advanceTo(240);
    two.advanceTo(240);
    assert.deepEqual(one.field, two.field);
    assert.ok(
      one.agents.every(
        (a) => a.x >= 0 && a.x < one.width && a.y >= 0 && a.y < one.height,
      ),
    );
    cover.push(one.coverage());
  }
  assert.equal(new Set(cover).size, 4);
  assert.ok(cover[0] > cover[1]);
  assert.ok(cover[1] > cover[2]);
});
