import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {parseFacultyBulkCsv} from "@/modules/people/faculty-bulk-import-model";

const source=(path:string)=>readFileSync(path,"utf8");
describe("chat-6 selected-college People gap verification",()=>{
 it("SA-academics-people-78 uses the legacy exact no-college title and contextual noun",()=>{
  const s=source("src/components/admin/admin-scoped-read-page.tsx");
  expect(s).toContain("Select a college to continue");
  expect(s).toContain("Choose a college in the header above to continue.");
   expect(s).toContain("Choose an Organization + College in the header above to view faculty assignments.");
  for(const noun of ["faculty assignments","matching records","students"])expect(s).toContain(noun);
 });
 it("SA-academics-people-82 validates the 500-row faculty sample and preserves row result feedback",()=>{
  const rows=parseFacultyBulkCsv("First Name,Last Name,Mobile Number,Email\nAnjali,Sharma,9876543210,anjali@example.edu\n");
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({firstName:"Anjali",lastName:"Sharma",phoneE164:"+919876543210",email:"anjali@example.edu"});
  const s=source("src/components/admin/super-admin-faculty-bulk-import.tsx");
  expect(s).toContain("bulk_faculty_sample.csv");
  expect(s).toContain('status==="FAILED"');
  expect(source("src/modules/people/faculty-bulk-import-model.ts")).toContain("if(data.length>500)");
 });
 it("G2-15-027-052 keeps legacy department and faculty type in import preview and report",()=>{
  const rows=parseFacultyBulkCsv("First Name,Last Name,Mobile Number,Email,Department,Faculty Type\nAnjali,Sharma,9876543210,anjali@example.edu,Computer Science,MENTOR\n");
  expect(rows[0]).toMatchObject({departmentName:"Computer Science",facultyType:"MENTOR"});
  const view=source("src/components/admin/super-admin-faculty-bulk-import.tsx");
  expect(view).toContain("Email,Department,Faculty Type");
  expect(view).toContain('key:"department",header:"Department"');
  expect(view).toContain('key:"facultyType",header:"Faculty Type"');
  expect(view).toContain("parsedRows[row.row-2]?.departmentName");
  expect(view).toContain("parsedRows[row.row-2]?.facultyType");
 });
 it("SA-academics-people-93 registers a student with a chosen program batch and class",()=>{
  const s=source("src/components/college/college-student-register-form.tsx");
  for(const field of ["First Name","Last Name","Mobile Number","Roll Number","Program","Batch","Class/Section","dateOfBirth","gender","address"])expect(s).toContain(field);
  expect(s).toContain("/api/college/students/register");
  expect(source("src/app/(authenticated)/admin/students/page.tsx")).toContain("<CollegeStudentRegisterForm choices={choices}/>");
 });
 it("SA-academics-people-84 NOT-A-GAP keeps suspend/end instead of hard delete per OD-23",()=>{
  const policy=source("docs/audit/owner-decisions-resolved.md");
  expect(policy).toContain("Suspend / end membership instead of delete");
  const component=source("src/components/admin/scoped-membership-lifecycle-actions.tsx");
  expect(component).toContain("SUSPEND");
  expect(component).not.toContain('action:"DELETE"');
 });
 it("SA-academics-people-87 NOT-A-GAP prohibits impersonation per OD-23",()=>{
  const policy=source("docs/audit/owner-decisions-resolved.md");
  expect(policy).toContain("no impersonation.");
  for(const path of ["src/app/(authenticated)/admin/faculty/page.tsx","src/app/(authenticated)/admin/students/page.tsx"]){
   expect(source(path)).not.toContain(">Impersonate<");
   expect(source(path)).not.toContain('aria-label="Impersonate"');
  }
 });
});
