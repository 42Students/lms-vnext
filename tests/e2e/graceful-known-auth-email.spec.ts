import { expect, test } from "@playwright/test";
import { captureUncaughtErrors, expectNoRawErrors } from "./support/no-raw-error";

/**
 * GR-80/GR-81: sign-in must preserve established human wording while hiding
 * the domain's internal machine-readable error identifier.
 * Both attempts are intercepted; this suite never issues a real login code.
 */
const failures = [
  {
    "code": "NOT_REGISTERED",
    "status": 400,
    "copy": "We couldn't find an account with that email."
  },
  {
    "code": "TOO_MANY_REQUESTS",
    "status": 429,
    "copy": "Too many codes were requested. Try again in about 10 minutes."
  },
  {
    "code": "TOO_SOON",
    "status": 429,
    "copy": "A code was just sent. Wait a few seconds before asking for another."
  },
  {
    "code": "OTP_DELIVERY_FAILED",
    "status": 503,
    "copy": "We couldn't send the email just now. Try again."
  },
  {
    "code": "ACCOUNT_DISABLED",
    "status": 403,
    "copy": "This account is disabled. Contact your administrator."
  },
  {
    "code": "ACCOUNT_SUSPENDED",
    "status": 403,
    "copy": "This account is suspended. Contact your college administrator."
  },
  {
    "code": "AUTH_NOT_CONFIGURED",
    "status": 503,
    "copy": "Sign-in is temporarily unavailable. Please try again shortly."
  },
  {
    "code": "INVALID_CONTACT",
    "status": 400,
    "copy": "Enter a valid phone number or email address."
  },
  {
    "code": "CHANNEL_DISABLED",
    "status": 403,
    "copy": "This college signs in with a mobile number. Use your phone number instead."
  },
  {
    "code": "EMAIL_NOT_AVAILABLE",
    "status": 409,
    "copy": "This account has no email address on file."
  }
] as const;

for (const failure of failures) {
  test("GR-80 GR-81 email auth " + failure.code + " preserves legacy wording and draft", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Email" }).click();
    const field = page.getByRole("textbox", { name: "Email" });
    await field.fill("test-user@example.com");
    const errors = captureUncaughtErrors(page);
    const requests: string[] = [];
    const handler: Parameters<typeof page.route>[1] = async route => {
      requests.push(route.request().method() + " " + new URL(route.request().url()).pathname);
      await route.fulfill({
        status: failure.status,
        contentType: "application/json",
        body: JSON.stringify({ error: failure.code, requestId: "ab12cd34" }),
      });
    };
    await page.route("**/api/auth/login/start", handler);
    try {
      const submit = page.getByRole("button", { name: "Continue", exact: true });
      await submit.click();
      await expect.poll(() => requests.length).toBe(1);
      await expect(page.getByRole("alert").filter({ hasText: failure.copy })).toBeVisible();
      await expect(field).toHaveValue("test-user@example.com");
      await expect(submit).toBeEnabled();
      await expectNoRawErrors(page);
      expect(requests).toEqual(["POST /api/auth/login/start"]);
      expect(errors).toEqual([]);
    } finally {
      await page.unroute("**/api/auth/login/start", handler);
    }
  });
}
