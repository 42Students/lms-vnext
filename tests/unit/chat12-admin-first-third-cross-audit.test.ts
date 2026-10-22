import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {parseAdminModuleDetailPageParams} from "@/modules/module-access/admin-module-detail-query";

const page=(path:string)=>readFileSync(resolve(process.cwd(),
 "src/app/(authenticated)/admin"+path+"/page.tsx"),"utf8");

describe("UX-admin-first-third-chat12 independent source cross-audit",()=>{
 it("UX-admin-attendance-01 recovers malformed month before any private attendance query",()=>{
  const src=page("/attendance");
  expect(src).toContain('context.adminScope?.collegeId ?? null');
  expect(src).toContain('if (!collegeId)');
  expect(src).toContain('!/^\\d{4}-(0[1-9]|1[0-2])$/.test(month)');
  expect(src).toContain('title="Invalid attendance month"');
  expect(src).toContain('href="/admin/attendance"');
  expect(src.indexOf('title="Invalid attendance month"')).toBeLessThan(src.indexOf("await getAdminAttendanceOptions("));
 });
 it("UX-admin-academics-01 requires explicit selected-college safety scope",()=>{
  const src=page("/academics");
  expect(src).toContain("context.adminScope?.collegeId ?? null");
  expect(src).toContain('title="Select a college scope"');
  expect(src).toContain('sectionBasePath="/admin/academics/sections"');
  expect(src.indexOf("if (!collegeId)")).toBeLessThan(src.indexOf("await getAcademicsWorkspace("));
 });
 it("UX-admin-colleges-01 validates filters before source queries and retains mobile actions",()=>{
  const src=page("/colleges");
  expect(src).toContain("parseAdminDirectorySearchParams(await searchParams)");
  expect(src.indexOf("if (!filters)")).toBeLessThan(src.indexOf("listColleges(context)"));
  expect(src).toContain('title="Invalid college directory filters"');
  expect(src).toContain("canManageCollegeDirectoryRow(context,college)");
  expect(src).toContain('mobilePriority: "action"');
  expect(src).toContain('href="/admin/colleges"');
 });
 it("UX-admin-companies-01 errors on malformed filters before directory lookup and labels safety scope",()=>{
  const src=page("/companies");
  expect(src).toContain("adminCompaniesQuerySchema.safeParse");
  expect(src.indexOf("if (!parsed.success)")).toBeLessThan(src.indexOf("listSuperAdminCompanyDirectory(context, parsed.data)"));
  expect(src).toContain('title="Invalid company search"');
  expect(src).toContain("context.adminScope?.collegeId");
  expect(src).toContain("results below remain restricted to that college");
 });
 it("UX-admin-features-collegeId-01 refuses malformed tenant ID and duplicate scope filters",()=>{
  const src=page("/features/[collegeId]");
  expect(src).toContain("collegeIdSchema.safeParse(collegeId)");
  expect(src).toContain("parseAdminModuleDetailPageParams(await searchParams)");
  expect(src.indexOf("if (!parsed)")).toBeLessThan(src.indexOf("getSuperAdminCollegeModuleAccess("));
  const parse=readFileSync(resolve(process.cwd(),"src/modules/module-access/admin-module-detail-query.ts"),"utf8");
  expect(parse).toContain("Object.values(raw).some(Array.isArray)");
  expect(parse).toContain("Object.keys(raw).some(key=>!allowed.has(key))");
  expect(src).toContain("notFound()");
  expect(src).toContain("getSuperAdminCollegeModuleAccess(");
  expect(src).toContain("if (!result)");
  expect(src).toContain("LearnerModuleAccessDrawer");
  expect(parseAdminModuleDetailPageParams({module:["placements","projects"]})).toBeNull();
  expect(parseAdminModuleDetailPageParams({page:["1","2"]})).toBeNull();
  expect(parseAdminModuleDetailPageParams({collegeId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"})).toBeNull();
  expect(parseAdminModuleDetailPageParams({scopeId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"})).toBeNull();
  expect(parseAdminModuleDetailPageParams({module:"placements",page:"0"})).toBeNull();
  expect(parseAdminModuleDetailPageParams({module:"placements",page:"1"})?.page).toBe(1);
 });
 it("UX-admin-college-admin-history-01 validates page, keeps empty state and uses IST on export",()=>{
  const src=page("/colleges/[collegeId]/admins/[userId]/history");
  expect(src).toContain("parseAdminSessionHistoryPage(raw)");
  expect(src.indexOf("if(page===null)")).toBeLessThan(src.indexOf("listCollegeAdminHistory("));
  expect(src).toContain('title="Invalid history page"');
  expect(src).toContain('timeZone:"Asia/Kolkata"');
  expect(src).toContain("Cross-college and raw event metadata are excluded.");
  expect(src).toContain("No matching identity or platform history was recorded");
 });
});
