import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Faculty My Assignments and My Quizzes legacy headers",()=>{
 for(const [route,title] of [["allAssignments","My Assignments"],["allQuizzes","My Quizzes"]]){
  it(route+" uses exact Faculty legacy H1 rather than Learner All",()=>{
   const src=readFileSync("src/app/(authenticated)/teacher/"+route+"/page.tsx","utf8");
   const renderedSource=route==="allAssignments"
    ?readFileSync("src/components/courses/faculty-assessment-overview.tsx","utf8")
    :src;
   expect(renderedSource).toContain('title="'+title+'"');
   if(route==="allAssignments")expect(src).toContain("<RetainedFacultyAssignments");
   expect(src).not.toContain('eyebrow="Faculty"');
   expect(src).not.toContain('title="All Quizzes"');
   expect(src).not.toContain('title="All Assignments"');
   expect(src).not.toMatch(/description="(?:Track class assignments|View quizzes across)/);
  });
 }
});
