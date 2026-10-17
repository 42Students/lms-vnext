import { expect, test } from "@playwright/test";
import { captureUncaughtErrors, expectNoRawErrors } from "./support/no-raw-error";

/** GR-80/GR-81: real sign-in form, deliberately failed provider-shaped replies.
 * No login/start call escapes interception, so no real OTP is issued.
 */
const codes = ["AUTH_PROVIDER_EXCEPTION","DOWNSTREAM_SMS_GATEWAY","DATABASE_CONNECTION_FAILED","TENANT_CONFIG_MISSING","MFA_DELIVERY_FAILED","PROVIDER_RESPONSE_INVALID","POSTGRES_TRANSACTION_ABORTED","AUTH_SESSION_CACHE_FAILURE","IDENTITY_STORE_UNAVAILABLE","UNKNOWN_HANDLER_EXCEPTION"] as const;

for (const code of codes) {
  test("GR-80 GR-81 email unknown code " + code + " does not disclose internals on retry", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Email" }).click();
    const contact = page.getByRole("textbox", { name: "Email" });
    await contact.fill("safe-retry@example.com");
    const errors = captureUncaughtErrors(page);
    const observed: string[] = [];
    const handler: Parameters<typeof page.route>[1] = async route => {
      observed.push(route.request().method() + " " + new URL(route.request().url()).pathname);
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: { "x-request-id": "ab12cd34" },
        body: JSON.stringify({
          code: code,
          message: "Error: relation private_auth violates a database constraint at source:1:2",
          requestId: "ab12cd34",
        }),
      });
    };
    await page.route("**/api/auth/login/start", handler);
    try {
      const continueButton = page.getByRole("button", { name: "Continue", exact: true });
      for (const expected of [1, 2]) {
        await continueButton.click();
        await expect.poll(() => observed.length).toBe(expected);
        await expect(page.getByRole("alert").filter({
          hasText: "Something went wrong. Try again in a moment.",
        })).toBeVisible();
        await expect(contact).toHaveValue("safe-retry@example.com");
        await expect(continueButton).toBeEnabled();
        await expectNoRawErrors(page);
      }
      expect(observed).toEqual([
        "POST /api/auth/login/start", "POST /api/auth/login/start",
      ]);
      expect(errors).toEqual([]);
    } finally {
      await page.unroute("**/api/auth/login/start", handler);
    }
  });
}
