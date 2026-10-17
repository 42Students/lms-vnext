import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  collegeCourseCatalogueQuerySchema,
  paginateCollegeCourses,
} from "../../src/modules/courses/college-course-catalogue-model";

const read=(path:string)=>readFileSync(path,"utf8");

describe("chat-6 Super Admin selected-college course directory parity",()=>{
  it("SA-academics-people-54 supports search sort pagination and route-correct actions",()=>{
    const page=read("src/app/(authenticated)/admin/courses/page.tsx");
    const table=read("src/components/courses/admin-course-overview.tsx");
    const query=collegeCourseCatalogueQuerySchema.parse({q:"comp",sort:"CODE_DESC",page:"2"});
    const data=Array.from({length:31},(_,i)=>({
      id:String(i),name:"Course "+i,code:"C"+String(i).padStart(2,"0"),departmentName:"Computer Science",
    }));
    const result=paginateCollegeCourses(data,query);
    expect(result.total).toBe(31);
    expect(result.page).toBe(2);
    expect(result.items).toHaveLength(6);
    expect(result.items[0]?.code).toBe("C05");
    expect(page).toContain("catalogueQuery={catalogueQuery.data}");
    expect(page).toContain('courseBasePath="/admin/courses"');
    expect(table).toContain('action={courseBasePath}');
    expect(table).toContain('href={courseBasePath}>Clear');
    expect(table).toContain(".replace(\"/college/courses\",courseBasePath)");
    expect(table).toContain("Search courses");
    expect(table).toContain("Export CSV");
  });

  it("SA-academics-people-54 exports a bounded selected-college CSV without exposing other colleges",()=>{
    const route=read("src/app/api/admin/courses/catalogue/export/route.ts");
    const table=read("src/components/courses/admin-course-overview.tsx");
    expect(route).toContain('requireSuperAdminSelectedCollege(context,"courses.read")');
    expect(route).toContain("eq(departments.collegeId,scope.collegeId)");
    expect(route).toContain("COLLEGE_COURSE_EXPORT_CAP+1");
    expect(route).toContain("renderCollegeCourseCatalogueCsv");
    expect(route).toContain("Cache-Control");
    expect(table).toContain("/api/admin/courses/catalogue/export");
    expect(collegeCourseCatalogueQuerySchema.safeParse({page:"0"}).success).toBe(false);
  });
});
