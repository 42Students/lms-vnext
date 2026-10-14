import {describe,expect,it} from "vitest";
import {facultyRemoveQuizOption} from "@/modules/courses/faculty-quiz-builder-model";
const single={type:"SINGLE_CHOICE" as const,options:[
 {text:"First",correct:false,sequence:0},
 {text:"Second",correct:true,sequence:1},
 {text:"Third",correct:false,sequence:2},
]};
const multi={type:"MULTIPLE_CHOICE" as const,options:[
 {text:"First",correct:true,sequence:0},
 {text:"Second",correct:false,sequence:1},
 {text:"Third",correct:true,sequence:2},
]};
describe("Faculty Quiz option removal",()=>{
 it("falls back to first correct option when original answer is removed",()=>{
  const result=facultyRemoveQuizOption(single,1);
  expect(result.map(o=>o.correct)).toEqual([true,false]);
  expect(single.options[1]!.correct).toBe(true);
 });
 it("retains another selected single answer if still present",()=>{
  expect(facultyRemoveQuizOption(single,2).map(o=>o.correct)).toEqual([false,true]);
 });
 it("preserves multi-choice remaining correctness",()=>{
  expect(facultyRemoveQuizOption(multi,0).map(o=>o.correct)).toEqual([false,true]);
 });
 it("keeps at least one correct and one incorrect option after a deletion",()=>{
  const oneCorrect={type:"MULTIPLE_CHOICE" as const,options:[
   {correct:true},{correct:false},{correct:false},
  ]};
  expect(facultyRemoveQuizOption(oneCorrect,0).map(o=>o.correct))
   .toEqual([true,false]);
  const onlyIncorrect={type:"MULTIPLE_CHOICE" as const,options:[
   {correct:true},{correct:true},{correct:false},
  ]};
  expect(facultyRemoveQuizOption(onlyIncorrect,2).map(o=>o.correct))
   .toEqual([true,false]);
  expect(onlyIncorrect.options.map(o=>o.correct)).toEqual([true,true,false]);
 });
 it("refuses to reduce below two options or delete an invalid index",()=>{
  const reduced=facultyRemoveQuizOption(single,2);
  expect(facultyRemoveQuizOption({type:"SINGLE_CHOICE",options:reduced},0)).toHaveLength(2);
  expect(facultyRemoveQuizOption(single,-1)).toHaveLength(3);
 });
});
