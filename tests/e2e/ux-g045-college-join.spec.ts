import { expect, test } from "@playwright/test";

test.describe("UX-G045 college join invitation recovery", () => {
  // Invalid tokens are denied before provider/database lookup.
  for (const width of [375, 1280]) {
    test("invalid college link stays usable at " + width + "px", async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/college-join/invalid-token");
      await expect(page.getByRole("heading", { name: "This link is no longer valid" })).toBeVisible();
      await expect(page.getByText("Ask the placement cell for a new one.", { exact: false })).toBeVisible();
      await expect(page.getByRole("button", { name: "Send me a code" })).toHaveCount(0);
      await expect(page.getByLabel("Work email")).toHaveCount(0);

      const signIn = page.getByRole("link", { name: "Sign in" });
      await expect(signIn).toBeVisible();
      const bounds = await signIn.boundingBox();
      expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width + 1);
      await testInfo.attach("college-join-invalid-" + width + "px", {
        body: await page.screenshot({ animations: "disabled" }),
        contentType: "image/png",
      });
      await signIn.click();
      await expect(page).toHaveURL(new RegExp("/login(?:[?]|$)"));
    });
  }

  for (const width of [375, 1280]) {
    test("email correction, resend, and successful join at " + width + "px", async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 800 });
      const sentEmails: string[] = [];
      const joined: Array<Record<string, string>> = [];
      await page.route("**/api/public/join-link/open", route =>
        route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
      await page.route("**/api/public/college-join/send-code", async route => {
        const data = route.request().postDataJSON() as { email: string };
        sentEmails.push(data.email);
        await route.fulfill({
          status: 200, contentType: "application/json",
          body: JSON.stringify({ companyName: sentEmails.length === 1 ? "Wrong Co" : null }),
        });
      });
      await page.route("**/api/public/college-join/join", async route => {
        joined.push(route.request().postDataJSON() as Record<string, string>);
        // A wrong email code must not render a success state.
        await route.fulfill(joined.length === 1
          ? { status: 400, contentType: "application/json", body: JSON.stringify({ error: "WRONG_CODE" }) }
          : { status: 200, contentType: "application/json",
              body: JSON.stringify({ outcome: "JOINED", signInEmail: "recruiter@glowtech.io" }) });
      });

      // Fixture is development-only; it renders the real production form
      // without creating a real token or sending an OTP.
      await page.goto("/e2e/ux-g045-college-join");
      await expect(page.getByRole("heading", { name: "Hire from Example College" })).toBeVisible();
      const email = page.getByRole("textbox", { name: /Work email/ });
      const name = page.getByRole("textbox", { name: /Your name/ });
      await email.fill("invalid-address");
      await page.getByRole("button", { name: "Send me a code" }).click();
      await expect(email).toBeFocused();
      expect(sentEmails).toHaveLength(0);

      await email.fill("recruiter@bluepeak.io");
      await name.fill("Recruiter Example");
      await page.getByRole("button", { name: "Send me a code" }).click();
      const code = page.locator('input[autocomplete="one-time-code"]');
      await expect(code).toBeVisible();
      await expect(code).toBeFocused();
      await expect(page.getByText("You are joining as Wrong Co.")).toBeVisible();
      expect(sentEmails).toEqual(["recruiter@bluepeak.io"]);

      const change = page.getByRole("button", { name: "Change work email" });
      await expect(change).toBeVisible();
      expect((await change.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      await change.click();
      await expect(email).toBeFocused();
      await expect(email).not.toHaveAttribute("readonly");
      await expect(code).toHaveCount(0);
      await expect(page.getByText("You are joining as Wrong Co.")).toHaveCount(0);
      await expect(name).toHaveValue("Recruiter Example");

      await email.fill("recruiter@glowtech.io");
      await page.getByRole("button", { name: "Send me a code" }).click();
      await expect(code).toBeVisible();
      await expect(code).toBeFocused();
      await expect(page.getByRole("textbox", { name: /Company name/ })).toBeVisible();
      await page.getByRole("textbox", { name: /Company name/ }).fill("Glow Tech");
      await code.fill("123456");
      await page.getByRole("button", { name: "Send a new code" }).click();
      await expect(code).toHaveValue("");
      await expect(code).toBeFocused();
      expect(sentEmails).toEqual([
        "recruiter@bluepeak.io", "recruiter@glowtech.io", "recruiter@glowtech.io",
      ]);
      expect(joined).toHaveLength(0);

      await code.fill("111111");
      await page.getByRole("button", { name: "Join Example College placements" }).click();
      await expect(page.getByRole("alert").filter({ hasText: "That code isn't right." }).first()).toBeVisible();
      await expect(code).toBeFocused();
      await expect(page.getByRole("heading", { name: "You now have access to Example College" })).toHaveCount(0);
      expect(joined).toHaveLength(1);

      await code.fill("654321");
      await page.getByRole("button", { name: "Join Example College placements" }).click();
      await expect(page.getByRole("heading", { name: "You now have access to Example College" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
      expect(joined).toHaveLength(2);
      expect(joined[1]).toMatchObject({
        email: "recruiter@glowtech.io", name: "Recruiter Example",
        companyName: "Glow Tech", code: "654321",
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width + 1);
      await testInfo.attach("college-join-complete-" + width + "px", {
        body: await page.screenshot({ animations: "disabled" }),
        contentType: "image/png",
      });
    });
  }
});
