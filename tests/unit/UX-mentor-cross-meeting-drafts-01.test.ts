import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Mentor meeting editors preserve drafts and safe errors",()=>{
 it("UX-mentor-cross-F01 notes cancellation returns to the draft and confirms discard",()=>{
  const src=read("src/components/projects/mentor-meeting-notes-editor.tsx");
  expect(src).toContain("useProjectEditorDiscardGuard(open||confirm,changed,pending");
  expect(src).toContain("if(!next)setOpen(true)");
  expect(src).toContain("if(pending)return;");
  expect(src).toContain("onClick={guard.requestClose}");
  expect(src).toContain("onConfirm={guard.confirmDiscard}");
  expect(src).toContain("if(!valid||pending)return");
 });
 it("UX-mentor-cross-F02 reschedule has the same discard and retry protection",()=>{
  const src=read("src/components/projects/mentor-meeting-reschedule.tsx");
  expect(src).toContain("useProjectEditorDiscardGuard(open||confirm,dirty,pending");
  expect(src).toContain("if(!next)setOpen(true)");
  expect(src).toContain("if(pending)return;");
  expect(src).toContain("if(!parsed.success||!changed||pending)return");
  expect(src).toContain("onClick={guard.requestClose}");
  expect(src).toContain("onConfirm={guard.confirmDiscard}");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-mentor-cross-F03 unexpected API errors use a friendly fallback",()=>{
  for(const path of ["src/components/projects/mentor-meeting-notes-editor.tsx","src/components/projects/mentor-meeting-reschedule.tsx"]){
   const src=read(path);
   expect(src).toContain("caught instanceof FriendlyFetchError?caught.message:friendlyApiError({})");
   expect(src).not.toContain("caught instanceof Error?caught.message");
  }
 });
});
