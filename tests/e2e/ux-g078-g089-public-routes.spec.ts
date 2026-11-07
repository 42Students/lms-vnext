import { expect, test } from "@playwright/test";

/** Public, unauthenticated browser acceptance. No session creation or real OTP. */
for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test("UX-G078 "+viewport.name+": full policy, anchored navigation and legal contact", async ({ page }) => {
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    const errors:string[]=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto("/privacy-policy");
    await expect(page).toHaveURL(/\/privacy-policy$/);
    await expect(page).toHaveTitle(/^Privacy Policy \| 42LMS(?: · 42 LMS)?$/);
    await expect(page.getByRole("heading",{name:"Privacy Policy",level:1})).toBeVisible();
    const links=page.getByRole("navigation",{name:"Privacy policy sections"}).getByRole("link");
    await expect(links).toHaveCount(13);
    const skip=page.getByRole("link",{name:"Skip to policy content"});
    await skip.focus();
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page).toHaveURL(/\/privacy-policy#overview$/);
    await expect(page.getByRole("heading",{name:"1. Overview"})).toBeVisible();
    await expect(page.getByRole("link",{name:"privacy@42lms.com"}).first())
      .toHaveAttribute("href","mailto:privacy@42lms.com");
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute("href","https://42lms.com/privacy-policy");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
    expect(errors).toEqual([]);
  });

  test("UX-G089 "+viewport.name+": retired Super Admin bookmark reaches safe OTP entry", async ({ page }) => {
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    const errors:string[]=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto("/superadmin-login",{waitUntil:"domcontentloaded"});
    await expect(page).toHaveURL(/\/login\?legacy=superadmin$/);
    await expect(page.locator('main[data-legacy-superadmin="true"]')).toBeVisible();
    await expect(page).toHaveTitle("Superadmin - 42 LMS");
    await expect(page.getByRole("navigation",{name:"Sign-in footer"}).getByRole("link",{name:"Privacy Policy"}))
      .toHaveAttribute("href","/assets/static/privacy-policy-view.html");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
    expect(errors).toEqual([]);
  });
}
