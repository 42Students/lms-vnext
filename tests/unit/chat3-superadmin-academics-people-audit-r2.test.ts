import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const page=(name:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/admin",name,"page.tsx"),"utf8");
describe("Chat-3 second-eye Super Admin academics and people audit",()=>{
 it("SA3-ACADEMICS-01 selected college controls workspace and no-scope state",()=>{
  const s=page("academics");
  expect(s).toContain("context.adminScope?.collegeId ?? null");
  expect(s).toContain('if (!collegeId) redirect("/superadmin/dashboard")');
  expect(s).toContain("getAcademicsWorkspace(");
  expect(s).toContain('sectionBasePath="/admin/academics/sections"');
 });
 it("SA3-ACADEMICS-02 scoped Section validates authorization then private 404",()=>{
  const s=page("academics/sections/[sectionId]");
  expect(s).toContain('redirect("/admin/academics")');
  expect(s).toContain("resolveSuperAdminSectionDetail(context, sectionId)");
  expect(s).toContain("notFound()");
 });
 it("SA3-PEOPLE-04 directory has explicit no-scope state, read-only masking, URL filter and pagination",()=>{
  const s=page("people/directory");
  expect(s).toContain("adminUsersQuerySchema.safeParse");
  expect(s).toContain("listSuperAdminUsers(context,query.data)");
  expect(s).toContain('data.contactVisible?row.email??"—":"Email masked"');
  expect(s).toContain("const base=new URL(adminUsersHref({...data.query,page:1})");
  expect(s).toContain("hrefForPage={page=>href(page)}");
  expect(s).toContain('title="No matching users"');
 });
 it("SA3-PEOPLE-05 membership detail masks contacts and limits platform block to unscoped Super Admin",()=>{
  const s=page("people/directory/[membershipId]");
  expect(s).toContain("getSuperAdminMembershipDetail(context,membershipId)");
  expect(s).toContain("if(!detail)notFound()");
  expect(s).toContain('contactVisible?detail.email??"Not recorded":"Masked outside selected college"');
  expect(s).toContain("isSuperAdmin(context)&&!context.adminScope?.collegeId&&!context.adminScope?.organizationId");
 });
 it("SA3-PEOPLE-06 audit trail is exact-membership and contains truthful empty copy",()=>{
  const s=page("people/directory/[membershipId]/audit");
  expect(s).toContain("listSuperAdminPersonAudit");
  expect(s).toContain("if(!data)notFound()");
  expect(s).toContain("No matching membership activity events have been recorded.");
 });
 it("SA3-PEOPLE-07 global unassigned identities honor global scope, do not disclose contact fields",()=>{
  const s=page("people/unassigned");
  expect(s).toContain("unassignedIdentityScopeAllowed(context.adminScope)");
  expect(s).toContain("listSuperAdminUnassignedUsers(context, parsed.data)");
  expect(s).toContain("Personal contact and session information are excluded");
 });
 it("SA3-RECRUITERS-01 alias reuses canonical HR permissions and does not fork data",()=>{
  const s=page("recruiters");
  expect(s).toContain('import SuperAdminHrPage from "../hr/page"');
  expect(s).toContain("<SuperAdminHrPage searchParams={searchParams}/>");
 });
 it("SA3-PEOPLE-08 membership list retains version-safe page limits and explicit empty copy",()=>{
  const s=page("people");
  expect(s).toContain("parsePeoplePageSize(rawPageSize)");
  expect(s).toContain("listCollegePeopleWithRuntime");
  expect(s).toContain('<DataTable empty={<EmptyState title="No matching contacts"');
 });
});
