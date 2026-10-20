import { test, expect } from "@playwright/test";

const record = (id, number) => ({
  id,
  number,
  recipe: { sawdust: 60, straw: 40 },
  moisture: 62,
  temperature: 24,
  days: 18,
  treated: true,
  outcome: "success",
  reasons: ["Original saved explanation."],
  modelVersion: 2,
});
async function enter(page) {
  await page
    .getByRole("button", { name: "Enter the Laboratory", exact: true })
    .click();
}
async function empty(page) {
  await expect(page.locator(".vessel-materials")).toHaveCount(0);
  await expect(page.locator(".recipe-composition-row")).toHaveCount(0);
  await expect(
    page.getByText("Add ingredients to begin", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mix Ingredients", exact: true }),
  ).toBeDisabled();
  const active = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("bluegreen-active-v3")),
  );
  expect(active.draft).toMatchObject({
    portions: {},
    mixing: false,
    mixProgress: 0,
    growthProgress: 0,
    runId: null,
  });
  expect(active.resultId).toBeNull();
}
async function capture(page, name) {
  await expect(page.locator("main>div")).toHaveCSS("opacity", "1");
  await expect(page.locator(".feedback-toast")).toHaveCount(0, {
    timeout: 6000,
  });
  await page.screenshot({
    path: `/tmp/bluegreen-inline-${name}-full.png`,
    fullPage: true,
  });
  // Also retain the actual 390 × 844 viewport, framed around vessel + controls.
  await page
    .getByTestId("mixing-vessel")
    .evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY),
    );
  await page.screenshot({ path: `/tmp/bluegreen-inline-${name}.png` });
}
async function notebook(page) {
  await page
    .getByRole("button", { name: "Open navigation menu", exact: true })
    .click();
  await page.getByRole("button", { name: /View My Experiments/ }).click();
}

test("new exhibition visitors start empty; inline ratios update the vessel and saved notebook remains comparable", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(
    (records) => {
      if (!localStorage.getItem("bluegreen-history-v3"))
        localStorage.setItem("bluegreen-history-v3", JSON.stringify(records));
    },
    [record("old-a", 1), record("old-b", 2)],
  );
  await page.goto("");
  await enter(page);
  await empty(page);
  await capture(page, "empty");
  const panel = page.getByRole("region", {
    name: "Recipe Composition",
    exact: true,
  });
  await expect(panel).toBeVisible();
  await expect(panel.locator(".composition-strip")).toHaveAccessibleName(
    "Recipe composition: no ingredients selected",
  );
  const original = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bluegreen-history-v3")),
  );
  await page.getByRole("button", { name: "Add Sawdust", exact: true }).click();
  await page.getByRole("button", { name: "Add Straw", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(panel.getByRole("slider")).toHaveCount(2);
  await expect(panel.locator(".recipe-total strong")).toHaveText("100%");
  await capture(page, "two-ingredients");
  const slider = panel.getByRole("slider", {
    name: "Sawdust percentage",
    exact: true,
  });
  await expect(slider).toHaveAttribute("step", "5");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("55");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("60");
  await expect(
    panel.getByRole("spinbutton", {
      name: "Straw exact percentage",
      exact: true,
    }),
  ).toHaveValue("40");
  await expect(page.locator(".vessel-layer").first()).toHaveCSS(
    "flex-grow",
    "60",
  );
  await expect(page.locator(".vessel-layer").nth(1)).toHaveCSS(
    "flex-grow",
    "40",
  );
  await expect(
    panel.locator(".composition-strip > div").first(),
  ).toHaveAttribute("style", /width: 60%/);
  const order = await page.evaluate(() => {
    const scene = document.querySelector(".mixing-room"),
      panel = document.querySelector(".recipe-composition"),
      action = document.querySelector(
        ".collecting-screen > .stirring-instructions",
      );
    return (
      scene.nextElementSibling === panel && panel.nextElementSibling === action
    );
  });
  expect(order).toBe(true);
  await capture(page, "60-40");
  await page
    .getByRole("button", { name: "Return to Welcome", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Resume Previous Experiment",
      exact: true,
    }),
  ).toBeVisible();
  await enter(page);
  await empty(page);
  await capture(page, "returning-visitor");
  await notebook(page);
  await expect(page.locator(".notebook-record")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Open experiment 1", exact: true })
    .click();
  await expect(page.locator(".result-analysis")).toContainText(
    "Original saved explanation.",
  );
  await page
    .getByRole("button", { name: "Compare Experiments", exact: true })
    .click();
  const checks = page.locator(".notebook-record input[type=checkbox]");
  await checks.nth(0).check();
  await checks.nth(1).check();
  await page
    .getByRole("button", { name: "Compare Experiments", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Experiments 2 and 1");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("bluegreen-history-v3")),
    ),
  ).toEqual(original);
  expect(errors).toEqual([]);
});

