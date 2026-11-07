import { expect, test, type BrowserContext, type Page } from "@playwright/test";
const origin = "http://localhost:3000";
const qaCode = "135790";

async function noOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

async function signInWithSeededFirstPartySession(context: BrowserContext) {
  // Dev-only allowlisted OTP; the action creates a real disposable DB-backed
  // device session and never bypasses request/role/tenant authorization.
  const start = await context.request.post("/api/auth/login/start", {
    headers: { Origin: origin },
    data: { channel: "EMAIL", contact: "superadmin.seed@example.com" },
  });
  expect(start.status(), "seeded QA OTP start").toBe(200);
  const body = await start.json() as {attemptId:string};
  expect(body.attemptId).toMatch(/^[0-9a-f-]{36}$/i);
  const verify = await context.request.post("/api/auth/login/verify", {
    headers: { Origin: origin },
    data: { attemptId: body.attemptId, code: qaCode, secondCode: qaCode },
  });
  expect(verify.status(), "seeded QA OTP verify").toBe(200);
  const result = await verify.json() as {ok:boolean};
  expect(result.ok).toBe(true);
}

test.describe("UX-G067 direct secure sign-in", () => {
  test("320px expired session offers accessible OTP entry and a safe return destination", async ({page}) => {
    await page.setViewportSize({width:320,height:780});
    await page.goto("/login?auth=revoked&returnTo=%2Faccount%2Fsecurity");
    await expect(page.locator('#sign-in-content [role="alert"]').first()).toContainText("Your session was ended");
    const fresh=page.getByRole("link",{name:"Start a fresh sign-in"});
    await expect(fresh).toHaveAttribute("href",/returnTo=%2Faccount%2Fsecurity/);
    await fresh.focus();
    await expect(fresh).toBeFocused();
    expect(await noOverflow(page)).toBe(true);
    await page.screenshot({path:"test-results/ux-g067-login-phone-320.png",fullPage:true});
  });
  test("1280px dedicated OTP page has branded form and noindex robots",async ({page}) => {
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/login");
    await expect(page.locator("#sign-in-content")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
    await expect(page.getByRole("link",{name:"Skip to sign in"})).toHaveAttribute("href","#sign-in-content");
    expect(await noOverflow(page)).toBe(true);
    await page.screenshot({path:"test-results/ux-g067-login-desktop-1280.png",fullPage:true});
  });
});

test.describe("UX-G003 account device-security real sign-in", () => {
  test.describe.configure({mode:"serial"});
  test("390px real first-party session renders own device and accessible session management", async ({page,context}) => {
    await signInWithSeededFirstPartySession(context);
    await page.setViewportSize({width:390,height:844});
    await page.goto("/account/security");
    await expect(page.getByRole("heading",{name:"Signed-in devices"})).toBeVisible();
    await expect(page.getByText("Only this account's active sign-ins are shown.",{exact:false})).toBeVisible();
    await expect(page.getByText("This device",{exact:true})).toBeVisible();
    const signOut=page.getByRole("button",{name:/Sign out this device:/});
    await expect(signOut).toBeVisible();
    await signOut.focus();
    await expect(signOut).toBeFocused();
    const response = await context.request.get("/api/auth/devices");
    expect(response.status()).toBe(200);
    const json=await response.json() as {devices:Array<{current:boolean}>};
    expect(json.devices.some(d=>d.current)).toBe(true);
    expect(await noOverflow(page)).toBe(true);
    await page.screenshot({path:"test-results/ux-g003-devices-mobile-390.png",fullPage:true});
  });

  test("1280px real other-device revocation leaves current session active",async ({browser,page,context}) => {
    const other=await browser.newContext({baseURL:origin});
    try{
      await signInWithSeededFirstPartySession(context);
      await signInWithSeededFirstPartySession(other);
      await page.setViewportSize({width:1280,height:800});
      await page.goto("/account/security");
      await expect(page.getByRole("heading",{name:"Signed-in devices"})).toBeVisible();
      const disclosure=page.locator("details").filter({hasText:"Sign out everywhere else"}).first();
      await disclosure.locator("summary").click();
      await disclosure.getByRole("button",{name:"Sign out everywhere else"}).click();
      const dialog=page.getByRole("alertdialog");
      await expect(dialog).toContainText("This device stays signed in");
      await dialog.getByRole("button",{name:"Sign out everywhere else"}).click();
      await expect(page.getByRole("button",{name:"Sign out this device",exact:false})).toBeVisible();
      expect((await context.request.get("/api/auth/devices")).status()).toBe(200);
      expect((await other.request.get("/api/auth/devices")).status()).toBe(401);
      expect(await noOverflow(page)).toBe(true);
      await page.screenshot({path:"test-results/ux-g003-devices-desktop-1280.png",fullPage:true});
    }finally {await other.close();}
  });

  test("anonymous device list is blocked instead of displaying previous user's sessions",async ({page})=>{
    await page.goto("/account/security");
    await expect(page.getByRole("heading",{name:"Signed-in devices"})).toHaveCount(0);
    expect((await page.request.get("/api/auth/devices")).status()).toBe(401);
  });
});
