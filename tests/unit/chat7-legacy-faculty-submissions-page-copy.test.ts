import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {facultySubmissionReportEmptyState} from "@/modules/courses/faculty-assignment-submissions-model";
describe("Faculty standalone submission list legacy exact copy",()=>{
 const page=readFileSync("src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx","utf8");
 it("uses the Assignment submissions heading with no invented Faculty eyebrow",()=>{
  expect(page).toContain('<PageHeader title="Assignment submissions"');
  expect(page).not.toContain('eyebrow="Faculty · Assignment Report"');
 });
 it("uses Graded, Pending and Grade pending exactly",()=>{
  expect(page).toContain('?"Graded":"Pending"');
  expect(page).toContain('"Grade pending"');
  expect(page).toContain("FacultySubmissionFileReview");
 });
 it("uses legacy No submissions yet only on true empty state",()=>{
  const q={filter:"ALL" as const,q:"",publication:"ALL" as const};
  expect(facultySubmissionReportEmptyState(q,0).title).toBe("No submissions yet");
  expect(facultySubmissionReportEmptyState({...q,q:"nobody"},3).title).toBe("No learner names match");
 });
});
