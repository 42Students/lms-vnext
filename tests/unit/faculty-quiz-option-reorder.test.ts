import {describe,expect,it} from "vitest";
import {facultyMoveQuizOption} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty option reorder",()=>{
 it("preserves correct flags while changing rendered and persisted order",()=>{
  const opts=[{text:"A",correct:true},{text:"B",correct:false},{text:"C",correct:false}];
  const updated=facultyMoveQuizOption(opts,0,2);
  expect(updated.map(o=>o.text)).toEqual(["B","C","A"]);
  expect(updated.map(o=>o.correct)).toEqual([false,false,true]);
  expect(opts[0]?.correct).toBe(true);
 });
});