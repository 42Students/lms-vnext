import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("DB04 registered migration 0081 live withdrawal boundary",()=>{
 it("requires a same-origin learner request with section and version only",()=>{
  const source=readFileSync(join(process.cwd(),
   "src/app/api/profile-verification/self/withdraw/route.ts"),"utf8");
  expect(source).toContain("isSameOriginRequest(request)");
  expect(source).toContain("z.strictObject");
  expect(source).toContain("withdrawOwnPendingVerification(");
  expect(source).toContain("createProfileVerificationRepository(verifyPrivateDocumentReceipt)");
  expect(source).not.toContain("learnerMembershipId:");
  expect(source).not.toContain("submittedSnapshot:");
  expect(source).toContain("STALE_VERSION");
  expect(source).toContain('Cache-Control":"private, no-store"');
 });
 it("requires the real migration with the explicit audit action",()=>{
  const sql=readFileSync(join(process.cwd(),
   "drizzle/0081_profile_verification_withdraw_action.sql"),"utf8");
  expect(sql).toContain("'WITHDRAWN'");
  const writer=readFileSync(join(process.cwd(),
   "src/modules/profile-verification/transaction-writer.ts"),"utf8");
  expect(writer).toContain('event.action !== "WITHDRAWN"');
 });
});
