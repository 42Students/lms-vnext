import { expect, test } from "@playwright/test";

for (const viewport of [
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const) {
  test("UX-G049 "+viewport.name+": retired test sign-in never creates a session",async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    const errors:string[]=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto("/e2e/superadmin-login?phone=9876543210");
    await expect(page.getByText("This link no longer creates a Super Admin session.")).toBeVisible();
    await expect(page.getByRole("link",{name:"Continue to secure sign-in"}))
      .toHaveAttribute("href","/login");
    await expect(page.getByRole("link",{name:"Back to home"})).toHaveAttribute("href","/home");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/i);
    await expect(page.locator("body")).not.toContainText("9876543210");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
    expect(errors).toEqual([]);
  });
  test("UX-G048/G122 "+viewport.name+": anonymous users cannot read dashboard or private tracker",async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    // Next.js may abort a navigation while the authenticated parent redirects
    // a missing session. Test each unauthorized HTTP response independently.
    for(const path of ["/dashboard","/tracker/mine","/tracker/mine/LMS-1234","/tracker/logs"]) {
      const response=await page.request.get(path,{maxRedirects:5});
      const body=await response.text();
      expect(body).not.toContain("Tracked private issue example");
      expect(body).not.toContain("Platform logs · Named Super Admin access");
      expect(body).not.toContain('aria-label="Dashboard summary metrics"');
      expect(body).not.toContain('data-authenticated-canvas="true"');
    }
    await page.goto("/login");
    await expect(page.locator("main").first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
  });
}
