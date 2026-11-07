import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { authenticateGracefulRole, type GracefulRole } from "./support/roles";

const enabled = process.env.E2E_AUTH_ENABLED === "true" && Boolean(process.env.E2E_AUTH_SECRET);
const scenarios: readonly {
 group: string; role: GracefulRole; path: string; heading: RegExp;
}[] = [
 {group:"G132",role:"college",path:"/college/attendance/settings",heading:/Attendance policy/i},
 {group:"G154",role:"superadmin",path:"/admin/projects/templates/new",heading:/Create project template/i},
 {group:"G161",role:"superadmin",path:"/tracker",heading:/What went wrong\?/i},
 {group:"G178",role:"college",path:"/college/people/manage",heading:/(People|Directory|Manage)/i},
 {group:"G184",role:"faculty",path:"/teacher/courses",heading:/My Courses/i},
];

test.describe("UX five-group batch — authenticated viewport smoke and screenshots",()=>{
 test.skip(!enabled,"Requires isolated E2E DB and seeded authenticated roles; never run against production.");
 for(const scenario of scenarios){
  for(const [viewport,width,height] of [["desktop",1280,800],["mobile",390,844]] as const){
   test(`${scenario.group} ${viewport} role surface is readable without document overflow`,async({page,context})=>{
    test.setTimeout(90_000);
    await authenticateGracefulRole(context,scenario.role);
    await page.setViewportSize({width,height});
    await page.goto(scenario.path);
    await expect(page.getByRole("heading",{level:1,name:scenario.heading}).first()).toBeVisible();
    const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
    expect(overflow,`${scenario.group} ${viewport} document overflow`).toBeLessThanOrEqual(2);
    mkdirSync("test-results/ux-five-group", {recursive:true});
    await page.screenshot({path:`test-results/ux-five-group/${scenario.group}-${viewport}.png`,fullPage:true});
   });
  }
 }
 test("G178 learner cannot export the college people directory",async({page,context})=>{
  await authenticateGracefulRole(context,"learner");
  const response=await page.request.get("/api/college/people/export");
  expect([401,403]).toContain(response.status());
  expect(response.headers()["content-type"]??"").not.toContain("text/csv");
 });
});
