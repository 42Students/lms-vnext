import {describe,expect,it} from "vitest";
import {normalizeRecruiterDesignation,recruiterDesignationPatchSchema,sameRecruiterProfileVersion} from "@/modules/placements/recruiter-designation-model";
describe("Recruiter self-designation writes",()=>{
 it("normalizes whitespace and empty title",()=>{
  expect(normalizeRecruiterDesignation("  Senior    HR  ")).toBe("Senior HR");
  expect(normalizeRecruiterDesignation("  ")).toBeNull();
 });
 it("accepts exactly bounded title + optimistic version",()=>{
  const token="2026-10-14T12:00:00.123Z";
  expect(recruiterDesignationPatchSchema.safeParse({title:"Recruiter",expectedUpdatedAt:token}).success).toBe(true);
  expect(recruiterDesignationPatchSchema.safeParse({title:"x".repeat(161),expectedUpdatedAt:token}).success).toBe(false);
  expect(recruiterDesignationPatchSchema.safeParse({title:"Recruiter",expectedUpdatedAt:"yesterday"}).success).toBe(false);
  expect(recruiterDesignationPatchSchema.safeParse({title:"Recruiter",expectedUpdatedAt:token,userId:"foreign"}).success).toBe(false);
  expect(sameRecruiterProfileVersion(new Date(token),token)).toBe(true);
  expect(sameRecruiterProfileVersion(new Date(token),"2026-10-14T12:00:00.000Z")).toBe(false);
 });
});
