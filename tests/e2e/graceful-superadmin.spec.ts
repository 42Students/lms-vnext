import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, expectFriendlyFailure, failApi, type FailureKind } from "./support/no-raw-error";

test.describe("GR-80 Super Admin college setup failure recovery", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires seeded Super Admin and organization in disposable database");

  for (const kind of [
    "backend-down", "html-502", "json-500", "forbidden",
    "conflict", "rate-limit", "maintenance", "slow", "session-expired",
  ] as FailureKind[]) {
    test(`GR-80 Super Admin college creation ${kind} retains all fields`, async ({ page, context }) => {
      test.setTimeout(40_000);
      await authenticateGracefulRole(context, "superadmin");
      await page.goto("/admin/colleges");
      const errors = captureUncaughtErrors(page);
      const organization = page.locator("#college-organization");
      await expect(organization).toBeVisible();
      await expect(organization.locator("option").first()).toBeAttached();
      const name = page.locator("#college-name");
      const code = page.locator("#college-code");
      await name.fill("Graceful College Draft");
      await code.fill("GRACEFUL-TEST-DRAFT");
      const failure = await failApi(page, kind === "backend-down" ? "**/api/**" : "**/api/colleges", kind);
      try {
        await page.getByRole("button", { name: "Create College" }).click();
        await expect.poll(failure.hits).toBeGreaterThan(0);
        await expectFriendlyFailure(page, kind);
        await expect(name).toHaveValue("Graceful College Draft");
        await expect(code).toHaveValue("GRACEFUL-TEST-DRAFT");
        await expect(page.getByRole("button", { name: "Create College" })).toBeEnabled();
        await expectNoRawErrors(page);
        expect(errors).toEqual([]);
      } finally {
        await failure.dispose();
      }
    });
  }

  test("GR-80 Super Admin offline college creation does not clear a form", async ({ page, context }) => {
    await authenticateGracefulRole(context, "superadmin");
    await page.goto("/admin/colleges");
    const name = page.locator("#college-name");
    const code = page.locator("#college-code");
    await name.fill("Offline College Draft");
    await code.fill("OFFLINE-GRACEFUL");
    await context.setOffline(true);
    try {
      await page.getByRole("button", { name: "Create College" }).click();
      await expect(name).toHaveValue("Offline College Draft");
      await expect(code).toHaveValue("OFFLINE-GRACEFUL");
      await expect(page.getByRole("alert").first()).toBeVisible();
      await expectNoRawErrors(page);
    } finally {
      await context.setOffline(false);
    }
  });
});
