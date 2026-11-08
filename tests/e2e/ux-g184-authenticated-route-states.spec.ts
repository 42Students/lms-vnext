import { expect, test } from "@playwright/test";

const roles=[
  {name:"admin",home:"/admin/tenants",states:["error","loading","not-found"]},
  {name:"college-admin",home:"/college",states:["not-found"]},
  {name:"hr",home:"/hr",states:["error","loading","not-found"]},
  {name:"teach",home:"/teach/courses",states:["error","loading","not-found"]},
  {name:"teacher",home:"/teacher/courses",states:["error","loading","not-found"]},
] as const;

const loadingLabel:Record<string,string>={
  admin:"Loading administration workspace…",
  hr:"Loading recruiter workspace…",
  teach:"Loading teaching workspace...",
  teacher:"Loading teaching courses…",
};

for(const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const) {
  for(const role of roles) {
    for(const state of role.states){
      test(`${viewport.name} ${role.name} ${state} keeps correct recovery and no private diagnostics`,async({page},info)=>{
        await page.setViewportSize(viewport);
        const sent:string[]=[];
        await page.route("**/api/client-errors",async route=>{
          sent.push(route.request().postData()??"");
          await route.fulfill({status:204,body:""});
        });
        await page.goto(`/e2e/ux-g184-authenticated-states?role=${role.name}&state=${state}`);
        await expect(page.getByRole("heading",{level:1,name:"Authenticated route state acceptance"})).toBeVisible();
        const region=page.getByRole("region",{name:`${role.name} ${state} preview`});
        await expect(region).toBeVisible();
        if(state==="error"){
          await expect(region.getByRole("alert")).toContainText("This page is temporarily unavailable");
          await expect(region.getByRole("link",{name:"Go to home"})).toHaveAttribute("href",role.home);
          await region.getByRole("button",{name:"Try again"}).click();
          await expect(region.getByRole("status").filter({hasText:"Safe retry count: 1"})).toBeVisible();
          await expect(region).not.toContainText("PRIVATE_SENTINEL_DONT_RENDER");
          await expect(region).not.toContainText("SECRET_NEXT_DIGEST");
        }else if(state==="loading"){
          const busy=region.locator('[data-slot="graceful-page-loading"]');
          await expect(busy).toHaveAttribute("aria-busy","true");
          await expect(busy.getByRole("status")).toHaveText(loadingLabel[role.name]);
        }else{
          await expect(region.getByRole("heading",{name:"Page not found"})).toBeVisible();
          if(role.name==="admin") {
            await expect(region.getByRole("link",{name:"Go to Tenant Setup"})).toHaveAttribute("href",role.home);
          }else {
            await expect(region.getByRole("link",{name:"Go to home"})).toHaveAttribute("href",role.home);
          }
        }
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
        await page.screenshot({path:info.outputPath(`${role.name}-${state}-${viewport.name}.png`),fullPage:true});
        expect(sent.every(body=>!body.includes("PRIVATE_SENTINEL_DONT_RENDER")&&!body.includes("SECRET_NEXT_DIGEST"))).toBe(true);
      });
    }
  }
}
test("delayed admin loading offers an accessible retry rather than an indefinite skeleton",async({page})=>{
  await page.goto("/e2e/ux-g184-authenticated-states?role=admin&state=loading");
  const busy=page.getByRole("region",{name:"admin loading preview"});
  await expect(busy.getByRole("status").filter({hasText:"This is taking longer than expected"})).toBeVisible({timeout:16_000});
  await expect(busy.getByRole("button",{name:"Try again"})).toBeVisible();
});
// The development-only witness must not become a public entry point or a way
// to select unapproved role/state combinations.
test("invalid or unsupported role-state preview combinations fail closed",async({request})=>{
  for(const query of [
    "role=admin&state=unknown",
    "role=unknown&state=error",
    "role=college-admin&state=loading",
  ]) {
    const result=await request.get("/e2e/ux-g184-authenticated-states?"+query);
    const html=await result.text();
    // App Router can stream a notFound() boundary with HTTP 200 once an outer
    // layout has begun streaming. Require semantic 404 evidence regardless of
    // transport status, and never let an invalid role reach our fixture UI.
    if(result.status()!==404) {
      expect(result.status()).toBe(200);
      expect(html).toMatch(/NEXT_HTTP_ERROR_FALLBACK;404|This page could not be found\.|<title>404/);
    }
    expect(html).not.toContain("Authenticated route state acceptance");
    expect(html).not.toContain("Development-only display of the real, role-specific route-state component");
  }
});
