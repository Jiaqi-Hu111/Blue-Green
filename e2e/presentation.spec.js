import { test, expect } from "@playwright/test";

const reference = {
  portions: { sawdust: 60, straw: 40 }, moisture: 62, temperature: 24,
  days: 18, treated: true, mixProgress: 0, growthProgress: 0,
};

test("retired introduction checkpoints and browser history open working mixing; Enter clears the checkpoint", async ({ page }) => {
  await page.goto("");
  await page.evaluate(draft => sessionStorage.setItem("bluegreen-active-v3",
    JSON.stringify({ step: 1, draft })), reference);
  await page.reload();
  await expect(page.getByRole("heading", { name: "From Waste to Mycelium", exact: true })).toBeVisible();
  await expect(page.locator(".intro-screen")).toHaveCount(0);
  // Repeated landing reloads must keep the explicitly resumable snapshot.
  await page.reload();
  await page.getByRole("button", { name: "Resume Previous Experiment", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mix Natural Ingredients", exact: true })).toBeVisible();
  await expect(page.locator(".recipe-composition-row")).toHaveCount(2);
  await expect(page.getByRole("navigation", { name: "Experiment journey" }).getByRole("button")).toHaveCount(6);
  await expect(page.locator(".journey-caption")).toHaveText("01 / 06");
  await expect(page.getByRole("button", { name: "Go to Explore the Laboratory", exact: true })).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new PopStateEvent("popstate", { state: { bluegreenStep: 1 } })));
  await expect(page.getByRole("heading", { name: "Mix Natural Ingredients", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await page.getByRole("button", { name: "Enter the Laboratory", exact: true }).click();
  await expect(page.locator(".recipe-composition-row")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mix Ingredients", exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("button", { name: "Resume Previous Experiment", exact: true })).toHaveCount(0);
});

test("old notebook explanations use neutral wording across results, details and comparison while stored records stay identical", async ({ page }) => {
  await page.goto("");
  const original = await page.evaluate(() => {
    const records = [2, 1].map(number => ({
      id: `old-${number}`, number, recipe: { sawdust: 60, straw: 40 },
      moisture: 62, temperature: 24, days: 18, treated: true,
      outcome: "success", modelVersion: 2, pinned: false,
      reasons: ["Full Colonization", "Colonisation speed was not measured."],
      feedback: { version: 1, summary: "Colonization is illustrative.",
        factors: [{ id: "growth", label: "Colonisation", status: "within", text: "Full colonization is not measured." }],
        adjustments: ["Do not infer colonization speed."], note: "No colonisation measurement." },
    }));
    const raw = JSON.stringify(records);
    localStorage.setItem("bluegreen-history-v3", raw);
    return raw;
  });
  await page.reload();
  await page.getByRole("button", { name: "Open Experiment Notebook", exact: true }).click();
  await page.getByRole("button", { name: "Open experiment 1", exact: true }).click();
  await expect(page.locator(".educational-feedback")).toContainText("Mycelium growth is illustrative.");
  await page.locator(".result-analysis summary").click();
  await expect(page.locator(".result-analysis")).toContainText("Full Mycelium Growth");
  const neutral = async () => expect(await page.locator("body").innerText())
    .not.toMatch(/colon(?:iz|is)(?:ation|e|ed|ing)/i);
  await neutral();
  await page.getByRole("button", { name: "View Experiment Details", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Full Mycelium Growth");
  await neutral();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Compare Experiments", exact: true }).click();
  const checks = page.locator(".notebook-record input[type=checkbox]");
  await expect(checks).toHaveCount(2);
  await checks.nth(0).check();
  await checks.nth(1).check();
  await page.getByRole("button", { name: "Compare Experiments", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Full Mycelium Growth");
  await neutral();
  expect(await page.evaluate(() => localStorage.getItem("bluegreen-history-v3"))).toBe(original);
});
