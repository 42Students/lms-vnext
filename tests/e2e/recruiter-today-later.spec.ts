import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";

const enabled=Boolean(process.env.E2E_AUTH_SECRET&&process.env.E2E_AUTH_ENABLED==="true");

test.describe("Recruiter Today prototype — persisted actions and Later",()=>{
 test.skip(!enabled,"Needs the verified Recruiter E2E identity and seeded deadline");

 test("a scoped deadline appears, Later survives reload, and Show them restores it",async({page,context})=>{
  const runtimeErrors:string[]=[];
  page.on("pageerror",error=>runtimeErrors.push(error.message));
  await authenticateGracefulRole(context,"recruiter");
  await page.setViewportSize({width:1488,height:992});
  await page.goto("/hr/home");
  const today=page.getByTestId("recruiter.today");
  await expect(today).toBeVisible({timeout:20_000});
  const needs=today.getByRole("region",{name:"Needs you"});
  await expect(needs).toBeVisible();
  await expect(today.getByRole("heading",{level:1,name:/One thing needs you/})).toBeVisible();
  // Synthetic seeded data only. One temporary, capped visual sample allows
  // audit against the latest uploaded PNG without exposing production data.
  if(process.env["E2E_CAPTURE_TODAY"]==="true"){
   const jpeg=await page.screenshot({type:"jpeg",quality:48,
    // The built-in Next dev badge is not part of the LMS prototype canvas.
    style:"nextjs-portal{visibility:hidden!important}",
   });
   console.log("RECRUITER_TODAY_E2E_JPEG="+jpeg.toString("base64"));
  }
  const deadline=needs.locator('[data-testid^="recruiter.today.task-deadline:"]');
  await expect(deadline).toHaveCount(1);
  await expect(deadline.getByText("E2E Prototype Software Engineer",{exact:false})).toBeVisible();
  await expect(today.getByRole("link",{name:"Calendar ›"})).toHaveAttribute("href",/\/hr\/calendar/);
  await expect(today.getByRole("region",{name:"This week"})).toBeVisible();
  await deadline.getByRole("button",{name:"Later"}).click();
  await expect(today.getByRole("heading",{level:1,name:/1 thing is put off for later/})).toBeVisible();
  await expect(deadline).toHaveCount(0);
  await page.reload();
  await expect(today.getByRole("heading",{level:1,name:/1 thing is put off for later/})).toBeVisible();
  await needs.getByRole("button",{name:"Show them"}).click();
  await expect(deadline).toHaveCount(1);
  await expect(today.getByRole("heading",{level:1,name:/One thing needs you/})).toBeVisible();
  await deadline.getByRole("link",{name:"Open"}).click();
  await expect(page).toHaveURL(/\/recruiter\/drives\/66000000-0000-4000-8000-000000000004\?tab=overview/);
  // Next dev always mounts an innocuous nextjs-portal for its dev badge.
  // Check real runtime errors and shadow-DOM dialogs, not portal existence.
  await expect(page.locator("vite-error-overlay, nextjs-portal [data-nextjs-dialog]")).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
  expect(await page.locator("body").innerText()).not.toMatch(/Application error|Internal Server Error/i);
 });

 test("unauthorized learner cannot see recruiter Today or the scoped action queue",async({page,context})=>{
  await authenticateGracefulRole(context,"learner");
  await page.goto("/hr/home");
  await expect(page).not.toHaveURL(/\/hr\/home/);
  await expect(page.getByTestId("recruiter.today")).toHaveCount(0);
 });
});
