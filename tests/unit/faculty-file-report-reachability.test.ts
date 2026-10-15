import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("faculty assignment report private-file viewing",()=>{
 it("exposes the same submission-scoped file viewer on the full report",()=>{
  const page=readFileSync("src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx","utf8");
  expect(page).toContain("FacultySubmissionFileReview");
  expect(page).toContain('row.submissionType==="FILE"');
  expect(page).toContain("submissionId={row.id}");
  expect(page).toContain("getFacultyAssignmentReport(context");
 });
});
