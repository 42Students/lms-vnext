import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, failApi, type FailureKind } from "./support/no-raw-error";

const actions = [
  {
    role: "learner",
    route: "/learn/my-placements",
    endpoint: "**/api/placements/preferences",
    field: "#placement-job-preferences input",
    button: "Save preferences",
    value: "Browser safety testing",
  },
  {
    role: "college",
    route: "/college/departments",
    endpoint: "**/api/college/departments",
    field: "#department-name",
    button: "Create Department",
    value: "Graceful browser test department",
  },
  {
    role: "superadmin",
    route: "/admin/organizations",
    endpoint: "**/api/organizations",
    field: "#organization-name",
    button: "Create Organization",
    value: "Graceful browser test organization",
  },
] as const;

for (const action of actions) {
  test.describe(`GR-80 ${action.role} save failure recovery`, () => {
    test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
      "Requires the existing seeded E2E identities and development harness");

    for (const kind of ["backend-down", "html-502", "json-500", "forbidden", "conflict", "rate-limit", "slow", "session-expired"] as FailureKind[]) {
      test(`GR-80 ${action.role} ${kind} protects unsaved input`, async ({ page, context }) => {
        test.setTimeout(35_000);
        await authenticateGracefulRole(context, action.role);
        await page.goto(action.route);
        const errors = captureUncaughtErrors(page);
        const field = page.locator(action.field).first();
        await expect(field).toBeVisible();
        await field.fill(action.value);
        const failure = await failApi(page, action.endpoint, kind);
        try {
          await page.getByRole("button", { name: action.button, exact: true }).click();
          await expect.poll(failure.hits).toBeGreaterThan(0);
          await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 15_000 });
          if (kind === "session-expired" && new URL(page.url()).pathname !== action.route) {
            // Simulates returning to the requested page after a fresh E2E sign-in.
            await page.goto(action.route);
          }
          await expect(field).toHaveValue(action.value);
          if (kind === "conflict") {
            await expect(page.getByText(/This changed while you were working/i).first())
              .toBeVisible();
          }
          await expectNoRawErrors(page);
          expect(errors).toEqual([]);
          await expect(page.getByRole("button", { name: action.button, exact: true })).toBeEnabled();
        } finally {
          await failure.dispose();
        }
      });
    }

    test(`GR-80 ${action.role} offline save retains an editable draft`, async ({ page, context }) => {
      await authenticateGracefulRole(context, action.role);
      await page.goto(action.route);
      const field = page.locator(action.field).first();
      await expect(field).toBeVisible();
      await field.fill(action.value);
      await context.setOffline(true);
      try {
        await page.getByRole("button", { name: action.button, exact: true }).click();
        await expect(page.getByRole("alert").first()).toBeVisible();
        await expect(field).toHaveValue(action.value);
        await expectNoRawErrors(page);
      } finally {
        await context.setOffline(false);
      }
    });
  });
}

/** Actual unknown record links, not an intercepted fake 404 body. */
const missingRecords = [
  { role: "learner", route: "/learn/courses/00000000-0000-4000-8000-000000000000" },
  { role: "faculty", route: "/teacher/courses/00000000-0000-4000-8000-000000000000/home" },
  { role: "mentor", route: "/mentor/projects/00000000-0000-4000-8000-000000000000" },
  { role: "college", route: "/college/students/00000000-0000-4000-8000-000000000000" },
  { role: "tpo", route: "/tpo/recruiters/00000000-0000-4000-8000-000000000000" },
  { role: "recruiter", route: "/hr/drives/00000000-0000-4000-8000-000000000000" },
  { role: "superadmin", route: "/admin/colleges/00000000-0000-4000-8000-000000000000" },
] as const;

for (const { role, route } of missingRecords) {
  test(`GR-80 ${role} unknown record link shows a usable not-found screen`, async ({ page, context }) => {
    test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
      "Requires seeded E2E identities and the development harness");
    await authenticateGracefulRole(context, role);
    const errors = captureUncaughtErrors(page);
    await page.goto(route);
    await expect(page.getByText(/not found|no longer available|could not find|does not exist/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /home|back|dashboard|return/i }).first()).toBeVisible();
    await expectNoRawErrors(page);
    expect(errors).toEqual([]);
  });
}
