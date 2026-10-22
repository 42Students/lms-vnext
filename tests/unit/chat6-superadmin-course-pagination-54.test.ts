import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {collegeCourseCatalogueQuerySchema,collegeCourseCatalogueHref,paginateCollegeCourses}
 from "@/modules/courses/college-course-catalogue-model";
const source=(p:string)=>readFileSync(p,"utf8");
const rows=Array.from({length:115},(_,i)=>({
  id:String(i).padStart(3,"0"),name:"Course "+String(i).padStart(3,"0"),
  code:"CRS"+i,departmentName:"Engineering",
}));
describe("Super Admin Courses bounded page size",()=>{
 it("SA-academics-people-54 supports stable search sort and 25/50/100-page URL persistence",()=>{
  for(const size of ["25","50","100"] as const){
   const query=collegeCourseCatalogueQuerySchema.parse({q:"Course",sort:"NAME_ASC",page:"2",pageSize:size});
   const page=paginateCollegeCourses(rows,query);
   expect(page.items).toHaveLength(Math.min(Number(size),115-Number(size)));
   expect(page.pageSize).toBe(Number(size));
   if(size==="25")expect(collegeCourseCatalogueHref(query)).not.toContain("pageSize=");
   else expect(collegeCourseCatalogueHref(query)).toContain("pageSize="+size);
  }
  expect(collegeCourseCatalogueQuerySchema.safeParse({pageSize:"500"}).success).toBe(false);
 });
 it("SA-academics-people-54 wires bounded UI page size and Refresh into the Super Admin page",()=>{
  const page=source("src/app/(authenticated)/admin/courses/page.tsx");
  const overview=source("src/components/courses/admin-course-overview.tsx");
  expect(page).toContain("parseSuperAdminCourseQuery(query)");
  expect(page).toContain("catalogueQuery={catalogueQuery}");
  expect(overview).toContain('name="pageSize"');
  expect(overview).toContain(">Refresh</Link>");
  expect(overview).toContain("{catalogue.pageSize} per page");
 });
});
