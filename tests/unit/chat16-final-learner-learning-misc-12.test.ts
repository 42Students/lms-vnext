import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
describe("LEARNER-learning-misc-12 Google Drive import fallback",()=>{
 it("LEARNER-learning-misc-12 clearly identifies absent provider import and offers verified local transfer",()=>{
  const form=source("src/components/courses/assignment-file-submission-control.tsx");
  expect(form).toContain("Google Drive import is not configured.");
  expect(form).toContain("download it to your device first, then use Choose a file to upload.");
  expect(form).toContain("must pass private-storage security checks.");
  expect(form).toContain("checkedAssignmentFileDeclaration");
  expect(form).toContain("uploadStagedAssignmentFile");
 });
 it("LEARNER-learning-misc-12 does not misrepresent Drive links as verified file upload receipts",()=>{
  const form=source("src/components/courses/assignment-file-submission-control.tsx");
  expect(form).toContain("readySubmissionFileIds(files)");
  expect(form).toContain("canSubmitStagedFiles(files)");
  expect(form).not.toContain("googleDriveToken");
  expect(form).not.toContain("drive.google.com/uc?export=download");
 });
});