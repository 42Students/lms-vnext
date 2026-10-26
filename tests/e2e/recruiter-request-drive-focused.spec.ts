import {test,expect} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {expectNoRawErrors} from "./support/no-raw-error";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const college="20000000-0000-4000-8000-000000000001";

test.describe("Recruiter Request Drive: real seeded workflow",()=>{
 test.skip(!enabled,"Requires disposable DB and verified recruiter");

 test("follows latest four-step prototype and validates before sending",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto("/hr/drives/new?collegeId="+college);
  for(const heading of ["1 · The role","2 · Pay","3 · Who can apply","4 · Rounds","What happens next"]){
   await expect(page.getByRole("heading",{name:heading})).toBeVisible({timeout:20_000});
  }
  await expect(page.getByRole("button",{name:"Send for review"}).first()).toBeDisabled();
  await expectNoRawErrors(page);
 });

 test("valid recruiter request goes to college review, never auto-publishes",async({page,context})=>{
  await authenticateGracefulRole(context,"recruiter");
  await page.goto("/hr/drives/new?collegeId="+college);
  await page.locator('[data-draft-field="title"]').fill("E2E Specialist Analyst Position");
  await page.locator('[data-draft-field="ctcLpa"]').fill("9.50");
  const send=page.getByRole("button",{name:"Send for review"}).first();
  await expect(send).toBeEnabled();
  const [response]=await Promise.all([
   page.waitForResponse(r=>r.url().includes("/api/placements/recruiter/drives/requests")&&r.request().method()==="POST"),
   send.click(),
  ]);
  const payload=await response.json() as {request?:{status?:string;id?:string;approvedJobId?:string|null};error?:string};
  expect(response.status(),"Request API must persist the candidate, not silently fail: "+JSON.stringify(payload)).toBeGreaterThanOrEqual(200);
  expect(response.status(),"Request API refused a valid role and pay: "+JSON.stringify(payload)).toBeLessThan(300);
  expect(payload.request?.id).toBeTruthy();
  expect(["REQUEST","DRAFT"]).toContain(payload.request?.status);
  if(payload.request?.status==="REQUEST"){
   await expect(page.getByRole("heading",{name:"Request sent"})).toBeVisible({timeout:20_000});
   await expect(page.getByText(/placement cell will review/i)).toBeVisible();
  }else{
   await expect(page.getByRole("heading",{name:"Drive approved"})).toBeVisible({timeout:20_000});
   // Even policy-approved drives start DRAFT; the TPO controls publication.
   expect(payload.request?.approvedJobId).toBeTruthy();
  }
  // Both pending requests and policy-approved draft jobs belong to WAITING.
  // DRAFT is a persisted request status, not a valid drive-list query view.
  await page.goto("/hr/drives?collegeId="+college+"&view=WAITING");
  await expect(page.getByText("E2E Specialist Analyst Position",{exact:false}).first()).toBeVisible();
  await expectNoRawErrors(page);
 });
});
