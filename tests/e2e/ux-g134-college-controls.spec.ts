import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { authenticateGracefulRole } from "./support/roles";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const journeys=[
  {route:"/college/students/register",heading:"Register students",label:"register-student"},
  {route:"/college/faculty-assignment",heading:"Faculty Assignment",label:"faculty-assignments"},
  {route:"/college/profile",heading:"Profile",label:"college-profile"},
  {route:"/college/people/manage",heading:"People Directory",label:"people-directory"},
] as const;

test.describe("UX-G134 scoped college controls and responsive recovery",()=>{
  test.skip(!enabled,"Requires disposable E2E PostgreSQL and ephemeral college identities");
  for(const journey of journeys){
    for(const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const){
      test(`${journey.label}: ${viewport.name} authenticated and usable without page-level overflow`,async({page,context})=>{
        test.setTimeout(90_000);
        await authenticateGracefulRole(context,"college");
        await page.setViewportSize({width:viewport.width,height:viewport.height});
        await page.goto(journey.route);
        await expect(page.getByRole("heading",{name:journey.heading,level:1}).first()).toBeVisible();
        const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
        expect(overflow,`${journey.label} ${viewport.name} overflow`).toBeLessThanOrEqual(2);
        mkdirSync("test-results/ux-g134",{recursive:true});
        await page.screenshot({path:`test-results/ux-g134/${journey.label}-${viewport.name}.png`,fullPage:true});
      });
    }
  }
  test("invalid student registration stays on the form and announces required fields",async({page,context})=>{
    await authenticateGracefulRole(context,"college");
    await page.goto("/college/students/register");
    await page.getByRole("button",{name:"Register student"}).click();
    await expect(page.getByText("Check the highlighted fields before registering.")).toBeVisible();
    await expect(page.getByText("Enter the first name")).toBeVisible();
  });
  test("learner cannot open the college-admin profile editor",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    await page.goto("/college/profile");
    await expect(page).toHaveURL(/\\/learn\\/profile(?:[?#]|$)/);
    await expect(page.getByRole("heading",{level:1,name:"Profile"})).toBeVisible();
    await expect(page.getByRole("button",{name:/Save.*contacts/i})).toHaveCount(0);
  });
  test("learner cannot export a college-wide people directory",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    const response=await page.request.get("/api/college/people/export");
    expect([401,403]).toContain(response.status());
    expect(response.headers()["content-type"]??"").not.toContain("text/csv");
  });
});
