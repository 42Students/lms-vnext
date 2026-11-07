import { expect, test, type Page } from "@playwright/test";

/**
 * UX-G086 and UX-G124 only. All OTP/verification API requests are intercepted
 * with synthetic payloads; no real contact is notified and no bearer is sent
 * to a provider or the public network.
 */
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;
const verificationToken = "a".repeat(43);

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth
  )).toBe(false);
}

for (const viewport of viewports) {
  test(`UX-G086 ${viewport.name} roll-number entry → OTP → recover from invalid code`,
    async ({ page }) => {
      await page.setViewportSize(viewport);
      const exceptions: string[] = [];
      page.on("pageerror", error => exceptions.push(error.message));
      let started = 0;
      let verified = 0;
      await page.route("**/api/auth/login/roll-number/start", async route => {
        started++;
        expect(route.request().method()).toBe("POST");
        expect(route.request().postDataJSON()).toEqual({ rollNumber: "COLLEGE-42" });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ attemptId: "synthetic-attempt", maskedContact: "s***@example.test", expiresInSeconds: 300 }),
        });
      });
      await page.route("**/api/auth/login/verify", async route => {
        verified++;
        expect(route.request().method()).toBe("POST");
        expect(route.request().postDataJSON()).toEqual({
          attemptId: "synthetic-attempt", code: "123456",
        });
        await route.fulfill({
          status: 400, contentType: "application/json", body: JSON.stringify({ error: "INVALID_CODE" }),
        });
      });

      await page.goto("/roll-number-login");
      await expect(page.getByRole("heading", { level: 1, name: "Student login" })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.getByText("Step 1 of 2 · Enter your roll number")).toBeVisible();
      const roll = page.getByRole("textbox", { name: "Roll number" });
      await expect(roll).toHaveAttribute("aria-describedby", /roll-login-hint/);
      await roll.fill("  COLLEGE-42  ");
      const send = page.getByRole("button", { name: "Send verification code" });
      await send.focus();
      await expect(send).toBeFocused();
      await send.click();
      await expect(page.getByText("Step 2 of 2 · Verify your code")).toBeVisible();
      await expect(page.getByRole("status")).toContainText("s***@example.test");
      const code = page.getByRole("textbox", { name: "Verification code" });
      await code.fill("123456");
      await page.getByRole("button", { name: "Verify and sign in" }).click();
      await expect(page.locator("#roll-login-error")).toContainText("Incorrect or expired code");
      await expect(code).toHaveValue("123456");
      expect(started).toBe(1);
      expect(verified).toBe(1);
      await expect(page.getByRole("link", { name: "Sign in with phone or email" })).toHaveAttribute("href", "/login");
      await page.getByRole("button", { name: "Start again or request another code" }).click();
      await expect(roll).toBeVisible();
      await expect(page.locator("#roll-login-error")).toHaveCount(0);
      await expectNoOverflow(page);
      expect(exceptions).toEqual([]);
    });

  test(`UX-G086 ${viewport.name} preserves the entered roll number after a failed request`,
    async ({ page }) => {
      await page.setViewportSize(viewport);
      let calls = 0;
      await page.route("**/api/auth/login/roll-number/start", async route => {
        calls++;
        await route.fulfill({
          status: 429, contentType: "application/json",
          body: JSON.stringify({ error: "RATE_LIMITED" }),
        });
      });
      await page.goto("/roll-number-login");
      const roll = page.getByRole("textbox", { name: "Roll number" });
      await roll.fill("TEST-ROLL-9");
      await page.getByRole("button", { name: "Send verification code" }).click();
      await expect(page.locator("#roll-login-error")).toContainText(/sign-in method is unavailable/i);
      await expect(roll).toHaveValue("TEST-ROLL-9");
      await expect(page.getByRole("button", { name: "Send verification code" })).toBeEnabled();
      expect(calls).toBe(1);
      await expectNoOverflow(page);
    });

  test(`UX-G124 ${viewport.name} strips fragment and redeems only after explicit confirmation`,
    async ({ page }) => {
      await page.setViewportSize(viewport);
      const exceptions: string[] = [];
      page.on("pageerror", error => exceptions.push(error.message));
      let calls = 0;
      await page.route("**/api/auth/email-ownership/redeem", async route => {
        calls++;
        expect(route.request().method()).toBe("POST");
        expect(route.request().postDataJSON()).toEqual({ token: verificationToken });
        expect(route.request().headers().referer).not.toContain(verificationToken);
        await route.fulfill({
          status: 200, contentType: "application/json",
          body: JSON.stringify({ verified: true, sessionCreated: false }),
        });
      });

      await page.goto("/verify-email#token=" + verificationToken);
      await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page).toHaveURL(/\/verify-email$/);
      await expect(page.getByText(/expires after 24 hours/)).toBeVisible();
      expect(calls).toBe(0);
      expect(await page.locator("body").innerText()).not.toContain(verificationToken);
      const confirm = page.getByRole("button", { name: "Confirm email ownership" });
      await confirm.focus();
      await expect(confirm).toBeFocused();
      await confirm.click();
      await expect(page.getByRole("status")).toContainText("Email ownership verified");
      await expect(page.getByRole("link", { name: "Return to my workspace" }))
        .toHaveAttribute("href", "/dashboard");
      expect(calls).toBe(1);
      await expectNoOverflow(page);
      expect(exceptions).toEqual([]);
    });

  test(`UX-G124 ${viewport.name} rejects a malformed fragment without making an API request`,
    async ({ page }) => {
      await page.setViewportSize(viewport);
      let calls = 0;
      await page.route("**/api/auth/email-ownership/redeem", async route => {
        calls++;
        await route.fulfill({ status: 400, body: "{}" });
      });
      await page.goto("/verify-email#token=invalid-token");
      await expect(page.locator('main [role="alert"]')).toContainText(/invalid, expired or unavailable/);
      await expect(page.getByRole("link", { name: "Back to sign in" }))
        .toHaveAttribute("href", "/login");
      await expect(page).toHaveURL(/\/verify-email$/);
      expect(calls).toBe(0);
      await expectNoOverflow(page);
    });
}

test("UX-G124 server-declined proof never displays raw errors or redirects automatically",
  async ({ page }) => {
    let calls = 0;
    await page.route("**/api/auth/email-ownership/redeem", async route => {
      calls++;
      await route.fulfill({
        status: 401, contentType: "application/json",
        body: JSON.stringify({ error: "SESSION_MISSING" }),
      });
    });
    await page.goto("/verify-email#token=" + verificationToken);
    await page.getByRole("button", { name: "Confirm email ownership" }).click();
    await expect(page.locator('main [role="alert"]')).toContainText(/invalid, expired or unavailable/);
    await expect(page.getByRole("button", { name: "Confirm email ownership" })).toHaveCount(0);
    await expect(page).toHaveURL(/\/verify-email$/);
    expect(await page.locator("body").innerText()).not.toContain("SESSION_MISSING");
    expect(calls).toBe(1);
  });
