import {describe,expect,it} from "vitest";
import {collegeRoleDirectoryQuerySchema} from "@/modules/people/college-role-directory-model";
import {collegeRoleDirectoryExportHref,parseCollegeRoleDirectoryExportQuery,renderCollegeRoleDirectoryCsv} from "@/modules/people/college-role-directory-export";

describe("Filtered College role directory CSV",()=>{
 it("round-trips all roster facets and excludes page and arbitrary tenant scope",()=>{
  const filter=collegeRoleDirectoryQuerySchema.parse({programId:"00000000-0000-4000-8000-000000000001",status:"ACTIVE",joinedFrom:"2026-10-14",page:4,pageSize:50});
  const href=collegeRoleDirectoryExportHref("LEARNER",filter);
  expect(href).toContain("programId=");
  expect(href).not.toContain("page=4");
  expect(href).not.toContain("pageSize=50");
  const parsed=parseCollegeRoleDirectoryExportQuery(new URL(href,"https://lms.invalid").searchParams);
  expect(parsed.kind).toBe("LEARNER");
  expect(parsed.filter.programId).toBe(filter.programId);
  expect(()=>parseCollegeRoleDirectoryExportQuery(new URLSearchParams("kind=LEARNER&kind=FACULTY"))).toThrow("INVALID_ROLE_DIRECTORY_EXPORT");
  expect(()=>parseCollegeRoleDirectoryExportQuery(new URLSearchParams("kind=LEARNER&collegeId=foreign"))).toThrow("INVALID_ROLE_DIRECTORY_EXPORT");
  expect(()=>parseCollegeRoleDirectoryExportQuery(new URLSearchParams("kind=FACULTY&programId=00000000-0000-4000-8000-000000000001"))).not.toThrow();
 });
 it("neutralizes spreadsheet formulas and preserves the 1000-row bound",()=>{
  const csv=renderCollegeRoleDirectoryCsv("FACULTY",[{membershipId:"id",name:"=HYPERLINK(1)",email:"+bad@example.test",membershipStatus:"ACTIVE",userStatus:"ACTIVE",joinedAt:new Date("2026-10-15T00:00:00Z"),program:null,cohort:null,sections:[],activeTeachingAssignments:2}],true);
  expect(csv).toContain("'=HYPERLINK(1)");
  expect(csv).toContain("'+bad@example.test");
  expect(csv).toContain("EXPORT TRUNCATED");
 });
});
