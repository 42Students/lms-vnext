import { expect,test } from "@playwright/test";
for(const viewport of [
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const){
 test("UX-G070 "+viewport.name+" mentor project-specific recovery",async({page},info)=>{
  await page.setViewportSize(viewport);
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/e2e/ux-mentor-route-recovery");
  const base="/mentor/projects/123e4567-e89b-42d3-a456-426614174000";
  const board=page.getByRole("region",{name:"Mentor board filters"});
  await expect(board.getByRole("link",{name:"Clear filters and retry"}))
    .toHaveAttribute("href",base+"/board-review");
  await expect(board.getByRole("link",{name:"Back to this project"}))
    .toHaveAttribute("href",base);
  const activity=page.getByRole("region",{name:"Mentor activity filters"});
  await expect(activity.getByRole("link",{name:"Clear filters and retry"}))
    .toHaveAttribute("href",base+"/activity-history");
  const notices=page.getByRole("region",{name:"Mentor notifications failed"});
  await expect(notices).not.toContainText("PRIVATE_PROVIDER_FAILURE");
  await expect(notices.getByRole("link",{name:"My projects"})).toHaveAttribute("href","/mentor/projects");
  await notices.getByRole("button",{name:"Retry notifications"}).click();
  await expect(page.getByTestId("mentor-retry-count")).toContainText("Retry attempts: 1");
  const boardError=page.getByRole("region",{name:"Mentor board failed"});
  await expect(boardError.getByRole("button",{name:"Retry board"})).toBeVisible();
  await expect(page.getByRole("region",{name:"Mentor loading state"}).getByRole("status")).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath("ux-g070-"+viewport.name+".png"),fullPage:true});
  expect(errors).toEqual([]);
 });
}
