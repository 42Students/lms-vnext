import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {SEED_IDS} from "../../scripts/db-seed-data";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const origin="http://localhost:3000";
const jobId="66000000-0000-4000-8000-000000000004";
const roundId="66000000-0000-4000-8000-000000000005";
const title="E2E Prototype Software Engineer";

test.describe("UX-G015: college-scoped placement operations and interview route acceptance",()=>{
 test.skip(!enabled,"Requires disposable seeded E2E DB, no production account shortcuts");
 for(const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const){
  test(`Super Admin sees seeded job, interview and settings without scope leakage on ${viewport.name}`,async({page,context},info)=>{
   test.setTimeout(180_000);
   await authenticateGracefulRole(context,"superadmin");
   await page.setViewportSize(viewport);
   const chosen=await context.request.post(origin+"/api/auth/admin-scope",{
    headers:{origin},data:{kind:"college",collegeId:SEED_IDS.collegeA},
   });
   expect(chosen.status(),"Selected college authorization must be server verified").toBe(200);

   await page.goto("/admin/placements/drives");
   await expect(page.getByRole("heading",{name:"Jobs Management (LMS)",level:1})).toBeVisible();
   await expect(page.getByText(title).first()).toBeVisible();

   await page.goto("/admin/placements/hiring?q=E2E");
   await expect(page).toHaveURL(/\/admin\/placements\/analytics\?q=E2E/);

   await page.goto("/admin/placements/interviews");
   await expect(page.getByRole("heading",{name:"Interviews",level:1})).toBeVisible();

   await page.goto("/admin/placements/interviews/"+roundId);
   await expect(page.getByRole("heading",{name:"Technical interview",level:1})).toBeVisible();
   await expect(page.getByText("Round ID")).toBeVisible();
   await expect(page.getByRole("link",{name:"Back to directory"}))
     .toHaveAttribute("href","/admin/placements/interviews");

   await page.goto("/admin/placements/job-settings");
   await expect(page.getByRole("heading",{name:"Placement Job Settings",level:1})).toBeVisible();

   await page.goto("/admin/placements/job-settings/"+jobId);
   await expect(page.getByRole("heading",{name:title,level:1})).toBeVisible();
   await expect(page.getByText("Minimum CGPA")).toBeVisible();
   await expect(page.getByRole("link",{name:"Back to directory"}))
     .toHaveAttribute("href","/admin/placements/job-settings");
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(2);
   await page.screenshot({path:info.outputPath("g015-job-policy-"+viewport.name+".png"),fullPage:true});

   await page.goto("/admin/placements/job-settings/not-a-uuid");
   await expect(page.getByText(title)).toHaveCount(0);
  });

  test(`Learner cannot read Super Admin drives or privileged interview details on ${viewport.name}`,async({page,context})=>{
   await authenticateGracefulRole(context,"learner");
   await page.setViewportSize(viewport);
   for(const href of ["/admin/placements/drives","/admin/placements/interviews/"+roundId]){
    await page.goto(href,{waitUntil:"domcontentloaded"});
    await expect(page.getByText(title)).toHaveCount(0);
    await expect(page.getByText("Technical interview")).toHaveCount(0);
    await expect(page.getByRole("button",{name:/Archive job|Manage jobs/i})).toHaveCount(0);
   }
  });
 }
});
