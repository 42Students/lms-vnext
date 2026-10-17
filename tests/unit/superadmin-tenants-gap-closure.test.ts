import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {organizationNameSchema} from "@/modules/organizations/validation";
import {collegeCodeSchema,createCollegeInputSchema} from "@/modules/colleges/validation";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const create=()=>source("src/components/admin/college-create-form.tsx");
const org=()=>source("src/components/admin/organization-create-form.tsx");
describe("Super Admin Tenants/Modules legacy gap contracts",()=>{
 it("SA-tenants-modules-03 scoped setup retains tenant navigation and administration controls",()=>{
  expect(source("src/app/(authenticated)/admin/tenants/setup/page.tsx")).toContain("superAdminTenantSetupSteps");
  expect(source("src/app/(authenticated)/admin/tenants/page.tsx")).toContain("Tenant details");
 });
 it("SA-tenants-modules-05 tenant scope list does not default to a foreign college",()=>{
  expect(source("src/app/(authenticated)/admin/tenants/setup/page.tsx"))
   .toContain("No college selected. Setup cannot default to an unrelated tenant.");
 });
 it("SA-tenants-modules-08 organizations can search and show an actionable archive guard",()=>{
  const actions=source("src/components/admin/organization-actions.tsx");
  expect(actions).toContain("ORGANIZATION_HAS_COLLEGES");
  expect(actions).toContain("Archive organization");
 });
 it("SA-tenants-modules-10 collapsed organization names reject blanks and show readable result feedback",()=>{
  expect(organizationNameSchema.parse("  ABC    University  ")).toBe("ABC University");
  expect(organizationNameSchema.safeParse("    ").success).toBe(false);
  expect(org()).toContain("Please enter organization name");
  expect(org()).toContain("Organization name already exists");
  expect(org()).toContain("Created organization “");
 });
 it("SA-tenants-modules-09 unsaved organization and college creation drafts restore after navigation",()=>{
  const organization=org(),college=create();
  expect(organization).toContain('useFormDraft("admin-create-organization"');
  expect(college).toContain('useFormDraft("admin-create-college:"+initialOrganizationId');
  expect(organization).toContain("Draft restored");
  expect(college).toContain("Draft restored");
  expect(organization).toContain("clearDraft()");
  expect(college).toContain("clearDraft()");
 });
 it("SA-tenants-modules-11 college create stores all optional address fields from typed form",()=>{
  const body=create();
  expect(body).toContain("Address details (optional)");
  for(const field of ["City","State","Address","Pin Code","Country"])
   expect(body).toContain(field);
  const payload=createCollegeInputSchema.parse({organizationId:"11111111-1111-4111-8111-111111111111",
   name:"Example College",code:"example-college",city:"Vijayawada",country:"India"});
  expect(payload.city).toBe("Vijayawada");
 });
 it("SA-tenants-modules-12 normalizes and validates legacy 3–63 lowercase college Unique ID",()=>{
  expect(collegeCodeSchema.parse("  MY-COLLEGE ")).toBe("my-college");
  for(const code of ["ab","space separated","unsupported_","x".repeat(64)])
   expect(collegeCodeSchema.safeParse(code).success).toBe(false);
  expect(create()).toContain("Unique ID must be 3-63 chars, lowercase letters/numbers/hyphen only.");
  expect(create()).toContain("is already used by another college");
 });
 it("SA-tenants-modules-13 tenant directory searches college and organization before paging",()=>{
  const page=source("src/app/(authenticated)/admin/tenants/page.tsx");
  expect(page).toContain('type="search"');
  expect(page).toContain('name="q"');
  expect(page).toContain("matching colleges");
 });
 it("SA-tenants-modules-16 College edit form persists address, landmark and postal fields",()=>{
  const edit=source("src/components/admin/college-edit-dialog.tsx");
  expect(edit).toContain("addressLine1");
  expect(edit).toContain("landmark");
  expect(edit).toContain("postalCode");
  expect(edit).toContain("country");
 });
 it("SA-tenants-modules-17 tenant-scoped admin manager derives college access from a membership and enforces same-origin writes",()=>{
  const client=source("src/components/admin/college-admin-lifecycle-action.tsx");
  const route=source("src/app/api/people/[membershipId]/lifecycle/route.ts");
  const people=source("src/modules/people/service.ts");
  expect(client).toContain("encodeURIComponent(membershipId)");
  expect(client).toContain('action==="SUSPEND"');
  expect(client).toContain('status==="ACTIVE"?"SUSPEND":"REACTIVATE"');
  expect(client).toContain("apiFetch");
  expect(client).toContain("useGuardedAction");
  expect(client).toContain("<ConfirmDialog");
  expect(client).not.toContain("window.confirm");
  expect(client).not.toContain("result.error");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("updateMembershipLifecycleWithRuntime");
  expect(people).toContain("collegeId: person.membership.collegeId");
 });
 it("SA-tenants-modules-18 Super Admin can inspect and revoke user sessions",()=>{
  const revoke=source("src/components/admin/admin-revoke-sessions.tsx");
  expect(revoke).toContain("Sign out everywhere");
  expect(revoke).toContain("session(s) revoked.");
  expect(revoke).toContain("/sessions");
 });
 it("SA-tenants-modules-21 sign-in methods use explicit choices and optimistic save",()=>{
  const signin=source("src/components/admin/college-signin-method-form.tsx");
  expect(signin).toContain("Email only");
  expect(signin).toContain("Phone only");
  expect(signin).toContain("Sign-in settings saved");
  expect(signin).toContain("expectedVersion");
  expect(signin).toContain("apiFetch<void>");
  expect(signin).toContain("useGuardedAction");
 });
});
