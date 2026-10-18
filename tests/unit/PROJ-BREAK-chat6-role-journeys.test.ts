import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");
describe("Projects IIT Dharwad — cross-account navigation and denial breaker",()=>{
 it("PROJ-BREAK-pages-01 Super Admin without a college scope cannot list or mutate someone else's projects",()=>{
  const p=src("src/app/(authenticated)/admin/projects/page.tsx");
  expect(p).toContain("context.adminScope?.collegeId ?? null");
  expect(p).toContain("if (!collegeId)");
  expect(p).toContain('title="No college selected"');
  expect(p.indexOf("if (!collegeId)")).toBeLessThan(p.indexOf("listProjectAdminSnapshots("));
  expect(p).toContain("ProjectAdminPagination");
 });
 it("PROJ-BREAK-pages-02 College Admin without an active selected membership gets recovery instead of a crash",()=>{
  const p=src("src/app/(authenticated)/college/projects/page.tsx");
  expect(p).toContain("getCurrentRequestContext()");
  // The central policy helper covers both absent/inactive membership and
  // Super Admin selected-college scope; no page-local role-name bypass.
  expect(p).toContain("const collegeId = getProjectAdminCollegeId(context)");
  expect(p).toContain("if (!collegeId)");
  expect(p).toContain("Choose an active college from the account switcher");
  expect(p.indexOf("if (!collegeId)")).toBeLessThan(p.indexOf("listProjectAdminSnapshots("));
  const access=src("src/modules/projects/admin-college-scope.ts");
  expect(access).toContain("context.membership?.collegeId ?? null");
  expect(access).toContain("context.adminScope?.collegeId ?? null");
  expect(access).toContain('can(context, "projects.manage", {');
  expect(access).toContain("if (!collegeId)");
  expect(access).toContain("return null;");
  expect(p).toContain("ProjectAdminPagination");
 });
 it("PROJ-BREAK-pages-03 Mentor role and effective tenant module access checked before opening project tabs",()=>{
  const p=src("src/app/(authenticated)/mentor/projects/page.tsx");
  expect(p).toContain('hasMembershipRole(');
  expect(p).toContain('"MENTOR"');
  expect(p).toContain('redirect("/dashboard")');
  expect(p).toContain("resolveOptionalModuleAccess");
  expect(p).toContain("mentorProjectListQuerySchema.safeParse");
  expect(p).toContain("Invalid Project filters");
  const detail=src("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
  expect(detail).toContain("requireProjectReadAccess(");
  expect(detail).toContain('access.access !== "MENTOR"');
  expect(detail).toContain('redirect("/mentor/projects")');
 });
 it("PROJ-BREAK-pages-04 Learner direct URL honors membership and disabled module flag",()=>{
  const p=src("src/app/(authenticated)/learn/projects/page.tsx");
  expect(p).toContain('hasMembershipRole(context, "LEARNER")');
  expect(p).toContain("resolveOptionalModuleAccess(context)");
  expect(p).toContain("This module is currently disabled for your college.");
  expect(p).toContain("parsePageSize");
  expect(p).toContain("learnerProjectListEmptyState");
  const access=src("src/modules/projects/access.ts");
  expect(access).toContain('member.role === "LEARNER"');
  expect(access).toContain('new ProjectsServiceError("PROJECT_ACCESS_DENIED")');
 });
 it("PROJ-BREAK-pages-05 all role entrypoints keep visible empty/error and filtered navigation states",()=>{
  for(const path of [
    "src/app/(authenticated)/admin/projects/page.tsx",
    "src/app/(authenticated)/college/projects/page.tsx",
    "src/app/(authenticated)/mentor/projects/page.tsx",
    "src/app/(authenticated)/learn/projects/page.tsx",
  ]){
    const p=src(path);
    expect(p,path).toContain("getCurrentRequestContext()");
    expect(p,path).toMatch(/Pagination|pageSize|page: parsePage/);
  }
 });
});
