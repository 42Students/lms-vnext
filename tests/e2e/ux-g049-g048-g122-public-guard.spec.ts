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
    for(const path of ["/dashboard","/tracker/mine","/tracker/mine/LMS-1234","/tracker/logs"]) {
      await page.goto(path,{waitUntil:"domcontentloaded"});
      const body=await page.locator("body").innerText();
      expect(body).not.toContain("Tracked private issue example");
      expect(body).not.toContain("Named Super Admin access");
      await expect(page.locator('[aria-label="Dashboard summary metrics"]')).toHaveCount(0);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
  });
}
