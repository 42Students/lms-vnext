import {expect,test,type BrowserContext} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {SEED_IDS} from "../../scripts/db-seed-data";

/** Real authorized Next routes and seeded PostgreSQL; no mock fixture. */
const origin="http://localhost:3000";
const college=SEED_IDS.collegeA;
const learner=SEED_IDS.learnerCollegeAMembership;
const drive="66000000-0000-4000-8000-000000000004";
const routes=[
  {group:"UX-G010",name:"Electives",href:"/admin/electives"},
  {group:"UX-G010",name:"Faculty assignments",href:"/admin/faculty-assignment"},
  {group:"UX-G011",name:"Student module access",href:`/admin/features/${college}/students/${learner}`},
  {group:"UX-G011",name:"Student access history",href:`/admin/features/${college}/students/${learner}/history`},
  {group:"UX-G012",name:"Lessons",href:"/admin/lessons"},
  {group:"UX-G013",name:"Student membership",href:`/admin/people/directory/${learner}`},
  {group:"UX-G013",name:"Membership audit",href:`/admin/people/directory/${learner}/audit`},
  {group:"UX-G014",name:"Placement analytics",href:"/admin/placements/analytics"},
  {group:"UX-G016",name:"Placement drive",href:`/admin/placements/jobs/${drive}`},
  {group:"UX-G016",name:"Drive applications",href:`/admin/placements/jobs/${drive}/applications`},
  {group:"UX-G017",name:"Create drive",href:"/admin/placements/new"},
  {group:"UX-G019",name:"Student placement lookup",href:"/admin/placements/student-lookup"},
  {group:"UX-G019",name:"Programs",href:"/admin/programs"},
  {group:"UX-G020",name:"At-risk projects",href:"/admin/projects/at-risk"},
  {group:"UX-G020",name:"Projects audit",href:"/admin/projects/audit"},
  {group:"UX-G021",name:"Project template directory",href:"/admin/projects/templates"},
] as const;
const viewports=[{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const;
const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET)&&Boolean(process.env.E2E_DATABASE_URL);
async function useCollege(context:BrowserContext){
  await authenticateGracefulRole(context,"superadmin");
  const response=await context.request.post(origin+"/api/auth/admin-scope",{
    headers:{Origin:origin},data:{kind:"college",collegeId:college},
  });
  expect(response.status(),"Super Admin selection must be authorized").toBe(200);
  const body=await response.json() as {scope?:{collegeId?:string}};
  expect(body.scope?.collegeId).toBe(college);
}

test.describe("UX-G010–G021 atomic Super Admin journeys, selected college",()=>{
  test.beforeAll(()=>{
    if(!enabled)throw new Error("Exact-SHA acceptance requires isolated seeded PostgreSQL and E2E credentials");
  });
  for(const viewport of viewports){
    for(const route of routes){
      test(`${route.group} ${viewport.name} genuine ${route.name} page`,async({page,context},info)=>{
        test.setTimeout(120000);
        await page.setViewportSize(viewport);
        await useCollege(context);
        const runtimeErrors:string[]=[];
        page.on("pageerror",error=>runtimeErrors.push(error.message));
        const response=await page.goto(route.href,{waitUntil:"domcontentloaded"});
        expect(response?.status(),route.href).toBeLessThan(400);
        // A middleware redirect to /dashboard is not evidence that the
        // protected Super Admin page works. Require the actual target route.
        expect(new URL(page.url()).pathname,route.name+" authorized destination")
          .toBe(route.href);
        await expect(page.getByRole("heading",{level:1}).first()).toBeVisible({timeout:30000});
        await expect(page.getByRole("heading",{level:1}).first()).not.toHaveText(/^(?:500|Access denied|Forbidden|Not found|Not authorized)$/i);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        expect(overflow,route.name+" horizontal overflow").toBeLessThanOrEqual(2);
        expect(runtimeErrors,route.name+" browser errors").toEqual([]);
        await page.screenshot({path:info.outputPath(`${route.group}-${viewport.name}-${route.name.toLowerCase().replaceAll(" ","-")}.png`),fullPage:true});
      });
    }
  }
  for(const viewport of viewports){
    test(`UX-G011 ${viewport.name} invalid student history filters recover within same membership`,async({page,context},info)=>{
      await page.setViewportSize(viewport);
      await useCollege(context);
      const scoped=`/admin/features/${college}/students/${learner}/history`;
      await page.goto(scoped+"?module=INVALID&actorName=Private");
      await expect(page.getByRole("heading",{name:"Invalid history filters"})).toBeVisible();
      const reset=page.getByRole("link",{name:"Clear history filters"});
      await expect(reset).toHaveAttribute("href",scoped);
      await page.screenshot({path:info.outputPath(`g011-${viewport.name}-invalid-history.png`),fullPage:true});
      await reset.click();
      await expect(page).toHaveURL(new RegExp("/history$"));
      await expect(page.getByRole("heading",{name:"Student module-rule history"})).toBeVisible();
    });
    test(`UX-G012 ${viewport.name} rejects unsupported lecture hall query fields`,async({page,context},info)=>{
      await page.setViewportSize(viewport);
      await useCollege(context);
      const hall="/admin/lecture-halls/69000000-0000-4000-8000-000000000001";
      await page.goto(hall+"?from=2026-11-01&to=2026-11-02&private=ignored");
      await expect(page.getByRole("heading",{name:"Invalid date range"})).toBeVisible();
      const reset=page.getByRole("link",{name:"Clear date range"});
      await expect(reset).toHaveAttribute("href",hall);
      await page.screenshot({path:info.outputPath(`g012-${viewport.name}-invalid-hall-filter.png`),fullPage:true});
      await reset.click();
      await expect(page).toHaveURL(new RegExp("/lecture-halls/69000000-0000-4000-8000-000000000001$"));
      await expect(page.getByText("Choose an IST date range to view scheduled classes.")).toBeVisible();
    });
  }
  test("Learner cannot read private Super Admin academic, people or placement records",async({page,context})=>{
    test.setTimeout(120000);
    await authenticateGracefulRole(context,"learner");
    for(const route of [
      `/admin/features/${college}/students/${learner}/history`,
      `/admin/people/directory/${learner}/audit`,
      `/admin/placements/jobs/${drive}/applications`,
      "/admin/projects/audit",
    ]){
      await page.goto(route,{waitUntil:"domcontentloaded"});
      // The router may return a streamed 200 shell before redirecting. Require
      // a visible access denial or an actual navigation away from the private route.
      await expect.poll(async()=>{
        const url=new URL(page.url());
        const denied=(await page.getByRole("heading",{name:/Access denied|Not authorized|Forbidden/i}).count())>0;
        return denied||(!url.pathname.startsWith("/admin/"));
      },{timeout:20000,message:"Learner must be denied "+route}).toBe(true);
      await expect(page.getByText("E2E Prototype Software Engineer")).toHaveCount(0);
    }
  });
});
