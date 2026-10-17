import { expect, test } from "@playwright/test";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, expectFriendlyFailure, failApi, type FailureKind } from "./support/no-raw-error";

test.describe("GR-80 Faculty authoring gracefully survives failed saves", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires the seeded Faculty course and development E2E harness");

  for (const kind of [
    "backend-down", "html-502", "json-500", "forbidden",
    "conflict", "rate-limit", "maintenance", "slow", "session-expired",
  ] as FailureKind[]) {
    test(`GR-80 Faculty assignment authoring ${kind} retains draft`, async ({ page, context }) => {
      test.setTimeout(45_000);
      await authenticateGracefulRole(context, "faculty");
      await page.goto("/teacher/courses");
      await page.getByRole("link", { name: /E2E Browser Course/ }).click();
      await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
      const deliveryId = new URL(page.url()).pathname.split("/")[3];
      expect(deliveryId).toMatch(/^[a-f0-9-]{36}$/i);
      await page.goto(`/teacher/courses/${deliveryId}/assignments/manage`);
      await expect(page.getByRole("heading", { name: "Assignment authoring" })).toBeVisible();
      const errors = captureUncaughtErrors(page);
      const title = page.getByRole("textbox", { name: "Title", exact: true });
      await title.fill("Graceful assignment unsaved draft");
      await page.getByRole("textbox", { name: "Text instructions" }).fill("Text that must remain after the failure");
      await page.getByRole("spinbutton", { name: "Maximum points" }).fill("20");
      await page.getByRole("checkbox", { name: /I confirm this Section assignment change/ }).check();
      const failure = await failApi(
        page, kind === "backend-down" ? "**/api/**" : `**/api/courses/faculty/assignments/${deliveryId}/command`, kind,
      );
      try {
        await page.getByRole("button", { name: "Create draft" }).click();
        await expect.poll(() => failure.requests().some((request) => request === `POST /api/courses/faculty/assignments/${deliveryId}/command`)).toBe(true);
        await expectFriendlyFailure(page, kind);
        await expect(title).toHaveValue("Graceful assignment unsaved draft");
        await expect(page.getByRole("textbox", { name: "Text instructions" }))
          .toHaveValue("Text that must remain after the failure");
        await expect(page.getByRole("button", { name: "Create draft" })).toBeEnabled();
        await expectNoRawErrors(page);
        expect(errors).toEqual([]);
      } finally {
        await failure.dispose();
      }
    });
  }

  test("GR-80 Faculty backend down keeps the current course and offers recovery", async ({ page, context }) => {
    await authenticateGracefulRole(context, "faculty");
    await page.goto("/teacher/courses");
    await expect(page.getByRole("heading", { name: "My Teaching Courses" })).toBeVisible();
    const failure = await failApi(page, "**/api/auth/memberships", "backend-down");
    try {
      const control = page.getByLabel("Switch workspace");
      await expect(control).toBeVisible();
      // This role has two seeded memberships. A failed switch must not blank the page.
      await control.selectOption(SEED_IDS.facultyCollegeBMembership);
      await expect.poll(failure.hits).toBeGreaterThan(0);
      await expect(page.getByRole("heading", { name: "My Teaching Courses" })).toBeVisible();
      await expectNoRawErrors(page);
    } finally {
      await failure.dispose();
    }
  });
});

test("GR-80 Faculty offline assignment authoring preserves unsaved content", async ({ page, context }) => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires Faculty course fixture");
  await authenticateGracefulRole(context, "faculty");
  await page.goto("/teacher/courses");
  await page.getByRole("link", { name: /E2E Browser Course/ }).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
  const deliveryId = new URL(page.url()).pathname.split("/")[3];
  await page.goto("/teacher/courses/" + deliveryId + "/assignments/manage");
  const title = page.getByRole("textbox", { name: "Title", exact: true });
  const instructions = page.getByRole("textbox", { name: "Text instructions" });
  await title.fill("Unsent Faculty assignment draft");
  await instructions.fill("Never erase this text after an offline save");
  await page.getByRole("spinbutton", { name: "Maximum points" }).fill("20");
  await page.getByRole("checkbox", { name: /I confirm this Section assignment change/ }).check();
  await context.setOffline(true);
  try {
    await page.getByRole("button", { name: "Create draft" }).click();
    await expect(title).toHaveValue("Unsent Faculty assignment draft");
    await expect(instructions).toHaveValue("Never erase this text after an offline save");
    await expect(page.getByRole("button", { name: "Create draft" })).toBeEnabled({ timeout: 15_000 });
    await expectNoRawErrors(page);
  } finally {
    await context.setOffline(false);
  }
});
