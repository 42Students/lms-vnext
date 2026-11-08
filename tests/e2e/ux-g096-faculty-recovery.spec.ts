import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const viewports=[
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const;
const id="11111111-1111-4111-8111-111111111111";

test.describe("UX-G096 Faculty profile and report navigation",()=>{
  test.skip(process.env.UX_G096_SEED!=="true","Requires isolated seeded E2E database");
  for(const viewport of viewports){
    test(viewport.name+" malformed Faculty profile query is recoverable",async({page,context},info)=>{
      await authenticateGracefulRole(context,"faculty");
      await page.setViewportSize(viewport);
      await page.goto("/teacher/profile/teaching?page=not-a-number");
      const invalid=page.getByRole("alert").filter({hasText:"Invalid teaching profile filters"});
      await expect(invalid).toBeVisible();
      await expect(invalid).toContainText("No teaching assignment records were loaded");
      await expect(invalid.getByRole("link",{name:"Clear filters"})).toHaveAttribute("href","/teacher/profile/teaching");
      await page.goto("/teacher/profile/teaching?search=hello&search=world");
      await expect(page.getByRole("alert").filter({hasText:"Invalid teaching profile filters"})).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:info.outputPath("g096-profile-recovery-"+viewport.name+".png"),fullPage:true});
    });
    test(viewport.name+" malformed Faculty assignment submissions recover in context",async({page,context},info)=>{
      await authenticateGracefulRole(context,"faculty");
      await page.setViewportSize(viewport);
      await page.goto("/teacher/report/assignment/"+id+"/submissions?deliveryId=invalid");
      const invalid=page.getByRole("alert").filter({hasText:"Invalid Section submission filters"});
      await expect(invalid).toBeVisible();
      await expect(invalid).toContainText("No learner submission records were loaded");
      await expect(invalid.getByRole("link",{name:"Open assignment report"}))
        .toHaveAttribute("href","/teacher/report/assignment/"+id);
      await expect(invalid.getByRole("link",{name:"Back to All Assignments"}))
        .toHaveAttribute("href","/teacher/allAssignments");
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:info.outputPath("g096-submission-recovery-"+viewport.name+".png"),fullPage:true});
    });
    test(viewport.name+" malformed Faculty assessment detail links offer safe parent lists",async({page,context})=>{
      await authenticateGracefulRole(context,"faculty");
      await page.setViewportSize(viewport);
      await page.goto("/teacher/report/assignment/not-valid");
      await expect(page.getByText("This assignment report link is not valid.")).toBeVisible();
      await expect(page.getByRole("link",{name:"Back to assignments"})).toHaveAttribute("href","/teacher/allAssignments");
      await page.goto("/teacher/report/quiz/not-valid");
      await expect(page.getByText("This quiz report link is no longer valid.")).toBeVisible();
      await expect(page.getByRole("link",{name:"Back to quizzes"})).toHaveAttribute("href","/teacher/allQuizzes");
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    });
  }
  test("negative: learner cannot access Faculty invalid filters or bookmark alias",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    await page.goto("/teacher/profile/teaching?page=INVALID");
    await expect(page.getByText("Invalid teaching profile filters")).toHaveCount(0);
    await page.goto("/teacher/profile/details?section=contacts");
    await expect(page).not.toHaveURL(/\/teacher\/profile#faculty-contact/);
    await page.goto("/teacher/report/assignment/"+id+"/submissions?deliveryId=bad");
    await expect(page.getByText("Invalid Section submission filters")).toHaveCount(0);
  });
});
