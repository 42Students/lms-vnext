import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {expectNoRawErrors} from "./support/no-raw-error";

const enabled=Boolean(process.env.E2E_AUTH_SECRET&&
 process.env.E2E_AUTH_ENABLED==="true");

test.describe("Recruiter prototype functional journeys",()=>{
 test.skip(!enabled,"Requires an active seeded recruiter and verified college grant");

 test("Messages opens the two-pane authorized inbox and preserves advanced filters",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto("/hr/conversations");
  if(!(await page.getByTestId("recruiter.messages.workspace").count())){
   const college=page.locator('a[href^="/hr/conversations?collegeId="]').first();
   if(await college.count())await college.click();
  }
  const workspace=page.getByTestId("recruiter.messages.workspace");
  await expect(workspace).toBeVisible();
  await expect(workspace.getByRole("searchbox",{name:"Search by drive or message"})).toBeVisible();
  await expect(workspace.getByRole("navigation",{name:"Authorized conversations"})).toBeVisible();
  await expect(workspace.getByRole("link",{name:"Advanced inbox"})).toBeVisible();
  const threads=workspace.getByRole("navigation",{name:"Authorized conversations"}).locator("a");
  if(await threads.count()){
   await threads.first().click();
   await expect(page).toHaveURL(/thread=/);
   await expect(page.getByRole("region",{name:"Selected conversation"})).toBeVisible();
  }else{
   await expect(workspace.getByRole("button",{name:"Open general conversation"})).toBeVisible();
  }
  await page.getByRole("link",{name:"Advanced inbox"}).click();
  await expect(page).toHaveURL(/view=advanced/);
  await expect(page.getByRole("heading",{level:1,name:"Messages"}).first()).toBeVisible();
  await expectNoRawErrors(page);
 });

 test("Company & Team keeps verified employer facts, hiring report and request-only invitations",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto("/hr/company");
  if(!(await page.getByTestId("recruiter.company.prototype").count())){
   const college=page.locator('a[href^="/hr/company?collegeId="]').first();
   if(await college.count())await college.click();
  }
  const company=page.getByTestId("recruiter.company.prototype");
  await expect(company).toBeVisible();
  await expect(company.getByRole("region",{name:"Your company"})).toBeVisible();
  await expect(company.getByRole("region",{name:"Your team"})).toBeVisible();
  await expect(company.getByRole("region",{name:"Your hiring at this college"})).toBeVisible();
  await expect(company.getByText("Hiring for",{exact:true})).toBeVisible();
  const invite=company.getByRole("form",{name:"Request colleague invitation"});
  if(await invite.count()){
   await expect(invite.getByRole("button",{name:"Request invite"})).toBeDisabled();
   await expect(invite.getByRole("textbox",{name:"Colleague work email"})).toBeVisible();
  }else{
   await expect(company.getByText(/must verify your company email domain/i)).toBeVisible();
  }
  // Open the company correction request without submitting or altering
  // any verified data. The submit must remain disabled until explicit review.
  const edit=company.getByText("Edit company details",{exact:true});
  await expect(edit).toBeVisible();
  await edit.click();
  const correction=company.getByRole("form",{name:"Request company profile correction"});
  await expect(correction).toBeVisible();
  await expect(correction.getByRole("button",{name:"Send to placement cell"})).toBeDisabled();
  await correction.getByRole("textbox",{name:"Requested change"}).fill("Please update our company profile website.");
  await expect(correction.getByRole("button",{name:"Send to placement cell"})).toBeDisabled();
  await correction.getByRole("checkbox").check();
  await expect(correction.getByRole("button",{name:"Send to placement cell"})).toBeEnabled();
  const teammateChange=company.getByText("Change access",{exact:true}).first();
  if(await teammateChange.count()){
   await teammateChange.click();
   const teamForm=company.getByRole("form",{name:"Request teammate access change"}).first();
   await expect(teamForm.getByRole("button",{name:"Send to placement cell"})).toBeDisabled();
  }
  await expectNoRawErrors(page);
 });


 test("Drive progress and Next for you remain visible above all five prototype workspace tabs",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  const drive="/recruiter/drives/66000000-0000-4000-8000-000000000004";
  for(const tab of ["overview","applicants","rounds","offers","discussion"]){
   await page.goto(drive+"?tab="+tab);
   const banner=page.getByRole("region",{name:"Drive progress and next action"});
   await expect(banner).toBeVisible();
   await expect(banner.getByRole("heading",{name:"Next for you"})).toBeVisible();
   await expect(banner.getByRole("list",{name:"Drive progress"}).locator("li")).toHaveCount(6);
  }
  await expectNoRawErrors(page);
 });

 test("Rounds and Offers show scoped scheduling and selection workspaces",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  // The fixture is an exact persisted drive. URL discovery from the default
  // WAITING view does not exercise this authorized drive, and is not a grant.
  const drive="/recruiter/drives/66000000-0000-4000-8000-000000000004";
  await page.goto(drive+"?tab=rounds");
  await expect(page.getByRole("heading",{name:"Who, when · interview panel lists"})).toBeVisible();
  await expect(page.getByText(/Only placement-cell-booked, actively shortlisted applicants/)).toBeVisible();
  await page.goto(drive+"?tab=offers");
  await expect(page.getByRole("heading",{name:"Send your selection list"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Students answer"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Joining"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Selection readiness across all rounds"})).toBeVisible();
  const list=page.getByRole("region",{name:"Selection list"});
  await expect(list).toBeVisible();
  await expect(list.getByRole("button",{name:"Upload your list (Excel)"})).toBeVisible();
  await expect(list.getByRole("button",{name:"Pick from those who clear"})).toBeVisible();
  await expectNoRawErrors(page);
 });

 test("A learner cannot open the employer messaging workspace",async({page,context})=>{
  await authenticateGracefulRole(context,"learner");
  await page.goto("/hr/conversations");
  await expect(page).not.toHaveURL(/\/hr\/conversations/);
  await expect(page.getByTestId("recruiter.messages.workspace")).toHaveCount(0);
  await expectNoRawErrors(page);
 });
});
