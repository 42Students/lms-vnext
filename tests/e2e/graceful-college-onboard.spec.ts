import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, failApi, type FailureKind } from "./support/no-raw-error";

test.describe("GR-80 College Admin person onboarding failure recovery", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires disposable seeded College Admin and development-only E2E auth");

  for (const kind of [
    "backend-down", "html-502", "json-500", "forbidden",
    "missing-record", "conflict", "rate-limit", "maintenance", "slow", "session-expired",
  ] as FailureKind[]) {
    test(`GR-80 College Admin person onboarding ${kind} keeps all edits`, async ({ page, context }) => {
      test.setTimeout(35_000);
      await authenticateGracefulRole(context, "college");
      await page.goto("/college/people/manage");
      await page.getByRole("button", { name: "Onboard person" }).first().click();
      const dialog = page.getByRole("dialog", { name: "Onboard person" });
      const name = dialog.getByLabel("Display name");
      const phone = dialog.getByLabel("Phone", { exact: true });
      const email = dialog.getByLabel("Email · optional");
      await name.fill("Browser Failure Test");
      await phone.fill("+919876543210");
      await email.fill("graceful-failure@example.invalid");
      const errors = captureUncaughtErrors(page);
      const failure = await failApi(
        page, kind === "backend-down" ? "**/api/**" : "**/api/people/onboard", kind,
      );
      try {
        await dialog.getByRole("button", { name: "Onboard person" }).click();
        await expect.poll(failure.hits).toBeGreaterThan(0);
        await expect(dialog).toBeVisible();
        await expect(name).toHaveValue("Browser Failure Test");
        await expect(phone).toHaveValue("+919876543210");
        await expect(email).toHaveValue("graceful-failure@example.invalid");
        await expect(page.getByRole("alert").filter({
          hasText: /onboard|failed|again|contact|permission|session/i,
        }).first()).toBeVisible({ timeout: 15_000 });
        await expectNoRawErrors(page);
        expect(errors).toEqual([]);
      } finally {
        await failure.dispose();
      }
    });
  }

  test("GR-80 College Admin offline onboarding does not close the person editor", async ({ page, context }) => {
    await authenticateGracefulRole(context, "college");
    await page.goto("/college/people/manage");
    await page.getByRole("button", { name: "Onboard person" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Onboard person" });
    const name = dialog.getByLabel("Display name");
    await name.fill("Offline Person Draft");
    await dialog.getByLabel("Phone", { exact: true }).fill("+919876543210");
    await context.setOffline(true);
    try {
      await dialog.getByRole("button", { name: "Onboard person" }).click();
      await expect(dialog).toBeVisible();
      await expect(name).toHaveValue("Offline Person Draft");
      await expectNoRawErrors(page);
    } finally {
      await context.setOffline(false);
    }
  });
});
