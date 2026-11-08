import { expect, test } from "@playwright/test";

const jobId="00000000-0000-4000-8000-000000000149";
const viewports=[{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const;
const noOverflow=async(page:import("@playwright/test").Page)=>{
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
};

for(const viewport of viewports){
 test(`${viewport.name}: selection partial batch refuses a second import until reconciliation`, async({page},info)=>{
  await page.setViewportSize(viewport);
  let writes=0;
  await page.route("**/api/placements/tpo/jobs/*/selections",async route=>{
    writes++;
    expect(route.request().method()).toBe("POST");
    const payload=route.request().postDataJSON();
    expect(payload.action).toBe("RECORD");
    expect(payload.entries.length).toBe(writes===1?100:1);
    await route.fulfill({status:writes===1?200:503,contentType:"application/json",body:JSON.stringify(writes===1?{ok:true}:{error:"SERVICE_UNAVAILABLE"})});
  });
  await page.goto("/e2e/ux-g149-placement-recovery");
  const section=page.getByRole("region",{name:"Selection import recovery"});
  const csv=["Application ID,Role,Package LPA",
    ...Array.from({length:101},(_,i)=>`app-${String(i+1).padStart(3,"0")},Developer,12`),
    "app-001,Developer,12","missing-app,Developer,12"].join("\n")+"\n";
  await section.locator('input[type="file"]').setInputFiles({name:"selection.csv",mimeType:"text/csv",buffer:Buffer.from(csv)});
  await expect(section.getByRole("status").filter({hasText:"101 matched · 2 unmatched"})).toBeVisible();
  await section.getByRole("button",{name:"Confirm and record 101 selections"}).click();
  const dialog=page.getByRole("alertdialog",{name:"Record 101 matched company selections?"});
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button",{name:"Cancel"}).click();
  expect(writes).toBe(0);
  await section.getByRole("button",{name:"Confirm and record 101 selections"}).click();
  await dialog.getByRole("button",{name:"Confirm and record 101 selections"}).click();
  await expect(section.getByText("100 row(s) confirmed before the error.",{exact:false})).toBeVisible();
  await expect(section.getByRole("button",{name:"Reload selection register"})).toBeVisible();
  await expect(section.locator('input[type="file"]')).toBeDisabled();
  expect(writes).toBe(2);
  await noOverflow(page);
  await page.screenshot({path:info.outputPath("selection-reconciliation-"+viewport.name+".png"),fullPage:true});
 });

 test(`${viewport.name}: ambiguous waitlist release locks stale preview token`,async({page},info)=>{
  await page.setViewportSize(viewport);
  let writes=0;
  await page.route("**/api/placements/tpo/jobs/*/waitlist-promote",async route=>{
    writes++;
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject({action:"OFFER_NEXT",confirmed:true,expectedPreviewToken:"synthetic-preview-v1"});
    await route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"UNKNOWN_COMMIT"})});
  });
  await page.goto("/e2e/ux-g149-placement-recovery");
  const section=page.getByRole("region",{name:"Waitlist offer recovery"});
  await section.getByRole("button",{name:"Verify and release next offer"}).first().click();
  const dialog=page.getByRole("alertdialog",{name:/Verify and release one offer to Synthetic learner 1/});
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button",{name:"Cancel"}).click();
  expect(writes).toBe(0);
  await section.getByRole("button",{name:"Verify and release next offer"}).first().click();
  await dialog.getByRole("button",{name:"Verify and release next offer"}).click();
  await expect(section.getByRole("status").filter({hasText:"Offer actions are locked until the waitlist"})).toBeVisible();
  await expect(section.getByRole("button",{name:"Verify and release next offer"})).toBeDisabled();
  expect(writes).toBe(1);
  await noOverflow(page);
  await page.screenshot({path:info.outputPath("waitlist-reconciliation-"+viewport.name+".png"),fullPage:true});
 });

 test(`${viewport.name}: calendar ignores superseded recruiter replies after a new slot`,async({page},info)=>{
  await page.setViewportSize(viewport);
  let requests=0;
  await page.route("**/api/placements/tpo/leads?*",async route=>{
    const index=++requests;
    if(index===1)await new Promise(resolve=>setTimeout(resolve,1100));
    await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({leads:[{
      id:"lead-"+index,name:index===1?"Stale recruiter":"Fresh recruiter",companyName:"Example company",email:null
    }]})});
  });
  await page.goto("/e2e/ux-g149-placement-recovery");
  const section=page.getByRole("region",{name:"Weekly calendar recovery"});
  const slots=section.locator('button[aria-label^="Add follow-up on"]');
  await expect(slots.first()).toBeVisible();
  await slots.nth(0).click();
  const dialog=page.getByRole("dialog",{name:"New recruiter follow-up"});
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button",{name:"Cancel"}).click();
  await expect(dialog).toHaveCount(0);
  await slots.nth(14).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("select")).toContainText("Fresh recruiter");
  await expect(dialog.locator("select")).not.toContainText("Stale recruiter");
  await page.waitForTimeout(1250);
  await expect(dialog.locator("select")).not.toContainText("Stale recruiter");
  expect(requests).toBe(2);
  await noOverflow(page);
  await page.screenshot({path:info.outputPath("calendar-latest-slot-"+viewport.name+".png"),fullPage:true});
 });
}

test("anonymous callers cannot release offers or import selections",async({request})=>{
 for(const endpoint of [
  `/api/placements/tpo/jobs/${jobId}/selections`,
  `/api/placements/tpo/jobs/${jobId}/waitlist-promote`,
 ]) {
  const response=await request.post(endpoint,{
    maxRedirects:0,data:{action:"OFFER_NEXT",confirmed:true,expectedPreviewToken:"synthetic-preview-v1"}
  });
  expect([401,403,302,307,308],`${endpoint} must deny anonymous writes`).toContain(response.status());
  expect(response.headers()["content-type"]??"").not.toContain("text/csv");
 }
});
