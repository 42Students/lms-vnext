import {describe,expect,it} from "vitest";
import {facultyAuthoringQuestionsFromResponse,facultyQuizDraftIssue}
 from "@/modules/courses/faculty-quiz-builder-model";
const valid=[{type:"SINGLE_CHOICE" as const,prompt:"A question",points:5,sequence:0,
 options:[{text:"Yes",correct:true,sequence:0},{text:"No",correct:false,sequence:1}]}];
describe("Faculty quiz builder draft contract",()=>{
 it("reads the actual nested quiz GET payload and restores correct choices",()=>{
  expect(facultyAuthoringQuestionsFromResponse({quiz:{questions:valid}})).toEqual(valid);
  expect(()=>facultyAuthoringQuestionsFromResponse({questions:valid})).toThrow();
 });
 it("rejects incomplete, repeated, or ambiguous correct options before sending",()=>{
  expect(facultyQuizDraftIssue("Quiz",valid)).toBeNull();
  expect(facultyQuizDraftIssue("  ",valid)).toMatch(/title/);
  expect(facultyQuizDraftIssue("Quiz",[{...valid[0],options:[
   {text:"Yes",correct:true,sequence:0},{text:"YES",correct:false,sequence:1},
  ]}])).toMatch(/unique/);
  expect(facultyQuizDraftIssue("Quiz",[{...valid[0],options:[
   {text:"Yes",correct:false,sequence:0},{text:"No",correct:false,sequence:1},
  ]}])).toMatch(/correct/);
 });
});
