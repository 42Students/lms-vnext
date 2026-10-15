import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("PR-S2-07 0091 final submission exact dev legacy wording",()=>{
 const form=readFileSync("src/components/projects/project-final-delivery-controls.tsx","utf8");
 const workspace=readFileSync("src/components/projects/project-workspace.tsx","utf8");
 it("shows Final submission and Submit final work, as in legacy Projects",()=>{
  expect(workspace).toContain('label="Final submission"');
  expect(workspace).toContain("Your final submission");
  expect(workspace).toContain("Final submission");
  expect(form).toContain('"Submit final work"');
  expect(form).not.toContain('"Submit final delivery"');
 });
 it("keeps real 0091 attachment/edit/submit safety gates and review visibility",()=>{
  for(const phrase of ['safeDraftAttachments(draft?.attachments)',"canSubmitDraft",
    "Additional files &amp; links","Add link","Save draft","projectMutation("]){
    expect(form).toContain(phrase);
  }
  expect(workspace).toContain("readiness.finalSubmission.approved");
 });
});
