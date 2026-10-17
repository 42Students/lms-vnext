import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, failApi, type FailureKind } from "./support/no-raw-error";

async function editProfile(page: import("@playwright/test").Page) {
  await page.goto("/learn/profile");
  await page.getByRole("button", { name: "Edit profile", exact: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "Edit learner profile" });
  await expect(dialog).toBeVisible();
  const headline = dialog.getByRole("textbox", { name: "Headline" });
  await headline.fill("Learner work must survive a failed save");
  return { dialog, headline };
}

test.describe("GR-80 Learner profile editing and autosave", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires disposable seeded Learner and E2E development harness");
  for (const kind of [
    "backend-down", "html-502", "json-500", "forbidden",
    "conflict", "rate-limit", "maintenance", "slow", "session-expired",
  ] as FailureKind[]) {
    test(`GR-80 Learner profile ${kind} never destroys a draft`, async ({ page, context }) => {
      test.setTimeout(40_000);
      await authenticateGracefulRole(context, "learner");
      const { dialog, headline } = await editProfile(page);
      const errors = captureUncaughtErrors(page);
      const failure = await failApi(page, kind === "backend-down" ? "**/api/**" : "**/api/profile/me", kind);
      try {
        await dialog.getByRole("button", { name: "Save profile" }).click();
        await expect.poll(failure.hits).toBeGreaterThan(0);
        await expect(headline).toHaveValue("Learner work must survive a failed save");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("button", { name: "Save profile" })).toBeEnabled();
        await expect(page.getByText(/could not|try again|changed|retry|session|sign in/i).first())
          .toBeVisible({ timeout: 15_000 });
        await expectNoRawErrors(page);
        expect(errors).toEqual([]);
      } finally {
        await failure.dispose();
      }
    });
  }

  test("GR-80 Learner offline profile save keeps editor and input", async ({ page, context }) => {
    await authenticateGracefulRole(context, "learner");
    const { dialog, headline } = await editProfile(page);
    await context.setOffline(true);
    try {
      await dialog.getByRole("button", { name: "Save profile" }).click();
      await expect(headline).toHaveValue("Learner work must survive a failed save");
      await expect(dialog).toBeVisible();
      await expectNoRawErrors(page);
    } finally {
      await context.setOffline(false);
    }
  });

  test("GR-80 Learner failed profile save survives reload with its local draft", async ({ page, context }) => {
    await authenticateGracefulRole(context, "learner");
    const { dialog } = await editProfile(page);
    const failure = await failApi(page, "**/api/profile/me", "json-500");
    try {
      await dialog.getByRole("button", { name: "Save profile" }).click();
      await expect.poll(failure.hits).toBeGreaterThan(0);
    } finally {
      await failure.dispose();
    }
    // The true unsaved user input, not merely the server's previous profile.
    await page.reload();
    await page.getByRole("button", { name: "Edit profile", exact: true }).first().click();
    await expect(page.getByRole("dialog", { name: "Edit learner profile" })
      .getByRole("textbox", { name: "Headline" }))
      .toHaveValue("Learner work must survive a failed save");
    await expectNoRawErrors(page);
  });
});
