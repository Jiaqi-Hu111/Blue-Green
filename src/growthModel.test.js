import test from "node:test";
import assert from "node:assert/strict";
import { ColonisationNetwork, growthTarget, visualQuality, ASSESSMENT_STEPS } from "./growthModel.js";
test("an empty substrate develops sparse branches, a connecting mesh and near-complete persistent colonisation", () => {
  const n = new ColonisationNetwork({
    seed: 1363509514
  });
  assert.equal(growthTarget(0), 0);
  assert.equal(growthTarget(25), 180);
  assert.equal(n.coverage(), 0);
  assert.ok(n.field.every(v => v === 0));
  let previous = n.field.slice();
  for (const [progress, low, high] of [[25, .03, .1], [50, .25, .4], [75, .6, .8], [100, .9, .95]]) {
    n.advanceTo(growthTarget(progress));
    assert.ok(n.coverage() >= low && n.coverage() <= high, `${progress}% stage coverage ${n.coverage()}`);
    assert.ok(n.field.every((v, i) => v >= previous[i]), "formed filaments never evaporate");
    assert.ok(n.field.every((v, i) => Number.isFinite(v) && v >= 0 && v <= 1 && (n.mask[i] || v === 0)));
    previous = n.field.slice();
  }
  assert.ok(n.segments > 50000, "mature coverage is accumulated filament strokes");
  n.advanceTo(ASSESSMENT_STEPS + 1000);
  assert.equal(n.iteration, ASSESSMENT_STEPS);
  assert.deepEqual(n.field, previous, "completed growth is stable until Replay");
});
test("Replay, direct Skip and incremental progression yield exactly the same seeded final filaments for all four outcomes", () => {
  const coverage = [];
  for (const outcome of ["success", "incomplete", "failed", "unverified"]) {
    const a = new ColonisationNetwork({
      outcome,
      seed: 42,
      width: 256,
      height: 176
    });
    const b = new ColonisationNetwork({
      outcome,
      seed: 42,
      width: 256,
      height: 176
    });
    for (let target = 30; target <= ASSESSMENT_STEPS; target += 30) a.advanceTo(target);
    b.advanceTo(ASSESSMENT_STEPS);
    assert.deepEqual(a.field, b.field);
    assert.equal(a.segments, b.segments);
    assert.ok(a.tips.every(t => t.x >= 0 && t.x < a.width && t.y >= 0 && t.y < a.height));
    coverage.push(a.coverage());
  }
  assert.ok(coverage[0] > .9 && coverage[0] < .95);
  assert.ok(coverage[1] > .45 && coverage[1] < .6);
  assert.ok(coverage[2] > .15 && coverage[2] < .3);
  assert.ok(coverage[3] > .55 && coverage[3] < .7);
  assert.ok(new Set(coverage).size === 4);
});
test("constrained and desktop fields both finish dense while retaining holes, tone variation and bounded work slices", () => {
  for (const [width, height] of [[256, 176], [512, 352]]) {
    const n = new ColonisationNetwork({
      seed: 124,
      width,
      height
    });
    assert.equal(n.advanceTo(ASSESSMENT_STEPS, 7), false);
    assert.equal(n.iteration, 7);
    n.advanceTo(ASSESSMENT_STEPS);
    assert.ok(n.coverage() > .9 && n.coverage() < .95);
    const ink = Array.from(n.field).filter((_, i) => n.mask[i]);
    assert.ok(ink.some(v => v < .1), "small exposed areas remain");
    assert.ok(ink.some(v => v > .8), "reinforced fibres remain legible");
    assert.ok(ink.some(v => v > .4 && v < .65), "fine layered fibres retain substrate texture");
    assert.ok(n.frontierCount <= n.field.length);
    assert.ok(n.tips.length <= 512);
  }
});
test("same seed reproduces inoculation sites; other recipes vary artwork, without changing artistic quality tiers", () => {
  const a = new ColonisationNetwork({
    seed: 1,
    width: 256,
    height: 176
  });
  const b = new ColonisationNetwork({
    seed: 2,
    width: 256,
    height: 176
  });
  a.advanceTo(180);
  b.advanceTo(180);
  assert.notDeepEqual(a.field, b.field);
  assert.deepEqual(visualQuality({
    width: 390,
    memory: 8
  }), {
    width: 384,
    height: 264
  });
  assert.deepEqual(visualQuality({
    width: 390,
    memory: 2
  }), {
    width: 256,
    height: 176
  });
  assert.deepEqual(visualQuality({
    width: 1440,
    memory: 8
  }), {
    width: 512,
    height: 352
  });
});
