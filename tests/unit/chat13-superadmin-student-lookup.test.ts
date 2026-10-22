import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin placement lookup",()=>{
 it("SA-placements-projects-09 supports tenant-scoped name, roll, email search and application outcomes",()=>{
  const page=read("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  const service=read("src/modules/placements/college-placement-student-lookup-service.ts");
  for(const v of ["suggestCollegePlacementLearners(ctx, query)","ctx.adminScope?.collegeId",
    "getCollegeStudentPlacementDetails(ctx,{membershipId:selectedStudent.membershipId,page:historyPage})",
    "Placement history","Joining"])expect(page).toContain(v);
  expect(page).toContain("parseSuperAdminPlacementStudentSearch(params)");
  expect(page).toContain("const lookup = query && scope");
  expect(page).toContain("choices.find(person => person.membershipId === requestedStudent)");
  expect(page).toContain("selectedStudent ? <section");
  expect(service).toContain("requireCollegePlacementAdmin");
  expect(service).toContain("eq(collegeMemberships.collegeId,collegeId)");
  for(const p of ["src/app/(authenticated)/admin/placements/page.tsx","src/app/(authenticated)/admin/placements/drives/page.tsx"])expect(read(p)).toContain("/admin/placements/student-lookup");
 });
 it("GR-71 lookup has actionable no-match and no-college states",()=>{
  const page=read("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  expect(page).toContain("Student not found in this college’s current search results.");
  expect(page).toContain("Choose a college in the header above to look up student placements.");
 });
 it("GR-73 lookup query persists during search",()=>{
  const page=read("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  expect(page).toContain("initialQuery={q}");
  const search=read("src/components/placements/admin-placement-student-search.tsx");
  expect(search).toContain('name="q"');
  expect(search).toContain("value={text}");
 });
 it("GR-76 lookup validates search length and explains no matches",()=>{
  const page=read("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  const search=read("src/components/placements/admin-placement-student-search.tsx");
  expect(search).toContain("maxLength={150}");
  expect(search).toContain("value.length < 2 || value.length > 150");
  expect(page).toContain("Student not found in this college’s current search results.");
 });
});
