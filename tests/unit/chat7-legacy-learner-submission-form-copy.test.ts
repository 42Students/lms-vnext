import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("SubmitAssignmentModal.jsx dev copy in Learner submission form",()=>{
 const ui=readFileSync("src/components/courses/assignment-submission-control.tsx","utf8");
 it("uses exact drawer and submission-method labels",()=>{
  for(const label of ["Submit Your Work","Written response","External Link","File Upload","Website / External Links","Paste the link","Add your work using the allowed methods below. Submission is final once recorded."]){
   expect(ui).toContain(label);
  }
  expect(ui).toContain('"Retry":"Submit"}');
 });
 it("keeps exact legacy validation and success without weakening the secure link or final confirmation",()=>{
  expect(ui).toContain("Add at least one submission before submitting.");
  expect(ui).toContain("Assignment submitted successfully.");
  expect(ui).toContain("isLearnerAssignmentHttpsLink(submissionUrl)");
  expect(ui).toContain("learnerAssignmentFinalConfirmation(submissionType)");
  expect(ui).toContain("You cannot replace the submission");
 });
});
