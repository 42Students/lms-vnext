import { expect, test } from "@playwright/test";

const oldPaths=[
  "/superadmin/projects/templates",
  "/superadmin/projects/templates/new",
  "/superadmin/projects/templates/21fba51e-bd58-4b64-93a3-370ddc01d6a9/overview",
];

test.describe("UX-G088 protected legacy project template bookmarks",()=>{
  test("desktop anonymous browser cannot open create, list or template detail",async({page},info)=>{
    await page.setViewportSize({width:1280,height:800});
    for(const path of oldPaths){
      await page.goto(path);
      await expect(page.locator("#sign-in-content")).toBeVisible();
      const target=new URL(page.url());
      expect(target.origin).toBe("http://localhost:3000");
      expect(["/","/login"]).toContain(target.pathname);
      // The legacy bookmark resolves to a canonical protected Admin URL before sign-in.
      // Require the exact internal destination; an arbitrary return URL is never accepted.
      expect(target.searchParams.get("returnTo")).toBe(path.replace(/^\/superadmin\//, "/admin/").replace(/\/overview$/, ""));
      await expect(page.getByText("Create New Template")).toHaveCount(0);
      await expect(page.getByText("Global project template catalogue")).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    await page.screenshot({path:info.outputPath("superadmin-templates-anonymous-desktop.png"),fullPage:true});
  });
  test("mobile anonymous bookmark shows a responsive sign-in, not a project action",async({page},info)=>{
    await page.setViewportSize({width:320,height:720});
    await page.goto("/superadmin/projects/templates/new?return=https%3A%2F%2Fevil.invalid");
    await expect(page.locator("#sign-in-content")).toBeVisible();
    const dest=new URL(page.url());
    expect(["/","/login"]).toContain(dest.pathname);
    expect(dest.searchParams.get("returnTo")).toBe("/admin/projects/templates/new");
    expect(dest.search).not.toContain("evil.invalid");
    await expect(page.getByText("Create New Template")).toHaveCount(0);
    await expect(page.getByRole("button",{name:/Create template/i})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath("superadmin-templates-anonymous-mobile.png"),fullPage:true});
  });
});
