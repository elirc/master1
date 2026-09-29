import { expect, test } from "@playwright/test";

test("renders the login screen with demo shortcuts", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Platform admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Client owner" })).toBeVisible();
});

test("renders the operations console shell for an authenticated admin", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("globalwork.authToken", "playwright-token");
    window.localStorage.setItem(
      "globalwork.authUser",
      JSON.stringify({
        id: "admin-user",
        email: "admin@globalwork.local",
        name: "Avery Platform Admin",
        platformRole: "PLATFORM_ADMIN",
        memberships: []
      })
    );
  });

  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: {
        id: "admin-user",
        email: "admin@globalwork.local",
        name: "Avery Platform Admin",
        platformRole: "PLATFORM_ADMIN",
        memberships: []
      }
    })
  );
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    const paged = { data: [], meta: { page: 1, pageSize: 25, total: 0, pageCount: 1 } };
    if (url.includes("/documents/review-queue") || url.includes("/payroll-adjustments") || url.includes("/audit-logs")) {
      return route.fulfill({ json: paged });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Employer of Record operations" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "New Hire Request" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Document Review Queue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Audit logs" })).toBeVisible();
});
