import { expect, test } from "@playwright/test";
for(const viewport of [
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const){
 test("UX-G059 "+viewport.name+" learner assessment recovery and pagination",async({page},info)=>{
   await page.setViewportSize(viewport);
   const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto("/e2e/ux-learner-assessments");
   const recovery=page.getByRole("region",{name:"Assessment page recovery"});
   await expect(recovery).not.toContainText("PRIVATE_ERROR_DO_NOT_DISPLAY");
   await expect(recovery.getByRole("link",{name:/Back to Courses|Courses/i}).first())
     .toHaveAttribute("href","/learn/courses");
   await recovery.getByRole("button",{name:"Retry"}).first().click();
   await expect(page.getByTestId("learner-retry-count")).toContainText("Retry attempts: 1");
   await expect(recovery.getByRole("link",{name:"All Quizzes"})).toHaveAttribute("href","/learn/allQuizzes");
   const loading=page.getByRole("region",{name:"Assessment loading states"});
   await expect(loading.getByRole("status")).toHaveCount(2);
   const pagination=page.getByRole("region",{name:"Stale filtered page recovery"});
   await expect(pagination.getByText("Requested page: 8 · Actual last page: 2")).toBeVisible();
   await expect(pagination.getByRole("link",{name:"Return to last authorized page"}))
     .toHaveAttribute("href","/learn/allAssignments?course=123e4567-e89b-42d3-a456-426614174000&page=2");
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.screenshot({path:info.outputPath("ux-g059-"+viewport.name+".png"),fullPage:true});
   expect(errors).toEqual([]);
 });
}
