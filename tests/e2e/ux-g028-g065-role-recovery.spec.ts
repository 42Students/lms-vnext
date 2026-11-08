import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const sizes=[
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const;
async function noOverflow(page:import("@playwright/test").Page){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
async function navigateSafely(page:import("@playwright/test").Page,href:string){
 try{await page.goto(href,{waitUntil:"domcontentloaded"});}
 catch(e){if(!String(e).includes("net::ERR_ABORTED"))throw e;}
}
for(const size of sizes){
 test("G065 "+size.name+": invalid learner notification cursor recovers without reading",async({page,context},info)=>{
  test.skip(process.env.UX_G028_G065_SEED!=="true");
  await authenticateGracefulRole(context,"learner");
  await page.setViewportSize(size);
  await page.goto("/learn/notifications/history?unread=invalid");
  const notice=page.getByRole("alert").filter({hasText:"Invalid history filters"});
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("No personal notifications were loaded");
  await expect(notice.getByRole("link",{name:"View newest history"})).toHaveAttribute("href","/learn/notifications/history");
  await noOverflow(page);
  await page.screenshot({path:info.outputPath("g065-notifications-"+size.name+".png"),fullPage:true});
 });
 test("G065 "+size.name+": invalid learner data-access pagination gives a safe reset",async({page,context},info)=>{
  test.skip(process.env.UX_G028_G065_SEED!=="true");
  await authenticateGracefulRole(context,"learner");
  await page.setViewportSize(size);
  await page.goto("/learn/profile/data-access?tpoPage=bad");
  const notice=page.getByRole("alert").filter({hasText:"Invalid data-access page"});
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("No private sharing records were loaded");
  await expect(notice.getByRole("link",{name:"View first history page"})).toHaveAttribute("href","/learn/profile/data-access");
  await noOverflow(page);
  await page.screenshot({path:info.outputPath("g065-data-access-"+size.name+".png"),fullPage:true});
 });
 test("G028 "+size.name+": college activity invalid category recovers with reset",async({page,context},info)=>{
  test.skip(process.env.UX_G028_G065_SEED!=="true");
  await authenticateGracefulRole(context,"college");
  await page.setViewportSize(size);
  await page.goto("/college/activity?category=INVALID");
  await expect(page.getByText("Invalid activity filters")).toBeVisible();
  await expect(page.getByRole("link",{name:"Clear filters"})).toHaveAttribute("href","/college/activity");
  await noOverflow(page);
  await page.screenshot({path:info.outputPath("g028-activity-"+size.name+".png"),fullPage:true});
 });
 test("G028 "+size.name+": malformed event ID not treated as a valid college activity",async({page,context})=>{
  test.skip(process.env.UX_G028_G065_SEED!=="true");
  await authenticateGracefulRole(context,"college");
  await page.setViewportSize(size);
  await navigateSafely(page,"/college/activity/not-a-uuid");
  await expect(page.getByRole("heading",{name:"Activity detail"})).toHaveCount(0);
  await noOverflow(page);
 });
}
test("negative Learner and Faculty cannot see other role's invalid links",async({page,context})=>{
 test.skip(process.env.UX_G028_G065_SEED!=="true");
 await authenticateGracefulRole(context,"faculty");
 await navigateSafely(page,"/learn/notifications/history?unread=bad");
 await expect(page.getByText("Invalid history filters")).toHaveCount(0);
 await navigateSafely(page,"/learn/placements");
 await expect(page).not.toHaveURL(/\/learn\/my-placements/);
 await authenticateGracefulRole(context,"learner");
 await navigateSafely(page,"/college/activity?category=bad");
 await expect(page.getByText("Invalid activity filters")).toHaveCount(0);
 await navigateSafely(page,"/college/activity/not-a-uuid");
 await expect(page.getByRole("heading",{name:"Activity detail"})).toHaveCount(0);
});
