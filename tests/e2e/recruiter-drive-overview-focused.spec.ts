import {test,expect} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {expectNoRawErrors} from "./support/no-raw-error";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const url="/recruiter/drives/66000000-0000-4000-8000-000000000004?tab=overview";

test.describe("Recruiter Drive Overview: newest six-stage prototype",()=>{
 test.skip(!enabled,"Needs verified employer with persisted hiring drive");

 test("progress cannot claim Completed before official close",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto(url);
  const progress=page.getByRole("list",{name:"Drive progress"});
  await expect(progress).toBeVisible();
  const stages=progress.getByRole("listitem");
  await expect(stages).toHaveCount(6);
  const captions=await stages.locator("span").allTextContents();
  expect(captions.some(label=>label==="Requested")).toBe(true);
  expect(captions.some(label=>label==="Approved")).toBe(true);
  expect(captions.some(label=>label==="Applications")).toBe(true);
  expect(captions.some(label=>label==="Offers")).toBe(true);
  expect(captions.some(label=>label==="Completed")).toBe(true);
  await expect(progress.getByText("Completed",{exact:true})).toBeVisible();
  const completed=stages.filter({hasText:"Completed"});
  await expect(completed.getByText("Upcoming")).toBeVisible();
  await expect(page.getByRole("heading",{name:"Hiring pipeline"})).toBeVisible();
  await expectNoRawErrors(page);
 });

 test("student-facing facts remain reference-only and restricted to this employer",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto(url);
  const student=page.locator('[aria-label="What students see"]');
  await expect(student).toBeVisible();
  await expect(student.locator("details")).toHaveAttribute("open","");
  await expect(student.getByText(/Exact publication and application access are controlled by the placement cell/i)).toBeVisible();
  await expect(page.getByRole("link",{name:"Review applicants"}).first()).toHaveAttribute("href",/tab=applicants/);
  await expectNoRawErrors(page);
 });
});
