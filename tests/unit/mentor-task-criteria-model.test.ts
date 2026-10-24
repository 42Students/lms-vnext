import {describe,expect,it} from "vitest";
import {mentorCriteriaLines,toggleMentorCriterion} from
 "@/modules/projects/mentor-task-criteria-model";
describe("Mentor persisted task criteria checklist",()=>{
 it("parses only explicit saved Markdown checkbox markers",()=>{
  const text="- [ ] Document API\n- [x] Add unit tests\nPlain acceptance note";
  expect(mentorCriteriaLines(text)).toEqual([
   {index:0,text:"Document API",checked:false,checkable:true},
   {index:1,text:"Add unit tests",checked:true,checkable:true},
   {index:2,text:"Plain acceptance note",checked:false,checkable:false},
  ]);
 });
 it("toggles exact row preserving unrelated text",()=>{
  const original="- [ ] First\n- [x] Second\nNothing checked";
  expect(toggleMentorCriterion(original,0)).toBe(
   "- [x] First\n- [x] Second\nNothing checked");
  expect(toggleMentorCriterion(original,1)).toBe(
   "- [ ] First\n- [ ] Second\nNothing checked");
 });
 it("refuses to toggle a note or missing line",()=>{
  expect(toggleMentorCriterion("No checkbox",0)).toBeNull();
  expect(toggleMentorCriterion("- [ ] Task",3)).toBeNull();
  expect(toggleMentorCriterion(null,0)).toBeNull();
 });
 it("does not infer completion from unrelated task DONE state",()=>{
  expect(mentorCriteriaLines("Reviewed by QA")).toEqual([
   {index:0,text:"Reviewed by QA",checked:false,checkable:false},
  ]);
 });
});
