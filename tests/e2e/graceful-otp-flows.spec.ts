import { expect, test, type Page } from "@playwright/test";
import {
  captureUncaughtErrors, expectNoRawErrors, failApi,
  type FailureKind,
} from "./support/no-raw-error";

/**
 * GR-80/GR-81: exercise the actual OTP form AFTER a controlled successful
 * first step. Every successful "start" is synthetic: never call a provider.
 * Verification and fallback sends are also deliberately fault-injected.
 */
const cases: readonly FailureKind[] = [
  "backend-down", "html-502", "json-500", "forbidden",
  "missing-record", "conflict", "rate-limit", "maintenance",
  "slow", "session-expired",
];
const attemptId = "0a000000-0000-4000-8000-000000000015";

type SignInChannel = "EMAIL" | "PHONE";
type AttemptOptions = { channel: SignInChannel; secondFactor?: boolean; fallback?: boolean };

async function openSyntheticCodeStep(page: Page, options: AttemptOptions) {
  await page.goto("/");
  const tabName = options.channel === "EMAIL" ? "Email" : "Phone";
  await page.getByRole("tab", { name: tabName, exact: true }).click();
  const contact = options.channel === "EMAIL"
    ? "graceful-otp-test@example.com" : "9876543210";
  const contactField = options.channel === "EMAIL" ? "Email" : "Mobile number";
  await page.getByRole("textbox", { name: contactField }).fill(contact);
  const starts: string[] = [];
  const handler: Parameters<Page["route"]>[1] = async (route) => {
    const request = route.request();
    starts.push(request.method() + " " + new URL(request.url()).pathname);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        attemptId,
        channel: options.channel,
        maskedContact: options.channel === "EMAIL" ? "g***@example.com" : "******3210",
        expiresInSeconds: 300,
        emailFallbackAvailable: options.fallback === true,
        maskedEmail: "g***@example.com",
        ...(options.secondFactor ? {
          requiresSecondFactor: true,
          maskedPhone: "******3210",
        } : {}),
      }),
    });
  };
  await page.route("**/api/auth/login/start", handler);
  try {
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Enter your code" })).toBeVisible();
    expect(starts, "Only one fake OTP start may run")
      .toEqual(["POST /api/auth/login/start"]);
  } finally {
    await page.unroute("**/api/auth/login/start", handler);
  }
}

async function assertRejectedRequest(
  page: Page, url: string, kind: FailureKind, action: () => Promise<void>,
) {
  const matcher = kind === "backend-down" ? "**/api/**" : "**" + url;
  const injection = await failApi(page, matcher, kind);
  try {
    await action();
    await expect.poll(
      () => injection.requests().filter(request => request === "POST " + url).length,
      { message: "GR-80 must intercept the intended POST, not an unrelated request" },
    ).toBe(1);
    expect(injection.requests().filter(request => request === "POST " + url))
      .toEqual(["POST " + url]);
    await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 15_000 });
    await expectNoRawErrors(page);
  } finally {
    await injection.dispose();
  }
}

for (const channel of ["EMAIL", "PHONE"] as const) {
  for (const kind of cases) {
    test("GR-80 GR-81 " + channel + " OTP verify " + kind + " keeps entered code and permits retry",
      async ({ page }) => {
        test.setTimeout(40_000);
        await openSyntheticCodeStep(page, { channel });
        const code = page.getByRole("textbox", { name: "One-time code" });
        await code.fill("135790");
        const errors = captureUncaughtErrors(page);
        await assertRejectedRequest(page, "/api/auth/login/verify", kind, async () => {
          await page.getByRole("button", { name: "Verify and sign in" }).click();
        });
        await expect(code).toHaveValue("135790");
        await expect(page.getByRole("button", { name: "Verify and sign in" }))
          .toBeEnabled({ timeout: 15_000 });
        await expect(page.getByRole("heading", { name: "Enter your code" })).toBeVisible();
        expect(errors).toEqual([]);
      });
  }
}

for (const kind of cases) {
  test("GR-80 GR-81 two-factor OTP verify " + kind + " keeps both codes on failure", async ({ page }) => {
    test.setTimeout(40_000);
    await openSyntheticCodeStep(page, { channel: "EMAIL", secondFactor: true });
    const sms = page.getByRole("textbox", { name: "Code from the text message" });
    const email = page.getByRole("textbox", { name: "Code from the email" });
    await sms.fill("135790");
    await email.fill("246810");
    const errors = captureUncaughtErrors(page);
    await assertRejectedRequest(page, "/api/auth/login/verify", kind, async () => {
      await page.getByRole("button", { name: "Verify and sign in" }).click();
    });
    await expect(sms).toHaveValue("135790");
    await expect(email).toHaveValue("246810");
    await expect(page.getByRole("button", { name: "Verify and sign in" }))
      .toBeEnabled({ timeout: 15_000 });
    await expect(page.getByText("Administrator sign-in needs two codes.")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

for (const kind of cases) {
  test("GR-80 GR-81 phone email-fallback " + kind + " preserves the active OTP attempt", async ({ page }) => {
    test.setTimeout(40_000);
    await openSyntheticCodeStep(page, { channel: "PHONE", fallback: true });
    const code = page.getByRole("textbox", { name: "One-time code" });
    await code.fill("135790");
    const errors = captureUncaughtErrors(page);
    const fallback = page.getByRole("button", { name: "Get the code by email" });
    await expect(fallback).toBeEnabled();
    await assertRejectedRequest(page, "/api/auth/login/email", kind, async () => {
      await fallback.click();
    });
    await expect(code).toHaveValue("135790");
    await expect(fallback).toBeEnabled({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Enter your code" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
