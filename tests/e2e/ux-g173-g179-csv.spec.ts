import {expect,test} from "@playwright/test";
import {readFile} from "node:fs/promises";

// First-run Next.js hydration must finish before a click can produce Blob bytes.
// Serialize the two viewports to avoid first-start development-server contention.
test.describe.configure({mode:"serial"});

const exportsToCheck=[
 ["College content","college-content.csv",false],
 ["Lesson content","legacy-lesson-content.csv",false],
 ["Recruiter applicants","recruiter-applicants.csv",true],
 ["Recruiter activity","recruiter-activity.csv",true],
 ["Recruiter calendar","recruiter-calendar.csv",true],
 ["Recruiter reports","recruiter-reports.csv",true],
 ["Recruiter proposals","recruiter-proposals.csv",true],
 ["Recruiter drives","recruiter-drives.csv",true],
 ["Recruiter inbox","recruiter-inbox.csv",true],
 ["Recruiter offers","recruiter-offers.csv",true],
 ["Recruiter team","recruiter-team.csv",true],
 ["Company-share audit","company-share-audit.csv",true],
 ["No proposal history","empty-proposals.csv",true],
 ["Team export cap","capped-team.csv",true],
] as const;
const unsafe="\u093E=HYPERLINK(1,2)";

for(const viewport of [
 {name:"desktop",width:1280,height:800},
 {name:"mobile",width:390,height:844},
] as const) {
 test("UX-G173/G179 "+viewport.name+" downloads fourteen legible CSV fixtures",async({page},testInfo)=>{
  test.setTimeout(120_000);
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  const pageErrors:string[]=[];
  page.on("pageerror",error=>pageErrors.push(error.message));
  const response=await page.goto("/e2e/ux-g173-g179-csv");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading",{
    name:"College and recruiter export quality check",
  })).toBeVisible();
  await expect(page.getByText("No live college, learner or recruiter data.",
    {exact:false})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width+1);
  for(const [title,filename,requiresBom] of exportsToCheck){
   const card=page.getByRole("heading",{name:title}).locator("..");
   const action=card.getByRole("button",{name:"Download sample CSV"});
   await expect(action).toHaveAttribute("data-filename",filename);
   await expect(action).toHaveAttribute("data-ready","true");
   expect((await action.boundingBox())?.height??0,filename).toBeGreaterThanOrEqual(44);
   const [download]=await Promise.all([page.waitForEvent("download"),action.click()]);
   expect(download.suggestedFilename()).toBe(filename);
   const diskPath=await download.path();
   expect(diskPath,filename).not.toBeNull();
   const csv=await readFile(diskPath!,"utf8");
   expect(csv,filename).toContain('","');
   if(requiresBom)expect(csv.startsWith("\uFEFF"),filename).toBe(true);
   if(filename==="empty-proposals.csv"){
    expect(csv.split("\r\n")).toHaveLength(2);
   }else{
    expect(csv,filename).toContain("'"+unsafe);
    expect(csv,filename).not.toContain('"'+unsafe);
   }
   if(filename==="capped-team.csv")
    expect(csv).toContain("Additional authorized teammates omitted");
   if(filename==="recruiter-applicants.csv")
    expect(csv).not.toContain("private@example.invalid");
  }
  await page.screenshot({path:testInfo.outputPath("ux-g173-g179-"+viewport.name+".png"),fullPage:true});
  expect(pageErrors).toEqual([]);
 });
}
