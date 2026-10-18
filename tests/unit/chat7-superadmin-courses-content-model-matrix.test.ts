import {describe,expect,it} from "vitest";
import {adminAssessmentQuerySchema,adminAssessmentHref,adminAssessmentExportHref,adminAssessmentStats} from "@/modules/courses/admin-assessment-directory-model";
import {adminContentQuerySchema,adminContentHref,adminContentPages,adminContentTypeLabel,contentTypesForKind} from "@/modules/courses/super-admin-content-directory-model";
import {adminLearningQuerySchema,adminLearningHref,adminProgressStats} from "@/modules/courses/admin-learning-read-model";
import {collegeCourseCatalogueQuerySchema,paginateCollegeCourses} from "@/modules/courses/college-course-catalogue-model";
import {safePublicCourseContentUrl} from "@/modules/courses/super-admin-content-public-link-model";

const id="11111111-1111-4111-8111-111111111111";
describe("Super Admin Courses and Content model behaviour and legacy-safe URLs",()=>{
 it("SA-academics-people-54 stable catalogue paging sorts identically across pages and clamps stale pages",()=>{
  const query=collegeCourseCatalogueQuerySchema.parse({q:"science",sort:"NAME_ASC",page:99,pageSize:"25"});
  const courses=[
   {id:"03",name:"Data Science",code:"CS03",departmentName:"Applied Science"},
   {id:"02",name:"Computer SCIENCE",code:"CS02",departmentName:"Engineering"},
   {id:"01",name:"Physics",code:"PH01",departmentName:"Physical Sciences"},
   {id:"04",name:"Software Engineering",code:"CS04",departmentName:"Computer"},
  ];
  const first=paginateCollegeCourses(courses,query);
  expect(first.total).toBe(3);
  expect(first.page).toBe(1);
  expect(first.pages).toBe(1);
  expect(first.items.map(row=>row.id)).toEqual(["02","03","01"]);
  expect(courses[0]?.id).toBe("03");
  expect(collegeCourseCatalogueQuerySchema.safeParse({page:-1}).success).toBe(false);
  expect(collegeCourseCatalogueQuerySchema.safeParse({pageSize:"500"}).success).toBe(false);
  expect(collegeCourseCatalogueQuerySchema.safeParse({collegeId:id}).success).toBe(false);
 });
 it("SA-academics-people-64 assignment search, scope and CSV never mix a page or another tenant",()=>{
  const q=adminAssessmentQuerySchema.parse({q:"Matrix",courseCode:"CS-101",scope:"SECTION",page:4,status:"PUBLISHED"});
  expect(adminAssessmentHref("ASSIGNMENT",q)).toContain("page=4");
  const url=new URL(adminAssessmentExportHref("ASSIGNMENT",q),"https://example.invalid");
  expect(url.pathname).toBe("/api/admin/assignments/export");
  expect(url.searchParams.get("courseCode")).toBe("CS-101");
  expect(url.searchParams.get("scope")).toBe("SECTION");
  expect(url.searchParams.get("page")).toBeNull();
  expect(url.searchParams.get("collegeId")).toBeNull();
  expect(adminAssessmentQuerySchema.safeParse({collegeId:id}).success).toBe(false);
  expect(adminAssessmentQuerySchema.safeParse({page:1001}).success).toBe(false);
  expect(adminAssessmentQuerySchema.safeParse({status:"RELEASED"}).success).toBe(false);
 });
 it("SA-academics-people-65 quiz results scope and status persist in authorized export",()=>{
  const q=adminAssessmentQuerySchema.parse({status:"CLOSED",results:"HIDDEN",scope:"SHARED",page:3});
  const url=new URL(adminAssessmentExportHref("QUIZ",q),"https://example.invalid");
  expect(url.pathname).toBe("/api/admin/quizzes/export");
  expect(url.searchParams.get("results")).toBe("HIDDEN");
  expect(url.searchParams.get("scope")).toBe("SHARED");
  expect(url.searchParams.get("page")).toBeNull();
  expect(adminAssessmentStats([{status:"PUBLISHED",activityCount:2},{status:"DRAFT",activityCount:3}]))
   .toEqual({displayed:2,published:1,activity:5});
 });
 it("SA-academics-people-61 content filters reject foreign ids, arrays and unbounded paging",()=>{
  for(const invalid of [{collegeId:id},{page:1001},{status:"INVALID"},
   {offeringId:"bad-id"},{lessonId:[id,id]},{scope:"OTHER"}]){
   expect(adminContentQuerySchema.safeParse(invalid).success).toBe(false);
  }
  const q=adminContentQuerySchema.parse({offeringId:id,scope:"SECTION",page:2});
  const url=new URL(adminContentHref("RESOURCES",q),"https://example.invalid");
  expect(url.pathname).toBe("/admin/resources");
  expect(url.searchParams.get("offeringId")).toBe(id);
  expect(url.searchParams.get("scope")).toBe("SECTION");
  expect(url.searchParams.get("page")).toBe("2");
  expect(adminContentPages(0)).toBe(1);
  expect(adminContentPages(26)).toBe(2);
 });
 it("SA-academics-people-62 never renders old unsafe media links",()=>{
  for(const bad of ["javascript:alert(1)","http://example.edu/",
   "https://user:secret@example.edu/","https://example.edu/docs#internal",
   "file:///etc/passwd","not-a-url"]){
   expect(safePublicCourseContentUrl(bad)).toBeNull();
  }
  expect(safePublicCourseContentUrl("https://example.edu/guide")).toBe("https://example.edu/guide");
  expect(contentTypesForKind("VIDEOS")).toEqual(["VIDEO","YOUTUBE"]);
  expect(contentTypesForKind("RESOURCES")).toEqual(["RESOURCE"]);
  expect(adminContentTypeLabel("YOUTUBE")).toBe("YouTube Video");
 });
 it("SA-academics-people-68 lesson/progress filters remain route-correct and never sum learners across offerings",()=>{
  const q=adminLearningQuerySchema.parse({status:"ALL",courseCode:"CS1",cohortCode:"2028",page:3});
  const href=adminLearningHref("PROGRESS",q);
  expect(href.startsWith("/admin/course-progress?")).toBe(true);
  expect(href).toContain("courseCode=CS1");
  expect(href).toContain("cohortCode=2028");
  expect(href).toContain("page=3");
  expect(adminLearningQuerySchema.safeParse({page:[1,2]}).success).toBe(false);
  expect(adminLearningQuerySchema.safeParse({collegeId:id}).success).toBe(false);
  const summary=adminProgressStats([
   {recordedRows:4,completedRows:3,learnersWithRecords:10},
   {recordedRows:2,completedRows:1,learnersWithRecords:10},
  ]);
  expect(summary.contentRecords).toBe(6);
  expect(summary.completedContentRecords).toBe(4);
  expect(summary.perOfferingLearnerCounts).toEqual([10,10]);
  expect(summary).not.toHaveProperty("totalLearners");
 });
});
