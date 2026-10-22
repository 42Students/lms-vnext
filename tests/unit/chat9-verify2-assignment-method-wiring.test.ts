import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
function source(path:string){return readFileSync(join(process.cwd(),path),"utf8");}
describe("learner assignment submission method parity",()=>{
 it("requires the current published assignment methods on list and detail",()=>{
  for(const path of [
   "src/components/courses/learner-assessment-overview.tsx",
   "src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx",
  ]){
   const code=source(path);
   expect(code).toContain("methodsEnabled");
   expect(code).toContain("multipartEnabled=");
  }
 });
 it("never offers written or link methods outside assignment policy",()=>{
  const control=source("src/components/courses/assignment-submission-control.tsx");
  const editor=source("src/components/courses/assignment-multipart-parts-editor.tsx");
  const files=source("src/components/courses/assignment-file-submission-control.tsx");
  expect(control).toContain("allowedMethods={allowedMethods}");
  expect(files).toContain('allowedMethods.includes("WRITTEN_RESPONSE")');
  expect(files).toContain("links.some(link=>!allowedMethods.includes(link.kind))");
  expect(editor).toContain('allowedLinkKinds.includes("REPOSITORY_LINK")');
  expect(editor).toContain('allowedLinkKinds.includes("EXTERNAL_LINK")');
 });
});
