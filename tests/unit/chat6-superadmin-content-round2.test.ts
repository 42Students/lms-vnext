import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Super Admin Courses and Content gap closure",()=>{
 it("SA-academics-people-48 uses select college legacy empty copy consistently",()=>{
  for(const path of ["src/app/(authenticated)/admin/assignments/page.tsx","src/app/(authenticated)/admin/quizzes/page.tsx","src/app/(authenticated)/admin/course-progress/page.tsx","src/components/courses/super-admin-content-directory-page.tsx"]){
   const src=readFileSync(path,"utf8");
   expect(src).toContain('title="Select a college to continue"');
   expect(src).toContain("Choose a college in the header above to see its ");
  }
 });
});
