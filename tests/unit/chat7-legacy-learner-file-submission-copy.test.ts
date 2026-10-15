import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("dev legacy file submission copy and private-storage safeguards",()=>{
 const ui=readFileSync("src/components/courses/assignment-file-submission-control.tsx","utf8");
 it("labels the file block like dev SubmitAssignmentModal",()=>{
  for(const label of ["File Upload","Choose a file to upload","Add another file","Uploading…","Remove this file","Submit Your Work"]){
   expect(ui).toContain(label);
  }
 });
 it("preserves secure signed-upload states and READY gating",()=>{
  for(const label of ["Files must pass security checks before final submission.","Check file","Cancel upload","Staged assignment files","canSubmitStagedFiles(files)"]){
   expect(ui).toContain(label);
  }
 });
});
