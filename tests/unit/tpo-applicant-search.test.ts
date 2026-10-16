import {describe,expect,it} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import {tpoApplicantSearchCondition} from "@/modules/placements/tpo-applicant-search";
import {tpoApplicantExportSearchPattern} from "@/modules/placements/tpo-drive-applications-export-model";

describe("TPO-drive-workspace-R02 applicant search contract",()=>{
 it("supports name, role, roll, registration, email, phone, branch and batch within one college",()=>{
  const condition=tpoApplicantSearchCondition("cse", "00000000-0000-4000-8000-000000000001");
  expect(condition).toBeDefined();
  const query=new PgDialect().sqlToQuery(condition!);
  for(const name of ["display_name","title","roll_number","registration_number",
    "email","phone_e164","learner_program_enrollments","cohorts","programs","departments",
    "membership_id","college_id"])expect(query.sql).toContain(name);
  expect(query.params).toContain("%cse%");
  expect(query.params).toContain("00000000-0000-4000-8000-000000000001");
  expect(query.sql).toContain("exists");
 });
 it("treats SQL wildcard input as literal search text",()=>{
  expect(tpoApplicantExportSearchPattern("a%_b")).toBe("%a\\%\\_b%");
 });
});
