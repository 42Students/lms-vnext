import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {expectNoRawErrors} from "./support/no-raw-error";

const enabled=Boolean(process.env.E2E_AUTH_SECRET&&process.env.E2E_AUTH_ENABLED==="true");
const seededJobId="66000000-0000-4000-8000-000000000004";
const title="E2E Prototype Software Engineer";

test.describe("Recruiter prototype: all authenticated screen families",()=>{
 test.skip(!enabled,"Requires the isolated verified recruiter fixture in db:e2e:prepare");

 const screenPaths=[
  {screen:"01 Today",url:"/hr/home",heading:"Today"},
  {screen:"02 Drives",url:"/hr/drives",heading:"Drives at Seed College A"},
  {screen:"03 Request a drive",url:"/hr/drives/new",heading:"Request a drive"},
  {screen:"09 Calendar",url:"/hr/calendar",heading:"Calendar"},
  {screen:"10 Messages",url:"/hr/conversations",heading:"Messages"},
  {screen:"11 Company & Team",url:"/hr/company",heading:"E2E Prototype Hiring Company"},
  {screen:"12 Profile",url:"/hr/profile",heading:"Your Profile"},
  {screen:"12 Notifications",url:"/hr/notifications",heading:"Notifications"},
 ] as const;

 for(const screen of screenPaths){
  test(screen.screen+" renders for a verified Recruiter",async({page,context})=>{
   await authenticateGracefulRole(context,"recruiter");
   await page.goto(screen.url);
   if(screen.screen==="01 Today"){
    // Today deliberately uses the current greeting, not a generic "Today" H1.
    await expect(page.getByTestId("recruiter.today")).toBeVisible({timeout:20_000});
    await expect(page.getByRole("heading",{level:1,name:/^Good (morning|afternoon|evening)/}))
     .toBeVisible();
   }else{
    await expect(page.getByRole("heading",{level:1,name:screen.heading}).first())
     .toBeVisible({timeout:20_000});
   }
   await expect(page.getByText(/Your access to this college has ended|No access to this college|No recruiter access/i))
    .toHaveCount(0);
   await expectNoRawErrors(page);
  });
 }
 for(const [screen,tab] of [
  ["04 Overview","overview"],
  ["05 Applicants","applicants"],
  ["06 Rounds","rounds"],
  ["07 Offers & Joining","offers"],
  ["08 Talk","discussion"],
 ] as const){
  test(screen+" opens a persisted, employer-owned drive",async({page,context})=>{
   await authenticateGracefulRole(context,"recruiter");
   await page.goto("/recruiter/drives/"+seededJobId+"?tab="+tab);
   await expect(page.getByRole("heading",{level:1,name:title}).first())
    .toBeVisible({timeout:20_000});
   await expect(page.getByText(/No access to this college|Hiring filters are invalid/i))
    .toHaveCount(0);
   await expectNoRawErrors(page);
  });
 }
});
