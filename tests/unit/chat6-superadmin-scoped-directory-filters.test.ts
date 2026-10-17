import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {adminContentQuerySchema,adminContentHref} from "../../src/modules/courses/super-admin-content-directory-model";
import {adminAssessmentQuerySchema,adminAssessmentHref} from "../../src/modules/courses/admin-assessment-directory-model";
const source=(p:string)=>readFileSync(p,"utf8");
const ID="00000000-0000-4000-a000-000000000012";
describe("Super Admin selected-college directory filters",()=>{
 it("SA-academics-people-61 applies scoped course, lesson, section and audience selectors with persistent paging",()=>{
  const parsed=adminContentQuerySchema.parse({offeringId:ID,lessonId:ID,deliveryId:ID,scope:"SECTION",page:2});
  const href=adminContentHref("VIDEOS",parsed);
  for(const param of ["offeringId","lessonId","deliveryId","scope=SECTION","page=2"])expect(href).toContain(param);
  expect(adminContentQuerySchema.safeParse({scope:"EVERYONE"}).success).toBe(false);
  const svc=source("src/modules/courses/super-admin-content-directory-service.ts");
  for(const field of ["query.offeringId","query.lessonId","query.deliveryId","isNotNull(lessonContents.deliveryId)","eq(departments.collegeId,collegeId)"])expect(svc).toContain(field);
  const page=source("src/components/courses/super-admin-content-directory-page.tsx");
  for(const field of ['name="offeringId"','name="lessonId"','name="deliveryId"','name="scope"'])expect(page).toContain(field);
 });
 it("SA-academics-people-66 filters selected college assessments by course, section scope and result publication",()=>{
  const parsed=adminAssessmentQuerySchema.parse({courseCode:"CS101",scope:"SECTION",results:"HIDDEN",page:2});
  const href=adminAssessmentHref("QUIZ",parsed);
  for(const key of ["courseCode=CS101","scope=SECTION","results=HIDDEN","page=2"])expect(href).toContain(key);
  expect(adminAssessmentQuerySchema.safeParse({scope:"GLOBAL"}).success).toBe(false);
  for(const name of ["assignments","quizzes"]){const code=source("src/app/(authenticated)/admin/"+name+"/page.tsx");expect(code).toContain("courseCode:raw.courseCode");expect(code).toContain("scope:raw.scope");}
  const ui=source("src/components/courses/admin-assessment-read-directory.tsx");
  for(const key of ['name="courseCode"','name="scope"','name="results"'])expect(ui).toContain(key);
  const svc=source("src/modules/courses/college-assessment-aggregate-service.ts");
  expect(svc).toContain("query.courseCode");
  expect(svc).toContain('query.results!=="ALL"');
 });
});