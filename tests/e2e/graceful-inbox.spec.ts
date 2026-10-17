import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, failApi, type FailureKind } from "./support/no-raw-error";

const journeys = [
  { role: "faculty", route: "/teacher/notifications", endpoint: "**/api/notifications/faculty/read-all" },
  { role: "mentor", route: "/mentor/notifications", endpoint: "**/api/mentor/notifications/read-all" },
] as const;
const kinds: FailureKind[] = [
  "backend-down", "html-502", "json-500", "forbidden",
  "missing-record", "conflict", "rate-limit", "slow", "session-expired",
];
for (const journey of journeys) {
  test.describe(`GR-80 ${journey.role} inbox failure matrix`, () => {
    test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
      "Requires disposable role seed and development-only E2E harness");
    for (const kind of kinds) {
      test(`GR-80 ${journey.role} read-all ${kind} has retry and unchanged inbox`, async ({ page, context }) => {
        await authenticateGracefulRole(context, journey.role);
        await page.goto(journey.route);
        const errors = captureUncaughtErrors(page);
        const button = page.getByRole("button", { name: "Mark all as read" });
        await expect(button).toBeVisible();
        test.skip(await button.isDisabled(),
          "GR-80 fixture gap: add deterministic unread notification before certification");
        const countText = await page.getByRole("link", { name: /^Unread \(/ }).first().innerText();
        const fault = await failApi(page,
          kind === "backend-down" ? "**/api/**" : journey.endpoint, kind);
        try {
          if (journey.role === "mentor") page.once("dialog", d => d.accept());
          await button.click();
          await expect.poll(() => fault.requests().includes("POST " + journey.endpoint.slice(2)))
            .toBe(true);
          await expect(page.getByText("Could not mark all as read")).toBeVisible();
          await expect(page.getByText("The inbox could not be updated. Retry the action.")).toBeVisible();
          await expect(button).toBeEnabled();
          await expect(page.getByRole("link", { name: /^Unread \(/ }).first()).toHaveText(countText);
          await expectNoRawErrors(page);
          expect(errors).toEqual([]);
        } finally {
          await fault.dispose();
        }
      });
    }
    test(`GR-80 ${journey.role} invalid inbox filters recover without code leakage`,
      async ({ page, context }) => {
        await authenticateGracefulRole(context, journey.role);
        await page.goto(journey.route + "?view=IMPOSSIBLE");
        await expect(page.getByRole("alert").first()).toContainText(/invalid/i);
        await expect(page.getByRole("link", { name: /return|newest|clear/i }).first()).toBeVisible();
        await expectNoRawErrors(page);
      });
  });
}
