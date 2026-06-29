import { expect, test } from "@playwright/test";

const E2E_USER = {
  username: "e2euser",
  email: "e2e.user@example.com",
  password: "e2epass123",
};

test.describe("Login to dashboard", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post("/api/auth/signup", { data: E2E_USER });
    if (res.status() !== 201 && res.status() !== 400) {
      throw new Error(`Failed to seed E2E user: ${res.status()} ${await res.text()}`);
    }
  });

  test("user can log in and view dashboard KPIs", async ({ page }) => {
    await page.goto("/auth/login");

    await page.getByTestId("login-email").fill(E2E_USER.email);
    await page.getByTestId("login-password").fill(E2E_USER.password);
    await page.getByTestId("login-submit").click();

    await expect(page).toHaveURL(/\/home/);

    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-title")).toBeVisible();
    await expect(page.getByText("Total Income")).toBeVisible();
    await expect(page.getByText("Total Expenses")).toBeVisible();
    await expect(page.getByText("Net Balance")).toBeVisible();
  });
});
