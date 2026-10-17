import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
const oldSHA = "1".repeat(40),
  newSHA = "2".repeat(40);
const oldDir = "/tmp/bluegreen-cache-old",
  newDir = "/tmp/bluegreen-cache-new";
let server,
  url,
  current = "old",
  requests = [];
test.beforeAll(() => {
  for (const [sha, dir] of [
    [oldSHA, oldDir],
    [newSHA, newDir],
  ])
    execFileSync(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "build",
        "--outDir",
        dir,
        "--emptyOutDir",
      ],
      { env: { ...process.env, GITHUB_SHA: sha }, stdio: "pipe" },
    );
  return new Promise((resolveReady) => {
    server = createServer((req, res) => {
      const parsed = new URL(req.url, "http://localhost");
      requests.push({
        path: parsed.pathname,
        query: parsed.search,
        release: current,
      });
      let relative = decodeURIComponent(parsed.pathname).replace(
        /^\/Blue-Green\//,
        "",
      );
      if (!relative) relative = "index.html";
      if (relative.includes("..")) {
        res.writeHead(400);
        res.end();
        return;
      }
      const dir = current === "old" ? oldDir : newDir;
      let path = resolve(dir, relative);
      if (!existsSync(path) && existsSync(resolve(oldDir, relative)))
        path = resolve(oldDir, relative);
      if (!existsSync(path)) {
        res.writeHead(404);
        res.end();
        return;
      }
      const type =
        {
          ".html": "text/html",
          ".js": "application/javascript",
          ".css": "text/css",
          ".png": "image/png",
          ".json": "application/json",
        }[extname(path)] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "public, max-age=600",
      });
      res.end(readFileSync(path));
    });
    server.listen(0, "127.0.0.1", () => {
      url = `http://127.0.0.1:${server.address().port}/Blue-Green/`;
      resolveReady();
    });
  });
});
test.afterAll(() => new Promise((r) => server?.close(r)));
test("fresh normal URL and previously cached context update safely while retaining recipe and history", async ({
  browser,
}) => {
  test.setTimeout(90000);
  current = "old";
  requests = [];
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem("bluegreen-history-v3"))
      localStorage.setItem(
        "bluegreen-history-v3",
        JSON.stringify([
          {
            id: "preserve",
            number: 1,
            recipe: { sawdust: 60, straw: 40 },
            moisture: 62,
            temperature: 24,
            days: 18,
            treated: true,
            outcome: "success",
            reasons: ["Retain this recorded explanation."],
          },
        ]),
      );
  });
  let page = await context.newPage();
  await page.goto(url);
  await page
    .getByRole("button", { name: "Enter the Laboratory", exact: true })
    .waitFor();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("meta[name=bluegreen-build]")).toHaveAttribute(
    "content",
    oldSHA,
  );
  await page.close();
  page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  let cacheHits = 0;
  cdp.on("Network.requestServedFromCache", () => cacheHits++);
  await page.goto(url);
  await page
    .getByRole("button", { name: "Enter the Laboratory", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Begin Experiment", exact: true })
    .click();
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
    .fill("26");
  const history = await page.evaluate(() =>
    localStorage.getItem("bluegreen-history-v3"),
  );
  expect(cacheHits).toBeGreaterThan(0);
  current = "new";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByLabel("Website update", { exact: true }),
  ).toContainText("New version available");
  await page.waitForTimeout(350);
  await expect(page.locator("meta[name=bluegreen-build]")).toHaveAttribute(
    "content",
    oldSHA,
  );
  await expect(
    page.getByRole("slider", { name: "Incubation Temperature", exact: true }),
  ).toHaveValue("26");
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(page.locator("meta[name=bluegreen-build]")).toHaveAttribute(
    "content",
    newSHA,
  );
  await expect(page).toHaveURL(url);
  await expect(
    page.getByRole("slider", { name: "Incubation Temperature", exact: true }),
  ).toHaveValue("26");
  expect(
    await page.evaluate(() => localStorage.getItem("bluegreen-history-v3")),
  ).toBe(history);
  expect(
    requests.some(
      (r) =>
        r.path === "/Blue-Green/version.json" &&
        r.query.startsWith("?check=") &&
        r.release === "new",
    ),
  ).toBe(true);
  expect(
    requests.some(
      (r) =>
        r.path === "/Blue-Green/" &&
        r.query.includes("__bluegreen_update=") &&
        r.release === "new",
    ),
  ).toBe(true);
  const fresh = await browser.newContext();
  const visitor = await fresh.newPage();
  await visitor.goto(url);
  await expect(visitor.locator("meta[name=bluegreen-build]")).toHaveAttribute(
    "content",
    newSHA,
  );
  await expect(visitor).toHaveURL(url);
  await expect(
    visitor.getByLabel("Website update", { exact: true }),
  ).toHaveCount(0);
  expect(
    await visitor.evaluate(async () => ({
      workers: await navigator.serviceWorker
        .getRegistrations()
        .then((r) => r.length),
      caches: await caches.keys(),
    })),
  ).toEqual({ workers: 0, caches: [] });
  await fresh.close();
  await context.close();
});

test("production output has coherent SHA manifest and content-hashed JS, CSS and runtime images", async () => {
  const html = readFileSync(resolve(newDir, "index.html"), "utf8");
  expect(html).toContain(newSHA);
  expect(
    JSON.parse(readFileSync(resolve(newDir, "version.json"), "utf8")).sha,
  ).toBe(newSHA);
  const js = html.match(/src="\/Blue-Green\/(assets\/index-[^"]+\.js)"/)[1],
    css = html.match(/href="\/Blue-Green\/(assets\/index-[^"]+\.css)"/)[1];
  expect(existsSync(resolve(newDir, js))).toBe(true);
  expect(existsSync(resolve(newDir, css))).toBe(true);
  const bundle = readFileSync(resolve(newDir, js), "utf8");
  expect(bundle).toMatch(/assets\/coastal-storybook-[a-f0-9]{12}\.png/);
  expect(bundle).toMatch(/assets\/illustrated-materials-[a-f0-9]{12}\.png/);
  expect(bundle).not.toContain("serviceWorker.register");
});
