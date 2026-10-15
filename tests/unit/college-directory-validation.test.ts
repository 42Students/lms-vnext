import { describe,expect,it } from "vitest";
import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import { collegeBatchDirectorySchema,collegeSemesterDirectorySchema } from "@/modules/academics/college-academic-directory-model";
import { collegeClassQuerySchema,collegeElectiveQuerySchema } from "@/modules/academics/college-structure-directory-model";
describe("College Admin filter validation messages",()=>{
 const failures=[
  collegeBatchDirectorySchema.safeParse({startOnOrAfter:"2026-12-01",startOnOrBefore:"2026-11-30"}),
  collegeSemesterDirectorySchema.safeParse({creditState:"UNSET",minimumCredits:6}),
  collegeClassQuerySchema.safeParse({periodStartsOnOrAfter:"2026-12-01",periodEndsOnOrBefore:"2026-11-30"}),
  collegeElectiveQuerySchema.safeParse({semesterFrom:4,semesterThrough:3}),
  collegeElectiveQuerySchema.safeParse({minimumRequiredPicks:3,maximumAllowedPicks:2}),
  collegeElectiveQuerySchema.safeParse({periodState:"UNLINKED",periodCode:"P1"}),
 ];
 it("describes each known contradiction without raw inputs",()=>{
  for(const result of failures){
   expect(result.success).toBe(false);
   if(!result.success){const message=collegeDirectoryValidationMessage(result.error);expect(message.length).toBeGreaterThan(16);expect(message).not.toContain("2026-12-01");}
  }
 });
 it("does not print caller-controlled values or permission internals for invalid filters",()=>{
  const result=collegeClassQuerySchema.safeParse({q:"=SECRET",page:"INVALID_VALUE"});
  expect(result.success).toBe(false);
  if(!result.success){
   const message=collegeDirectoryValidationMessage(result.error);
   expect(message).not.toContain("SECRET");
   expect(message).not.toContain("INVALID_VALUE");
   expect(message).not.toContain("Missing permission");
  }
 });
});
