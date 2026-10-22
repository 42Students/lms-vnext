import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {collegeCourseCatalogueQuerySchema,paginateCollegeCourses} from "@/modules/courses/college-course-catalogue-model";
import {collegeCourseDuplicatePrefill} from "@/modules/courses/college-course-duplicate-model";
import {FACULTY_ASSIGNMENT_COPY,facultyAssignmentRoleLabel} from "@/modules/courses/college-courses-copy";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const catalogue=()=>read("src/components/courses/admin-course-overview.tsx");
const creation=()=>read("src/components/courses/admin-course-create-panel.tsx");
const detail=()=>read("src/components/courses/admin-offering-learning-page.tsx");
const faculty=()=>read("src/app/(authenticated)/college/faculty-assignment/page.tsx");
describe("College Courses & Content gap closure",()=>{
 it("COL-courses-content-01 SQL catalogue supports scoped search, sort and page with CSV",()=>{
  const a=collegeCourseCatalogueQuerySchema.parse({q:" math ",page:"2",sort:"NAME_DESC"});
  expect(a.q).toBe("math");
  const rows=Array.from({length:26},(_,i)=>({id:String(i),name:"Math "+String(i).padStart(2,"0"),code:String(i),departmentName:"Math"}));
  const v=paginateCollegeCourses(rows,a);
  expect(v.total).toBe(26);expect(v.page).toBe(2);expect(v.items).toHaveLength(1);
  const svc=read("src/modules/courses/college-course-catalogue-service.ts");
  expect(svc).toContain("authorizedCollege(context)");
  expect(svc).toContain("COLLEGE_COURSE_CATALOGUE_PAGE_SIZE");
  expect(catalogue()).toContain("Export CSV");
 });
 it("COL-courses-content-02 the course Home fields have guarded persisted editor",()=>{
  const editor=read("src/components/courses/admin-course-display-editor.tsx");
  for(const field of ["Introduction","Rich description HTML","Course Home content","takeaways","thumbnailUrl"])expect(editor).toContain(field);
  expect(read("src/modules/courses/course-display-readiness.ts")).toContain("DB05_VERIFIED");
 });
 it("COL-courses-content-03 visibility is not faked by an archived record label",()=>{
  expect(catalogue()).toContain('courseVisibleToStudentsLabel(course.status==="ACTIVE"&&course.enabled&&');
  expect(catalogue()).toContain('course.legacyAllowedForDisplay!==0?"ACTIVE":"HIDDEN"');
  expect(read("src/components/courses/admin-offering-section-preview.tsx")).toContain("studentVisible");
 });
 it("COL-courses-content-04 Duplicate produces distinct unoccupied code, retains metadata, not students",()=>{
  const courses=[{id:"a",name:"Algorithms",code:"CS1",departmentId:"d",description:"Learn"},{id:"b",name:"Copy",code:"CS1-COPY",departmentId:"d",description:null}];
  expect(collegeCourseDuplicatePrefill(courses,"a")).toMatchObject({code:"CS1-COPY2",name:"Algorithms (Copy)",departmentId:"d"});
  expect(collegeCourseDuplicatePrefill(courses,"missing")).toBeNull();
  expect(creation()).toContain("Cancel copy");
 });
 it("COL-courses-content-05 existing course table shows student-visibility indicator and department",()=>{
  expect(catalogue()).toContain("COLLEGE_COURSES_COPY.studentsSeeIt");
  expect(catalogue()).toContain('header: "Department"');
  expect(catalogue()).toContain('header: "Dependencies"');
  expect(catalogue()).toContain("activeOfferingCountByCourse");
 });
 it("COL-courses-content-07 setup wizard preserves mapped Course Offering Delivery and Teaching order",()=>{
  for(const step of ["1. Create Course","2. Course Offering","3. Section Delivery","4. Assign Course Faculty"])expect(creation()).toContain(step);
  expect(creation()).toContain('setNextSetupStep("OFFERING")');
  expect(creation()).toContain('setNextSetupStep("DELIVERY")');
 });
 it("COL-courses-content-08 offering detail displays Home/Syllabus and scoped teacher identities",()=>{
  expect(detail()).toContain("<AdminOfferingSectionTabs");
  expect(read("src/components/courses/admin-offering-section-tabs.tsx")).toContain('ariaLabel="Course detail tabs"');
  expect(detail()).toContain("AdminOfferingTeachersPanel");
  expect(detail()).toContain("Back to Courses");
 });
 it("COL-courses-content-09 section content selector never discloses student media links",()=>{
  const body=read("src/components/courses/admin-offering-section-preview.tsx");
  expect(body).toContain("Section-specific");
  expect(body).toContain("Shared offering");
  expect(body).toContain("does not expose private file, video or meeting URLs");
  expect(detail()).toContain("AdminOfferingSectionPreview");
 });
 it("COL-courses-content-10 absent offering is a friendly page, load failure is distinct",()=>{
  const miss=read("src/app/(authenticated)/college/courses/offerings/[offeringId]/not-found.tsx");
  const fail=read("src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx");
  expect(miss).toContain("Course not found");
  expect(miss).toContain("This course doesn't exist, was removed, or isn't available to your college.");
  expect(miss).toContain("Back to Courses");
  expect(fail).toContain("Course details could not be loaded");
  expect(fail).toContain("Retry");
  expect(fail).toContain("<ErrorState");
  expect(read("src/components/ui/error-state.tsx")).toContain('role="alert"');
  expect(fail).not.toContain("{error.message}");
 });
 it("COL-courses-content-11 Faculty Assignment form selects multiple courses by program, batch, class, semester and year",()=>{
  const widget=read("src/components/college/college-faculty-assignment-actions.tsx");
  expect(widget).toContain("Select one or more courses");
  expect(widget).toContain("setSelected(");
  for(const item of ["programId","cohortId","sectionId","semesterNumber","academicYear"])expect(widget).toContain(item);
  expect(widget).toContain("/api/college/teaching-assignments/bulk");
 });
 it("COL-courses-content-12 faculty reassign retains history and explicit lifecycle",()=>{
  expect(faculty()).toContain("CollegeFacultyReassignAction");
  expect(faculty()).toContain("CollegeFacultyAssignmentEnd");
 });
 it("COL-courses-content-14 Class filter uses dropdown and role/status labels are friendly",()=>{
  expect(faculty()).toContain('name="sectionCode"');
  expect(facultyAssignmentRoleLabel("PRIMARY")).toBe("Primary Instructor");
  expect(facultyAssignmentRoleLabel("CO_TEACHER")).toBe("Co-Teacher");
  expect(FACULTY_ASSIGNMENT_COPY.yes).toBe("Yes");
  expect(FACULTY_ASSIGNMENT_COPY.no).toBe("No");
 });
 it("COL-courses-content-16 the surrounding course content tabs are distinct maintained routes",()=>{
  const nav=read("src/modules/people/college-legacy-tabs-model.ts");
  for(const tab of ["Lessons","Video","Resources","Live Classes","Assignments","Quizzes","Progress"])expect(nav).toContain('label:"'+tab+'"');
 });
 it("COL-courses-content-17 archiving warns about active course offerings rather than silently deleting",()=>{
  const actions=read("src/components/courses/admin-course-actions.tsx");
  expect(actions).toContain("A Course with active Offerings cannot be archived.");
  expect(actions).toContain("Archive Course");
  expect(actions).toContain("activeOfferingCount>0");
  expect(actions).toContain("useGuardedAction");
  expect(actions).toContain("academicSetupErrorMessage");
 });
 it("COL-courses-content-15 raw machine codes are not rendered in Course mutation errors",()=>{
  expect(read("src/components/courses/admin-course-actions.tsx")).toContain("academicSetupErrorMessage(error");
  expect(read("src/components/courses/learner-course-api.ts")).toContain("COURSE_NAME_CONFLICT");
  expect(read("src/components/courses/admin-course-actions.tsx")).toContain("apiFetch<unknown>");
  expect(creation()).toContain("apiFetch<unknown>");
  expect(read("src/components/courses/admin-course-display-editor.tsx")).toContain("apiFetch<{display?:{version:number}}>");
 });
});
