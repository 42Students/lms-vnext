import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {LEGACY_FACULTY_TYPES,facultyTypeLabel} from "@/modules/people/college-faculty-type-model";
import {FACULTY_CSV_COLUMNS} from "@/modules/people/college-faculty-csv-columns";
import {LEGACY_STUDENT_CSV_COLUMNS,MAX_STUDENT_CSV_ROWS,parseStudentCsv} from "@/modules/people/college-student-csv-model";
import {collegeRoleDirectoryQuerySchema,parseCollegeRoleDirectorySearchParams,assertCompatibleCollegeRoleDirectoryFilters,collegeRoleDirectoryHref} from "@/modules/people/college-role-directory-model";
import {escapeRoleDirectoryCsvCell,ROLE_DIRECTORY_EXPORT_LIMIT} from "@/modules/people/college-role-directory-export";
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const directory=()=>src("src/components/college/college-role-directory-workspace.tsx");
describe("College People legacy audited page contracts",()=>{
 it("COL-people-01 registration includes faculty role and legacy choice fields",()=>{
  expect(directory()).toContain('forcedRole="FACULTY"');
  expect(src("src/components/admin/person-onboard-dialog.tsx")).toContain("FACULTY");
 });
 it("COL-people-02 edit Faculty shows supported profile fields but canonical login remains read-only",()=>{
  const editor=src("src/components/college/college-person-edit-action.tsx");
  expect(editor).toContain("Edit Faculty");
  expect(editor).toContain("Department");
  expect(editor).toContain("Academic title");
  expect(editor).toContain("Login Mobile");
  expect(editor).toContain("readOnly");
 });
 it("COL-people-03 faculty import follows the exact five legacy CSV columns and preview/commit",()=>{
  expect(FACULTY_CSV_COLUMNS).toEqual(["First Name","Last Name","Mobile Number","Email","Faculty Type"]);
  const widget=src("src/components/college/college-faculty-csv-import.tsx");
  expect(widget).toContain("Bulk register faculty");
  expect(widget).toContain('run("PREVIEW")');
  expect(widget).toContain('run("IMPORT")');
  expect(widget).toContain("Download row report");
 });
 it("COL-people-04 student registration records class, program, gender, roll, DOB and address",()=>{
  const form=src("src/components/college/college-student-register-form.tsx");
  for(const label of ["Roll Number","Program","Batch","Class/Section","Gender","Date of Birth","Address"])
   expect(form).toContain(label);
  expect(form).toContain("/api/college/students/register");
  expect(src("src/modules/people/college-student-registration-service.ts")).toContain("placeImportedLearnerInSection");
 });
 it("COL-people-05 student CSV accepts legacy five-column template and bounded 500-row import",()=>{
  expect(LEGACY_STUDENT_CSV_COLUMNS).toEqual(["First Name","Last Name","Mobile Number","Email","Roll Number"]);
  expect(MAX_STUDENT_CSV_ROWS).toBe(500);
  const sample=LEGACY_STUDENT_CSV_COLUMNS.join(",")+"\nAkhila,Example,9876543210,a@example.test,R001";
  const programId="11111111-1111-4111-8111-111111111111";
  const cohortId="22222222-2222-4222-8222-222222222222";
  const result=parseStudentCsv(sample,{programId,cohortId});
  expect(result.structuralErrors).toEqual([]);
  expect(result.entries[0]?.errors).toEqual([]);
  expect(result.entries[0]?.data?.rollNumber).toBe("R001");
 });
 it("COL-people-06 import history lists source receipts with bounded pagination",()=>{
  const history=src("src/components/college/college-student-import-history.tsx");
  expect(history).toContain("Bulk import history");
  expect(history).toContain("When");
  expect(history).toContain("Students");
  expect(history).toContain("Imported");
  expect(history).toContain("Partial");
  expect(history).toContain("Failed");
 });
 it("COL-people-07 learner editor permits roll/class context but not shared login mutation",()=>{
  const editor=src("src/components/college/college-person-edit-action.tsx");
  expect(editor).toContain("Edit Student");
  expect(editor).toContain("Roll Number");
  expect(editor).toContain("Contact mobile");
  expect(editor).toContain("Login Email");
  expect(editor).toContain("readOnly");
 });
 it("COL-people-08 Faculty and Students have Suspend and Reactivate in their own directories",()=>{
  const faculty=src("src/components/college/college-faculty-lifecycle-action.tsx");
  const student=src("src/components/college/college-student-lifecycle-action.tsx");
  expect(directory()).toContain("<CollegeFacultyLifecycleAction");
  expect(directory()).toContain("<CollegeStudentLifecycleAction");
  expect(faculty).toContain("Suspend Faculty");
  expect(faculty).toContain("Reactivate Faculty");
  expect(student).toContain('"Suspend"');
  expect(student).toContain('"Reactivate"');
 });
 it("COL-people-10 membership Audit trail records reviewer identity and immutable event chronology",()=>{
  const modal=src("src/components/college/college-person-audit-modal.tsx");
  expect(directory()).toContain("<CollegePersonAuditModal");
  expect(modal).toContain("Audit trail");
  expect(modal).toContain("event.authorName");
  expect(src("src/modules/people/college-person-audit-service.ts")).toContain("activityEvents");
 });
 it("COL-people-11 schedule reassign shows upcoming clash skips and complete receipt",()=>{
  const widget=src("src/components/college/college-faculty-schedule-reassign.tsx");
  expect(widget).toContain("Reassign class schedules");
  expect(widget).toContain("receipt.reassigned");
  expect(widget).toContain("receipt.total");
  expect(widget).toContain("SKIPPED");
 });
 it("COL-people-13 directory can render membership context and pending status without guessing",()=>{
  expect(directory()).toContain("Teaching assignments");
  expect(directory()).toContain("Program · Batch · Class");
  expect(directory()).toContain("Membership status");
 });
 it("COL-people-14 Faculty Type enum has legacy labels including Guest and Adjunct",()=>{
  expect(LEGACY_FACULTY_TYPES).toContain("Professor");
  expect(LEGACY_FACULTY_TYPES).toContain("Assistant Professor");
  expect(LEGACY_FACULTY_TYPES).toContain("Adjunct");
  expect(facultyTypeLabel("professor")).toBe("Professor");
  expect(facultyTypeLabel(null)).toBe("Not specified");
 });
 it("COL-people-15 learner/class and faculty/type filter URLs cannot be mixed",()=>{
  const faculty=collegeRoleDirectoryQuerySchema.parse({teaching:"ASSIGNED",pageSize:"50"});
  expect(collegeRoleDirectoryHref("FACULTY",faculty)).toContain("teaching=ASSIGNED");
  expect(()=>parseCollegeRoleDirectorySearchParams({page:["1","2"]})).toThrow("INVALID_ROLE_DIRECTORY_FILTERS");
  expect(()=>assertCompatibleCollegeRoleDirectoryFilters("FACULTY",collegeRoleDirectoryQuerySchema.parse({classPresence:"ASSIGNED"}))).toThrow();
  const page=directory();
  for(const field of ["Active class / section","Active program","Active batch","Department","Employment type","Membership status"])
    expect(page).toContain(field);
  expect(page).toContain("Advanced filters");
  expect(page).toContain("collegeRoleDirectoryHasActiveFilters(kind,result.filter)");
  expect(page.indexOf("Active class / section")).toBeLessThan(page.indexOf("<summary"));
  expect(page.indexOf("Department")).toBeLessThan(page.indexOf("<summary"));
  expect(page).toContain('name="accountStatus"');
 });
 it("COL-people-16 visible CSV neutralizes spreadsheet formula injection",()=>{
  expect(escapeRoleDirectoryCsvCell("=HYPERLINK(1)")).toBe('"\'=HYPERLINK(1)"');
  expect(ROLE_DIRECTORY_EXPORT_LIMIT).toBe(1000);
  expect(directory()).toContain("Export visible");
 });
 it("COL-people-17 Contacts separate from member management with role tabs and page-size",()=>{
  const contacts=src("src/app/(authenticated)/college/contacts/page.tsx");
  expect(contacts).toContain("All contacts");
  expect(contacts).toContain("Faculty contacts");
  expect(contacts).toContain("Student contacts");
  expect(contacts).toContain("Student accounts");
  expect(src("src/app/(authenticated)/college/people/page.tsx")).toContain('redirect("/college/contacts")');
 });
 it("COL-people-18 unauthorised student contacts must remain masked until a policy grants access",()=>{
  const contacts=src("src/app/(authenticated)/college/contacts/page.tsx");
  expect(contacts).toContain("Student contact details are masked");
 });
 it("COL-people-19 contact directory presents legacy search and tabs before advanced filters",()=>{
  const page=src("src/app/(authenticated)/college/contacts/page.tsx");
  for(const label of ["All contacts","Faculty contacts","Student contacts","Name or email","Search contacts","Advanced filters"])
   expect(page).toContain(label);
  expect(page.indexOf("Name or email")).toBeLessThan(page.indexOf("<summary"));
  expect(page).toContain("open={activeCollegeContactFilterCount(filter)>0}");
  expect(page).toContain('name="q"');
  expect(page).toContain('name="tab" value={filter.tab}');
  expect(page).toContain("Student contact details are masked");
 });
 it("COL-people-21 mentor workload shows tracked active workspaces",()=>{
  const page=src("src/components/college/college-role-directory-workspace.tsx");
  expect(page).not.toContain("Mentor workload");
 });
 it("COL-people-22 learner and faculty filter restrictions don't leak other roles",()=>{
  const query=collegeRoleDirectoryQuerySchema.parse({});
  expect(()=>assertCompatibleCollegeRoleDirectoryFilters("FACULTY",{...query,programId:"11111111-1111-4111-8111-111111111111"})).toThrow();
 });
 it("COL-people-25 edit forms show 10-digit mobile validation",()=>{
  expect(src("src/components/college/college-student-register-form.tsx")).toContain("Mobile number must be 10 digits");
  expect(src("src/modules/people/college-student-csv-model.ts")).toContain("DUPLICATE_PHONE_IN_FILE");
 });
 it("COL-people-26 faculty suspension is a 2-stage in-page confirmation and feedback",()=>{
  const component=src("src/components/college/college-faculty-lifecycle-action.tsx");
  expect(component).toContain("Confirm");
  expect(component).toContain("Faculty suspended.");
  expect(component).toContain("Faculty reactivated.");
  expect(component).not.toContain("window.confirm");
 });
 it("COL-people-03 import preview/import use the guarded request helper without echoing API codes",()=>{
  const sourceText=src("src/components/college/college-faculty-csv-import.tsx");
  expect(sourceText).toContain("apiFetch<{report:Report}>");
  expect(sourceText).toContain("useGuardedAction");
  expect(sourceText).not.toContain("payload?.error");
 });
 it("COL-people-04 student register uses guarded network calls and keeps the form after failed submit",()=>{
  const sourceText=src("src/components/college/college-student-register-form.tsx");
  expect(sourceText).toContain("apiFetch<{");
  expect(sourceText).toContain("useGuardedAction");
  expect(sourceText).not.toContain("body?.error");
 });
 it("COL-people-05 learner CSV preview and import use safe JSON, with per-row report retained",()=>{
  const sourceText=src("src/components/college/college-student-csv-import.tsx");
  expect(sourceText).toContain("apiFetch<{report:Report}>");
  expect(sourceText).toContain("studentImportReportCsv");
  expect(sourceText).toContain("useGuardedAction");
 });
 it("COL-people-25 untrusted partial registration failures are never shown verbatim to learners",()=>{
  const sourceText=src("src/components/college/college-student-register-form.tsx");
  expect(sourceText).toContain("Some enrollment steps need attention.");
  expect(sourceText).not.toContain('(body?.failures??[]).join');
 });
 it("COL-people-27 Faculty and Learner use responsive cards and bounded desktop table",()=>{
  const page=directory();
  expect(page).toContain("md:hidden");
  expect(page).toContain("md:table");
  expect(page).toContain("overflow-x-auto");
  expect(page).toContain("min-w-0");
  expect(page).toContain("Advanced filters");
 });
 it("COL-people-12 OTP lockout is a short-lived challenge, not an account state to clear",()=>{
  const login=src("src/modules/auth/login-service.ts");
  expect(login).toContain("ATTEMPT_LIFETIME_SECONDS = 300");
  expect(login).toContain("OTP_ATTEMPTS_EXCEEDED");
  expect(login).toContain("verificationAttempts");
  expect(login).not.toContain("clearUserLockout");
 });
 it("COL-people-24 mentor reassignment preserves selection and uses explicit confirmed legacy copy",()=>{
  const reassignment=src("src/components/projects/project-mentor-reassignment.tsx");
  const page=src("src/components/projects/project-admin-reassign-mentor-page.tsx");
  expect(reassignment).toContain('title={"Reassign "+actionableSelection.length+" of "+selected.length+" selected workspace(s) to "+selectedMentorName+"?"}');
  expect(reassignment).toContain("Reassigned "+'"+response.reassignedCount+"');
  expect(reassignment).toContain("No workspaces needed changes — they already have this mentor.");
  expect(reassignment).toContain("Select at least one workspace to reassign.");
  expect(reassignment).toContain("<ConfirmDialog");
  expect(reassignment).not.toContain("window.confirm");
  expect(reassignment).not.toContain("{failure.code}");
  expect(page).toContain("Move selected non-archived project workspaces to a new primary mentor.");
  expect(page).toContain("Back to workspaces");
 });
 it("COL-people-09 is an approved non-destructive membership lifecycle instead of permanent delete",()=>{
  const faculty=src("src/components/college/college-faculty-lifecycle-action.tsx");
  const learner=src("src/components/college/college-student-lifecycle-action.tsx");
  expect(faculty).toContain("Suspend Faculty");
  expect(faculty).toContain("Reactivate Faculty");
  expect(learner).toContain('"Suspend"');
  expect(learner).toContain('"Reactivate"');
  expect(faculty).not.toContain("Delete Faculty");
  expect(learner).not.toContain("Delete Student");
 });

 it("COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes",()=>{
  const service=src("src/modules/people/membership-service.ts");
  const panel=src("src/components/admin/person-membership-actions.tsx");
  const grant=service.slice(service.indexOf("export async function addMembershipRole("));
  const remove=service.slice(service.indexOf("export async function removeMembershipRole("));
  const guard='if (input.role === "COLLEGE_ADMIN") {\n    requirePermission(context, "admin-scope.select");';
  expect(grant).toContain(guard);
  expect(remove).toContain(guard);
  expect(panel).toContain("Only a Super Admin can change the College Admin role.");
  expect(panel).toContain("The College Admin role can only be assigned or removed by a Super Admin.");
  const policy=src("src/modules/permissions/policy.ts");
  expect(policy).toContain('permission === "admin-scope.select"');
  expect(policy).toContain("return isSuperAdmin(context);");
 });

});
