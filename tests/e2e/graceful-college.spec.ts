import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors } from "./support/no-raw-error";

test.describe("GR-80 College Admin safe contact recovery and draft filters", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires seeded College Admin in disposable development database");

  test("GR-80 College Admin invalid contacts filter has a recovery link not a raw code", async ({ page, context }) => {
    await authenticateGracefulRole(context, "college");
    const errors = captureUncaughtErrors(page);
    await page.goto("/college/contacts?status=UNKNOWN_INTERNAL_STATUS");
    await expect(page.getByText("Invalid contact filters")).toBeVisible();
    await expect(page.getByRole("link", { name: "Reset contact filters" }))
      .toHaveAttribute("href", "/college/contacts");
    await expectNoRawErrors(page);
    expect(errors).toEqual([]);
  });

  test("GR-80 College Admin department form stays usable after navigating away from a bad link", async ({ page, context }) => {
    await authenticateGracefulRole(context, "college");
    await page.goto("/college/contacts?status=UNKNOWN_INTERNAL_STATUS");
    await page.getByRole("link", { name: "Reset contact filters" }).click();
    await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
    await page.goto("/college/departments");
    await expect(page.getByRole("heading", { name: "Departments" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Department" })).toBeVisible();
    await expectNoRawErrors(page);
  });
});
