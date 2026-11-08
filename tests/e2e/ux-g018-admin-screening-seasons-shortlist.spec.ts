import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {SEED_IDS} from "../../scripts/db-seed-data";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const pendingApplicationId="66000000-0000-4000-8000-000000000011";
const shortlistedApplicationId="66000000-0000-4000-8000-000000000008";
const origin="http://localhost:3000";

test.describe("UX-G018: scoped screening, seasons and shortlist directories and details",()=>{
 test.skip(!enabled,"Requires disposable PG and real seeded role sessions");
 for(const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const){
  test(`Super Admin opens all six scoped screening/season/shortlist surfaces on ${viewport.name}`,async({page,context},info)=>{
   test.setTimeout(180_000);
   await authenticateGracefulRole(context,"superadmin");
   await page.setViewportSize(viewport);
   const selected=await context.request.post(origin+"/api/auth/admin-scope",{
    headers:{origin},data:{kind:"college",collegeId:SEED_IDS.collegeA}});
   expect(selected.status()).toBe(200);
   const routes=[
    {href:"/admin/placements/screenings",heading:"Application Screening Queue"},
    {href:"/admin/placements/screenings/"+pendingApplicationId,heading:"Applicant screening"},
    {href:"/admin/placements/seasons",heading:"Placement Seasons"},
    {href:"/admin/placements/seasons/"+SEED_IDS.placementSeasonA,heading:null},
    {href:"/admin/placements/shortlisted",heading:"Shortlisted Applicants"},
    {href:"/admin/placements/shortlisted/"+shortlistedApplicationId,heading:null},
   ];
   for(const [i,item] of routes.entries()){
    const response=await page.goto(item.href);
    expect(response?.status(),item.href).toBeLessThan(400);
    await expect(page.getByRole("heading",{level:1,name:item.heading??undefined}).first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth),
      item.href+" overflow").toBeLessThanOrEqual(2);
    await page.screenshot({path:info.outputPath("g018-"+i+"-"+viewport.name+".png"),fullPage:true});
   }
   await page.goto("/admin/placements/screenings/"+pendingApplicationId);
   await expect(page.getByText("Automated scoring was intentionally retired.")).toHaveCount(0);
   await expect(page.getByText(/Protected attributes are not used/)).toBeVisible();
   await expect(page.getByText("Privacy")).toBeVisible();

   await page.goto("/admin/placements/shortlisted/"+shortlistedApplicationId);
   await expect(page.getByText("Internal screening reason and recruiter notes are withheld")).toBeVisible();

   await page.goto("/admin/placements/seasons/not-valid");
   await expect(page.getByText("Season ID")).toHaveCount(0);
  });

  test(`Learner cannot view screening or shortlist records on ${viewport.name}`,async({page,context})=>{
   await authenticateGracefulRole(context,"learner");
   await page.setViewportSize(viewport);
   for(const href of ["/admin/placements/screenings/"+pendingApplicationId,
    "/admin/placements/shortlisted/"+shortlistedApplicationId,
    "/admin/placements/seasons/"+SEED_IDS.placementSeasonA]){
    await page.goto(href,{waitUntil:"domcontentloaded"});
    await expect(page.getByText("Application ID")).toHaveCount(0);
    await expect(page.getByText("Internal screening reason and recruiter notes are withheld")).toHaveCount(0);
   }
  });
 }
});
