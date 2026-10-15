import {describe,expect,it} from "vitest";
import {facultyDuplicateQuizOption} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty duplicate answer",()=>{
 it("never marks a duplicated correct answer as correct automatically",()=>{
  const original=[{text:"Yes",correct:true},{text:"No",correct:false}];
  const updated=facultyDuplicateQuizOption(original,0);
  expect(updated.map(x=>x.correct)).toEqual([true,false,false]);
  expect(updated[1]).not.toBe(original[0]);
 });
 it("does not grow past 20 answers",()=>expect(facultyDuplicateQuizOption(Array.from({length:20},()=>({correct:false})),0)).toHaveLength(20));
});