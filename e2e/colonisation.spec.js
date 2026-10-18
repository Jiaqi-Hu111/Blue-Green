import { test, expect } from "@playwright/test";
import { SUBSTRATE_PATH } from "../src/growthModel.js";
test("exact checkpoints accumulate visible filaments into a nearly covered, textured substrate", async ({
  page
}) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  let previous;
  const reports = [];
  for (const [progress, low, high] of [[0, 0, 0], [25, .03, .1], [50, .25, .4], [75, .6, .8], [100, .9, .95]]) {
    await page.goto("");
    await page.evaluate(p => sessionStorage.setItem("bluegreen-active-v3", JSON.stringify({
      step: 4,
      draft: {
        portions: {
          sawdust: 60,
          straw: 40
        },
        moisture: 62,
        temperature: 24,
        days: 18,
        treated: true,
        mixProgress: 1,
        growthProgress: p,
        runId: "persistent-checkpoints"
      }
    })), progress);
    await page.reload();
    const canvas = page.getByTestId("growth-network");
    await expect(canvas).toHaveAttribute("data-iterations", String(progress * 7.2));
    const coverage = Number(await canvas.getAttribute("data-coverage"));
    expect(coverage).toBeGreaterThanOrEqual(low);
    expect(coverage).toBeLessThanOrEqual(high);
    const data = await canvas.evaluate(el => Array.from(el.getContext("2d").getImageData(0, 0, el.width, el.height).data.filter((_, i) => i % 4 === 3)));
    if (!progress) expect(data.every(a => a === 0)).toBe(true);
    if (previous) expect(data.every((a, i) => a >= previous[i])).toBe(true);
    previous = data;
    const visible = await canvas.evaluate((el, path) => {
      const context = el.getContext("2d"),
        pixels = context.getImageData(0, 0, el.width, el.height).data;
      const mask = document.createElement("canvas");
      mask.width = el.width;
      mask.height = el.height;
      const m = mask.getContext("2d");
      m.setTransform(context.getTransform());
      m.fill(new Path2D(path));
      const area = m.getImageData(0, 0, mask.width, mask.height).data;
      let count = 0,
        bright = 0,
        sum = 0,
        squares = 0;
      for (let i = 3; i < area.length; i += 4) if (area[i] >= 250) {
        const a = pixels[i] / 255;
        count++;
        sum += a;
        squares += a * a;
        if (a >= .35) bright++;
      }
      return {
        fraction: bright / count,
        mean: sum / count,
        deviation: Math.sqrt(squares / count - (sum / count) ** 2)
      };
    }, SUBSTRATE_PATH);
    reports.push({
      progress,
      sourceCoverage: coverage,
      displayed: visible
    });
    if (progress === 100) {
      expect(visible.fraction).toBeGreaterThan(.9);
      expect(visible.mean).toBeLessThan(.9);
      expect(visible.deviation).toBeGreaterThan(.08);
    }
    await page.locator(".growth-vessel").screenshot({
      path: `/tmp/colonisation-checkpoint-${progress}.png`
    });
    await page.waitForTimeout(150);
    expect(await canvas.getAttribute("data-iterations")).toBe(String(progress * 7.2));
  }
  await test.info().attach("artistic-coverage-checkpoints", {
    body: JSON.stringify(reports, null, 2),
    contentType: "application/json"
  });
  expect(errors).toEqual([]);
});
