import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, failApi, type FailureKind } from "./support/no-raw-error";

const operations = [
  {
    name: "designation", field: "#hr-recruiter-designation", button: "Save designation",
    endpoint: "**/api/placements/recruiter/profile",
    text: "Graceful Test Recruitment Specialist",
  },
  {
    name: "display name", field: "#hr-first-name", button: "Save name",
    endpoint: "**/api/placements/recruiter/profile/name",
    text: "BrowserFailure",
  },
] as const;

test.describe("GR-80 Recruiter profile mutations", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires disposable seeded Recruiter with verified current employer grants");

  for (const operation of operations) {
    for (const kind of [
      "backend-down", "html-502", "json-500", "forbidden",
      "missing-record", "conflict", "rate-limit", "maintenance", "slow", "session-expired",
    ] as FailureKind[]) {
      test(`GR-80 Recruiter ${operation.name} ${kind} retains input and recovers`, async ({ page, context }) => {
        test.setTimeout(35_000);
        await authenticateGracefulRole(context, "recruiter");
        await page.goto("/hr/profile");
        const field = page.locator(operation.field);
        await expect(field).toBeVisible();
        await field.fill(operation.text);
        const errors = captureUncaughtErrors(page);
        const failure = await failApi(
          page, kind === "backend-down" ? "**/api/**" : operation.endpoint, kind,
        );
        try {
          await page.getByRole("button", { name: operation.button }).click();
          await expect.poll(failure.hits).toBeGreaterThan(0);
          await expect(field).toHaveValue(operation.text);
          await expect(page.getByRole("alert").filter({
            hasText: /try again|could not|changed|wait|session|connection|permission/i,
          }).first()).toBeVisible({ timeout: 15_000 });
          await expect(page.getByRole("button", { name: operation.button })).toBeEnabled();
          await expectNoRawErrors(page);
          expect(errors).toEqual([]);
        } finally {
          await failure.dispose();
        }
      });
    }

    test(`GR-80 Recruiter ${operation.name} offline preserves an editable draft`, async ({ page, context }) => {
      await authenticateGracefulRole(context, "recruiter");
      await page.goto("/hr/profile");
      const field = page.locator(operation.field);
      await field.fill(operation.text);
      await context.setOffline(true);
      try {
        await page.getByRole("button", { name: operation.button }).click();
        await expect(field).toHaveValue(operation.text);
        await expect(page.getByRole("alert").first()).toBeVisible();
        await expectNoRawErrors(page);
      } finally {
        await context.setOffline(false);
      }
    });
  }
});
