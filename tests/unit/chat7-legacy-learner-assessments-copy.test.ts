import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Learner global assessments exact dev legacy headings",()=>{
 for(const [route,title] of [["allAssignments","All Assignments"],["allQuizzes","All Quizzes"]]){
  it(route+" renders the literal legacy H1 without an invented eyebrow or subtitle",()=>{
   const src=readFileSync("src/app/(authenticated)/learn/"+route+"/page.tsx","utf8");
   expect(src).toContain('title="'+title+'"');
   expect(src).not.toContain('eyebrow="Learner"');
   expect(src).not.toMatch(/description="Every published/);
   expect(src).toContain("<LearnerAssessmentOverview");
  });
 }
});
