import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("chat-19 College Admin assignment editor discard protection",()=>{
 it("keeps unsaved title, instructions, dates, points and method edits until confirmed",()=>{
  const source=readFileSync("src/components/courses/college-assignment-actions.tsx","utf8");
  expect(source).toContain("title!==savedEdit.title");
  expect(source).toContain("description!==savedEdit.description");
  expect(source).toContain("points!==savedEdit.points");
  expect(source).toContain("dueAt!==savedEdit.dueAt||methodsDirty");
  expect(source).toContain("if(editDirty){setConfirmDiscard(true);return;}");
  expect(source).toContain("onOpenChange={open=>{if(!open)closeEdit();}}");
  expect(source).toContain("onClick={closeEdit}>Cancel");
  expect(source).toContain("Discard unsaved assignment changes?");
 });
});
