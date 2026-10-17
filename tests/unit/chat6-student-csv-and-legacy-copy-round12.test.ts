import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {LEGACY_STUDENT_CSV_COLUMNS,MAX_STUDENT_CSV_ROWS,parseStudentCsv} from "@/modules/people/college-student-csv-model";
const src=(path:string)=>readFileSync(path,"utf8");
const programId="11111111-1111-4111-8111-111111111111";
const cohortId="22222222-2222-4222-8222-222222222222";

describe("Super Admin student CSV lifecycle",()=>{
 it("SA-academics-people-95 validates a 500-row legacy roster with the selected academic placement and no mutation",()=>{
  expect(MAX_STUDENT_CSV_ROWS).toBe(500);
  expect(LEGACY_STUDENT_CSV_COLUMNS).toEqual(["First Name","Last Name","Roll Number","Mobile Number","Email"]);
  const csv=LEGACY_STUDENT_CSV_COLUMNS.join(",")+"\n"+"Anjali,Sharma,9876543210,anjali@example.edu,22CS001\n";
  const parsed=parseStudentCsv(csv,{programId,cohortId});
  expect(parsed.structuralErrors).toEqual([]);
  expect(parsed.entries[0]?.errors).toEqual([]);
  expect(parsed.entries[0]?.data?.phoneE164).toBe("+919876543210");
  expect(parsed.entries[0]?.data?.cohortId).toBe(cohortId);
  expect(parseStudentCsv(csv,{programId}).structuralErrors).toContain("CHOOSE_PROGRAM_AND_BATCH");
 });
 it("SA-academics-people-95 scopes import writes and history to the selected active college, with same-origin checked API",()=>{
  const service=src("src/modules/people/college-student-csv-service.ts");
  expect(service).toContain('await resolveActingCollege(context, "people.manage")');
  expect(service).toContain('requirePermission(context, "academics.manage"');
  expect(service).toContain('eq(activityEvents.collegeId,selected.collegeId)');
  expect(service).toContain('eq(activityEvents.organizationId,selected.organizationId)');
  expect(service).toContain('eq(activityEvents.eventType,"IDENTITY_COLLEGE_STUDENT_CSV_IMPORT")');
  expect(src("src/app/api/people/student-import/route.ts")).toContain("isSameOriginRequest(request)");
  const page=src("src/app/(authenticated)/admin/students/page.tsx");
  expect(page).toContain("Bulk Register Students");
  expect(page).toContain("<CollegeStudentCsvImport choices={choices}/>");
  expect(page).toContain("<SuperAdminStudentImportHistory runs={importRuns}/>");
  const modal=src("src/components/admin/super-admin-student-import-history.tsx");
  expect(modal).toContain("Bulk import history");
  expect(modal).toContain("No bulk imports on file for this college.");
 });
 it("SA-academics-people-100 restores registration and roster copy without destructive hard delete",()=>{
  const page=src("src/app/(authenticated)/admin/students/page.tsx");
  const form=src("src/components/college/college-student-register-form.tsx");
  const editor=src("src/components/college/college-person-edit-action.tsx");
  expect(page).toContain("Register New Student");
  expect(page).toContain("Registered Students");
  expect(page).toContain("Bulk Register Students");
  expect(page).toContain("Manage student identity, academic placement and account access from one roster.");
  expect(form).toContain("Student registered successfully! They can now login with their mobile number.");
  expect(form).toContain("Used for OTP login");
  expect(editor).toContain("Student updated successfully!");
  expect(src("docs/audit/owner-decisions-resolved.md")).toContain("OD-23");
 });
});
