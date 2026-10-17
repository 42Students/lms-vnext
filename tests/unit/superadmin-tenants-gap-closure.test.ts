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
 it("SA-tenants-modules-04 unscoped platform has four described navigation cards including Recruiter accounts",()=>{
  const nav=source("src/modules/admin-ui/admin-dashboard-navigation.ts");
  const page=source("src/components/admin/admin-dashboard-actions.tsx");
  expect(nav).toContain('href: "/admin/tenants"');
  expect(nav).toContain('label: "Recruiter accounts", href: "/admin/recruiters"');
  expect(nav).not.toContain('label: "Tenant Setup", href: "/admin/tenants/setup"');
  expect(page).toContain("Choose the level you need to operate at.");
  expect(page).toContain("subtitle={item.subtitle}");
 });
 it("SA-tenants-modules-07 archive is intentionally non-destructive with dependent-college guard",()=>{
  const actions=source("src/components/admin/organization-actions.tsx");
  const service=source("src/modules/organizations/service.ts");
  expect(actions).toContain("Archive organization");
  expect(actions).toContain("ORGANIZATION_HAS_COLLEGES");
  expect(service).toContain('status:"ARCHIVED"');
  expect(actions).not.toContain("Delete organization");
 });
 it("SA-tenants-modules-14 college archive intentionally preserves dependencies and historical records",()=>{
  const component=source("src/components/admin/college-archive-button.tsx");
  const service=source("src/modules/colleges/service.ts");
  expect(component).toContain("COLLEGE_HAS_DEPENDENCIES");
  expect(component).toContain("The server checks memberships");
  expect(service).toContain("assertCollegeCanArchive(usage)");
  expect(service).toContain('status:"ARCHIVED"');
 });
 it("SA-tenants-modules-R03 Audit Findings requires an active Super Admin rather than a broad logs role",()=>{
  const board=source("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  const permission=source("src/modules/permissions/policy.ts");
  expect(board).toContain('if(!isSuperAdmin(ctx) || ctx.user.platformStatus !== "ACTIVE")redirect("/dashboard")');
  expect(board).toContain('requirePermission(ctx,"admin-scope.select"');
  expect(permission).toContain('return isSuperAdmin(context);');
 });

 it("SA-tenants-modules-R02 restores only archived organization or college with scoped transactional audit",()=>{
  const org=source("src/modules/organizations/service.ts");
  const college=source("src/modules/colleges/service.ts");
  const ui=source("src/components/admin/tenant-restore-action.tsx");
  const directory=source("src/app/(authenticated)/admin/organizations/page.tsx");
  const detail=source("src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx");
  for(const [entity,route] of [
    ["organization","src/app/api/organizations/[organizationId]/restore/route.ts"],
    ["college","src/app/api/colleges/[collegeId]/restore/route.ts"],
  ]){
   const sourceText=source(route);
   expect(sourceText).toContain("isSameOriginRequest(request)");
   expect(sourceText).toContain("getCurrentRequestContext()");
   expect(sourceText).toContain("export async function POST");
   expect(sourceText).toContain("apiErrorResponse(error)");
   expect(ui).toContain(entity);
  }
  expect(org).toContain("export async function restoreOrganization");
  expect(org).toContain('eq(organizations.status,"ARCHIVED")');
  expect(org).toContain("await assertUniqueActiveName(candidate.name,organizationId)");
  expect(org).toContain("PLATFORM_ORGANIZATION_RESTORED");
  expect(college).toContain("export async function restoreCollege");
  expect(college).toContain('candidate.organizationStatus!=="ACTIVE"');
  expect(college).toContain('eq(colleges.status,"ARCHIVED")');
  expect(college).toContain("PLATFORM_COLLEGE_RESTORED");
  expect(ui).toContain("<ConfirmDialog");
  expect(ui).toContain("useGuardedAction");
  expect(directory).toContain("listArchivedOrganizations(context)");
  expect(detail).toContain('<TenantRestoreAction kind="college"');
  expect(detail).toContain("Restore the parent organization");
  expect(source("src/modules/activity/taxonomy.ts")).toContain("PLATFORM_COLLEGE_RESTORED");
 });

 it("SA-tenants-modules-23 distinguishes measured required failures from optional advice",()=>{
  const page=source("src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx");
  const evalModel=source("src/modules/colleges/readiness-model.ts");
  expect(page).toContain("Must fix before launch");
  expect(page).toContain('evaluation.checks.filter(check=>check.status!=="PASS")');
  expect(page).toContain("Recommended setup");
  expect(page).toContain("supplemental.activeLectureHalls===null");
  expect(page).toContain("supplemental.attendancePolicyRecord===null");
  expect(page).toContain("Runtime DNS, login, teaching and placement verification are still required before launch.");
  expect(page).toContain("readinessRemediationLink(check.id,college.id)");
  expect(evalModel).toContain('"NOT_READY"');
  expect(evalModel).toContain('"INCOMPLETE"');
 });

});
