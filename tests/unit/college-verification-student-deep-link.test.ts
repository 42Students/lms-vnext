import {describe,expect,it} from "vitest";
import {collegeVerificationStudentHref} from "@/modules/verification/staff-links";
describe("Verification staff queue Student drilldown",()=>{
 it("navigates through a scoped Student page, not a forged arbitrary path",()=>{
  const id="00000000-0000-4000-8000-000000000111";
  expect(collegeVerificationStudentHref(id)).toBe("/college/students/"+id);
  expect(()=>collegeVerificationStudentHref("../../admin")).toThrow();
  expect(()=>collegeVerificationStudentHref("other-college")).toThrow();
 });
});