test("refresh and explicit Resume preserve the active run; Enter always clears it", async ({
  page,
}) => {
  await page.goto("");
  await enter(page);
  await page
    .getByRole("button", { name: "Optional Reference Recipe", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mix Ingredients", exact: true })
    .click();
  await page.getByRole("button", { name: "Auto Mix", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("slider", { name: "Incubation Temperature", exact: true })
    .fill("27");
  await page.reload();
  await expect(page.getByRole("heading", { name: "From Waste to Mycelium", exact: true })).toBeVisible();
  await expect(page.locator(".recipe-composition-row")).toHaveCount(0);
  await page.getByRole("button", { name: "Resume Previous Experiment", exact: true }).click();
  await expect(
    page.getByRole("slider", { name: "Incubation Temperature", exact: true }),
  ).toHaveValue("27");
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", {
      name: "Sawdust exact percentage",
      exact: true,
    }),
  ).toHaveValue("60");
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to Welcome", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Resume Previous Experiment", exact: true })
    .click();
  await expect(
    page.getByRole("slider", { name: "Incubation Temperature", exact: true }),
  ).toHaveValue("27");
  await page
    .getByRole("button", { name: "Start Cultivation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip Animation", exact: true })
    .click();
  await page.getByRole("button", { name: "View Results", exact: true }).click();
  await expect(page.locator(".outcome-badge").first()).toHaveText(
    "Favourable Growth",
  );
  await page
    .getByRole("button", { name: "Return to Welcome", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Enter the Laboratory", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("bluegreen-active-v3")).draft
          .portions,
    ),
  ).toEqual({});
  await empty(page);
  await page.getByRole("button", { name: "Add Sawdust", exact: true }).click();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await enter(page);
  await empty(page);
  await notebook(page);
  await expect(page.locator(".notebook-record")).toHaveCount(1);
});

test("inline controls remain usable during stirring, removal and compact layouts", async ({
  page,
}) => {
  await page.goto("");
  await enter(page);
  await page
    .getByRole("button", { name: "Optional Reference Recipe", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mix Ingredients", exact: true })
    .click();
  await page.getByRole("button", { name: "Auto Mix", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Straw exact percentage", exact: true })
    .fill("37");
  await expect(
    page.getByRole("spinbutton", {
      name: "Sawdust exact percentage",
      exact: true,
    }),
  ).toHaveValue("63");
  await expect(
    page.getByRole("button", { name: "Mix Ingredients", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(400);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("bluegreen-active-v3")).draft
          .mixProgress,
    ),
  ).toBe(0);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const input = page.getByRole("slider", {
      name: "Sawdust percentage",
      exact: true,
    });
    expect((await input.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole("button", { name: "Remove Straw", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", {
      name: "Sawdust exact percentage",
      exact: true,
    }),
  ).toHaveValue("100");
  await page
    .getByRole("button", { name: "Remove Sawdust", exact: true })
    .click();
  await empty(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
