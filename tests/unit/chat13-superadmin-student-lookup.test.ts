import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin placement lookup",()=>{
 it("SA-placements-projects-09 supports tenant-scoped name, roll, email search and application outcomes",()=>{
  const page=read("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  const service=read("src/modules/placements/college-placement-student-lookup-service.ts");
  for(const v of ["lookupCollegeStudentPlacement(ctx,query)","ctx.adminScope?.collegeId","Name, roll number or email","Application","Joining"])expect(page).toContain(v);
  expect(page).toContain("parseSuperAdminPlacementStudentSearch(params)");
  expect(page).toContain("query&&ctx.adminScope?.collegeId?await lookupCollegeStudentPlacement(ctx,query):null");
  expect(service).toContain("requireCollegePlacementAdmin");
  expect(service).toContain("eq(collegeMemberships.collegeId,collegeId)");
  for(const p of ["src/app/(authenticated)/admin/placements/page.tsx","src/app/(authenticated)/admin/placements/drives/page.tsx"])expect(read(p)).toContain("/admin/placements/student-lookup");
 });
 it("GR-71 lookup has actionable no-match and no-college states",()=>{
  const page=read("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  expect(page).toContain("No matching college students.");
  expect(page).toContain("Select a college to continue");
 });
 it("GR-73 lookup query persists during search",()=>{
  const page=read("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  expect(page).toContain("defaultValue={q}");expect(page).toContain('name="q"');
 });
 it("GR-76 lookup validates search length and explains no matches",()=>{
  const page=read("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  expect(page).toContain("minLength={3} maxLength={150}");
  expect(page).toContain("No matching college students.");
 });
});
