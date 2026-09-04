import { defineConfig } from "@playwright/test";

// Drives the full storyline in a real Chromium against the local standalone stack, using the dev connector shim
// (VITE_DEV_WALLET=true) in place of the 1AM extension. Every step is a real transaction with a real proof.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30 * 60_000,
  expect: { timeout: 120_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:5175",
    headless: true,
    viewport: { width: 1280, height: 900 },
    screenshot: "on",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "VITE_DEV_WALLET=true pnpm exec vite --port 5175 --strictPort",
    url: "http://localhost:5175",
    reuseExistingServer: true,
    timeout: 120_000,
    env: { VITE_DEV_WALLET: "true" },
  },
});
