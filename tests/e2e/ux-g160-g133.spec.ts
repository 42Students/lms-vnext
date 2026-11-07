import { expect, test, type Page } from "@playwright/test";

const viewports = [
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const;
const fixture="/e2e/ux-g160-g133-fixture";

async function assertNoHorizontalOverflow(page:Page) {
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth + 1
  )).toBe(false);
}

for (const viewport of viewports) {
 test(`UX-G160 ${viewport.name} independently reviews lift and new debarment`,
  async ({page},testInfo)=>{
   await page.setViewportSize(viewport);
   const posts: Array<{action:string;debarmentId?:string;reason:string}> = [];
   await page.route("**/api/placements/tpo/students/**/debarments",async route=>{
    const payload=route.request().postDataJSON() as {action:string;debarmentId?:string;
      reason:string;untilDate?:string|null;untilDrives?:number|null};
    posts.push(payload);
    const prior=[
      {id:"fixture-first",reason:"First review restriction",untilDate:null,
       untilDrives:null,drivesCounted:0,createdAt:"2026-11-07T09:00:00.000Z",
       liftedAt:null,liftedReason:null,active:true},
      {id:"fixture-second",reason:"Second review restriction",untilDate:null,
       untilDrives:2,drivesCounted:1,createdAt:"2026-11-07T10:00:00.000Z",
       liftedAt:null,liftedReason:null,active:true},
    ];
    const rows=payload.action==="LIFT"
     ?prior.map(row=>row.id===payload.debarmentId
       ?{...row,active:false,liftedAt:"2026-11-07T11:00:00.000Z",
          liftedReason:payload.reason}:row)
     :[{id:"fixture-created",reason:payload.reason,untilDate:payload.untilDate??null,
        untilDrives:payload.untilDrives??null,drivesCounted:0,
        createdAt:"2026-11-07T11:00:00.000Z",
        liftedAt:null,liftedReason:null,active:true}];
    await route.fulfill({status:200,contentType:"application/json",
      body:JSON.stringify({rows})});
   });
   await page.goto(fixture);
   const existing=page.locator('[data-ux-fixture="debar-active"]');
   await expect(existing.getByText("First review restriction")).toBeVisible();
   const liftReason=existing.getByRole("textbox",{name:"Reason for lifting"});
   await liftReason.nth(0).fill("First verified review");
   await liftReason.nth(1).fill("Second unrelated review");
   await expect(liftReason.nth(0)).toHaveValue("First verified review");
   await expect(liftReason.nth(1)).toHaveValue("Second unrelated review");
   const create=page.locator('[data-ux-fixture="debar-create"]');
   const helpIds=await page.locator('[data-ux-fixture^="debar"] input[type="date"]')
    .evaluateAll(inputs=>inputs.map(input=>input.getAttribute("aria-describedby")));
   expect(helpIds).toHaveLength(2);
   expect(helpIds.every(Boolean)).toBe(true);
   expect(new Set(helpIds).size).toBe(2);
   await existing.getByRole("button",{name:"Review lift"}).first().click();
   const modal=page.getByRole("dialog",{name:"Lift debarment"});
   await expect(modal).toBeVisible();
   await expect(modal).toContainText("First verified review");
   await expect(modal).not.toContainText("Second unrelated review");
   await modal.getByRole("button",{name:"Lift restriction"}).click();
   await expect(existing.getByText("Debarment lifted.")).toBeVisible();
   expect(posts[0]).toMatchObject({action:"LIFT",debarmentId:"fixture-first",
    reason:"First verified review"});
   await create.getByRole("textbox",{name:"Reason for Debar"}).fill("Short temporary restriction");
   await create.getByRole("combobox",{name:"How long"}).selectOption("MANUAL");
   await create.getByRole("button",{name:"Review debarment"}).click();
   const createDialog=page.getByRole("dialog",{name:"Confirm debarment"});
   await expect(createDialog).toContainText("Short temporary restriction");
   await createDialog.getByRole("button",{name:"Apply debarment"}).click();
   await expect(create.getByText("Debarment saved.")).toBeVisible();
   expect(posts[1]).toMatchObject({action:"DEBAR",reason:"Short temporary restriction",
    untilDate:null,untilDrives:null});
   await assertNoHorizontalOverflow(page);
   const shot=testInfo.outputPath(`${viewport.name}-debar.png`);
   await page.screenshot({path:shot,fullPage:true});
   await testInfo.attach(`${viewport.name}-debar`,{path:shot,contentType:"image/png"});
 });

 test(`UX-G133 ${viewport.name} recovers stale device and rate-limited sign-in`,
  async ({page},testInfo)=>{
   await page.setViewportSize(viewport);
   let deviceDeletes=0;
   await page.route("**/api/auth/devices/fixture-other",async route=>{
    deviceDeletes++;
    await route.fulfill({status:409,contentType:"application/json",
      body:JSON.stringify({error:"SESSION_STALE"})});
   });
   await page.route("**/api/auth/login/start",async route=>{
    await route.fulfill({status:429,contentType:"application/json",
      body:JSON.stringify({error:"TOO_MANY_REQUESTS",retryAfterSeconds:40})});
   });
   await page.goto(fixture);
   const devices=page.locator('[data-ux-fixture="devices"]');
   await devices.getByRole("button",{name:"Sign out device: Other test browser"}).click();
   const confirm=page.getByRole("dialog",{name:"Sign out Other test browser"});
   await expect(confirm).toBeVisible();
   await confirm.getByRole("button",{name:"Sign out Other test browser"}).click();
   await expect(page.getByText("Your device list changed. Review the latest sessions.")).toBeVisible();
   expect(deviceDeletes).toBe(1);
   const login=page.locator('[data-ux-fixture="login"]');
   await login.getByRole("textbox",{name:"Email"}).fill("test@example.com");
   await login.getByRole("button",{name:"Send code"}).click();
   await expect(login.getByRole("alert")).toContainText("Verification is temporarily blocked.");
   const retry=login.getByRole("button",{name:/Try again in 0:/});
   await expect(retry).toBeDisabled();
   await assertNoHorizontalOverflow(page);
   const shot=testInfo.outputPath(`${viewport.name}-auth.png`);
   await page.screenshot({path:shot,fullPage:true});
   await testInfo.attach(`${viewport.name}-auth`,{path:shot,contentType:"image/png"});
 });

 test(`UX-G160 ${viewport.name} has keyboard-reachable quick actions`,
  async ({page},testInfo)=>{
   await page.setViewportSize(viewport);
   await page.goto(fixture);
   const bar=page.locator('[data-ux-fixture="topbar"]');
   const trigger=bar.locator('summary[aria-label="New placement work"]');
   await trigger.focus();
   await expect(trigger).toBeFocused();
   await trigger.press("Enter");
   await expect(bar.getByRole("link",{name:"Recruiter lead"})).toBeVisible();
   await expect(bar.getByRole("link",{name:"Drive"})).toBeVisible();
   await expect(bar.getByRole("link",{name:"View all follow-ups"})).toBeVisible();
   await trigger.press("Escape");
   await expect(bar.getByRole("link",{name:"Recruiter lead"})).toBeHidden();
   await assertNoHorizontalOverflow(page);
   const shot=testInfo.outputPath(`${viewport.name}-topbar.png`);
   await page.screenshot({path:shot,fullPage:true});
   await testInfo.attach(`${viewport.name}-topbar`,{path:shot,contentType:"image/png"});
 });
}
