import { test, expect } from "@playwright/test";
const reference = {
  portions: { sawdust: 60, straw: 40 },
  moisture: 62,
  temperature: 24,
  days: 18,
  treated: true,
  mixing: false,
  mixProgress: 1,
  growthProgress: 0,
  runId: "network-review",
};
async function fixture(page, changes = {}, step = 4) {
  await page.goto("");
  await page.evaluate(
    ({ draft, step }) =>
      sessionStorage.setItem(
        "bluegreen-active-v3",
        JSON.stringify({ step, draft }),
      ),
    { draft: { ...reference, ...changes }, step },
  );
  await page.reload();
}
async function hash(canvas) {
  return canvas.evaluate((el) => {
    const d = el.getContext("2d").getImageData(0, 0, el.width, el.height).data;
    let h = 2166136261;
    for (let i = 3; i < d.length; i += 4) h = Math.imul(h ^ d[i], 16777619);
    return h >>> 0;
  });
}

test("expanded observation shares the active field, preserves pause/replay and evolves after assessment", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await fixture(page);
  const main = page.getByTestId("growth-network");
  await expect(main).toHaveAttribute("data-iterations", "0");
  await page
    .getByRole("button", { name: "Expand Network", exact: true })
    .click();
  const dialog = page.getByRole("dialog"),
    detail = page.getByTestId("expanded-network");
  await expect(detail).toHaveAttribute("data-iterations", "0");
  const close = dialog.getByRole("button", {
    name: "Close Network Observation",
    exact: true,
  });
  await expect(close).toBeFocused();
  await page.waitForTimeout(450);
  await expect(close).toBeFocused();
  await dialog.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Pause", exact: true }),
  ).toBeFocused();
  await page.waitForTimeout(350);
  await expect(
    dialog.getByRole("button", { name: "Pause", exact: true }),
  ).toBeFocused();
  await expect(main).toHaveAttribute("data-stage", "assessment", {
    timeout: 14000,
  });
  await page.waitForTimeout(2200);
  const earlier = Number(await main.getAttribute("data-iterations")),
    before = await hash(detail);
  await page.waitForTimeout(650);
  expect(Number(await main.getAttribute("data-iterations"))).toBeGreaterThan(
    earlier,
  );
  expect(await hash(detail)).not.toBe(before);
  await dialog.getByRole("button", { name: "Pause", exact: true }).click();
  await page.waitForTimeout(120);
  const paused = await main.getAttribute("data-iterations"),
    pausedHash = await hash(detail);
  await expect(detail).toHaveAttribute("data-iterations", paused);
  expect(await detail.getAttribute("data-seed")).toBe(
    await main.getAttribute("data-seed"),
  );
  await page.waitForTimeout(300);
  expect(await main.getAttribute("data-iterations")).toBe(paused);
  await dialog
    .getByRole("button", { name: "Return to Laboratory", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expand Network", exact: true })
    .click();
  await expect(detail).toHaveAttribute("data-iterations", paused);
  await expect.poll(() => hash(detail)).toBe(pausedHash);
  await dialog.getByRole("button", { name: "Replay", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(main).toHaveAttribute("data-iterations", "0");
  await dialog.getByRole("button", { name: "Pause", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Return to Laboratory", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip Animation", exact: true })
    .click();
  await expect(main).toHaveAttribute("data-iterations", "720", {
    timeout: 15000,
  });
  const replayHash = await hash(main);
  await page
    .getByRole("button", { name: "Restart Animation", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page
    .getByRole("button", { name: "Skip Animation", exact: true })
    .click();
  await expect(main).toHaveAttribute("data-iterations", "720", {
    timeout: 15000,
  });
  expect(await hash(main)).toBe(replayHash);
  expect(errors).toEqual([]);
});

test("all outcomes show input-specific feedback, real source identifiers and model assumptions; old history stays intact", async ({
  page,
}) => {
  test.setTimeout(60000);
  const configurations = [
    ["success", {}],
    ["incomplete", { moisture: 45 }],
    ["failed", { treated: false }],
    ["unverified", { days: 32 }],
  ];
  for (const [outcome, changes] of configurations) {
    await fixture(page, { ...changes, runId: "feedback-" + outcome }, 3);
    await page
      .getByRole("button", { name: "Start Cultivation", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Skip Animation", exact: true })
      .click();
    await page
      .getByRole("button", { name: "View Results", exact: true })
      .click();
    await expect(page.locator(".result-panel")).toHaveClass(
      new RegExp("result-" + outcome),
    );
    const feedback = page.locator(".educational-feedback");
    await expect(feedback).toContainText("Sawdust 60%");
    await expect(feedback.locator(".feedback-factors > div")).toHaveCount(5);
    if (outcome === "incomplete")
      await expect(feedback).toContainText("45% water / wet substrate mass");
    if (outcome === "failed")
      await expect(feedback).toContainText("does not confirm contamination");
    if (outcome === "unverified")
      await expect(feedback).toContainText("uncertainty, not proof");
    await page.locator(".result-evidence summary").click();
    await expect(page.locator(".result-evidence")).toContainText(
      "None of these sources validates",
    );
    await expect(page.locator(".result-evidence a").first()).toHaveAttribute(
      "href",
      "https://doi.org/10.1371/journal.pone.0213954",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (outcome === "failed" || outcome === "success")
      await feedback.screenshot({ path: "/tmp/feedback-" + outcome + ".png" });
  }
  await page.reload();
  await expect(page.locator(".feedback-factors > div")).toHaveCount(5);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bluegreen-history-v3")),
  );
  expect(saved).toHaveLength(4);
  expect(saved.every((r) => r.feedback.version === 1)).toBe(true);
});
