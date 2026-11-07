import {expect,test} from "@playwright/test";
import {readFile} from "node:fs/promises";
const examples=[
  {title:"Batch export",filename:"batches.csv",header:"batchName",payload:"\u093E=SUM(1)"},
  {title:"Semester export",filename:"semesters.csv",header:"Total credits",payload:"\u20DD@BAD"},
  {title:"Class export",filename:"classes.csv",header:"Class/Section Name",payload:"\u093E+FORMULA"},
  {title:"Lecture hall export",filename:"lecture-halls.csv",header:"Configured seats",payload:"\u093E=BAD"},
] as const;
for(const viewport of [
 {name:"desktop",width:1280,height:800},
 {name:"mobile",width:390,height:844},
]){
 test("UX-G166 "+viewport.name+" files are readable, safe and downloadable",async({page},testInfo)=>{
  await page.setViewportSize(viewport);
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/e2e/ux-g166-academic-csv");
  await expect(page.getByRole("heading",{name:"Academic CSV quality check"})).toBeVisible();
  await expect(page.getByText(/Synthetic examples only/)).toBeVisible();
  for(const example of examples){
   const card=page.getByRole("heading",{name:example.title}).locator("..");
   const action=card.getByRole("link",{name:"Download example CSV"});
   await expect(action).toHaveAttribute("download",example.filename);
   expect((await action.boundingBox())?.height??0).toBeGreaterThanOrEqual(44);
   const [download]=await Promise.all([page.waitForEvent("download"),action.click()]);
   expect(download.suggestedFilename()).toBe(example.filename);
   const downloadPath=await download.path();
   expect(downloadPath).not.toBeNull();
   const csv=await readFile(downloadPath!,"utf8");
   expect(csv.startsWith("\uFEFF")).toBe(true);
   expect(csv).toContain(example.header);
   expect(csv).toContain("'"+example.payload);
   if(example.filename==="classes.csv")expect(csv).toContain("EXPORT TRUNCATED");
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width+1);
  await page.screenshot({path:testInfo.outputPath("academic-csv-"+viewport.name+".png"),fullPage:true});
  expect(errors).toEqual([]);
 });
}
