import { expect, test } from "@playwright/test";
import { FRIENDLY_MESSAGES } from "../../src/lib/friendly-error";
import { authenticateGracefulRole, type GracefulRole } from "./support/roles";
import {
  captureUncaughtErrors, expectNoRawErrors, failApi, type FailureKind,
} from "./support/no-raw-error";

/**
 * GR-80: recovery is not complete when the error first appears. The customer
 * must be able to try again without losing what they typed or double-sending.
 * Both attempts are intercepted; this suite never requests a real OTP.
 */
const retryKinds: readonly FailureKind[] = [
  "backend-down", "html-502", "json-500", "forbidden",
  "missing-record", "conflict", "rate-limit", "maintenance", "slow",
];
const channels = [
  { name: "Email", textbox: "Email", contact: "learner.a@vnext.test" },
  { name: "Phone", textbox: "Mobile number", contact: "9876543210" },
] as const;

for (const channel of channels) {
  for (const kind of retryKinds) {
    test(`GR-80 ${channel.name} sign-in retries after ${kind} without losing contact`,
      async ({ page }) => {
        test.setTimeout(50_000);
        await page.goto("/");
        await page.getByRole("tab", { name: channel.name }).click();
        const contact = page.getByRole("textbox", { name: channel.textbox });
        await contact.fill(channel.contact);
        const errors = captureUncaughtErrors(page);
        const matcher = kind === "backend-down" ? "**/api/**" : "**/api/auth/login/start";
        const fault = await failApi(page, matcher, kind);
        const attempts = () => fault.requests().filter((request) =>
          request === "POST /api/auth/login/start").length;
        try {
          const submit = page.getByRole("button", { name: "Continue", exact: true });
          await submit.click();
          await expect.poll(attempts, { message: "first real OTP-start request" }).toBe(1);
          await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 15_000 });
          await expect(contact).toHaveValue(channel.contact);
          await expect(submit).toBeEnabled({ timeout: 15_000 });

          // Retry deliberately fails too: no real OTP is ever generated.
          await submit.click();
          await expect.poll(attempts, { message: "second real OTP-start request" }).toBe(2);
          await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 15_000 });
          await expect(contact).toHaveValue(channel.contact);
          await expect(submit).toBeEnabled({ timeout: 15_000 });
          expect(attempts(), "an accidental third OTP request would be a duplicate").toBe(2);
          await expectNoRawErrors(page);
          expect(errors).toEqual([]);
        } finally {
          await fault.dispose();
        }
      });
  }
}

/**
 * GR-80/GR-16: no navigation while offline. This checks the actual application
 * shell already on screen, then restores the connection and verifies recovery.
 */
const shellJourneys: ReadonlyArray<{ name: string; route: string; role?: GracefulRole }> = [
  { name: "Public", route: "/" },
  { name: "Learner", route: "/learn/my-placements", role: "learner" },
  { name: "Faculty", route: "/teacher/courses", role: "faculty" },
  { name: "Mentor", route: "/mentor/projects", role: "mentor" },
  { name: "College Admin", route: "/college/departments", role: "college" },
  { name: "TPO", route: "/tpo/recruiters", role: "tpo" },
  { name: "Recruiter", route: "/hr/profile", role: "recruiter" },
  { name: "Super Admin", route: "/admin/organizations", role: "superadmin" },
];
const viewports = [
  { name: "desktop", width: 1280, height: 850 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const journey of shellJourneys) {
  for (const viewport of viewports) {
    test(`GR-80 GR-16 ${journey.name} ${viewport.name} offline notice clears after reconnect`,
      async ({ page, context }) => {
        test.skip(Boolean(journey.role) &&
          (!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true"),
          "Authenticated shell check requires disposable seeded development users");
        if (journey.role) await authenticateGracefulRole(context, journey.role);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(journey.route);
        await expect(page.locator("body")).toBeVisible();
        const notice = page.getByRole("alert").filter({ hasText: FRIENDLY_MESSAGES.offline });
        await expect(notice).toHaveCount(0);
        const errors = captureUncaughtErrors(page);
        await context.setOffline(true);
        try {
          await expect(notice.first()).toBeVisible({ timeout: 10_000 });
          await expectNoRawErrors(page);
        } finally {
          await context.setOffline(false);
        }
        await expect(notice).toHaveCount(0);
        await expectNoRawErrors(page);
        expect(errors).toEqual([]);
      });
  }
}
