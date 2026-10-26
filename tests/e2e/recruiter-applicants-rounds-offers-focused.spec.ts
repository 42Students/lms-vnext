import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {expectNoRawErrors} from "./support/no-raw-error";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const drive="/recruiter/drives/66000000-0000-4000-8000-000000000004";

test.describe("Recruiter Applicants, Rounds and Offers: prototype 05–07",()=>{
 test.skip(!enabled,"Needs isolated, verified recruiter employer grant");

 test("Applicants hides unshared learner identities and has no fabricated queue",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto(drive+"?tab=applicants");
  await expect(page.getByRole("heading",{name:"Shared applicants"})).toBeVisible();
  await expect(page.getByText("Applicants have not been shared")).toBeVisible();
  await expect(page.getByRole("link",{name:"Review one by one"})).toHaveCount(0);
  await expect(page.getByText(/Only placement-cell-shortlisted applicants are visible/)).toBeVisible();
  await expectNoRawErrors(page);
 });

 test("an arbitrary application identifier never becomes a focused review",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto(drive+"?tab=applicants&review=1&applicant=66000000-0000-4000-8000-000000000099");
  await expect(page.getByRole("dialog",{name:"Focused review"})).toHaveCount(0);
  await expect(page.getByText("E2E Verified Applicant",{exact:true})).toHaveCount(0);
 });

 test("Rounds keeps interview slots, employer proposals and official bookings distinct",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto(drive+"?tab=rounds");
  await expect(page.getByRole("heading",{name:"Who, when · interview panel lists"})).toBeVisible();
  await expect(page.getByText(/Only placement-cell-booked, actively shortlisted applicants/)).toBeVisible();
  await expect(page.getByRole("link",{name:"Change your time plan"})).toHaveAttribute("href",/interview-slots/);
  await expect(page.getByRole("heading",{name:"Scheduled rounds and potential time conflicts"})).toBeVisible();
  await expectNoRawErrors(page);
 });

 test("Offers distinguishes recruiter proposal from a released offer or recorded joining",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto(drive+"?tab=offers");
  await expect(page.getByRole("heading",{name:"Send your selection list"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Students answer"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Joining"})).toBeVisible();
  await expect(page.getByText(/a recruiter selection is not an offer/i)).toBeVisible();
  await expect(page.getByRole("heading",{name:"Selection readiness across all rounds"})).toBeVisible();
  await expectNoRawErrors(page);
 });
});
