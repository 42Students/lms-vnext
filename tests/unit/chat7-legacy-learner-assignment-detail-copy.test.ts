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
  for(const literal of ["Your submission","Due","Submitted {formatDate(item.submittedAt)}"]){
    expect(src).toContain(literal);
  }
  expect(src).toContain("item.gradePublished");
  expect(src).toContain("AssignmentFileOpenControl");
  expect(src).toContain("The deadline has passed; this published assignment accepts late submissions.");
 });
});
