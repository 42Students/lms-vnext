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
 it("allows deliberate multiple-choice selection and clearing",()=>{
  expect(facultyToggleQuizAnswer(multiple,1,true).map(x=>x.correct)).toEqual([true,true]);
  expect(facultyToggleQuizAnswer(multiple,0,false).map(x=>x.correct)).toEqual([false,false]);
 });
 it("returns an unchanged copy for an out-of-bounds index",()=>{
  expect(facultyToggleQuizAnswer(single,6,true)).toEqual(single.options);
  expect(facultyToggleQuizAnswer(single,6,true)).not.toBe(single.options);
  expect(single.options[0]?.correct).toBe(true);
 });
});
