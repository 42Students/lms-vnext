import {expect,test,type Page,type TestInfo} from "@playwright/test";
const screens=[{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const;
async function ready(page:Page){
 await page.goto("/e2e/ux-g156-fixture");
 await expect(page.locator('[data-ux-g156-ready="true"]')).toHaveCount(1);
}
async function capture(page:Page,info:TestInfo,label:string){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 const path=info.outputPath(label+".png");
 await page.screenshot({path,fullPage:true});
 await info.attach(label,{path,contentType:"image/png"});
}
for(const viewport of screens){
 test("UX-G156 "+viewport.name+" never invents an invitation recipient count",async({page},info)=>{
  await page.setViewportSize(viewport);
  let sends=0;
  await page.route("**/api/placements/tpo/batches/*/invitation",async route=>{
   if(route.request().method()!=="POST")return route.fallback();
   sends++;
   await route.fulfill({status:200,contentType:"application/json",
    body:JSON.stringify(sends===1?{invitedAt:"2026-11-08T08:00:00.000Z"}:
     {invitedAt:"2026-11-08T08:00:00.000Z",notifiedCount:2})});
  });
  await page.route("**/api/placements/tpo/audit/saved-views",async route=>
   route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ready:true,views:[]})}));
  await ready(page);
  const section=page.locator('[data-ux-fixture="invite"]');
  await section.getByLabel("Registration deadline").fill("2030-01-01");
  const button=section.getByRole("button",{name:/Invite/});
  await expect(button).toBeEnabled();
  await button.click();
  await expect(section.getByText(/recipient count could not be verified/)).toBeVisible();
  await expect(section).not.toContainText("5 students notified");
  await button.click();
  await expect(section.getByText(/In-app only; email delivery is not enabled/)).toBeVisible();
  expect(sends).toBe(2);
  await capture(page,info,viewport.name+"-invitation");
 });
 test("UX-G156 "+viewport.name+" refuses an unverified reminder outcome",async({page},info)=>{
  await page.setViewportSize(viewport);
  let calls=0;
  await page.route("**/api/placements/tpo/batches/*/remind",async route=>{
   calls++;
   await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({alreadySent:false})});
  });
  await page.route("**/api/placements/tpo/audit/saved-views",async route=>
   route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ready:true,views:[]})}));
  await ready(page);
  const section=page.locator('[data-ux-fixture="remind"]');
  await section.getByRole("checkbox").check();
  await section.getByRole("button",{name:"Send reminder"}).click();
  await expect(section.getByText(/Reminder outcome could not be verified/)).toBeVisible();
  expect(calls).toBe(1);
  await capture(page,info,viewport.name+"-reminder");
 });
 test("UX-G156 "+viewport.name+" preserves class decision after stale-version conflict",async({page},info)=>{
  await page.setViewportSize(viewport);
  let posts=0;
  await page.route("**/api/placements/tpo/batches/*/classes/*/decision",async route=>{
   posts++;
   expect(route.request().postDataJSON()).toMatchObject({decision:"INELIGIBLE",
    reason:"Not cleared for placement",expectedVersion:"2026-11-07T08:00:00.000Z"});
   await route.fulfill({status:409,contentType:"application/json",body:JSON.stringify({error:"STALE_VERSION"})});
  });
  await page.route("**/api/placements/tpo/audit/saved-views",async route=>
   route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ready:true,views:[]})}));
  await ready(page);
  const section=page.locator('[data-ux-fixture="decision"]');
  await section.getByRole("combobox",{name:"Who is in"}).selectOption("INELIGIBLE");
  await section.getByRole("textbox",{name:"Reason"}).fill("Not cleared for placement");
  await section.getByRole("button",{name:"Save"}).click();
  const modal=page.getByRole("alertdialog",{name:"Set this class to ineligible?"});
  await modal.getByRole("button",{name:"Save"}).click();
  await expect(modal.getByRole("alert")).toContainText("Class decision changed");
  await expect(modal).toBeVisible();
  expect(posts).toBe(1);
  await capture(page,info,viewport.name+"-decision");
 });
 test("UX-G156 "+viewport.name+" recovers malformed saved audit data",async({page},info)=>{
  await page.setViewportSize(viewport);
  await page.route("**/api/placements/tpo/audit/saved-views",async route=>
   route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ready:true,views:null})}));
  await ready(page);
  const section=page.locator('[data-ux-fixture="audit"]');
  await section.getByText("Saved audit views (0/12)").click();
  await expect(section.getByText(/Could not load saved audit views/)).toBeVisible();
  await expect(section.getByRole("button",{name:"Save current"})).toBeDisabled();
  await capture(page,info,viewport.name+"-audit");
 });
}
