import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Learner Projects TaskDetailsModal submission exact legacy copy",()=>{
 const source=readFileSync("src/components/projects/project-task-submission-control.tsx","utf8");
 it("uses Submit for review and Submitted for review. without invented modal description",()=>{
  expect(source).toContain("Submit for review");
  expect(source).toContain('title: "Submitted for review."');
  expect(source).toContain('title="Submit for review"');
  expect(source).not.toContain("Share the work artifact the mentor should review.");
 });
 it("keeps secure submissions, mandatory work link and final access gate",()=>{
  for(const text of ["disabled={disabled}","submissionUrl.trim()","url.protocol !== \"https:\"","url.protocol !== \"http:\"","projectMutation(","router.refresh()"]){
   expect(source).toContain(text);
  }
 });
});
