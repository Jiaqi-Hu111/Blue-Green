import test from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "./simulation.js";
import { describeExperiment, EVIDENCE_TABLE } from "./outcomeFeedback.js";
import { SOURCES } from "./data/research.js";
const base = {
  recipe: { sawdust: 60, straw: 40 },
  moisture: 62,
  temperature: 24,
  days: 18,
  treated: true,
};
test("reference and meaningful input variations keep every category, with specific educational feedback", () => {
  for (const [changes, expected, term] of [
    [{}, "success", "Sawdust 60%"],
    [{ moisture: 45 }, "incomplete", "45%"],
    [{ temperature: 36 }, "failed", "36°C"],
    [{ treated: false }, "failed", "Untreated"],
    [{ days: 32 }, "unverified", "32 simulated"],
    [
      { recipe: { sawdust: 25, coffee: 25, straw: 25, paper: 25 } },
      "unverified",
      "Four positive",
    ],
    [{ recipe: { coffee: 60, straw: 40 } }, "incomplete", "Coffee Grounds 60%"],
  ]) {
    const input = { ...base, ...changes },
      result = evaluate(input),
      feedback = describeExperiment(input, result.outcome);
    assert.equal(result.outcome, expected);
    assert.ok(JSON.stringify(feedback).includes(term));
    assert.ok(feedback.adjustments.length > 0);
    assert.equal(feedback.factors.length, 5);
    if (expected === "failed")
      assert.match(feedback.summary, /does not confirm contamination/);
    if (expected === "unverified")
      assert.match(feedback.summary, /uncertainty, not proof/);
    assert.deepEqual(evaluate(input), result);
  }
});
test("citation rows resolve the catalogue; technical-report status and moisture distinction are explicit", () => {
  for (const row of EVIDENCE_TABLE) {
    assert.ok(row.principle);
    assert.ok(row.assumption);
    for (const id of row.sources)
      assert.ok(
        SOURCES.some((s) => s.id === id && s.url.startsWith("https://")),
      );
  }
  assert.ok(
    SOURCES.find((s) => s.id === "fungar2021").journal.includes(
      "not peer reviewed",
    ),
  );
  assert.ok(
    describeExperiment(base, "success")
      .factors.find((f) => f.id === "moisture")
      .text.includes("Ambient humidity"),
  );
});
