import { expect,test } from "@playwright/test";
for(const viewport of [
 {name:"desktop",width:1280,height:800},
 {name:"mobile",width:390,height:844},
] as const){
 test("UX-G081/G082 "+viewport.name+" recruiter drive context and recovery",async({page},info)=>{
  await page.setViewportSize(viewport);
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/api/client-errors",route=>route.fulfill({status:204}));
  await page.goto("/e2e/ux-recruiter-drive-journeys");
  const discussion=page.getByRole("region",{name:"Drive discussion continuity"});
  await expect(discussion.getByRole("link",{name:"Discussion and messages"})).toHaveAttribute("href",
    "/recruiter/drives/123e4567-e89b-42d3-a456-426614174000/messages");
  const drive=page.getByRole("region",{name:"Recruiter drive retry"});
  await expect(drive.getByRole("link",{name:"Go to home"})).toHaveAttribute("href","/recruiter/home");
  await expect(drive).not.toContainText("SENSITIVE_SOURCE_DO_NOT_DISPLAY");
  await drive.getByRole("button",{name:"Try again"}).click();
  await expect(page.getByTestId("recruiter-drive-retries")).toContainText("Retry attempts: 1");
  const profile=page.getByRole("region",{name:"Recruiter profile retry"});
  await expect(profile.getByRole("link",{name:"Go to home"})).toHaveAttribute("href","/recruiter/home");
  const loading=page.getByRole("region",{name:"Recruiter journey loading"});
  await expect(loading.getByText("Loading drive change requests…")).toBeVisible();
  await expect(loading.getByText("Loading drive proposals…")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath("ux-g081-g082-"+viewport.name+".png"),fullPage:true});
  expect(errors).toEqual([]);
 });
}
