import { expect, test } from "@playwright/test";
for(const viewport of [
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const){
  test("UX-G080 "+viewport.name+" recruiter alias recovery",async({page},info)=>{
    await page.setViewportSize(viewport);
    const errors:string[]=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/api/client-errors",route=>route.fulfill({status:204}));
    await page.goto("/e2e/ux-recruiter-recovery");
    const missing=page.getByRole("region",{name:"Recruiter not found"});
    await expect(missing.getByRole("link",{name:"Go to recruiter Today"})).toHaveAttribute("href","/recruiter/home");
    const loading=page.getByRole("region",{name:"Recruiter loading examples"});
    await expect(loading.getByText("Opening recruiter Today…")).toBeVisible();
    await expect(loading.getByText("Loading recruiter drives…")).toBeVisible();
    const recovery=page.getByRole("region",{name:"Recruiter safe recovery"});
    await expect(recovery.getByRole("link",{name:"Go to home"})).toHaveAttribute("href","/recruiter/home");
    await expect(recovery).not.toContainText("SECRET_PROVIDER_ERROR");
    await recovery.getByRole("button",{name:"Try again"}).click();
    await expect(page.getByTestId("recruiter-retry-count")).toContainText("Retry attempts: 1");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath("ux-g080-"+viewport.name+".png"),fullPage:true});
    expect(errors).toEqual([]);
  });
}
