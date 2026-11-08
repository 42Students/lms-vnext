import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

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


const roleSeeded = process.env.E2E_AUTH_ENABLED === "true" && Boolean(process.env.E2E_AUTH_SECRET);
test.describe("UX-G048/G122 role-authenticated dashboard and tracker isolation", () => {
  test.skip(!roleSeeded, "Requires seeded disposable PostgreSQL and E2E role identity");
  for (const viewport of [
    {name:"desktop",width:1280,height:800},
    {name:"mobile",width:390,height:844},
  ] as const) {
    test("G048 "+viewport.name+": named Super Admin sees global dashboard without scoped private counts", async ({page,context},info) => {
      await authenticateGracefulRole(context,"superadmin");
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      await page.goto("/dashboard");
      await expect(page.getByRole("heading",{name:"Overview",level:1})).toBeVisible();
      await expect(page.getByRole("navigation",{name:"Platform operations"})).toBeVisible();
      await expect(page.getByRole("link",{name:/Tenant setup/}).first()).toBeVisible();
      await expect(page.getByText("Choose the level you need to operate at.")).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(2);
      await page.screenshot({path:info.outputPath("g048-superadmin-"+viewport.name+".png"),fullPage:true});
    });
    test("G122 "+viewport.name+": named log access, denied learner log access and own reporter recovery",async({page,context},info)=>{
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      await authenticateGracefulRole(context,"superadmin");
      await page.goto("/tracker/logs?environment=INVALID");
      await expect(page.getByRole("heading",{name:"Logs",level:1})).toBeVisible();
      await expect(page.getByText("Invalid log environment.")).toBeVisible();
      await expect(page.getByRole("link",{name:"Reset filter"})).toHaveAttribute("href","/tracker/logs");
      await authenticateGracefulRole(context,"learner");
      await page.goto("/tracker/logs");
      await expect(page.getByRole("heading",{name:"Logs access"})).toBeVisible();
      await expect(page.getByRole("link",{name:"Sign in to view logs"}))
        .toHaveAttribute("href","/login?next=%2Ftracker%2Flogs");
      await expect(page.getByText("What the backend is telling us, and what to do about it.")).toHaveCount(0);
      await page.goto("/tracker/mine");
      await expect(page.getByRole("heading",{name:"My reports"})).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(2);
      await page.screenshot({path:info.outputPath("g122-reporter-"+viewport.name+".png"),fullPage:true});
    });
  }
});
