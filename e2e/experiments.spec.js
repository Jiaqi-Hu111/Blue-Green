import { test, expect } from "@playwright/test";
async function snapshot(page, options) {
  await expect(page.locator("main>div")).toHaveCSS("opacity", "1");
  await page.screenshot(options);
}
async function expectShares(page, shares) {
  const inputs = page.locator(".recipe-number input");
  await expect(inputs).toHaveCount(shares.length);
  for (let i = 0; i < shares.length; i++)
    await expect(inputs.nth(i)).toHaveValue(shares[i]);
}
async function begin(page) {
  await page.goto("");
  await page
    .getByRole("button", { name: "Enter the Laboratory", exact: true })
    .click();
}
async function add(page, name) {
  await page.getByRole("button", { name: `Add ${name}`, exact: true }).click();
}
async function mix(page) {
  await page
    .getByRole("button", { name: "Mix Ingredients", exact: true })
    .click();
  await page.getByRole("button", { name: "Auto Mix", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
async function result(page) {
  await page
    .getByRole("button", { name: "Start Cultivation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip Animation", exact: true })
    .click();
  await page.getByRole("button", { name: "View Results", exact: true }).click();
}
const old = {
  id: "historical",
  number: 7,
  recipe: { sawdust: 60, straw: 40 },
  moisture: 62,
  temperature: 24,
  days: 18,
  treated: true,
  outcome: "success",
  reasons: ["Historical reason, not reevaluated."],
  customData: "untouched",
};

test("empty initialization, inline percentages, reference result, new experiment and history preservation", async ({
  page,
  context,
}) => {
  await page.addInitScript((record) => {
    if (!localStorage.getItem("bluegreen-lab-v2"))
      localStorage.setItem(
        "bluegreen-lab-v2",
        JSON.stringify({
          draft: { portions: { coffee: 100 }, mixProgress: 1 },
          history: [record],
        }),
      );
  }, old);
  await begin(page);
  await expect(page.locator(".vessel-materials")).toHaveCount(0);
  await expect(
    page.getByText("Add ingredients to begin", { exact: true }),
  ).toBeVisible();
  await snapshot(page, {
    path: "/tmp/bluegreen-empty-vessel.png",
    fullPage: true,
  });
  await add(page, "Sawdust");
  await add(page, "Straw");
  await expectShares(page, ["50", "50"]);
  await snapshot(page, {
    path: "/tmp/bluegreen-two-ingredients.png",
    fullPage: true,
  });
  await page
    .getByRole("spinbutton", { name: "Sawdust exact percentage", exact: true })
    .fill("60");
  await expect(
    page.getByRole("spinbutton", {
      name: "Straw exact percentage",
      exact: true,
    }),
  ).toHaveValue("40");
  await snapshot(page, {
    path: "/tmp/bluegreen-inline-recipe.png",
    fullPage: true,
  });
  await snapshot(page, {
    path: "/tmp/bluegreen-ready-to-mix.png",
    fullPage: true,
  });
  await mix(page);
  await expect(
    page.getByRole("slider", { name: "Substrate Moisture", exact: true }),
  ).toHaveValue("62");
  await result(page);
  await expect(page.locator(".outcome-badge").first()).toHaveText(
    "Favourable Growth",
  );
  await expect(page.locator(".result-analysis")).toContainText("Sawdust 60%");
  const legacy = await page.evaluate(() =>
    localStorage.getItem("bluegreen-lab-v2"),
  );
  await page
    .getByRole("button", { name: "Compare Experiments", exact: true })
    .click();
  await expect(page.locator(".notebook-record")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Run Another Experiment", exact: true })
    .click();
  await expect(page.locator(".vessel-materials")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Mix Ingredients", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => localStorage.getItem("bluegreen-lab-v2")),
  ).toBe(legacy);
  await page
    .getByRole("button", { name: "Optional Reference Recipe", exact: true })
    .click();
  await expectShares(page, ["60", "40"]);
  await mix(page);
  await result(page);
  await expect(page.locator(".outcome-badge").first()).toHaveText(
    "Favourable Growth",
  );
  const other = await context.newPage();
  await begin(other);
  await expect(other.locator(".vessel-materials")).toHaveCount(0);
  await other
    .getByRole("button", { name: "Open navigation menu", exact: true })
    .click();
  await other.getByRole("button", { name: /View My Experiments/ }).click();
  await expect(other.locator(".notebook-record")).toHaveCount(3);
  await expect(other.locator(".notebook-record")).toContainText([
    "Favourable Growth",
    "Favourable Growth",
    "Favourable Growth",
  ]);
  await other.close();
});

test("zero shares disable mixing, removal rebalances, editing after stirring resets Continue", async ({
  page,
}) => {
  await begin(page);
  await add(page, "Sawdust");
  await add(page, "Straw");
  await page
    .getByRole("slider", { name: "Straw percentage", exact: true })
    .fill("0");
  await expect(
    page.getByRole("spinbutton", {
      name: "Sawdust exact percentage",
      exact: true,
    }),
  ).toHaveValue("100");
  await expect(
    page.getByRole("button", { name: "Mix Ingredients", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "Resume Previous Experiment", exact: true }).click();
  await page
    .getByRole("slider", { name: "Straw percentage", exact: true })
    .fill("40");
  await mix(page);
  await page
    .getByRole("button", { name: "Review Recipe", exact: true })
    .click();
  await page
    .getByRole("slider", { name: "Straw percentage", exact: true })
    .fill("45");
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Remove Straw", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", {
      name: "Sawdust exact percentage",
      exact: true,
    }),
  ).toHaveValue("100");
  await expect(page.locator(".recipe-composition-row")).toHaveCount(1);
});

test("session-only notebook records do not replace or erase existing device history", async ({
  page,
  context,
}) => {
  await page.addInitScript((record) => {
    if (!localStorage.getItem("bluegreen-history-v3"))
      localStorage.setItem("bluegreen-history-v3", JSON.stringify([record]));
  }, old);
  await page.goto("");
  await page
    .getByRole("button", { name: "Open Experiment Notebook", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Notebook privacy", exact: true })
    .selectOption("session");
  await page
    .getByRole("button", { name: "Run Another Experiment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Optional Reference Recipe", exact: true })
    .click();
  await mix(page);
  await result(page);
  await page
    .getByRole("button", { name: "Compare Experiments", exact: true })
    .click();
  await expect(page.locator(".notebook-record")).toHaveCount(2);
  const other = await context.newPage();
  await other.goto("");
  await other
    .getByRole("button", { name: "Open Experiment Notebook", exact: true })
    .click();
  await expect(other.locator(".notebook-record")).toHaveCount(1);
  expect(
    await other.evaluate(
      () =>
        JSON.parse(localStorage.getItem("bluegreen-history-v3"))[0].customData,
    ),
  ).toBe("untouched");
  await other.close();
});

test("procedural growth stages, pause/restart, clipping and four distinct outcomes", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const configurations = [
    ["success", 62, 24, true, 18],
    ["incomplete", 45, 24, true, 18],
    ["failed", 62, 24, false, 18],
    ["unverified", 62, 24, true, 32],
  ];
  const coverage = [];
  for (const [
    outcome,
    moisture,
    temperature,
    treated,
    days,
  ] of configurations) {
    await page.goto("");
    await page.evaluate(
      (config) =>
        sessionStorage.setItem(
          "bluegreen-active-v3",
          JSON.stringify({
            step: 4,
            draft: {
              portions: { sawdust: 60, straw: 40 },
              moisture: config[1],
              temperature: config[2],
              treated: config[3],
              days: config[4],
              mixProgress: 1,
              growthProgress: 0,
              runId: `visual-${config[0]}`,
            },
          }),
        ),
      [outcome, moisture, temperature, treated, days],
    );
    await page.reload();
    await page.getByRole("button", { name: "Resume Previous Experiment", exact: true }).click();
    const canvas = page.getByTestId("growth-network");
    await expect(canvas).toHaveAttribute("data-iterations", "0");
    await snapshot(page, {
      path: `/tmp/growth-${outcome}-preparation.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(canvas).toHaveAttribute("data-stage", "early", {
      timeout: 6000,
    });
    if (outcome === "success")
      await snapshot(page, {
        path: "/tmp/growth-success-early.png",
        fullPage: true,
      });
    await expect(canvas).toHaveAttribute("data-stage", "network", {
      timeout: 6000,
    });
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page.waitForTimeout(250);
    const before = await canvas.getAttribute("data-iterations");
    await page.waitForTimeout(350);
    expect(await canvas.getAttribute("data-iterations")).toBe(before);
    if (outcome === "success")
      await snapshot(page, {
        path: "/tmp/growth-success-network.png",
        fullPage: true,
      });
    await page
      .getByRole("button", { name: "Skip Animation", exact: true })
      .click();
    // Dense reconstruction stays time-sliced; it must finish exactly, without
    // imposing the former sparse field's five-second wall-clock assumption.
    await expect(canvas).toHaveAttribute("data-iterations", "720", {
      timeout: 15000,
    });
    coverage.push(Number(await canvas.getAttribute("data-coverage")));
    await snapshot(page, {
      path: `/tmp/growth-${outcome}-assessment.png`,
      fullPage: true,
    });
    // Transparent pixels outside the exact substrate path prove the network cannot escape onto the UI.
    const leak = await canvas.evaluate((el) => {
      const c = el.getContext("2d"),
        data = c.getImageData(0, 0, el.width, el.height).data;
      for (let x = 0; x < el.width; x++)
        for (const y of [0, 20, 40, 310, 329].map((v) =>
          Math.floor((v / 330) * el.height),
        ))
          if (data[(y * el.width + x) * 4 + 3]) return true;
      return false;
    });
    expect(leak).toBe(false);
    await page
      .getByRole("button", { name: "Restart Animation", exact: true })
      .click();
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(canvas).toHaveAttribute("data-stage", "preparation");
    await page
      .getByRole("button", { name: "Skip Animation", exact: true })
      .click();
    // Dense reconstruction stays time-sliced; it must finish exactly, without
    // imposing the former sparse field's five-second wall-clock assumption.
    await expect(canvas).toHaveAttribute("data-iterations", "720", {
      timeout: 15000,
    });
    expect(Number(await canvas.getAttribute("data-coverage"))).toBe(
      coverage.at(-1),
    );
    await page
      .getByRole("button", { name: "View Results", exact: true })
      .click();
    await expect(page.locator(".result-panel")).toHaveClass(
      new RegExp(`result-${outcome}`),
    );
  }
  expect(new Set(coverage).size).toBe(4);
  expect(coverage[0]).toBeGreaterThan(coverage[1]);
  expect(coverage[1]).toBeGreaterThan(coverage[2]);
  expect(errors).toEqual([]);
});

test("hidden pages pause growth and unsupported Canvas keeps a static fallback", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "bluegreen-active-v3",
      JSON.stringify({
        step: 4,
        draft: {
          portions: { sawdust: 60, straw: 40 },
          moisture: 62,
          temperature: 24,
          days: 18,
          treated: true,
          mixProgress: 1,
          growthProgress: 35,
          runId: "visibility",
        },
      }),
    ),
  );
  await page.goto("");
  await page.getByRole("button", { name: "Resume Previous Experiment", exact: true }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(200);
  const frozen = await page.locator(".chamber-progress").textContent();
  await page.waitForTimeout(400);
  expect(await page.locator(".chamber-progress").textContent()).toBe(frozen);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".chamber-progress")).not.toHaveText(frozen);
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.reload();
  await page.getByRole("button", { name: "Resume Previous Experiment", exact: true }).click();
  await expect(
    page.getByText("Static illustrative frame · Canvas unavailable", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Skip Animation", exact: true })
    .click();
  await expect(page.locator(".network-fallback")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View Results", exact: true }),
  ).toBeEnabled();
});
