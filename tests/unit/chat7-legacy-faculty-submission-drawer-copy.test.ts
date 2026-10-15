import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {facultySubmissionReviewEmptyLabel} from "@/modules/courses/faculty-submission-review-model";
describe("Faculty legacy viewSubmissionsModal grade and empty-state copy",()=>{
 const ui=readFileSync("src/components/courses/faculty-assignment-review.tsx","utf8");
 it("uses the exact dev drawer and grade button copy",()=>{
  for(const text of ["Assignment submissions","View submissions","Written Response","Grade points","Submit grade","Edit grade","Pending","Graded"]){
   expect(ui).toContain(text);
  }
 });
 it("keeps the legacy unfiltered empty state and descriptive filtered empties",()=>{
  expect(facultySubmissionReviewEmptyLabel("ALL")).toBe("No submissions yet");
  expect(facultySubmissionReviewEmptyLabel("UNGRADED")).toBe("No submissions are waiting for grading.");
 });
 it("retains the explicit privacy-preserving Publish grade action",()=>{
  expect(ui).toContain("Publish grade");
  expect(ui).toContain("Save your score and feedback changes before publishing.");
  expect(ui).toContain("submission.gradePublished");
 });
});
