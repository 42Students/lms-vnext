import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
describe("bulk review must use DB04 locked writer",()=>{
 it("revalidates persisted College Admin role and delegates every decision to the registered writer",()=>{
  const source=readFileSync(resolve(process.cwd(),"src/modules/verification/staff-bulk-review-service.ts"),"utf8");
  expect(source).toContain("await requireCollegeVerificationActor(context)");
  expect(source).toContain("await reviewProfileVerification(context");
  expect(source).toContain("verifyPrivateDocumentReceipt");
  expect(source).not.toContain("tx.update(profileVerifications)");
 });
});
