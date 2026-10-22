import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Super Admin content CSV parity",()=>{
 it("SA-academics-people-69 exposes four selected-college bounded CSV endpoints",()=>{
  const paths=[["lessons","LESSONS"],["course-progress","PROGRESS"],["assignments","ASSIGNMENT"],["quizzes","QUIZ"]] as const;
  for(const [name,kind] of paths){
   const route=readFileSync("src/app/api/admin/"+name+"/export/route.ts","utf8");
   expect(route).toContain('exportSuperAdminLearningDirectory(request,"'+kind+'")');
  }
  const service=readFileSync("src/modules/admin-ui/super-admin-learning-csv-service.ts","utf8");
  expect(service).toContain("getCurrentRequestContext");
  expect(service).toContain("2000:500");
  expect(service).toContain("X-Export-Truncated");
  for(const name of ["lessons","course-progress"]){
   const page=readFileSync("src/app/(authenticated)/admin/"+name+"/page.tsx","utf8");
   expect(page).toContain("/api/admin/"+name+"/export");
  }
  for(const [name,kind] of [["assignments","ASSIGNMENT"],["quizzes","QUIZ"]] as const){
   const page=readFileSync("src/app/(authenticated)/admin/"+name+"/page.tsx","utf8");
   expect(page).toContain('adminAssessmentExportHref("'+kind+'",query.data');
  }
  const model=readFileSync("src/modules/courses/admin-assessment-directory-model.ts","utf8");
  expect(model).toContain('"/api/admin/assignments/export"');
  expect(model).toContain('"/api/admin/quizzes/export"');
 });
});
