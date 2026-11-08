import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { authenticateGracefulRole, type GracefulRole } from "./support/roles";

const enabled = process.env.E2E_AUTH_ENABLED === "true" && Boolean(process.env.E2E_AUTH_SECRET);
const journeys: readonly {role: GracefulRole; route: string; title: string; label: string}[] = [
  {role:"college",route:"/college/batches",title:"Batches",label:"batches"},
  {role:"college",route:"/college/semesters",title:"Semesters",label:"semesters"},
  {role:"college",route:"/college/academics",title:"Academics",label:"academic-workspace"},
  {role:"college",route:"/college/classes",title:"Classes & Sections",label:"class-directory"},
  {role:"college",route:"/college/lecture-halls",title:"Lecture Halls",label:"lecture-halls"},
  {role:"college",route:"/college/batch-promotion",title:"Batch Promotion",label:"batch-promotion"},
  {role:"learner",route:"/learn/calendar",title:"Class Schedule",label:"learner-calendar"},
];

test.describe("UX-G125 academic create, directory and schedule viewport acceptance", () => {
  test.skip(!enabled, "Requires disposable E2E PostgreSQL, seeded roles and E2E_AUTH_SECRET");
  for(const scenario of journeys){
    for(const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
      test(`${scenario.label}: ${viewport.name} authenticated surface loads without document overflow`,async({page,context})=>{
        test.setTimeout(90_000);
        await authenticateGracefulRole(context,scenario.role);
        await page.setViewportSize({width:viewport.width,height:viewport.height});
        await page.goto(scenario.route);
        await expect(page.getByRole("heading",{level:1,name:scenario.title})).toBeVisible();
        const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
        expect(overflow,`${scenario.label}: ${viewport.name} horizontal overflow`).toBeLessThanOrEqual(2);
        mkdirSync("test-results/ux-g125",{recursive:true});
        await page.screenshot({path:`test-results/ux-g125/${scenario.label}-${viewport.name}.png`,fullPage:true});
      });
    }
  }
  test("an academic empty-state deep link reveals its collapsed creation form and focuses the summary",async({page,context})=>{
    await authenticateGracefulRole(context,"college");
    await page.goto("/college/academics");
    await page.locator("#academic-create-program").waitFor();
    await page.evaluate(()=>{document.getElementById("academic-create-program")?.removeAttribute("open");});
    await page.evaluate(()=>{window.location.hash="#academic-create-program";});
    await expect(page.locator("#academic-create-program")).toHaveAttribute("open",/^(|open)$/);
    await expect(page.locator("#academic-create-program summary")).toBeFocused();
  });
  test("learner cannot export the college's private batch directory",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    const response=await page.request.get("/api/academics/college-academic-export/batches");
    expect([401,403]).toContain(response.status());
    expect(response.headers()["content-type"]??"").not.toContain("text/csv");
  });
});
