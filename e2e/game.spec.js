import { test, expect } from "@playwright/test";
const key = "bluegreen-lab-v2";
async function begin(page) {
  await page.goto("");
  await page
    .getByRole("button", { name: "Enter the Laboratory", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Welcome to the/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Begin Experiment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Mix Natural Ingredients/ }),
  ).toBeVisible();
}
async function add(page, id) {
  await page.getByRole("button", { name: `Add ${id}`, exact: true }).click();
}
async function blend(page) {
  await page
    .getByRole("button", { name: "Mix Ingredients", exact: true })
    .click();
  await page.getByRole("button", { name: "Auto Mix", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Incubation Period", exact: true }),
  ).toBeVisible();
}
async function run(page) {
  await page
    .getByRole("button", { name: "Start Cultivation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip Animation", exact: true })
    .click();
  await page.getByRole("button", { name: "View Results", exact: true }).click();
}
async function shot(page, name) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `/tmp/bluegreen-${name}.png`, fullPage: true });
}
async function assertEnglishAndLayout(page) {
  const content = await page.locator("body").innerText();
  expect(content).not.toMatch(/[\u3400-\u9fff]/);
  const labels = await page
    .locator("[aria-label]")
    .evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label")).join(" "),
    );
  expect(labels).not.toMatch(/[\u3400-\u9fff]/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("complete eight-stage mobile journey, local notebook, lifecycle and four outcomes", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("");
  await expect(page.getByRole("heading", { name: /From Waste/ })).toBeVisible();
  await shot(page, "welcome-mobile");
  await assertEnglishAndLayout(page);
  await page
    .getByRole("button", { name: "Enter the Laboratory", exact: true })
    .click();
  await shot(page, "intro-mobile");
  await assertEnglishAndLayout(page);
  await page
    .getByRole("button", { name: "Learn about Straw", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Plant fibres");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Begin Experiment", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mix Ingredients", exact: true }),
  ).toBeDisabled();
  await add(page, "Sawdust");
  await add(page, "Sawdust");
  await add(page, "Straw");
  await expect(page.locator(".total-percent")).toHaveText("100%");
  await expect(page.locator(".portion-percentage")).toHaveText(["67%", "33%"]);
  await shot(page, "mix-mobile");
  await assertEnglishAndLayout(page);
  await blend(page);
  await shot(page, "conditions-mobile");
  await assertEnglishAndLayout(page);
  await page
    .getByRole("button", { name: "Review Recipe", exact: true })
    .click();
  await expect(page.locator(".portion-percentage")).toHaveText(["67%", "33%"]);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Start Cultivation", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await page.locator(".chamber-progress").textContent();
  await page.waitForTimeout(350);
  expect(await page.locator(".chamber-progress").textContent()).toBe(paused);
  await shot(page, "growth-mobile");
  await page.reload();
  expect(await page.locator(".chamber-progress").textContent()).toBe(paused);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page
    .getByRole("button", { name: "Skip Animation", exact: true })
    .click();
  await page.getByRole("button", { name: "View Results", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "A New Material Takes Shape!",
      exact: true,
    }),
  ).toBeVisible();
  await shot(page, "results-mobile");
  await assertEnglishAndLayout(page);
  await page
    .getByRole("button", { name: "Save Experiment", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Experiment Saved", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "View Experiment Details", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("18 days");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Explore Your Material", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Decorative Objects", exact: true })
    .click();
  await expect(page.locator(".application-note")).toContainText(
    "not automatically food-safe",
  );
  const rotate = page.getByLabel("Sample viewing angle", { exact: true });
  await rotate.fill("25");
  await expect(rotate).toHaveValue("25");
  await page
    .getByRole("button", { name: "Explore End-of-Life Pathways", exact: true })
    .click();
  await expect(page.locator(".lifecycle-stage")).toContainText(
    "Do not assume direct soil disposal",
  );
  await shot(page, "lifecycle-mobile");
  await assertEnglishAndLayout(page);
  await page
    .getByRole("button", { name: "View My Experiments", exact: true })
    .click();
  await expect(page.locator(".notebook-record")).toHaveCount(1);
  await shot(page, "notebook-mobile");
  await assertEnglishAndLayout(page);
  await page.reload();
  await expect(page.locator(".notebook-record")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Duplicate experiment 1", exact: true })
    .click();
  await page
    .getByRole("slider", { name: "Substrate Moisture", exact: true })
    .fill("45");
  await run(page);
  await expect(
    page.getByRole("heading", { name: "Not Quite There Yet!", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Adjust & Retry", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Untreated Substrate", exact: true })
    .click();
  await run(page);
  await expect(
    page.getByRole("heading", {
      name: "Something Interrupted the Growth.",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Adjust & Retry", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Treated Substrate", exact: true })
    .click();
  await page
    .getByRole("slider", { name: "Substrate Moisture", exact: true })
    .fill("62");
  await page
    .getByRole("button", { name: "32 incubation days", exact: true })
    .click();
  await expect(page.locator(".day-value")).toContainText("32");
  await run(page);
  await expect(
    page.getByRole("heading", {
      name: "An Experimental Discovery!",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Compare Experiments", exact: true })
    .click();
  await expect(page.locator(".notebook-record")).toHaveCount(4);
  await page
    .getByRole("checkbox", { name: "Compare", exact: true })
    .nth(0)
    .check();
  await page
    .getByRole("checkbox", { name: "Compare", exact: true })
    .nth(3)
    .check();
  await page
    .getByRole("button", { name: "Compare Experiments", exact: true })
    .click();
  await expect(page.getByRole("table")).toContainText("32 days");
  await expect(page.locator("tr.different")).not.toHaveCount(0);
  await assertEnglishAndLayout(page);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Open experiment 1", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A New Material Takes Shape!",
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("pointer drag/drop, ingredient removal and genuine circular stirring", async ({
  page,
}) => {
  await begin(page);
  const jar = page.getByRole("button", { name: "Add Sawdust", exact: true }),
    vessel = page.getByTestId("mixing-vessel");
  const j = await jar.boundingBox(),
    v = await vessel.boundingBox();
  await page.mouse.move(j.x + j.width / 2, j.y + j.height / 2);
  await page.mouse.down();
  await page.mouse.move(v.x + v.width / 2, v.y + v.height * 0.5, { steps: 15 });
  await expect(vessel).toHaveClass(/drop-active/);
  await page.mouse.up();
  await expect(page.locator(".portion-name")).toContainText("Sawdust");
  await add(page, "Straw");
  await page
    .getByRole("button", { name: "Add one portion of Straw", exact: true })
    .click();
  await expect(page.locator(".portion-percentage")).toHaveText(["33%", "67%"]);
  await page
    .getByRole("button", { name: "Remove one portion of Straw", exact: true })
    .click();
  await expect(page.locator(".portion-percentage")).toHaveText(["50%", "50%"]);
  await page
    .getByRole("button", { name: "Mix Ingredients", exact: true })
    .click();
  await vessel.scrollIntoViewIfNeeded();
  const r = await vessel.boundingBox(),
    cx = r.x + r.width / 2,
    cy = r.y + r.height * 0.52;
  await page.mouse.move(cx + 65, cy);
  await page.mouse.down();
  for (let i = 1; i <= 150; i++) {
    const a = (i / 64) * 2 * Math.PI;
    await page.mouse.move(cx + 65 * Math.cos(a), cy + 65 * Math.sin(a));
  }
  await page.mouse.up();
  await expect(
    page.getByText("Beautifully blended!", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Incubation Period", exact: true }),
  ).toBeVisible();
});

test("touch pointer drag and stirring alternatives work without resetting back navigation", async ({
  page,
}) => {
  await begin(page);
  const jar = page.getByRole("button", {
      name: "Add Coffee Grounds",
      exact: true,
    }),
    vessel = page.getByTestId("mixing-vessel");
  const a = await jar.boundingBox(),
    b = await vessel.boundingBox();
  const client = await page.context().newCDPSession(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: a.x + a.width / 2, y: a.y + a.height / 2 }],
  });
  for (let i = 1; i <= 12; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x:
            a.x +
            a.width / 2 +
            ((b.x + b.width / 2 - a.x - a.width / 2) * i) / 12,
          y:
            a.y +
            a.height / 2 +
            ((b.y + b.height / 2 - a.y - a.height / 2) * i) / 12,
        },
      ],
    });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(errors).toEqual([]);
  await expect(page.locator(".portion-name")).toContainText("Coffee Grounds");
  await add(page, "Sawdust");
  await blend(page);
  await page
    .getByRole("button", {
      name: "Increase Incubation Temperature",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("slider", { name: "Incubation Temperature", exact: true }),
  ).toHaveValue("25");
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(
    page.getByText("Beautifully blended!", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Beautifully blended!", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("slider", { name: "Incubation Temperature", exact: true }),
  ).toHaveValue("25");
});

test("vertical instruments, keyboard controls and swipe incubation dial change actual inputs", async ({
  page,
}) => {
  await begin(page);
  await add(page, "Sawdust");
  await add(page, "Straw");
  await blend(page);
  const thermometer = page.getByRole("slider", {
    name: "Drag temperature liquid",
    exact: true,
  });
  await thermometer.scrollIntoViewIfNeeded();
  const t = await thermometer.boundingBox();
  await page.mouse.move(t.x + t.width * 0.7, t.y + t.height * 0.25);
  await page.mouse.down();
  await page.mouse.move(t.x + t.width * 0.7, t.y + t.height * 0.1, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(
    page.getByRole("slider", { name: "Incubation Temperature", exact: true }),
  ).toHaveValue("35");
  await thermometer.focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("slider", { name: "Incubation Temperature", exact: true }),
  ).toHaveValue("34");
  const water = page.getByRole("slider", {
    name: "Drag substrate water level",
    exact: true,
  });
  await water.scrollIntoViewIfNeeded();
  const w = await water.boundingBox();
  await page.mouse.move(w.x + w.width / 2, w.y + w.height * 0.5);
  await page.mouse.down();
  await page.mouse.up();
  await expect(
    page.getByRole("slider", { name: "Substrate Moisture", exact: true }),
  ).toHaveValue("60");
  const wheel = page.getByRole("group", {
    name: "Incubation day wheel",
    exact: true,
  });
  await wheel.scrollIntoViewIfNeeded();
  await wheel.evaluate((el) => el.scrollBy({ left: 200, behavior: "instant" }));
  await expect(page.locator(".day-value")).not.toContainText("18");
  await run(page);
  await expect(
    page.getByRole("heading", {
      name: "Something Interrupted the Growth.",
      exact: true,
    }),
  ).toBeVisible();
});

test("restart confirms before discarding and help traps keyboard focus", async ({
  page,
}) => {
  await begin(page);
  await add(page, "Sawdust");
  await add(page, "Straw");
  await page
    .getByRole("button", { name: "Open navigation menu", exact: true })
    .click();
  await page.getByRole("button", { name: /Restart Experiment/ }).click();
  await expect(page.getByRole("dialog")).toContainText("unfinished recipe");
  await page
    .getByRole("button", { name: "Keep My Experiment", exact: true })
    .click();
  await expect(page.locator(".portion-row")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Contextual Help", exact: true })
    .click();
  const close = page.getByRole("button", {
    name: "Close About This Experience",
    exact: true,
  });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator(".source-link").last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Contextual Help", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Open navigation menu", exact: true })
    .click();
  await page.getByRole("button", { name: /Restart Experiment/ }).click();
  await page
    .getByRole("button", { name: "Begin New Experiment", exact: true })
    .click();
  await expect(page.locator(".portion-row")).toHaveCount(0);
  await expect(page.locator(".total-percent")).toHaveText("EMPTY VESSEL");
});

test("four-material recipe gets uncertainty, reduced motion and keyboard tap alternative", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await begin(page);
  const jar = page.getByRole("button", { name: "Add Sawdust", exact: true });
  await jar.focus();
  await page.keyboard.press("Enter");
  await add(page, "Coffee Grounds");
  await add(page, "Straw");
  await add(page, "Paper Fibres");
  await expect(page.locator(".portion-percentage")).toHaveText([
    "25%",
    "25%",
    "25%",
    "25%",
  ]);
  await blend(page);
  await page
    .getByRole("button", { name: "Start Cultivation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Skip Animation", exact: true })
    .click();
  await page.getByRole("button", { name: "View Results", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "An Experimental Discovery!",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".result-analysis")).toContainText(
    "Four-material blends",
  );
});

test("earlier notebook migration preserves results", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "bluegreen-lab-v1",
      JSON.stringify({
        step: 5,
        recipe: { sawdust: 65, coffee: 35 },
        history: [
          {
            id: 123,
            recipe: { sawdust: 65, coffee: 35 },
            moisture: 62,
            temperature: 24,
            outcome: "success",
            reasons: ["Original recorded explanation."],
          },
        ],
      }),
    );
  });
  await page.goto("");
  await expect(page.locator(".notebook-record")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Open experiment 1", exact: true })
    .click();
  await expect(page.locator(".result-analysis")).toContainText(
    "Original recorded explanation.",
  );
  await expect(page.getByText(/earlier model/)).toBeVisible();
});

test("desktop/tablet/compact-phone layouts and production subdirectory assets", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("");
    await assertEnglishAndLayout(page);
    if (width === 1440) await shot(page, "welcome-desktop");
    await page
      .getByRole("button", { name: "Enter the Laboratory", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Begin Experiment", exact: true })
      .click();
    await assertEnglishAndLayout(page);
    await add(page, "Sawdust");
    await add(page, "Straw");
    if (width === 1440) await shot(page, "mix-desktop");
    await page
      .getByRole("button", { name: "Return to Welcome", exact: true })
      .click();
  }
  for (const image of [
    "coastal-storybook.png",
    "illustrated-materials.png",
    "mycelium.png",
  ]) {
    const response = await request.get(`images/${image}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
  }
  expect(errors).toEqual([]);
});

test("natural animation completes and reopening results does not duplicate records", async ({
  page,
}) => {
  await begin(page);
  await add(page, "Sawdust");
  await add(page, "Straw");
  await blend(page);
  await page
    .getByRole("button", { name: "Start Cultivation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "View Results", exact: true }),
  ).toBeEnabled({ timeout: 12000 });
  await page.getByRole("button", { name: "View Results", exact: true }).click();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await page.getByRole("button", { name: "View Results", exact: true }).click();
  await page
    .getByRole("button", { name: "Compare Experiments", exact: true })
    .click();
  await expect(page.locator(".notebook-record")).toHaveCount(1);
});

test("corrupted and denied browser storage allow a complete in-memory experiment", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  await begin(page);
  await add(page, "Sawdust");
  await add(page, "Straw");
  await expect(page.getByRole("status")).toContainText(
    "storage is unavailable",
  );
  await blend(page);
  await run(page);
  await expect(
    page.getByRole("heading", {
      name: "A New Material Takes Shape!",
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("storybook instruments remain on-screen and the circular dial controls real time", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "bluegreen-lab-v2",
      JSON.stringify({
        step: 3,
        draft: {
          portions: { sawdust: 2, straw: 1 },
          mixProgress: 1,
          mixing: true,
          moisture: 62,
          temperature: 24,
          days: 18,
          treated: true,
        },
        history: [],
      }),
    );
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("");
    await page
      .getByRole("heading", { name: "Incubation Period", exact: true })
      .waitFor();
    for (const label of [
      "Drag temperature liquid",
      "Drag substrate water level",
      "Rotate incubation dial",
    ]) {
      const element = page.getByRole("slider", { name: label, exact: true });
      await element.scrollIntoViewIfNeeded();
      const r = await element.boundingBox();
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(width);
      await expect(element).toBeVisible();
    }
    for (const selector of [
      ".instrument-reading",
      ".day-value",
      ".instrument-controls",
    ]) {
      for (const el of await page.locator(selector).all()) {
        const r = await el.boundingBox();
        expect(r.x + r.width).toBeLessThanOrEqual(width);
      }
    }
    if (width === 390) await shot(page, "conditions-mobile");
  }
  const dial = page.getByRole("slider", {
    name: "Rotate incubation dial",
    exact: true,
  });
  await dial.scrollIntoViewIfNeeded();
  const d = await dial.boundingBox();
  await page.mouse.click(d.x + d.width * 0.9, d.y + d.height / 2);
  await expect(dial).toHaveAttribute("aria-valuenow", "30");
  await expect(page.locator(".day-value")).toContainText("30");
  await dial.focus();
  await page.keyboard.press("ArrowDown");
  await expect(dial).toHaveAttribute("aria-valuenow", "29");
});

test("stirring is a distinct illustrated scene with substrate and no premature colonization", async ({
  page,
}) => {
  await begin(page);
  await add(page, "Sawdust");
  await add(page, "Straw");
  await page
    .getByRole("button", { name: "Mix Ingredients", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Give it a swirl!", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Sawdust", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".mixing-room .growth-visualization")).toHaveCount(
    0,
  );
  await shot(page, "stirring-mobile");
  await page.getByRole("button", { name: "Auto Mix", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your mixture is ready!", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review Ingredients", exact: true })
    .click();
  await expect(page.locator(".portion-percentage")).toHaveText(["50%", "50%"]);
  await expect(
    page.getByRole("heading", { name: "Mix Natural Ingredients", exact: true }),
  ).toBeVisible();
});
