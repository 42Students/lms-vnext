import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, failApi, type FailureKind } from "./support/no-raw-error";

test.describe("GR-80 Mentor notifications and calendar failure behaviour", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires seeded Mentor membership in disposable development database");

  for (const kind of [
    "backend-down", "html-502", "json-500", "forbidden",
    "conflict", "rate-limit", "slow", "session-expired",
  ] as FailureKind[]) {
    test(`GR-80 Mentor marking unread notifications ${kind} stays usable`, async ({ page, context }) => {
      test.setTimeout(35_000);
      await authenticateGracefulRole(context, "mentor");
      await page.goto("/mentor/notifications");
      const errors = captureUncaughtErrors(page);
      const markAll = page.getByRole("button", { name: "Mark all as read" });
      await expect(markAll).toBeVisible();
      // The seed does not promise an unread notification; never claim the
      // API path was exercised when the product deliberately disables it.
      test.skip(await markAll.isDisabled(), "Seed needs an unread Mentor notification for this mutation");
      const failure = await failApi(page, "**/api/mentor/notifications/read-all", kind);
      page.once("dialog", (dialog) => dialog.accept());
      try {
        await markAll.click();
        await expect.poll(failure.hits).toBeGreaterThan(0);
        await expect(page.getByText(/could not mark all as read|retry the action|try again/i).first())
          .toBeVisible({ timeout: 15_000 });
        await expect(markAll).toBeEnabled();
        await expectNoRawErrors(page);
        expect(errors).toEqual([]);
      } finally {
        await failure.dispose();
      }
    });
  }

  test("GR-80 Mentor invalid meeting filter links to a safe recovery route", async ({ page, context }) => {
    await authenticateGracefulRole(context, "mentor");
    await page.goto("/mentor/calendar?status=NOT_A_MEETING_STATE");
    await expect(page.getByRole("alert")).toContainText("Invalid meeting filters");
    await expect(page.getByRole("link", { name: "Clear filters" }))
      .toHaveAttribute("href", "/mentor/calendar");
    await expectNoRawErrors(page);
  });

  test("GR-80 Mentor offline calendar keeps entered filters until reconnect", async ({ page, context }) => {
    await authenticateGracefulRole(context, "mentor");
    await page.goto("/mentor/calendar");
    const search = page.getByRole("searchbox", { name: "Search" });
    await expect(search).toBeVisible();
    await search.fill("Mentor meeting browser draft");
    await context.setOffline(true);
    try {
      await expect(page.getByText(/you appear to be offline|offline|reconnect/i).first())
        .toBeVisible({ timeout: 10_000 });
      await expect(search).toHaveValue("Mentor meeting browser draft");
      await expectNoRawErrors(page);
    } finally {
      await context.setOffline(false);
    }
  });
});
