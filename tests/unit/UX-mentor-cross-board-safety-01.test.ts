import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Mentor board external links and modal focus",()=>{
 it("UX-mentor-cross-B04 never opens unverified evidence URLs",()=>{
  const lane=read("src/components/projects/mentor-lane-board.tsx");
  const detail=read("src/components/projects/mentor-board-task-detail-dialog.tsx");
  for(const source of [lane,detail]){
   expect(source).toContain("safeProjectExternalHref");
   expect(source).not.toContain('href={row.submissionUrl}');
   expect(source).not.toContain('href={item.submissionUrl}');
  }
 });
 it("UX-mentor-cross-B05 task detail restores focus and handles Escape",()=>{
  const detail=read("src/components/projects/mentor-board-task-detail-dialog.tsx");
  // Escape and opener focus are handled by the shared accessible Dialog.
  expect(detail).toContain("<Dialog open={true}");
  expect(detail).toContain("onOpenChange={next=>{if(!next)onClose();}}");
  const dialog=read("src/components/ui/dialog.tsx");
  expect(dialog).toContain("useOverlayExit(ref, opener, open, 180)");
  expect(dialog).toContain("opener.current.focus()");
  expect(dialog).toContain("onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}");
  expect(detail).toContain("timeZone:\"Asia/Kolkata\"");
 });
 it("UX-mentor-cross-B06 board and destructive controls have 44px targets",()=>{
  for(const path of ["src/components/projects/mentor-lane-board.tsx","src/components/projects/mentor-board-task-detail-dialog.tsx","src/components/projects/mentor-task-delete-control.tsx"]){
   const code=read(path);
   expect(code,path).not.toContain("min-h-10");
   expect(code,path).toContain("min-h-11");
  }
 });
});
