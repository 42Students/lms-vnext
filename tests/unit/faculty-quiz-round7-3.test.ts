import {describe,expect,it} from "vitest";
import {facultyQuizQuestionIssue} from "@/modules/courses/faculty-quiz-builder-model";
const valid={type:"SINGLE_CHOICE" as const,prompt:"Select the mutex",points:2,sequence:0,
 options:[{text:"Lock",correct:true,sequence:0},{text:"Socket",correct:false,sequence:1}]};
describe("Faculty inline quiz checks",()=>{
 it("shows valid and invalid question feedback before submit",()=>{
  expect(facultyQuizQuestionIssue(valid)).toBeNull();
  expect(facultyQuizQuestionIssue({...valid,prompt:""})).not.toBeNull();
  expect(facultyQuizQuestionIssue({...valid,points:0})).not.toBeNull();
 });
});