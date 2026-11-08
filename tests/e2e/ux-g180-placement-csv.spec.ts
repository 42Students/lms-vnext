import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const samples = [
 ["Cohort decision history","cohort-history.csv","Action ID"],
 ["Batch student view","batch-students.csv","Effective decision"],
 ["Company drive history","company-drives.csv","Not recorded"],
 ["Company engagement","engagement.csv","Recorded drives (selected scope)"],
] as const;
for(const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("UX-G180 "+viewport.name+" placement CSV downloads",async({page},testInfo)=>{
  await page.setViewportSize(viewport);
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/e2e/ux-g180-placement-csv");
  await expect(page.getByRole("heading",{name:"Placement CSV quality check"})).toBeVisible();
  await expect(page.getByText("No actual learner or company data.",{exact:false})).toBeVisible();
  for(const [title,file,header] of samples){
   const card=page.getByRole("heading",{name:title}).locator("..");
   const link=card.getByRole("link",{name:"Download example CSV"});
   await expect(link).toHaveAttribute("download",file);
   expect((await link.boundingBox())?.height??0).toBeGreaterThanOrEqual(44);
   const [download]=await Promise.all([page.waitForEvent("download"),link.click()]);
   expect(download.suggestedFilename()).toBe(file);
   const path=await download.path();expect(path).not.toBeNull();
   const csv=await readFile(path!,"utf8");
   expect(csv).toContain(header);expect(csv).toContain("'\u093E=FORMULA(1)");
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width+1);
  await page.screenshot({path:testInfo.outputPath("ux-g180-"+viewport.name+".png"),fullPage:true});
  expect(errors).toEqual([]);
 });
}
