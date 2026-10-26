import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {expectNoRawErrors} from "./support/no-raw-error";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const job="E2E Prototype Software Engineer";

test.describe("Recruiter Drives: latest prototype and legacy authorized list",()=>{
 test.skip(!enabled,"Requires disposable PostgreSQL and verified recruiter fixture");

 test("the published employer-owned drive is visible, scoped and opens",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto("/hr/drives?view=ALL");
  await expect(page.getByRole("heading",{level:1,name:/^Drives at /})).toBeVisible();
  await expect(page.getByRole("heading",{name:job})).toBeVisible();
  await expect(page.getByRole("link",{name:job})).toHaveAttribute("href",/\/recruiter\/drives\//);
  await expectNoRawErrors(page);
 });

 test("lifecycle and search filters cannot invent a completed or foreign drive",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto("/hr/drives?view=LIVE");
  await expect(page.getByRole("heading",{name:job})).toBeVisible();
  await page.goto("/hr/drives?view=CLOSED");
  await expect(page.getByRole("heading",{name:job})).toHaveCount(0);
  await page.goto("/hr/drives?view=ALL&q=NoSuchEmployerPrivateRole");
  await expect(page.getByRole("heading",{name:job})).toHaveCount(0);
  await expect(page.getByText("No drives match this search")).toBeVisible();
  await expectNoRawErrors(page);
 });
});
