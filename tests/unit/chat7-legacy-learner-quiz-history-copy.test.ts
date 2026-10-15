import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Learner quiz attempt history legacy status wording",()=>{
 const page=readFileSync("src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx","utf8");
 it("retains dynamic quiz title without invented Learner eyebrow or description",()=>{
  expect(page).toContain("<PageHeader title={quiz.title} />");
  expect(page).not.toContain('eyebrow="Learner · Quiz history"');
  expect(page).not.toContain('description={quiz.courseName');
 });
 it("labels the no-attempt state Not attempted per legacy QuizzesContent",()=>{
  expect(page).toContain("Not attempted · No quiz attempt is recorded for you in this course.");
  expect(page).toContain("Attempt history");
  expect(page).toContain("attempt.resultsVisible");
  expect(page).toContain("Question review and scores are withheld until results are published.");
 });
});
