import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const backlog=readFileSync("src/components/projects/mentor-product-backlog.tsx","utf8");
describe("Mentor backlog WebView confirmation and draft protection",()=>{
 it("UX-mentor-cross-B01 moves tasks only after an accessible ConfirmDialog",()=>{
  expect(backlog).not.toContain("window.confirm");
  expect(backlog).toContain("setMoveRequest({task,targetSprintId:id})");
  expect(backlog).toContain("setMoveRequest({task,targetSprintId:null})");
  expect(backlog).toContain('open={moveRequest!==null}');
  expect(backlog).toContain('pending={busy} confirmVariant="primary" onConfirm={move}');
 });
 it("UX-mentor-cross-B02 guards unsaved creation and repeated submits",()=>{
  expect(backlog).toContain("useProjectEditorDiscardGuard(adding,draftDirty,busy,discardDraft)");
  expect(backlog).toContain("onClick={guard.requestClose}");
  expect(backlog).toContain("if(busy)return");
  expect(backlog).toContain("onConfirm={guard.confirmDiscard}");
 });
 it("UX-mentor-cross-B03 touch targets remain at least 44px",()=>{
  expect(backlog).not.toContain("min-h-10");
  expect(backlog).toContain("min-h-11");
 });
});
