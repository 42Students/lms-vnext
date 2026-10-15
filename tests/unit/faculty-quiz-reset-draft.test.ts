import {describe,expect,it} from "vitest";
import {facultyQuizMayResetDraft} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz discard draft action",()=>{
 it("only offers explicit reset when there are unsaved changes and no request in flight",()=>{
  expect(facultyQuizMayResetDraft(true,false)).toBe(true);
  expect(facultyQuizMayResetDraft(false,false)).toBe(false);
  expect(facultyQuizMayResetDraft(true,true)).toBe(false);
 });
});