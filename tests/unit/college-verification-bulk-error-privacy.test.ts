import {describe,it,expect} from "vitest";
import {safeCollegeBulkReviewFailure} from "@/modules/verification/bulk-safe-error";
describe("College bulk review privacy-safe error feedback",()=>{
 it("never echoes raw SQL, stack, authorization details, or a malicious server string",()=>{
  for(const issue of ["SQL password=topsecret","/srv/app/private/file.ts",new Error("secret-digest"),{error:"token"}]){
   expect(safeCollegeBulkReviewFailure(issue)).not.toMatch(/secret|private|password|digest|token/i);
  }
 });
 it("explains known recovery steps without exposing raw errors",()=>{
  expect(safeCollegeBulkReviewFailure("STALE_VERSION")).toMatch(/Refresh/);
  expect(safeCollegeBulkReviewFailure("VERIFICATION_UNAVAILABLE")).toMatch(/temporarily unavailable/);
  expect(safeCollegeBulkReviewFailure("INVALID_ORIGIN")).toMatch(/Reload/);
 });
});
