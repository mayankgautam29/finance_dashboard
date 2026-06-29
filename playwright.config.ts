import { defineConfig, devices } from "@playwright/test";

const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const frontendUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: frontendUrl,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "python -m uvicorn main:app --host 127.0.0.1 --port 8000",
      cwd: "./backend",
      url: `${backendUrl}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        MONGODB_URI:
          process.env.MONGODB_URI ??
          "mongodb://127.0.0.1:27017/finance_dashboard_e2e",
        JWT_SECRET: process.env.JWT_SECRET ?? "e2e-test-jwt-secret-local-only",
        ALLOWED_ORIGINS: "http://127.0.0.1:3000",
        SECURE_COOKIES: "false",
      },
    },
    {
      command: "npm run dev -- --port 3000",
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        BACKEND_URL: backendUrl,
      },
    },
  ],
});
