import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const sizes=[{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const;
const overflow=async(page:import("@playwright/test").Page)=>
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);

test.describe("UX G025/G036/G044/G087/G097 scoped role and tenant route journeys",()=>{
  test.skip(!enabled,"Requires seeded, disposable PostgreSQL and E2E auth.");

  for(const size of sizes){
    test(`G044 ${size.name}: active College Admin legacy department and program bookmarks`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"college");
      await page.setViewportSize(size);
      for(const [oldPath,canonical] of [
        ["/college-admin/departments","/college/departments"],
        ["/college-admin/programs","/college/programs"],
      ] as const){
        await page.goto(oldPath,{waitUntil:"commit"});
        await expect(page).toHaveURL(`http://localhost:3000${canonical}`);
        await expect(page.locator("main").first()).toBeVisible();
        await overflow(page);
      }
      await page.screenshot({path:info.outputPath(`G044-authorized-${size.name}.png`),fullPage:true});
    });

    test(`G044 ${size.name}: Learner cannot use College Admin aliases`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize(size);
      for(const legacy of ["/college-admin/departments","/college-admin/programs"]){
        await page.goto(legacy,{waitUntil:"commit"});
        // Both legacy aliases must converge on the explicitly denied dashboard,
        // rather than merely not reaching an expected editor URL.
        await expect(page).toHaveURL(/\/dashboard(?:[?#]|$)/);
        await expect(page.getByRole("heading",{name:/College departments|Manage programs/i})).toHaveCount(0);
        await overflow(page);
      }
      await page.screenshot({path:info.outputPath(`G044-denied-${size.name}.png`),fullPage:true});
    });

    test(`G087 ${size.name}: global Super Admin bookmark preserves only allowlisted query`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"superadmin");
      await page.setViewportSize(size);
      await page.goto("/superadmin/programs?employeeId=other&q=Science&page=2&pageSize=10&collegeId=foreign&return=https%3A%2F%2Fevil.invalid",{waitUntil:"commit"});
      await expect(page).toHaveURL(/\/admin\/programs(?:[?#]|$)/);
      const destination=new URL(page.url());
      expect(destination.pathname).toBe("/admin/programs");
      expect(destination.searchParams.get("q")).toBe("Science");
      expect(destination.searchParams.get("page")).toBe("2");
      expect(destination.searchParams.get("pageSize")).toBe("10");
      expect(destination.searchParams.has("collegeId")).toBe(false);
      expect(destination.searchParams.has("employeeId")).toBe(false);
      expect(destination.searchParams.has("return")).toBe(false);
      await overflow(page);
      await page.screenshot({path:info.outputPath(`G087-bookmark-${size.name}.png`),fullPage:true});
    });

    test(`G087 ${size.name}: non-Super Admin cannot enter elevated legacy directory`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize(size);
      await page.goto("/superadmin/programs?q=foreign&collegeId=other",{waitUntil:"commit"});
      await expect(page).toHaveURL(/\/dashboard(?:[?#]|$)/);
      await expect(page.getByRole("button",{name:/create program/i})).toHaveCount(0);
      await overflow(page);
      await page.screenshot({path:info.outputPath(`G087-role-negative-${size.name}.png`),fullPage:true});
    });

    test(`G025 ${size.name}: Super Admin tenant invalid filters remain recoverable`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"superadmin");
      await page.setViewportSize(size);
      await page.goto("/admin/tenants/setup?tab=NOT_A_STEP&q=forged&collegeId=foreign&return=https%3A%2F%2Fevil.invalid");
      await expect(page.getByText("Invalid tenant setup filters")).toBeVisible();
      await expect(page.getByRole("link",{name:"Clear filters"})).toHaveAttribute("href","/admin/tenants/setup");
      await expect(page.locator("body")).not.toContainText("Platform-wide private user record");
      await overflow(page);
      await page.screenshot({path:info.outputPath(`G025-filters-${size.name}.png`),fullPage:true});
    });

    test(`G025 ${size.name}: Learner cannot configure tenants`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize(size);
      await page.goto("/admin/tenants/setup");
      await expect(page.getByText("Access denied. You are not authorized to access Superadmin.")).toBeVisible();
      await expect(page.getByRole("button",{name:/create college|create organization/i})).toHaveCount(0);
      await overflow(page);
      await page.screenshot({path:info.outputPath(`G025-denied-${size.name}.png`),fullPage:true});
    });

    test(`G036 ${size.name}: College Admin placement directory has scoped filter recovery`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"college");
      await page.setViewportSize(size);
      await page.goto("/college/placements/drives?page=not-a-page");
      const content=page.locator("body");
      await expect(content).toContainText(/Invalid drive filters|Placements unavailable/);
      await expect(page.getByRole("button",{name:/Create Job/i})).toHaveCount(0);
      await overflow(page);
      await page.screenshot({path:info.outputPath(`G036-filter-${size.name}.png`),fullPage:true});
    });

    test(`G036 ${size.name}: Learner cannot see college placement management`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize(size);
      await page.goto("/college/placements/drives",{waitUntil:"commit"});
      await expect(page).toHaveURL(/\/dashboard(?:[?#]|$)/);
      await expect(page.getByRole("button",{name:/Create Job/i})).toHaveCount(0);
      await overflow(page);
      await page.screenshot({path:info.outputPath(`G036-denied-${size.name}.png`),fullPage:true});
    });

    test(`G097 ${size.name}: invalid Faculty attempt section never loads private learner data`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"faculty");
      await page.setViewportSize(size);
      await page.goto("/teacher/report/quiz/10000000-0000-4000-8000-000000000001/attempts?deliveryId=invalid-section");
      await expect(page.getByText("Invalid quiz attempt filters")).toBeVisible();
      await expect(page.getByText("No learner attempt details were loaded.",{exact:false})).toBeVisible();
      await expect(page.getByRole("link",{name:"Choose a Quiz again"})).toHaveAttribute("href","/teacher/allQuizzes");
      await overflow(page);
      await page.screenshot({path:info.outputPath(`G097-invalid-${size.name}.png`),fullPage:true});
    });
  }
});
