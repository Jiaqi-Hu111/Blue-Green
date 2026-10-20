import test from "node:test";
import assert from "node:assert/strict";
import { neutralGrowthText } from "./text.js";

test("historical biological wording is neutral in presentation without changing its source", () => {
  const record = { reasons: ["Full Colonization", "Colonisation speed is illustrative.",
    "Hyphae colonize fibres; colonised areas connect with colonizing tips."] };
  const original = JSON.stringify(record);
  assert.deepEqual(record.reasons.map(neutralGrowthText), ["Full Mycelium Growth",
    "Mycelium growth speed is illustrative.",
    "Hyphae grow through fibres; grown through areas connect with growing through tips."]);
  assert.equal(neutralGrowthText("COLONIZATION"), "MYCELIUM GROWTH");
  assert.equal(neutralGrowthText("Incomplete Growth — an illustrative outcome"),
    "Incomplete Growth — an illustrative outcome");
  assert.equal(neutralGrowthText(undefined), "");
  assert.equal(neutralGrowthText(null), "");
  assert.equal(JSON.stringify(record), original);
});
