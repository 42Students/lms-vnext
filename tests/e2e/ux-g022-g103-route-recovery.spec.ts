import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

test.describe("UX-G022/G103 project-template and TPO route recovery", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED!=="true",
    "Requires isolated seeded authenticated browser database");

  test("desktop Super Admin create entry retains authorized template form", async ({page,context}) => {
    await authenticateGracefulRole(context,"superadmin");
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/admin/projects/templates/new");
    await expect(page.getByRole("heading",{name:"Create project template",level:1})).toBeVisible();
    await expect(page.getByRole("region",{name:"Project template form"})).toBeVisible();
    await page.screenshot({path:"test-results/ux-g022-superadmin-desktop.png",fullPage:true});
  });

  test("mobile template create cannot disclose the form to a learner",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    await page.setViewportSize({width:390,height:844});
    await page.goto("/admin/projects/templates/new");
    await expect(page.getByRole("region",{name:"Project template form"})).toHaveCount(0);
    await page.screenshot({path:"test-results/ux-g022-learner-mobile-negative.png",fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  });

  test("TPO finder keeps ambiguous search from executing and offers a clean reset",async({page,context})=>{
    await authenticateGracefulRole(context,"tpo");
    await page.setViewportSize({width:390,height:844});
    await page.goto("/tpo/find?q=student&q=company");
    await expect(page.getByRole("alert")).toContainText("Search must contain");
    await page.getByRole("link",{name:"Clear invalid search"}).click();
    await expect(page.getByRole("searchbox",{name:/Record name/})).toHaveValue("");
    await page.screenshot({path:"test-results/ux-g103-find-mobile.png",fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  });

  test("TPO follow-up errors do not silently broaden an invalid scope",async({page,context})=>{
    await authenticateGracefulRole(context,"tpo");
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/tpo/follow-ups?scope=FORGED&window=NEXT_7_DAYS");
    await expect(page.getByText("Invalid follow-up filters.")).toBeVisible();
    await expect(page.getByRole("link",{name:"Clear filters"})).toBeVisible();
    await expect(page.getByRole("region",{name:"Follow-up ownership"})).toHaveCount(0);
    await page.screenshot({path:"test-results/ux-g103-followups-desktop.png",fullPage:true});
  });

  test("TPO home rejects repeated season selection and recovers without guessing",async({page,context})=>{
    await authenticateGracefulRole(context,"tpo");
    await page.setViewportSize({width:390,height:844});
    await page.goto("/tpo/home?seasonId=one&seasonId=two");
    await expect(page.getByText("Invalid placement home filters")).toBeVisible();
    await page.getByRole("link",{name:"Clear home filters"}).click();
    await expect(page).toHaveURL(/\/tpo\/home$/);
    await page.screenshot({path:"test-results/ux-g103-home-mobile.png",fullPage:true});
  });
});
