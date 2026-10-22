import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("legacy learner assignment detail — ViewAssignmentModal.jsx dev",()=>{
 const src=readFileSync("src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx","utf8");
 it("shows the assignment's real title and exact Instructions & resources wording",()=>{
  expect(src).toContain("<PageHeader title={item.title} />");
  expect(src).toContain("Instructions & resources");
  expect(src).toContain("Your faculty hasn't added any resources to this assignment yet.");
  expect(src).not.toContain('eyebrow="Learner · Assignment"');
 });
 it("preserves exact Your submission and Due with safe submission state",()=>{
  for(const literal of ["Your submission","Due",'<StatusBadge tone="success">Submitted</StatusBadge>{formatDate(item.submittedAt)}']){
    expect(src).toContain(literal);
  }
  expect(src).toContain("item.gradePublished");
  expect(src).toContain("AssignmentFileOpenControl");
  // Late and unset deadlines are rejected (LEARNER-learning-misc-05/06); the dev legacy
  // Alert message for a passed deadline is exactly "Submissions are closed".
  expect(src).toContain("Submissions are closed");
  expect(src).not.toContain("accepts late submissions");
 });
});
