import { expect, test } from "@playwright/test";
import { captureUncaughtErrors, expectNoRawErrors } from "./support/no-raw-error";

/** GR-80/GR-81: real verification form and deliberate domain failures.
 * Both the start and verify POSTs are intercepted. No real OTP or login occurs.
 */
const outcomes = [
  {
    "code": "INCORRECT_OTP",
    "copy": "That code isn't right. Check it and try again.",
    "mode": "keep"
  },
  {
    "code": "OTP_EXPIRED",
    "copy": "This code can't be used any more. Ask for a new one to continue.",
    "mode": "restart"
  },
  {
    "code": "INVALID_ATTEMPT",
    "copy": "This code can't be used any more. Ask for a new one to continue.",
    "mode": "restart"
  },
  {
    "code": "OTP_ATTEMPTS_EXCEEDED",
    "copy": "Too many wrong codes. Ask for a new one.",
    "mode": "restart"
  },
  {
    "code": "WRONG_TENANT",
    "copy": "This code was asked for on another college's address. Start again here.",
    "mode": "change"
  },
  {
    "code": "SECOND_FACTOR_REQUIRED",
    "copy": "Enter both codes to continue.",
    "mode": "keep"
  },
  {
    "code": "SECOND_FACTOR_UNAVAILABLE",
    "copy": "This administrator account needs both a verified phone number and email address.",
    "mode": "keep"
  },
  {
    "code": "TOO_MANY_REQUESTS",
    "copy": "Too many codes were requested. Try again in about 10 minutes.",
    "mode": "keep"
  },
  {
    "code": "TOO_SOON",
    "copy": "A code was just sent. Wait a few seconds before asking for another.",
    "mode": "keep"
  },
  {
    "code": "ACCOUNT_DISABLED",
    "copy": "This account is disabled. Contact your administrator.",
    "mode": "keep"
  }
] as const;

for (const outcome of outcomes) {
  test("GR-80 GR-81 two-factor " + outcome.code + " preserves safe recovery behavior", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Email" }).click();
    const contact = page.getByRole("textbox", { name: "Email" });
    await contact.fill("recovery@example.com");
    const starts: string[] = [];
    const starter: Parameters<typeof page.route>[1] = async route => {
      starts.push(route.request().method() + " " + new URL(route.request().url()).pathname);
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          attemptId: "0a000000-0000-4000-8000-000000000015",
          channel: "EMAIL", maskedContact: "r***@example.com",
          expiresInSeconds: 300, emailFallbackAvailable: false,
          maskedEmail: "r***@example.com",
          requiresSecondFactor: true,
          maskedPhone: "******3210",
        }),
      });
    };
    await page.route("**/api/auth/login/start", starter);
    try {
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page.getByRole("heading", { name: "Enter your code" })).toBeVisible();
      expect(starts).toEqual(["POST /api/auth/login/start"]);
    } finally {
      await page.unroute("**/api/auth/login/start", starter);
    }
    const errors = captureUncaughtErrors(page);
    const code = page.getByRole("textbox", { name: "Code from the text message" });
    await code.fill("135790");
    const second = page.getByRole("textbox", { name: "Code from the email" });
    await second.fill("246810");
    const verifyCalls: string[] = [];
    const verifier: Parameters<typeof page.route>[1] = async route => {
      verifyCalls.push(route.request().method() + " " + new URL(route.request().url()).pathname);
      await route.fulfill({
        status: 400, contentType: "application/json",
        body: JSON.stringify({ error: outcome.code, requestId: "ab12cd34" }),
      });
    };
    await page.route("**/api/auth/login/verify", verifier);
    try {
      await page.getByRole("button", { name: "Verify and sign in" }).click();
      await expect.poll(() => verifyCalls.length).toBe(1);
      await expect(page.getByRole("alert").filter({ hasText: outcome.copy })).toBeVisible();
      expect(verifyCalls).toEqual(["POST /api/auth/login/verify"]);
      if (outcome.mode === "change") {
        await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
        await expect(contact).toHaveValue("recovery@example.com");
      } else if (outcome.mode === "restart") {
        await expect(code).toHaveValue("");
        await expect(second).toHaveValue("");
        await expect(page.getByRole("button", { name: "Verify and sign in" })).toBeDisabled();
      } else {
        await expect(code).toHaveValue("135790");
        await expect(second).toHaveValue("246810");
        await expect(page.getByRole("button", { name: "Verify and sign in" })).toBeEnabled();
      }
      await expectNoRawErrors(page);
      expect(errors).toEqual([]);
    } finally {
      await page.unroute("**/api/auth/login/verify", verifier);
    }
  });
}
