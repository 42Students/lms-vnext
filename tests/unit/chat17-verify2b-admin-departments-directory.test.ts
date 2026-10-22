import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Super Admin cross-college department directory",()=>{
 it("scopes global, organization and college results before pagination, with live role recheck",()=>{
  const service=read("src/modules/admin-ui/super-admin-department-directory-service.ts");
  expect(service).toContain("isSuperAdmin(ctx)");
  expect(service).toContain("assertPersistedPlatformPermission(tx,ctx");
  expect(service).toContain('eq(organizations.status,"ACTIVE")');
  expect(service).toContain('eq(colleges.status,"ACTIVE")');
  expect(service).toContain("isNull(departments.archivedAt)");
  expect(service).toContain("organizationId?eq(organizations.id,organizationId)");
  expect(service).toContain("collegeId?eq(colleges.id,collegeId)");
  expect(service).toContain("readOnly:true as const");
 });
 it("exposes no-tenant-selector read-only route and accessible directory",()=>{
  const route=read("src/app/api/admin/departments/directory/route.ts");
  expect(route).toContain('"Cache-Control":"private, no-store"');
  expect(route).toContain("getAll(key).length!==1");
  const page=read("src/app/(authenticated)/admin/departments/all/page.tsx");
  expect(page).toContain('aria-label="Departments table, scroll for columns"');
  expect(page).toContain('Page {page} of {directory.totalPages}');
  expect(read("src/app/(authenticated)/admin/departments/page.tsx"))
   .toContain('href="/admin/departments/all"');
 });
});
