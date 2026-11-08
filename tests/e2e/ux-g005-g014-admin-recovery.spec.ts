import {expect,test,type Page} from "@playwright/test";

const fixture="/e2e/ux-g005-g014-admin-recovery";
const viewports=[
 {name:"desktop",width:1280,height:800},
 {name:"mobile",width:390,height:844},
] as const;

async function checkNoHorizontalOverflow(page:Page){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
}

for(const viewport of viewports){
 test("UX-G005/G006 actual route errors recover on "+viewport.name,async({page},info)=>{
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.route("**/api/client-errors",route=>route.fulfill({status:204,body:""}));
  await page.goto(fixture);
  const academics=page.getByRole("region",{name:"Academic section recovery"});
  await expect(academics.getByRole("link",{name:"Go to home"}))
   .toHaveAttribute("href","/admin/academics");
  await expect(academics.getByRole("button",{name:"Try again"})).toBeVisible();
  await academics.getByRole("button",{name:"Try again"}).click();
  await expect(academics.getByTestId("section-retries")).toHaveText("Academic retries: 1");

  const audit=page.getByRole("region",{name:"Audit log recovery"});
  await expect(audit.getByText(/No empty or partial history is shown/)).toBeVisible();
  await expect(audit.getByRole("link",{name:"Back to Super Admin"}))
   .toHaveAttribute("href","/admin");
  await audit.getByRole("button",{name:"Retry audit log"}).click();
  await expect(audit.getByTestId("audit-retries")).toHaveText("Audit retries: 1");
  await checkNoHorizontalOverflow(page);
  await page.screenshot({path:info.outputPath("ux-admin-recovery-"+viewport.name+".png"),fullPage:true});
  expect(errors).toEqual([]);
 });
}
