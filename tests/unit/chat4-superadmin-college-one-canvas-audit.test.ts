import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/admin/",path),"utf8");

describe("Super Admin colleges/organizations canvas and page states",()=>{
 it("UX-COL-ONE-CANVAS-01 preserves scoped, accessible tenant directories and paging",()=>{
  const colleges=read("colleges/page.tsx");
  const organizations=read("organizations/page.tsx");
  expect(colleges).toContain('aria-label="Existing Colleges"');
  expect(colleges).toContain('aria-label="Search colleges"');
  expect(organizations).toContain('aria-label="Existing Organizations"');
  expect(organizations).toContain('aria-label="Search organizations"');
  for(const page of [colleges,organizations]){
   expect(page).toContain("<DataTable");
   expect(page).toContain("<Pagination");
   expect(page).toContain('role="search"');
   expect(page).toContain("<ErrorState");
   expect(page.indexOf("requirePermission(context")).toBeLessThan(
    page.indexOf("parseAdminDirectorySearchParams("));
  }
  expect(colleges).toContain("No colleges match your search");
  expect(organizations).toContain("No organizations found.");
 });
 it("UX-COL-ONE-CANVAS-02 preserves archived states and college-bound setup links",()=>{
  const detail=read("colleges/[collegeId]/page.tsx");
  expect(detail).toContain("tenantSetupLinksAvailable(item.status,item.organizationStatus)");
  expect(detail).toContain("Restore the parent organization before restoring this college.");
  expect(detail).toContain("Setup links are unavailable while this college or its organization is archived.");
  expect(detail).toContain("getSuperAdminTenantLifecycleDetail(context,collegeId)");
  expect(detail).toContain("getSuperAdminTenantLifecycleDetail(context,collegeId)");
  expect(detail).toContain('<ErrorState title="Missing collegeId"');
  expect(detail).toContain("if(error instanceof AuthorizationError) throw error;");
 });
 it("UX-COL-ONE-CANVAS-03 keeps administrator account and session controls in the directory",()=>{
  const admins=read("colleges/[collegeId]/admins/page.tsx");
  expect(admins).toContain('aria-label="College administrator directory"');
  expect(admins).toContain("No active College Admin or TPO accounts in this college.");
  expect(admins).toContain('caption="College Admin and TPO accounts"');
  expect(admins).toContain("listCollegeAdminSessionTargetsPage(context,collegeId,page,role)");
  expect(admins).toContain("CollegeAdminLifecycleAction");
  expect(admins).toContain("View active devices");
  expect(admins).toContain('title="View administrator history"');
  expect(admins).toContain('>\n          History\n        </Link>');
  expect(admins).toContain('mobilePriority:"primary"');
 });
 it("UX-COL-ONE-CANVAS-04 distinguishes unknown readiness evidence from a passing check",()=>{
  const readiness=read("colleges/[collegeId]/readiness/page.tsx");
  expect(readiness).toContain('aria-label="Must fix before launch"');
  expect(readiness).toContain("Recommended setup");
  expect(readiness).toContain("Unknown source");
  expect(readiness).toContain("UNKNOWN means the underlying");
  expect(readiness).toContain("An unknown check");
  expect(readiness).toContain("No readiness checks match the selected status and area.");
  expect(readiness).toContain('aria-label="Readiness check filters"');
 });
});
