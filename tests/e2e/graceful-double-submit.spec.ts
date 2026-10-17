import { expect, test, type Page, type BrowserContext } from "@playwright/test";
import { authenticateGracefulRole, type GracefulRole } from "./support/roles";
import { expectNoRawErrors, failApi } from "./support/no-raw-error";

type Case = {
  role?: GracefulRole;
  url: string;
  field: string;
  value: string;
  button: string;
  endpoint: string;
};
const flows: Case[] = [
  { url: "/", field: 'input[name="contact"]', value: "graceful@example.com",
    button: "Continue", endpoint: "**/api/auth/login/start" },
  { role: "learner", url: "/learn/my-placements",
    field: "#placement-job-preferences input", value: "Graceful duplicate guard",
    button: "Save preferences", endpoint: "**/api/placements/preferences" },
  { role: "college", url: "/college/departments",
    field: "#department-name", value: "Graceful Duplicate Department",
    button: "Create Department", endpoint: "**/api/college/departments" },
  { role: "superadmin", url: "/admin/organizations",
    field: "#organization-name", value: "Graceful Duplicate Organization",
    button: "Create Organization", endpoint: "**/api/organizations" },
  { role: "recruiter", url: "/hr/profile",
    field: "#hr-recruiter-designation", value: "Graceful Duplicate Role",
    button: "Save designation", endpoint: "**/api/placements/recruiter/profile" },
];

for (const flow of flows) {
  test(`GR-80 GR-30 guarded double-submit ${flow.role ?? "public"} sends only one request while slow`,
    async ({ page, context }: { page: Page; context: BrowserContext }) => {
      test.setTimeout(35_000);
      test.skip(Boolean(flow.role) &&
        (!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true"),
        "Authenticated guarded-action tests require seeded E2E identities");
      if (flow.role) await authenticateGracefulRole(context, flow.role);
      await page.goto(flow.url);
      if (!flow.role) await page.getByRole("tab", { name: "Email" }).click();
      const field = page.locator(flow.field).first();
      await expect(field).toBeVisible();
      await field.fill(flow.value);
      const fault = await failApi(page, flow.endpoint, "slow");
      try {
        await page.getByRole("button", { name: flow.button, exact: true }).click();
        await expect.poll(() => fault.requests().some((request) => request.includes(flow.endpoint.replace("**", "")))).toBe(true);
        expect(fault.hits()).toBe(1);
        // React swaps the button's accessible label to its busy copy. Never
        // continue searching by the original label during the pending state.
        const busy = page.getByRole("button", { name: /^(Saving|Creating|Sending code)…$/ });
        await expect(busy.first()).toBeDisabled();
        // A second Enter on the still-focused form field must not duplicate
        // a mutation while the first request is outstanding.
        await field.press("Enter");
        expect(fault.hits()).toBe(1);
        await expect(page.getByRole("button", { name: flow.button, exact: true }))
          .toBeEnabled({ timeout: 15_000 });
        await expect(field).toHaveValue(flow.value);
        expect(fault.hits(), "GR-30 action sent twice while first request was pending").toBe(1);
        await expectNoRawErrors(page);
      } finally {
        await fault.dispose();
      }
    });
}
