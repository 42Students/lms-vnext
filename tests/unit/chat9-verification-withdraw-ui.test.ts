import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("learner UPDATE_PENDING real withdraw action",()=>{
 it("only renders on UPDATE_PENDING and passes current row version",()=>{
  const page=readFileSync(join(process.cwd(),
   "src/app/(authenticated)/learn/profile/verification/page.tsx"),"utf8");
  expect(page).toContain('row.status === "UPDATE_PENDING"');
  expect(page).toContain("LearnerVerificationWithdraw");
  expect(page).toContain("expectedVersion={row.version}");
 });
 it("requires confirmation and handles stale-row 409 without repeat submits",()=>{
  const src=readFileSync(join(process.cwd(),
   "src/components/profile/learner-verification-withdraw.tsx"),"utf8");
  expect(src).toContain("if(!confirm||pending||stale)return");
  expect(src).toContain("/api/profile-verification/self/withdraw");
  expect(src).toContain("response.status===409");
  expect(src).toContain('body:JSON.stringify({section,expectedVersion})');
  expect(src).not.toContain("learnerMembershipId:");
 });
});
