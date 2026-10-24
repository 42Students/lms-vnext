import {describe,expect,it} from "vitest";
import {recruiterDriveListQuerySchema} from "@/modules/placements/recruiter-drive-list-model";
describe("Recruiter Everywhere verified drive-search filter",()=>{
 it("limits search to validated exact college, known own-job lifecycle and bounded text",()=>{
  const f=recruiterDriveListQuerySchema.parse({
   collegeId:"11111111-1111-4111-8111-111111111111",q:"Systems Engineer",
   view:"ALL",page:1,sort:"RECENT",
  });
  expect(f.collegeId).toBe("11111111-1111-4111-8111-111111111111");
  expect(f.q).toBe("Systems Engineer");
  expect(f.employment).toBe("ALL");
 });
 it("rejects overlong searches, cross-site extra keys, invalid grant IDs",()=>{
  expect(recruiterDriveListQuerySchema.safeParse({collegeId:"not-a-uuid"}).success).toBe(false);
  expect(recruiterDriveListQuerySchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
  expect(recruiterDriveListQuerySchema.safeParse({q:"test",tenant:"foreign"}).success).toBe(false);
 });
});
