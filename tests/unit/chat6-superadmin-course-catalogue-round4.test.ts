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
    expect(route).toContain('eq(courses.status,"ACTIVE")');
    expect(route).toContain('keys.indexOf(key)!==index');
    expect(route).toContain("renderCollegeCourseCatalogueCsv");
    expect(route).toContain("Cache-Control");
    expect(table).toContain("/api/admin/courses/catalogue/export");
    expect(collegeCourseCatalogueQuerySchema.safeParse({page:"0"}).success).toBe(false);
  });

  it("SA-academics-people-74 counts lesson dependencies only in the selected college and preflights archive",()=>{
    const service=read("src/modules/admin-ui/super-admin-course-dependencies-service.ts");
    const page=read("src/app/(authenticated)/admin/courses/page.tsx");
    const overview=read("src/components/courses/admin-course-overview.tsx");
    const actions=read("src/components/courses/admin-course-actions.tsx");
    const backend=read("src/modules/courses/course-service.ts");
    expect(service).toContain('requireSuperAdminSelectedCollege(context,"courses.read")');
    expect(service).toContain("countDistinct(courseLessons.id)");
    expect(service).toContain("eq(departments.collegeId,selected.collegeId)");
    expect(page).toContain("lessonCountByCourse={lessonCountByCourse}");
    expect(overview).toContain("lessonCountByCourse?.[course.id]");
    expect(actions).toContain("confirmDisabled={activeOfferingCount>0}");
    expect(actions).toContain("active Course Offering(s) must be archived");
    expect(backend).toContain('COURSE_HAS_ACTIVE_OFFERINGS');
  });

  it("SA-academics-people-55 keeps legacy course headings and creation update feedback with department recovery",()=>{
    const form=read("src/components/courses/admin-course-create-panel.tsx");
    const overview=read("src/components/courses/admin-course-overview.tsx");
    const actions=read("src/components/courses/admin-course-actions.tsx");
    const copy=read("src/modules/courses/college-courses-copy.ts");
    expect(copy).toContain('createTitle: "Create New Course"');
    expect(copy).toContain('existingTitle: "Existing Courses"');
    expect(copy).toContain('nameLabel: "Course Name"');
    expect(copy).toContain('Created course');
    expect(form).toContain("No departments in this college yet.");
    expect(form).toContain("Go to Departments");
    expect(form).toContain('href={courseBasePath.startsWith("/admin/")?"/admin/departments":"/college/departments"}');
    expect(overview).toContain("COLLEGE_COURSES_COPY.existingTitle");
    expect(actions).toContain('Updated course “"+name.trim()+"”.');
  });

  it("SA-academics-people-62 shows scoped student visibility and lesson ordering with safe external links",()=>{
    const service=read("src/modules/courses/super-admin-content-directory-service.ts");
    const page=read("src/components/courses/super-admin-content-directory-page.tsx");
    expect(service).toContain("visibleToStudents:lessonContents.visibleToStudents");
    expect(service).toContain("externalUrl:lessonContents.externalUrl");
    expect(service).toContain("eq(departments.collegeId,collegeId)");
    expect(page).toContain("studentContentVisible(item)");
    expect(page).toContain("Students {studentContentVisible(item)?");
    expect(page).toContain("Order within lesson:");
    expect(page).toContain("Linked materials:");
    expect(page).toContain('return url.protocol==="https:"?url.toString():null');
    expect(page).toContain('rel="noopener noreferrer"');
  });
});
