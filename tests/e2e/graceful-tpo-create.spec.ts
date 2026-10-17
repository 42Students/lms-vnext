import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, failApi, type FailureKind } from "./support/no-raw-error";

const kinds: FailureKind[] = [
  "backend-down", "html-502", "json-500", "forbidden",
  "missing-record", "conflict", "rate-limit", "slow", "session-expired",
];

test.describe("GR-80 TPO recruiter creation drafts", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires disposable TPO membership with DB09 recruiter tables ready");

  for (const kind of kinds) {
    test(`GR-80 TPO creating recruiter ${kind} retains review and contact fields`, async ({ page, context }) => {
      test.setTimeout(45_000);
      await authenticateGracefulRole(context, "tpo");
      await page.goto("/tpo/recruiters");
      const errors = captureUncaughtErrors(page);
      await page.getByRole("button", { name: "Add recruiter lead" }).click();
      const dialog = page.getByRole("dialog", { name: "Add recruiter lead" });
      await expect(dialog).toBeVisible();
      const name = dialog.getByRole("textbox", { name: "Name *" });
      const company = dialog.getByRole("textbox", { name: "Company *" });
      const email = dialog.getByRole("textbox", { name: "Email" });
      await name.fill("Graceful Recruiter Draft");
      await company.fill("Browser Test Company");
      await email.fill("graceful@example.invalid");

      // Creation has two preflight checks: one per submit. Emulate only a
      // not-found contact in the disposable fixture to reach the actual POST.
      // An all-API outage must fail on preflight and never claim it hit POST.
      if (kind !== "backend-down") {
        await page.route("**/api/placements/tpo/leads/check?*", async (route) =>
          route.fulfill({ status: 204, body: "" }));
      }
      const failure = await failApi(page,
        kind === "backend-down" ? "**/api/**" : "**/api/placements/tpo/leads", kind);
      try {
        const first = dialog.getByRole("button", { name: "Review and create recruiter" });
        await first.click();
        if (kind !== "backend-down") {
          await expect(dialog.getByText("Confirm: Create recruiter lead", { exact: false })).toBeVisible();
          await dialog.getByRole("button", { name: "Confirm and create recruiter" }).click();
          await expect.poll(() => failure.requests().includes("POST /api/placements/tpo/leads"))
            .toBe(true);
        } else {
          await expect.poll(() =>
            failure.requests().some((request) => request.startsWith("GET /api/placements/tpo/leads/check")))
            .toBe(true);
        }
        await expect(dialog.getByRole("alert").first()).toBeVisible({ timeout: 15_000 });
        await expect(name).toHaveValue("Graceful Recruiter Draft");
        await expect(company).toHaveValue("Browser Test Company");
        await expect(email).toHaveValue("graceful@example.invalid");
        await expect(dialog).toBeVisible();
        await expectNoRawErrors(page);
        expect(errors).toEqual([]);
      } finally {
        await failure.dispose();
      }
    });
  }

  test("GR-80 TPO offline recruiter creation preserves the unfinished lead", async ({ page, context }) => {
    await authenticateGracefulRole(context, "tpo");
    await page.goto("/tpo/recruiters");
    await page.getByRole("button", { name: "Add recruiter lead" }).click();
    const dialog = page.getByRole("dialog", { name: "Add recruiter lead" });
    await dialog.getByRole("textbox", { name: "Name *" }).fill("Offline Recruiter");
    await dialog.getByRole("textbox", { name: "Company *" }).fill("Offline Company");
    await dialog.getByRole("textbox", { name: "Email" }).fill("offline@example.invalid");
    await context.setOffline(true);
    try {
      await dialog.getByRole("button", { name: "Review and create recruiter" }).click();
      await expect(dialog.getByRole("alert").first()).toBeVisible();
      await expect(dialog.getByRole("textbox", { name: "Name *" })).toHaveValue("Offline Recruiter");
      await expect(dialog).toBeVisible();
      await expectNoRawErrors(page);
    } finally {
      await context.setOffline(false);
    }
  });
});

test("GR-80 GR-34 TPO slow confirmed recruiter creation does not duplicate POST", async ({ page, context }) => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Needs disposable TPO with DB09 CRM tables ready");
  test.setTimeout(40_000);
  await authenticateGracefulRole(context, "tpo");
  await page.goto("/tpo/recruiters");
  await page.getByRole("button", { name: "Add recruiter lead" }).click();
  const dialog = page.getByRole("dialog", { name: "Add recruiter lead" });
  await dialog.getByRole("textbox", { name: "Name *" }).fill("Only One Recruiter");
  await dialog.getByRole("textbox", { name: "Company *" }).fill("Single Save Company");
  await dialog.getByRole("textbox", { name: "Email" }).fill("once@example.invalid");
  await page.route("**/api/placements/tpo/leads/check?*", route =>
    route.fulfill({ status: 204, body: "" }));
  await dialog.getByRole("button", { name: "Review and create recruiter" }).click();
  await expect(dialog.getByText(/Confirm: Create recruiter lead/)).toBeVisible();
  const fault = await failApi(page, "**/api/placements/tpo/leads", "slow");
  try {
    await dialog.getByRole("button", { name: "Confirm and create recruiter" }).click();
    await expect.poll(() => fault.requests().filter(request =>
      request === "POST /api/placements/tpo/leads").length).toBe(1);
    await expect(dialog.getByRole("button", { name: "Creating…" })).toBeDisabled();
    await dialog.getByRole("textbox", { name: "Name *" }).press("Enter");
    expect(fault.hits()).toBe(1);
    await expect(dialog.getByRole("button", { name: "Confirm and create recruiter" }))
      .toBeEnabled({ timeout: 15_000 });
    await expect(dialog.getByRole("textbox", { name: "Name *" })).toHaveValue("Only One Recruiter");
    expect(fault.hits()).toBe(1);
    await expectNoRawErrors(page);
  } finally {
    await fault.dispose();
  }
});
