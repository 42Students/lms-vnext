import {expect,test,type Page} from "@playwright/test";

const fixture="/e2e/ux-g158-fixture";
const viewports=[
 {name:"desktop",width:1280,height:800},
 {name:"mobile",width:390,height:844},
] as const;
async function noOverflow(page:Page){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
}
async function screenshot(page:Page,testInfo:import("@playwright/test").TestInfo,label:string){
 const path=testInfo.outputPath(label+".png");
 await page.screenshot({path,fullPage:true});
 await testInfo.attach(label,{path,contentType:"image/png"});
}

for(const viewport of viewports){
 test("UX-G158 "+viewport.name+" recovers stale announcement deletion in place",async({page},info)=>{
  await page.setViewportSize(viewport);
  let posts=0;
  await page.route("**/api/placements/tpo/announcements/**/lifecycle",async route=>{
   posts++;
   expect(route.request().method()).toBe("POST");
   expect(route.request().postData()).toContain("expectedVersion");
   await route.fulfill({status:409,contentType:"application/json",
    body:JSON.stringify({error:"STALE_VERSION"})});
  });
  await page.route("**/api/placements/tpo/announcements/**/receipts",async route=>
   route.fulfill({status:200,contentType:"application/json",
    body:JSON.stringify({delivered:0,read:0,unread:[],notDelivered:false})}));
  await page.goto(fixture);
  const section=page.locator('[data-ux-fixture="delete"]');
  const opener=section.getByRole("button",{name:"Delete",exact:true});
  await opener.click();
  const modal=page.getByRole("alertdialog",{name:"Delete this announcement?"});
  await expect(modal).toBeVisible();
  await modal.getByRole("button",{name:"Delete announcement"}).click();
  await expect(modal.getByRole("alert")).toContainText("changed since you opened it");
  await expect(modal.getByRole("button",{name:"Delete announcement"})).toBeEnabled();
  await expect(modal).toBeVisible();
  expect(posts).toBe(1);
  await modal.getByRole("button",{name:"Cancel"}).click();
  await expect(opener).toBeFocused();
  await noOverflow(page);
  await screenshot(page,info,viewport.name+"-delete-recovery");
 });
 test("UX-G158 "+viewport.name+" displays honest unread names and retries invalid receipts",async({page},info)=>{
  await page.setViewportSize(viewport);
  let requests=0;
  await page.route("**/api/placements/tpo/announcements/**/receipts",async route=>{
   requests++;
   const body=requests===1
    ?{delivered:2,read:5,unread:[],notDelivered:false}
    :{delivered:2,read:1,unread:[],notDelivered:false};
   await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(body)});
  });
  await page.goto(fixture);
  const section=page.locator('[data-ux-fixture="receipts"]');
  await expect(section.getByText("Read status was incomplete.")).toBeVisible();
  await section.getByRole("button",{name:"Retry read status"}).click();
  await expect(section.getByText("1 of 2 read")).toBeVisible();
  await section.getByRole("button",{name:"Who hasn't read (1)"}).click();
  const drawer=page.getByRole("dialog",{name:"Who hasn't read"});
  await expect(drawer).toContainText("Unread recipient names are not available yet.");
  expect(requests).toBe(2);
  await noOverflow(page);
  await screenshot(page,info,viewport.name+"-read-retry");
 });
 test("UX-G158 "+viewport.name+" retries undo, then confirms success",async({page},info)=>{
  await page.setViewportSize(viewport);
  let attempts=0;
  await page.route("**/api/placements/tpo/announcements/**/lifecycle",async route=>{
   attempts++;
   expect(route.request().postData()).toContain("UNDO_SEND");
   await route.fulfill({status:attempts===1?409:200,contentType:"application/json",
    body:JSON.stringify(attempts===1?{error:"UNDO_WINDOW_EXPIRED"}:{saved:true})});
  });
  await page.route("**/api/placements/tpo/announcements/**/receipts",async route=>
   route.fulfill({status:200,contentType:"application/json",
    body:JSON.stringify({delivered:0,read:0,unread:[],notDelivered:false})}));
  await page.goto(fixture);
  const section=page.locator('[data-ux-fixture="undo"]');
  const undo=section.getByRole("button",{name:"Undo sending this announcement"});
  await expect(undo).toBeVisible();
  await undo.click();
  await expect(section.getByRole("alert")).toContainText("Undo window ended or announcement changed");
  await undo.click();
  await expect(section.getByRole("status")).toContainText("Announcement send undone.");
  expect(attempts).toBe(2);
  await noOverflow(page);
  await screenshot(page,info,viewport.name+"-undo");
 });
 test("UX-G158 "+viewport.name+" keeps shortcut help keyboard-accessible",async({page},info)=>{
  await page.setViewportSize(viewport);
  await page.route("**/api/placements/tpo/announcements/**/receipts",async route=>
   route.fulfill({status:200,contentType:"application/json",
    body:JSON.stringify({delivered:0,read:0,unread:[],notDelivered:false})}));
  await page.goto(fixture);
  const button=page.locator('[data-ux-fixture="shortcuts"]').getByRole("button",{name:"Keyboard shortcuts"});
  await button.focus();
  await button.press("Enter");
  const drawer=page.getByRole("dialog",{name:"Keyboard shortcuts"});
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("New recruiter lead")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await noOverflow(page);
  await screenshot(page,info,viewport.name+"-shortcuts");
 });
}
