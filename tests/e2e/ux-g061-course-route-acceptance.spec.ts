import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";

const viewports=[
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const;

test.describe("UX-G061 learner course route acceptance",()=>{
  test.skip(!process.env.E2E_AUTH_SECRET,"Authenticated browser E2E requires the disposable E2E identity harness");

  for(const viewport of viewports){
    test(`${viewport.name}: real learner course route and safe unknown-course recovery`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      await page.goto("/learn/courses");
      await expect(page.getByRole("heading",{level:1,name:"Courses"})).toBeVisible();
      const course=page.getByRole("link",{name:/E2E Browser Course/});
      const href=await course.getAttribute("href");
      expect(href).toMatch(/^\/learn\/courses\/[0-9a-f-]{36}\/home$/i);
      await page.goto(href!);
      await expect(page.getByRole("heading",{level:1,name:"E2E Browser Course"})).toBeVisible();
      for(const tab of ["Overview","Learning Path","Attendance","Discussions"])
        await expect(page.getByRole("link",{name:tab,exact:true})).toBeVisible();
      await expect(page.getByText("E2E Section B Secret",{exact:true})).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const pageCapture=await page.screenshot({fullPage:true});
      await info.attach(`g061-course-${viewport.name}`,{body:pageCapture,contentType:"image/png"});

      await page.goto("/learn/courses/00000000-0000-4000-8000-000000000000/home");
      await expect(page.getByRole("heading",{level:1,name:"Course unavailable"})).toBeVisible();
      await expect(page.getByRole("link",{name:"Back to Courses"})).toHaveAttribute("href","/learn/courses");
      await expect(page.getByText("E2E Section A Notes",{exact:true})).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const recoveryCapture=await page.screenshot({fullPage:true});
      await info.attach(`g061-course-recovery-${viewport.name}`,{body:recoveryCapture,contentType:"image/png"});
    });
  }

  test("a non-learner cannot read the seeded learner course delivery",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    await page.goto("/learn/courses");
    const href=await page.getByRole("link",{name:/E2E Browser Course/}).getAttribute("href");
    expect(href).toMatch(/^\/learn\/courses\/[0-9a-f-]{36}\/home$/i);
    await authenticateGracefulRole(context,"faculty");
    await page.goto(href!);
    await expect(page.getByText("E2E Section A Notes",{exact:true})).toHaveCount(0);
    await expect(page.getByText("E2E Section B Secret",{exact:true})).toHaveCount(0);
  });
});
