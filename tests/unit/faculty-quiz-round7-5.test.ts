import {describe,expect,it} from "vitest";
import {facultyInsertQuizQuestionAfter} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty insert Quiz question",()=>{
 it("inserts after selected question without mutating the original list",()=>{
  const q=[{prompt:"a"},{prompt:"c"}];const next=facultyInsertQuizQuestionAfter(q,0,{prompt:"b"});
  expect(next.map(x=>x.prompt)).toEqual(["a","b","c"]);expect(q).toHaveLength(2);
 });
 it("respects the 100-question limit and ignores invalid indexes",()=>{
  expect(facultyInsertQuizQuestionAfter(Array(100).fill("old"),3,"new")).toHaveLength(100);
  expect(facultyInsertQuizQuestionAfter(["a"],-1,"b")).toEqual(["a"]);
 });
});