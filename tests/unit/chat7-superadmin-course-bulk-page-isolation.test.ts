import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {superAdminCourseBulkSchema} from "@/modules/courses/super-admin-course-bulk-visibility";

const source=(path:string)=>readFileSync(path,"utf8");
const id1="11111111-1111-4111-8111-111111111111";
const id2="22222222-2222-4222-8222-222222222222";
describe("SA-courses-visibility-01 admin acting-college, page and bulk selection isolation",()=>{
 it("never retains a mutable selection on acting-college or visible catalogue ID changes",()=>{
  const parent=source("src/components/courses/admin-course-overview.tsx");
  expect(parent).toContain("key={workspace.collegeId");
  expect(parent).toContain("catalogue.items:workspace.courses");
  expect(parent).toContain("key={workspace.collegeId}");
  expect(parent).toContain("courses={(catalogue?catalogue.items:workspace.courses).map(course=>({id:course.id,name:course.name}))}");
 });
 it("filters selected items to current college/page on every submit, count and checkbox",()=>{
  const control=source("src/components/courses/super-admin-course-bulk-visibility.tsx");
  expect(control).toContain("const currentIds=new Set(courses.map(row=>row.id))");
  expect(control).toContain('const storageKey="lms:college-bulk-course-selection:"+collegeId');
  expect(control).toContain("saved?.filterKey===filterKey");
  expect(control).toContain("const selectedHere=selected.filter(id=>currentIds.has(id))");
  expect(control).toContain("const ids=[...selected]");
  expect(control).toContain("setSelected([...new Set(ids.filter(");
  expect(control).toContain("selectedHere.length");
  expect(control).toContain("selected.includes(course.id)");
  expect(control).toContain('method:"POST"');
  expect(control).toContain("confirmed:true");
 });
 it("rejects forged and duplicate IDs at the strict bulk API schema boundary",()=>{
  const valid={courseIds:[id1,id2],visibleToStudents:false,confirmed:true};
  expect(superAdminCourseBulkSchema.safeParse(valid).success).toBe(true);
  for(const body of [
   {...valid,courseIds:[id1,id1]}, {...valid,courseIds:["tenant-other"]},
   {...valid,visibleToStudents:"false"}, {...valid,confirmed:false},
   {...valid,actingCollegeId:id1},{...valid,courseIds:[]},
  ])expect(superAdminCourseBulkSchema.safeParse(body).success).toBe(false);
 });
});
