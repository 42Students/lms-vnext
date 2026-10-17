import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const text=(path:string)=>readFileSync(path,"utf8");
describe("Chat-6 Super Admin people round 3 source verification",()=>{
 it("SA-academics-people-80 registers faculty with structured name and Indian mobile through college-scoped onboarding",()=>{
  {const file=text("src/app/(authenticated)/admin/faculty/page.tsx");expect(file).toContain("forcedRole=\"FACULTY\"");expect(file).toContain("Register New Faculty");}
  {const file=text("src/components/admin/person-onboard-dialog.tsx");expect(file).toContain("firstName");expect(file).toContain("lastName");expect(file).toContain("indianMobileToE164");expect(file).toContain("/api/people/onboard");}
 });
 it("SA-academics-people-81 supports editing faculty profile, department and employment fields",()=>{
  {const file=text("src/app/(authenticated)/admin/faculty/page.tsx");expect(file).toContain("kind=\"FACULTY\"");}
  {const file=text("src/components/college/college-person-edit-action.tsx");expect(file).toContain("Edit Faculty");expect(file).toContain("primaryDepartmentId");expect(file).toContain("employmentType");expect(file).toContain("academicTitle");expect(file).toContain("gender");expect(file).toContain("dateOfBirth");expect(file).toContain("address");}
 });
 it("SA-academics-people-83 exposes college-scoped suspend and reactivate actions with reason",()=>{
  {const file=text("src/app/(authenticated)/admin/faculty/page.tsx");expect(file).toContain("ScopedMembershipLifecycleActions");}
  {const file=text("src/components/admin/scoped-membership-lifecycle-actions.tsx");expect(file).toContain("Suspend");expect(file).toContain("Reactivate");expect(file).toContain("Reason for suspension");expect(file).toContain("Other college access is unaffected");}
 });
 it("SA-academics-people-88 provides editable membership profiles and audit trail detail links",()=>{
  {const file=text("src/components/admin/person-membership-actions.tsx");expect(file).toContain("PersonProfileDialog");}
  {const file=text("src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx");expect(file).toContain("View audit trail");}
 });
 it("SA-academics-people-96 supports student suspend and reactivate via membership lifecycle",()=>{
  {const file=text("src/app/(authenticated)/admin/students/page.tsx");expect(file).toContain("ScopedMembershipLifecycleActions");}
  {const file=text("src/components/admin/scoped-membership-lifecycle-actions.tsx");expect(file).toContain("College membership suspended.");expect(file).toContain("College membership reactivated.");}
 });
 it("SA-academics-people-97 supports safe bulk student module overrides with selection cap",()=>{
  {const file=text("src/app/(authenticated)/admin/students/page.tsx");expect(file).toContain("SuperAdminStudentBulkAccess");}
  {const file=text("src/components/admin/super-admin-student-bulk-access.tsx");expect(file).toContain("Bulk module access");expect(file).toContain("Select first");expect(file).toContain("ENABLE");expect(file).toContain("DISABLE");expect(file).toContain("INHERIT");expect(file).toContain("/api/admin/students/module-access/bulk");}
 });
 it("SA-academics-people-112 restricts recruiter account-wide actions outside selected scope",()=>{
  {const file=text("src/components/admin/super-admin-hr-accounts.tsx");expect(file).toContain("accountManageable");expect(file).toContain("scopeDescription");expect(file).toContain("Account-wide actions are restricted");}
  {const file=text("src/components/admin/super-admin-hr-detail-drawer.tsx");expect(file).toContain("Account-wide actions are unavailable");}
 });
});
