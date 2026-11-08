import {expect,test,type Page,type TestInfo} from "@playwright/test";

const fixture="/e2e/ux-g159-fixture";
const sizes=[{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const;
async function screenshot(page:Page,info:TestInfo,label:string){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 const path=info.outputPath(label+".png");
 await page.screenshot({path,fullPage:true});
 await info.attach(label,{path,contentType:"image/png"});
}
for(const viewport of sizes){
 test("UX-G159 "+viewport.name+" validates future IST away period and saves",async({page},info)=>{
  await page.setViewportSize(viewport);
  const payloads:Array<{until:string|null;expectedUntil:string|null}>=[];
  await page.route("**/api/placements/tpo/team/away",async route=>{
   payloads.push(route.request().postDataJSON());
   await route.fulfill({status:200,contentType:"application/json",
    body:JSON.stringify({until:payloads.at(-1)?.until})});
  });
  await page.goto(fixture);
  const section=page.locator('[data-ux-fixture="away"]');
  const date=section.getByLabel("Away until (IST)");
  await date.fill("2020-01-01T10:30");
  await section.getByRole("button",{name:"Set away"}).click();
  await expect(section.getByText(/Past away periods cannot be saved/)).toBeVisible();
  expect(payloads).toHaveLength(0);
  await date.fill("2030-01-01T10:30");
  await section.getByRole("button",{name:"Set away"}).click();
  await expect.poll(()=>payloads.length).toBe(1);
  expect(payloads[0]).toEqual({
   until:"2030-01-01T05:00:00.000Z",expectedUntil:"2026-12-01T00:00:00.000Z"});
  await screenshot(page,info,viewport.name+"-away");
 });
 test("UX-G159 "+viewport.name+" preserves rename draft after server conflict",async({page},info)=>{
  await page.setViewportSize(viewport);
  let attempts=0;
  await page.route("**/api/placements/tpo/team/threads/*/rename",async route=>{
   attempts++;
   expect(route.request().postDataJSON()).toMatchObject({
    topic:"Campus team 2027",expectedTopic:"Recruiter follow-ups"});
   await route.fulfill({status:409,contentType:"application/json",
    body:JSON.stringify({error:"STALE_MESSAGE"})});
  });
  await page.goto(fixture);
  const section=page.locator('[data-ux-fixture="rename"]');
  await section.getByRole("button",{name:"Rename conversation"}).click();
  const input=section.getByRole("textbox",{name:"Conversation name"});
  await input.fill("Campus team 2027");
  await section.getByRole("button",{name:"Save",exact:true}).click();
  await expect(section.getByText(/renamed elsewhere/)).toBeVisible();
  await expect(input).toHaveValue("Campus team 2027");
  expect(attempts).toBe(1);
  await section.getByRole("button",{name:"Cancel"}).click();
  await expect(section.getByRole("button",{name:"Rename conversation"})).toHaveAttribute("aria-expanded","false");
  await screenshot(page,info,viewport.name+"-rename");
 });
 test("UX-G159 "+viewport.name+" checks exactly which 25 recipients are selected",async({page},info)=>{
  await page.setViewportSize(viewport);
  await page.goto(fixture);
  const section=page.locator('[data-ux-fixture="nudge"]');
  const all=section.getByRole("checkbox",{name:"Select first 25 on this page"});
  await all.check();
  await expect(all).toBeChecked();
  await section.getByRole("checkbox",{name:"Learner 25",exact:true}).uncheck();
  await section.getByRole("checkbox",{name:"Learner 26",exact:true}).check();
  await expect(section.getByRole("status")).toContainText("25 selected");
  await expect(all).not.toBeChecked();
  await all.check();
  await expect(section.getByRole("checkbox",{name:"Learner 25",exact:true})).toBeChecked();
  await expect(section.getByRole("checkbox",{name:"Learner 26",exact:true})).not.toBeChecked();
  await screenshot(page,info,viewport.name+"-nudge");
 });
 test("UX-G159 "+viewport.name+" shows stale message edit and delete errors in dialogs",async({page},info)=>{
  await page.setViewportSize(viewport);
  const actions:string[]=[];
  await page.route("**/api/placements/tpo/team/threads/*/messages/*/change",async route=>{
   const payload=route.request().postDataJSON() as {action:string;expectedBodyHash:string;body?:string};
   actions.push(payload.action);
   expect(payload.expectedBodyHash).toBe("fixture-message-hash");
   await route.fulfill({status:409,contentType:"application/json",body:JSON.stringify({error:"STALE_MESSAGE"})});
  });
  await page.goto(fixture);
  const section=page.locator('[data-ux-fixture="message"]');
  await section.getByRole("button",{name:"Edit",exact:true}).click();
  const edit=page.getByRole("dialog",{name:"Edit message"});
  await edit.getByRole("textbox",{name:"Edit message"}).fill("Updated team message");
  await edit.getByRole("button",{name:"Save edit"}).click();
  await expect(edit.getByText(/message changed or the edit window ended/)).toBeVisible();
  await expect(edit.getByRole("textbox",{name:"Edit message"})).toHaveValue("Updated team message");
  await edit.getByRole("button",{name:"Cancel"}).click();
  await section.getByRole("button",{name:"Delete",exact:true}).click();
  const deletion=page.getByRole("alertdialog",{name:"Delete this message?"});
  await deletion.getByRole("button",{name:"Delete message"}).click();
  await expect(deletion.getByText(/message changed or the edit window ended/)).toBeVisible();
  await expect(deletion).toBeVisible();
  expect(actions).toEqual(["EDIT","DELETE"]);
  await screenshot(page,info,viewport.name+"-message");
 });
}
