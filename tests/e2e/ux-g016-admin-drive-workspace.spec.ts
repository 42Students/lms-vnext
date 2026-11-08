import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {SEED_IDS} from "../../scripts/db-seed-data";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const jobId="66000000-0000-4000-8000-000000000004";
const base="/admin/placements/jobs/"+jobId;
const pages=[
 {href:base,label:"Overview"},
 {href:base+"/applications",label:"Applications"},
 {href:base+"/schedule",label:"Schedule"},
 {href:base+"/settings",label:"Settings"},
 {href:"/admin/placements/joining",label:"Joining"},
];
const origin="http://localhost:3000";

test.describe("UX-G016: scoped placement drive workspace journey",()=>{
 test.skip(!enabled,"Requires isolated PostgreSQL and ephemeral test actor auth");
 for(const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const){
  test(`Super Admin opens real drive tabs and joining outcomes on ${viewport.name}`,async({page,context},info)=>{
   test.setTimeout(180_000);
   await authenticateGracefulRole(context,"superadmin");
   await page.setViewportSize(viewport);
   const res=await context.request.post(origin+"/api/auth/admin-scope",{headers:{origin},
    data:{kind:"college",collegeId:SEED_IDS.collegeA}});
   expect(res.status()).toBe(200);

   for(const row of pages){
    const response=await page.goto(row.href);
    expect(response?.status(),row.href).toBeLessThan(400);
    await expect(page.getByRole("heading",{level:1}).first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth),
      row.label+" horizontal overflow").toBeLessThanOrEqual(2);
    await page.screenshot({path:info.outputPath("g016-"+row.label.toLowerCase()+"-"+viewport.name+".png"),fullPage:true});
   }
   await page.goto(base);
   const nav=page.getByRole("tablist",{name:"Drive workspace"});
   await expect(nav).toBeVisible();
   for(const tab of ["Overview","Applications","Schedule","Settings"])
    await expect(nav.getByRole("tab",{name:tab})).toBeVisible();
   await expect(page.getByText("E2E Prototype Software Engineer").first()).toBeVisible();

   // Local, validated return URLs remain in the admin placement family.
   await page.goto(base+"?returnTo=%2F%2Fevil.example");
   await expect(page.getByRole("navigation",{name:"Drive breadcrumb"}).getByRole("link",{name:"Drives"}))
    .toHaveAttribute("href","/admin/placements/drives");
  });

  test(`Learner cannot see private Admin drive tabs on ${viewport.name}`,async({page,context})=>{
   await authenticateGracefulRole(context,"learner");
   await page.setViewportSize(viewport);
   for(const href of [base,base+"/applications",base+"/schedule",base+"/settings"]){
    await page.goto(href,{waitUntil:"domcontentloaded"});
    await expect(page.getByRole("tablist",{name:"Drive workspace"})).toHaveCount(0);
    await expect(page.getByText("E2E Prototype Software Engineer")).toHaveCount(0);
   }
  });
 }
});
