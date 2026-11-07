import { expect, test } from "@playwright/test";

const token = "BrowserRecruiterInvitationToken_2026_November";

test.describe("UX-G047 private company applicant share", () => {
  test("invalid share never displays applicant rows or a usable code form, on desktop and mobile", async ({ page }, info) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/company-share/invalid-test-token");
    await expect(page.getByRole("heading", {name: /We couldn't load this share|This link is not valid any more\./i})).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noarchive/);
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
    await expect(page.getByRole("button", { name: "Open the list" })).toHaveCount(0);
    await expect(page.getByRole("table")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("company-share-invalid-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 320, height: 720 });
    await expect(page.getByRole("heading", {name: /We couldn't load this share|This link is not valid any more\./i})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("company-share-invalid-mobile.png"), fullPage: true });
  });
});

test.describe("UX-G083 pending recruiter invitations", () => {
  test("unauthenticated browser cannot see the private invitation list", async ({ page }, info) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/recruiter-invitations");
    await expect.poll(() => new URL(page.url()).searchParams.get("returnTo")).toBe("/recruiter-invitations");
    const destination = new URL(page.url());
    expect(["/", "/login"]).toContain(destination.pathname);
    expect(destination.searchParams.get("returnTo")).toBe("/recruiter-invitations");
    await expect(page.locator("#sign-in-content")).toBeVisible();
    await expect(page.getByRole("heading", {name: "Server Error"})).toHaveCount(0);
    await expect(page.getByRole("heading", {name: "Recruiter invitations"})).toHaveCount(0);
    await expect(page.getByText("Pending college invitations")).toHaveCount(0);
    await expect(page.getByRole("button", {name: "Accept"})).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("pending-invitations-anonymous-mobile.png"), fullPage: true });
  });
});

test.describe("UX-G084 canonical recruiter invitation", () => {
  test("invalid invitation shows safe recovery on a narrow phone", async ({ page }, info) => {
    await page.route("**/api/public/recruiter-invite/**", async route => {
      if (route.request().method() === "GET") {
        await route.fulfill({status: 410,contentType: "application/json",body: JSON.stringify({error: "INVITE_NOT_FOUND"})});
      } else {
        await route.fulfill({status: 403,contentType: "application/json",body: "{}"});
      }
    });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/recruiter-invite/" + token);
    await expect(page.getByRole("heading", {name: "This link is no longer valid"})).toBeVisible();
    await expect(page.getByRole("link", {name: "Sign in"})).toHaveAttribute("href", "/login");
    await expect(page.getByRole("button", {name: "Send me a code"})).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noarchive/);
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("recruiter-invalid-mobile.png"), fullPage: true });
  });

  test("OTP completion waits for server-attested pending consent; code input gets focus", async ({ page }, info) => {
    const posted: string[] = [];
    await page.route("**/api/public/recruiter-invite/**", async route => {
      const request=route.request();
      const pathname=new URL(request.url()).pathname;
      if (request.method()==="GET") {
        await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({invite:{
          collegeName:"Example College",companyName:"Example Employer",
          contactName:"Recruiter Example",contactEmail:"recruiter@example.org",
          designation:"Hiring Manager",expiresAt:"2027-01-01T00:00:00.000Z"
        }})});
        return;
      }
      posted.push(pathname);
      if (pathname.endsWith("/opened")) {
        await route.fulfill({status:200,contentType:"application/json",body:"{}"});
      } else if (pathname.endsWith("/send-code")) {
        await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({sent:true})});
      } else if (pathname.endsWith("/accept")) {
        await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
          accepted:true,outcome:"PENDING_CONSENT",status:"PENDING_HR",signInEmail:"recruiter@example.org"
        })});
      } else {
        await route.fulfill({status:403,contentType:"application/json",body:"{}"});
      }
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/recruiter-invite/" + token);
    await expect(page.getByRole("heading", {name:"Example College would like you to hire from their students"})).toBeVisible();
    await expect(page.getByRole("button", {name:"Send me a code"})).toBeEnabled();
    await page.screenshot({path:info.outputPath("recruiter-ready-desktop.png"),fullPage:true});
    await page.getByRole("button", {name:"Send me a code"}).click();
    await expect(page.locator("#invite-code")).toBeVisible();
    await expect(page.locator("#invite-code")).toBeFocused();
    await page.locator("#invite-code").fill("123456");
    await page.getByRole("button", {name:"Join Example College placements"}).click();
    await expect(page.getByText("Your invitation is awaiting your account sign-in.")).toBeVisible();
    await expect(page.getByRole("link", {name:"Sign in"})).toBeVisible();
    expect(posted.some(p=>p.endsWith("/send-code"))).toBe(true);
    expect(posted.some(p=>p.endsWith("/accept"))).toBe(true);
    await page.screenshot({path:info.outputPath("recruiter-pending-consent-desktop.png"),fullPage:true});
  });
});
