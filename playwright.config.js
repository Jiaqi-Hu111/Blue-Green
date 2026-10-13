import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const systemBrowser =
  process.env.CHROMIUM_EXECUTABLE_PATH ||
  (!process.env.CI && existsSync("/usr/bin/chromium")
    ? "/usr/bin/chromium"
    : undefined);
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: "http://localhost:4173/Blue-Green/",
    viewport: { width: 390, height: 844 },
    launchOptions: {
      ...(systemBrowser ? { executablePath: systemBrowser } : {}),
      args: ["--no-sandbox"],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://localhost:4173/Blue-Green/",
    reuseExistingServer: !process.env.CI,
  },
});
