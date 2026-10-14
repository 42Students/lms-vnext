import {describe,expect,it} from "vitest";
import {facultyToggleQuizAnswer} from "@/modules/courses/faculty-quiz-builder-model";
const single={type:"SINGLE_CHOICE" as const,options:[
 {text:"first",correct:true},{text:"second",correct:false},
]};
const multiple={type:"MULTIPLE_CHOICE" as const,options:[
 {text:"first",correct:true},{text:"second",correct:false},
]};
describe("Faculty quiz answer option interaction",()=>{
 it("never unchecks the only single-choice answer",()=>{
  expect(facultyToggleQuizAnswer(single,0,false).map(x=>x.correct)).toEqual([true,false]);
  expect(facultyToggleQuizAnswer(single,1,true).map(x=>x.correct)).toEqual([false,true]);
 });
 it("enforces at least one correct and incorrect option for multiple-choice edits",()=>{
  expect(facultyToggleQuizAnswer(multiple,1,true).map(x=>x.correct)).toEqual([true,false]);
  expect(facultyToggleQuizAnswer(multiple,0,false).map(x=>x.correct)).toEqual([true,false]);
  const three={type:"MULTIPLE_CHOICE" as const,options:[
   {correct:true},{correct:false},{correct:false},
  ]};
  const twoCorrect=facultyToggleQuizAnswer(three,1,true);
  expect(twoCorrect.map(x=>x.correct)).toEqual([true,true,false]);
  expect(facultyToggleQuizAnswer({type:"MULTIPLE_CHOICE",options:twoCorrect},0,false)
   .map(x=>x.correct)).toEqual([false,true,false]);
 });
 it("returns an unchanged copy for an out-of-bounds index",()=>{
  expect(facultyToggleQuizAnswer(single,6,true)).toEqual(single.options);
  expect(facultyToggleQuizAnswer(single,6,true)).not.toBe(single.options);
  expect(single.options[0]?.correct).toBe(true);
 });
});
