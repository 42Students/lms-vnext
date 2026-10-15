import {describe,it,expect} from "vitest";
import {verificationEnrollmentFilterMode} from "@/modules/verification/enrollment-mode";
describe("Verification academic filters share a single current enrollment",()=>{
 it("binds class, program, batch and branch within one active section enrollment",()=>{
  const id="00000000-0000-4000-8000-000000000011";
  expect(verificationEnrollmentFilterMode({sectionId:id,programId:id,branchId:id,batchId:id})).toBe("SECTION");
  expect(verificationEnrollmentFilterMode({programId:id,branchId:id})).toBe("PROGRAM");
  expect(verificationEnrollmentFilterMode({})).toBe("ALL");
 });
});
