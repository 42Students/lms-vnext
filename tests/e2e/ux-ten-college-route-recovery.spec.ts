import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
const cases=[
  {id:"G030",name:"Batch promotion",link:"Back to batches",href:"/college/batches"},
  {id:"G031",name:"College profile",link:"College contacts",href:"/college/contacts"},
  {id:"G032",name:"College courses",link:"College home",href:"/college"},
  {id:"G033",name:"Elective allocation",link:"Back to elective slots",href:"/college/electives"},
  {id:"G034",name:"Student groups",link:"College home",href:"/college"},
  {id:"G035",name:"Lecture hall",link:"Back to lecture halls",href:"/college/lecture-halls"},
  {id:"G037",name:"Placement job",link:"Go to home",href:"/college/placements"},
  {id:"G038",name:"New placement",link:"Go to home",href:"/college/placements"},
  {id:"G039",name:"College projects",link:"Go to home",href:"/college/projects"},
  {id:"G040",name:"Project audit",link:"Go to home",href:"/college/projects"},
] as const;
for(const size of [{label:"narrow-mobile",width:320,height:640},{label:"mobile",width:390,height:844},{label:"desktop",width:1280,height:800}] as const){
  test("ten College Admin fallback controls at "+size.label,async({page},info)=>{
    await page.setViewportSize(size);
    const failures:string[]=[];
    page.on("pageerror",error=>failures.push(error.message));
    await page.goto("/e2e/ux-ten-college-recovery");
    await expect(page.getByRole("heading",{name:"College route recovery acceptance"})).toBeVisible();
    await expect(page.getByRole("region",{name:"Lecture hall loading recovery"}).getByRole("link",{name:"All lecture halls"})).toHaveAttribute("href","/college/lecture-halls");
    for(const item of cases){
      const region=page.getByRole("region",{name:item.name+" recovery"});
      await expect(region.getByRole("link",{name:item.link})).toHaveAttribute("href",item.href);
      const button=region.getByRole("button",{name:/^(Retry|Try again)$/});
      await button.click();
      await expect(region.getByRole("status")).toContainText(item.id+" retry count: 1");
      expect((await button.boundingBox())?.height??0).toBeGreaterThanOrEqual(size.width<768?44:36);
    }
    const unexpectedCourse=page.getByRole("region",{name:"Course progress unknown failure"});
    await expect(unexpectedCourse.getByText("Course progress unavailable",{exact:true})).toBeVisible();
    await expect(unexpectedCourse).toContainText("Course progress report could not be loaded");
    await expect(unexpectedCourse.getByRole("link",{name:"College home"})).toHaveAttribute("href","/college");
    await unexpectedCourse.getByRole("button",{name:"Retry"}).click();
    await expect(unexpectedCourse.getByRole("status")).toHaveText("Unknown course retry count: 1");

    const metadataCourse=page.getByRole("region",{name:"Course progress metadata failure"});
    await expect(metadataCourse.getByText("Course-progress filters unavailable",{exact:true})).toBeVisible();
    await expect(metadataCourse).toContainText("Some course-progress filters could not be loaded");
    await metadataCourse.getByRole("button",{name:"Retry"}).click();
    await expect(metadataCourse.getByRole("status")).toHaveText("Metadata course retry count: 1");

    // Genuine user-visible fallback content, not raw error.message or digest.
    await expect(page.locator("body")).not.toContainText("student@example.invalid");
    await expect(page.locator("body")).not.toContainText("sensitive-value");
    await expect(page.locator("body")).not.toContainText("sensitive-digest-value");
    await expect(page.locator("body")).not.toContainText("COURSE_PROGRESS_FILTERS_UNAVAILABLE");
    await expect(page.locator("body")).not.toContainText("Synthetic development-only route failure");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(failures).toEqual([]);
    await page.screenshot({path:info.outputPath("college-recovery-"+size.label+".png"),fullPage:true});
  });
  test("learner denied College Admin placement creation at "+size.label,async({page,context},info)=>{
    test.skip(process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_AUTH_SECRET,"Requires disposable seeded E2E role");
    await page.setViewportSize(size);
    await authenticateGracefulRole(context,"learner");
    await page.goto("/college/placements/new",{waitUntil:"domcontentloaded"});
    await expect(page).toHaveURL(/\/dashboard(?:[?#]|$)/,{timeout:15000});
    await expect(page.getByRole("button",{name:/Create (?:job|drive|placement)/i})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:info.outputPath("college-denied-"+size.label+".png"),fullPage:true});
  });
}
