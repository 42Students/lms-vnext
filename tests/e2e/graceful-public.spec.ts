import { expect, test } from "@playwright/test";
import { captureUncaughtErrors, expectNoRawErrors, expectFriendlyFailure, failApi, type FailureKind } from "./support/no-raw-error";

test.describe("GR-80 public sign-in failure matrix", () => {
  const cases: FailureKind[] = [
    "backend-down", "html-502", "json-500", "forbidden",
    "missing-record", "conflict", "rate-limit", "slow", "session-expired",
  ];

  for (const kind of cases) {
    test(`GR-80 public sign-in ${kind} retains email and explains recovery`, async ({ page }) => {
      test.setTimeout(30_000);
      await page.goto("/");
      const errors = captureUncaughtErrors(page);
      await page.getByRole("tab", { name: "Email" }).click();
      const email = page.getByRole("textbox", { name: "Email" });
      await email.fill("learner.a@vnext.test");
      const failure = await failApi(page, kind === "backend-down" ? "**/api/**" : "**/api/auth/login/start", kind);
      try {
        await page.getByRole("button", { name: "Continue" }).click();
        await expect.poll(() => failure.requests().some((request) => request === "POST /api/auth/login/start")).toBe(true);
        await expectFriendlyFailure(page, kind);
        await expect(email).toHaveValue("learner.a@vnext.test");
        await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
        await expectNoRawErrors(page);
        expect(errors, "Uncaught client-side errors").toEqual([]);
      } finally {
        await failure.dispose();
      }
    });
  }


  test.describe("GR-80 public phone sign-in failure matrix", () => {
    for (const kind of cases) {
      test(`GR-80 public phone sign-in ${kind} retains the number`, async ({ page }) => {
        test.setTimeout(30_000);
        await page.goto("/");
        const errors = captureUncaughtErrors(page);
        await page.getByRole("tab", { name: "Phone" }).click();
        const contact = page.getByRole("textbox", { name: "Mobile number" });
        await contact.fill("9876543210");
        const failure = await failApi(
          page, kind === "backend-down" ? "**/api/**" : "**/api/auth/login/start", kind,
        );
        try {
          await page.getByRole("button", { name: "Continue" }).click();
          await expect.poll(failure.hits).toBeGreaterThan(0);
          await expectFriendlyFailure(page, kind);
          await expect(contact).toHaveValue("9876543210");
          await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
          await expectNoRawErrors(page);
          expect(errors).toEqual([]);
        } finally {
          await failure.dispose();
        }
      });
    }
  });

  test("GR-80 sign-in offline retains contact and can retry after reconnect", async ({ page, context }) => {
    await page.goto("/");
    const errors = captureUncaughtErrors(page);
    await page.getByRole("tab", { name: "Email" }).click();
    const email = page.getByRole("textbox", { name: "Email" });
    await email.fill("learner.a@vnext.test");
    await context.setOffline(true);
    try {
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page.getByRole("alert")).toContainText(/connection|offline|try again/i);
      await expect(email).toHaveValue("learner.a@vnext.test");
      await expectNoRawErrors(page);
      expect(errors).toEqual([]);
    } finally {
      await context.setOffline(false);
    }
    await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
  });
});
