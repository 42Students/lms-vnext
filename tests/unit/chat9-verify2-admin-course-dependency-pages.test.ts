import {describe,expect,it} from "vitest";
import {paginateCollegeCourses} from "@/modules/courses/college-course-catalogue-model";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const courses=Array.from({length:125},(_,i)=>({
 id:"course-"+String(i).padStart(3,"0"),name:"Course "+String(i).padStart(3,"0"),
 code:"C"+String(i).padStart(3,"0"),departmentName:"Engineering",
}));
describe("Super Admin paged course dependency counts",()=>{
 it("limits dependency queries to exactly the course UUIDs shown by 10/25/50/100 page sizes",()=>{
  for(const size of ["10","25","50","100"] as const){
   const first=paginateCollegeCourses(courses,{q:"",sort:"NAME_ASC",page:1,pageSize:size});
   const next=paginateCollegeCourses(courses,{q:"",sort:"NAME_ASC",page:2,pageSize:size});
   expect(first.items).toHaveLength(Number(size));
   expect(new Set(first.items.map(row=>row.id)).size).toBe(Number(size));
   expect(first.items.some(row=>next.items.some(item=>item.id===row.id))).toBe(false);
  }
 });
 it("scope is applied on the DB query, not only to presentation counts",()=>{
  const service=source("src/modules/admin-ui/super-admin-course-dependencies-service.ts");
  const page=source("src/app/(authenticated)/admin/courses/page.tsx");
  expect(service).toContain('requireSuperAdminSelectedCollege(context,"courses.read")');
  expect(service).toContain("z.array(z.uuid()).max(100).parse(visibleCourseIds)");
  expect(service).toContain("inArray(courses.id,courseIds)");
  expect(page).toMatch(/paginateCollegeCourses\(workspace\?\.courses\s*\?\?\s*\[\],\s*catalogueQuery\)\.items\.map\(course\s*=>\s*course\.id\)/);
  expect(page).toMatch(/getSuperAdminCourseDependencyCounts\(context,\s*paginateCollegeCourses\(/);
  expect(page).toContain("!dependenciesResult.ok");
 });
});
