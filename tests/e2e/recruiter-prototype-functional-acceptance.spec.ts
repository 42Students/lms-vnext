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
  await expect(page.getByRole("heading",{name:"Messages"})).toBeVisible();
  await expectNoRawErrors(page);
 });

 test("Company & Team keeps verified employer facts, hiring report and request-only invitations",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto("/hr/company");
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
  await expectNoRawErrors(page);
 });

 test("Rounds and Offers show scoped scheduling and selection workspaces",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto("/hr/drives");
  const candidates=await page.locator('a[href^="/recruiter/drives/"]').evaluateAll(links=>links
   .map(link=>link.getAttribute("href")??"")
   .filter(href=>/^\/recruiter\/drives\/[0-9a-f-]{36}(?:[?#]|$)/i.test(href)));
  test.skip(candidates.length===0,"Seed has no recruiter-visible drive");
  const drive=candidates[0]!.split(/[?#]/)[0]!;
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
