import { expect, test } from "@playwright/test";

const protectedPaths = [
  { group:"UX-G053", path:"/hr/calendar" },
  { group:"UX-G054", path:"/hr/drives" },
  { group:"UX-G055", path:"/hr/drives/new" },
  { group:"UX-G056", path:"/hr/profile" },
] as const;
const viewports = [
  { name:"desktop", width:1280,height:800 },
  { name:"mobile", width:390,height:844 },
] as const;

/** Security-negative real browser checks: no test recruiter account or private data. */
for (const viewport of viewports) {
  for (const target of protectedPaths) {
    test(target.group+" "+viewport.name+": anonymous route stays outside the HR workspace", async ({page})=>{
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      const errors:string[]=[];
      page.on("pageerror",error=>errors.push(error.message));
      await page.goto(target.path,{waitUntil:"domcontentloaded"});
      // The authenticated layout requires a verified session before mounting
      // the HR shell. It redirects anonymous visitors to the public root/login.
      await expect.poll(()=>new URL(page.url()).pathname,{timeout:15000})
        .toMatch(/^\/(?:login|home)?$/);
      await expect(page.locator('[data-authenticated-canvas="true"]')).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
      expect(errors).toEqual([]);
      await page.screenshot({path:"test-results/ux-hr-five-groups/"+target.group+"-"+viewport.name+".png",fullPage:true});
    });
  }
}
