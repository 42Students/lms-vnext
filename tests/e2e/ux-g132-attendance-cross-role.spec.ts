import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const sizes=[{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const;
const checkViewport=async(page:import("@playwright/test").Page)=>
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);

test.describe("UX-G132 attendance controls: real role and responsive acceptance",()=>{
  test.skip(!enabled,"Requires disposable seeded PostgreSQL and ephemeral test-role credentials");
  for(const size of sizes){
    test(`college ${size.name}: attendance overview and policy navigation`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"college");
      await page.setViewportSize(size);
      await page.goto("/college/attendance");
      await expect(page.getByRole("heading",{level:1,name:"Attendance"})).toBeVisible();
      await expect(page.getByRole("navigation",{name:"Attendance views"}).getByRole("link",{name:"Attendance policy"})).toBeVisible();
      await checkViewport(page);
      await page.screenshot({path:info.outputPath(`college-attendance-${size.name}.png`),fullPage:true});
    });

    test(`learner ${size.name}: own attendance and malformed-link recovery`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize(size);
      await page.goto("/learn/attendance");
      await expect(page.getByRole("heading",{level:1,name:"Attendance"})).toBeVisible();
      await checkViewport(page);
      await page.goto("/learn/attendance?deliveryId=not-a-uuid");
      await expect(page.getByText("Invalid course attendance link")).toBeVisible();
      await expect(page.getByRole("link",{name:"View my attendance"})).toHaveAttribute("href","/learn/attendance");
      await checkViewport(page);
      await page.screenshot({path:info.outputPath(`learner-invalid-course-${size.name}.png`),fullPage:true});
    });

    test(`faculty ${size.name}: assigned course attendance and editor access`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"faculty");
      await page.setViewportSize(size);
      await page.goto("/teacher/courses");
      await page.getByRole("link",{name:/E2E Browser Course/}).first().click();
      await expect(page).toHaveURL(new RegExp("/teacher/courses/[0-9a-f-]{36}/home$","i"));
      const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
      await page.goto("/teacher/courses/"+deliveryId+"/attendanceDetail");
      await expect(page.getByRole("region",{name:"Faculty prototype attendance"})).toBeVisible();
      await expect(page.locator("#faculty-attendance-scheduling")).toHaveCount(1);
      await checkViewport(page);
      await page.screenshot({path:info.outputPath(`faculty-attendance-${size.name}.png`),fullPage:true});
    });

    test(`superadmin ${size.name}: attendance scoped or college selection required`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"superadmin");
      await page.setViewportSize(size);
      await page.goto("/admin/attendance");
      // A platform-wide actor without an active college must not see a
      // fabricated tenant attendance grid. A selected college gets the page.
      await expect(page.getByText("Choose a college in the header above to see its attendance.").or(
        page.getByRole("heading",{level:1,name:"Attendance"})).first()).toBeVisible();
      await checkViewport(page);
      await page.screenshot({path:info.outputPath(`superadmin-attendance-${size.name}.png`),fullPage:true});
    });

    test(`learner ${size.name}: cannot manage college attendance policy`,async({page,context},info)=>{
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize(size);
      await page.goto("/college/attendance/settings",{waitUntil:"commit"});
      await expect(page.getByRole("button",{name:/Save policy|Reset to default/i})).toHaveCount(0);
      await expect(page.getByRole("heading",{name:"College attendance policy",exact:true})).toHaveCount(0);
      await checkViewport(page);
      await page.screenshot({path:info.outputPath(`learner-policy-denied-${size.name}.png`),fullPage:true});
    });
  }
});
