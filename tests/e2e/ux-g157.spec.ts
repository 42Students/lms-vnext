import {expect,test,type Page,type TestInfo} from "@playwright/test";

const sizes=[{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const;
async function openFixture(page:Page){
 await page.goto("/e2e/ux-g157-fixture");
 await expect(page.locator('[data-ux-g157-ready="true"]')).toHaveCount(1);
}
async function capture(page:Page,info:TestInfo,label:string){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 const shot=info.outputPath(label+".png");
 await page.screenshot({path:shot,fullPage:true});
 await info.attach(label,{path:shot,contentType:"image/png"});
}
for(const viewport of sizes){
 test("UX-G157 "+viewport.name+" isolates unsent company conversation drafts",async({page},info)=>{
  await page.setViewportSize(viewport);
  await page.route("**/api/placements/tpo/batches/**/saved-views",async route=>{
   await route.fulfill({status:200,contentType:"application/json",body:"[]"});
  });
  await openFixture(page);
  const section=page.locator('[data-ux-fixture="company"]');
  const message=section.getByRole("textbox",{name:"Message"});
  await message.fill("Private conversation for A");
  await expect(message).toHaveValue("Private conversation for A");
  await section.getByRole("button",{name:"Change company"}).click();
  await expect(section.getByRole("status")).toHaveText("Selected: Company B");
  await expect(message).toHaveValue("");
  await section.getByRole("button",{name:"Change company"}).click();
  await expect(section.getByRole("status")).toHaveText("Selected: Company A");
  await expect(message).toHaveValue("Private conversation for A");
  await capture(page,info,viewport.name+"-company-draft");
 });
 test("UX-G157 "+viewport.name+" explains blocked-date range validation",async({page},info)=>{
  await page.setViewportSize(viewport);
  await page.route("**/api/placements/tpo/batches/**/saved-views",async route=>
   route.fulfill({status:200,contentType:"application/json",body:"[]"}));
  await openFixture(page);
  const section=page.locator('[data-ux-fixture="blocked"]');
  await section.getByLabel("From", {exact:true}).fill("2029-01-01");
  await section.getByLabel("Until", {exact:true}).fill("2029-05-01");
  await expect(section.getByRole("alert")).toContainText("at most 90 days");
  await expect(section.getByRole("button",{name:"Block dates"})).toBeDisabled();
  await section.getByLabel("Until",{exact:true}).fill("2029-01-05");
  await expect(section.getByRole("status").first()).toContainText("Blocking 5 days");
  await expect(section.getByRole("button",{name:"Block dates"})).toBeEnabled();
  await capture(page,info,viewport.name+"-blocked-dates");
 });
 test("UX-G157 "+viewport.name+" prevents a sixth pin and recovers a failed deletion",async({page},info)=>{
  await page.setViewportSize(viewport);
  const rows=Array.from({length:5},(_,i)=>({
    id:"view-"+(i+1),name:"Saved group "+(i+1),pinned:true,createdAt:"2026-11-08T00:00:00Z",
    query:{batchId:"00000000-0000-4000-8000-000000000357",q:"",decision:"ALL",source:"ALL",registration:"ALL",order:"NAME_ASC"},
  }));
  let deletes=0;
  await page.route("**/api/placements/tpo/batches/**/saved-views",async route=>{
   if(route.request().method()==="POST"){
    deletes++;
    await route.fulfill({status:409,contentType:"application/json",
      body:JSON.stringify({error:"STALE_VIEW"})});
   }else{
    await route.fulfill({status:200,contentType:"application/json",
      body:JSON.stringify(rows)});
   }
  });
  await openFixture(page);
  const section=page.locator('[data-ux-fixture="views"]');
  await section.getByRole("button",{name:"Saved batch views"}).click();
  await expect(section.getByRole("button",{name:"Open"})).toHaveCount(5);
  await section.getByRole("textbox",{name:"View name"}).fill("Another pinned view");
  await section.getByRole("checkbox",{name:"Pin view"}).check();
  await expect(section.getByText("Five views are already pinned.")).toBeVisible();
  await expect(section.getByRole("button",{name:"Save current filters"})).toBeDisabled();
  await section.getByRole("checkbox",{name:"Pin view"}).uncheck();
  await expect(section.getByRole("button",{name:"Save current filters"})).toBeEnabled();
  await section.getByRole("button",{name:"Delete"}).first().click();
  const dialog=page.getByRole("alertdialog",{name:"Delete this saved batch view?"});
  await dialog.getByRole("button",{name:"Delete"}).click();
  await expect(dialog.getByRole("alert")).toContainText("Could not save the batch view.");
  await expect(dialog).toBeVisible();
  expect(deletes).toBe(1);
  await capture(page,info,viewport.name+"-saved-views");
 });
 test("UX-G157 "+viewport.name+" cannot send a campaign without a provider",async({page},info)=>{
  await page.setViewportSize(viewport);
  await page.route("**/api/placements/tpo/batches/**/saved-views",async route=>
   route.fulfill({status:200,contentType:"application/json",body:"[]"}));
  await openFixture(page);
  const section=page.locator('[data-ux-fixture="campaign"]');
  await expect(section.getByText(/Campaign email is not set up yet/).first()).toBeVisible();
  await expect(section.getByRole("button",{name:"Send",exact:true})).toBeDisabled();
  await capture(page,info,viewport.name+"-campaign");
 });
}
