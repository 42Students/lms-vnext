import {expect,test} from "@playwright/test";

const cases=[
 {id:"UX-G030",title:"Batch promotion",link:"Back to batches",href:"/college/batches",retry:"Retry"},
 {id:"UX-G031",title:"Companies",link:"College home",href:"/college",retry:"Retry"},
 {id:"UX-G032",title:"Course offering",link:"Back to Courses",href:"/college/courses",retry:"Retry"},
 {id:"UX-G033",title:"Elective offering roster",link:"Elective slots",href:"/college/electives",retry:"Retry"},
 {id:"UX-G034",title:"Group import preview",link:"Student groups",href:"/college/groups",retry:"Retry"},
 {id:"UX-G035",title:"Lecture hall schedule",link:"Back to lecture halls",href:"/college/lecture-halls",retry:"Retry"},
 {id:"UX-G037",title:"Placement applications",link:"Placements",href:"/college/placements",retry:"Retry"},
 {id:"UX-G038",title:"Placement readiness by department",link:"Placements",href:"/college/placements",retry:"Retry"},
 {id:"UX-G039",title:"Project workspace",link:"All projects",href:"/college/projects",retry:"Retry workspace"},
 {id:"UX-G040",title:"Project audit",link:"Go to home",href:"/college/projects",retry:"Try again"},
] as const;

for(const viewport of [{name:"320",width:320,height:640},{name:"390",width:390,height:844},{name:"1280",width:1280,height:800}] as const){
 test("actual atomic College Admin fallback actions at "+viewport.name,async({page},info)=>{
  await page.setViewportSize(viewport);
  const pageErrors:string[]=[];
  page.on("pageerror",error=>pageErrors.push(error.message));
  await page.goto("/e2e/ux-ten-college-recovery");
  await expect(page.getByRole("heading",{name:"Atomic College Admin route recovery"})).toBeVisible();
  for(const item of cases){
   const region=page.getByRole("region",{name:item.id+" atomic recovery"});
   await expect(region.getByRole("heading",{name:item.title,exact:true})).toBeVisible();
   await expect(region.getByRole("link",{name:item.link})).toHaveAttribute("href",item.href);
   const retry=region.getByRole("button",{name:item.retry,exact:true});
   await expect(retry).toBeEnabled();
   const rect=await retry.boundingBox();
   expect(rect?.height??0,"Mobile recovery control should stay touch accessible").toBeGreaterThanOrEqual(viewport.width<768?44:36);
   await retry.focus();
   await page.keyboard.press("Enter");
   await expect(region.getByRole("status")).toContainText(item.id+" retry count: 1");
  }
  const body=page.locator("body");
  await expect(body).not.toContainText("tenant-secret-should-not-render");
  await expect(body).not.toContainText("private-error-digest-should-not-render");
  expect(pageErrors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
  await page.screenshot({path:info.outputPath("college-atomic-recovery-"+viewport.name+".png"),fullPage:true});
 });
}
