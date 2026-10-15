import {describe,expect,it} from "vitest";
import {facultyAuthoringQuestionsFromResponse,facultyQuizDraftIssue}
 from "@/modules/courses/faculty-quiz-builder-model";
import {facultyQuizCommandSchema} from "@/modules/courses/faculty-quiz-authoring-model";
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

describe("Faculty Quiz archive command validation",()=>{
 const quizId="00000000-0000-4000-8000-000000000001";
 const expectedUpdatedAt="2026-10-14T12:00:00.000Z";
 const archive={action:"ARCHIVE",quizId,expectedUpdatedAt,confirmed:true};
 it("requires explicit confirmation and an optimistic token",()=>{
  expect(facultyQuizCommandSchema.safeParse(archive).success).toBe(true);
  expect(facultyQuizCommandSchema.safeParse({...archive,confirmed:false}).success).toBe(false);
  expect(facultyQuizCommandSchema.safeParse({...archive,expectedUpdatedAt:"invalid"}).success).toBe(false);
  expect(facultyQuizCommandSchema.safeParse({...archive,quizId:"other"}).success).toBe(false);
 });
 it("rejects forged tenant and destructive extra fields",()=>{
  expect(facultyQuizCommandSchema.safeParse({...archive,collegeId:quizId}).success).toBe(false);
  expect(facultyQuizCommandSchema.safeParse({...archive,deleteQuestions:true}).success).toBe(false);
  expect(facultyQuizCommandSchema.safeParse({...archive,questions:valid}).success).toBe(false);
 });
});

describe("Faculty Quiz close command validation",()=>{
 const close={action:"CLOSE",quizId:"00000000-0000-4000-8000-000000000001",
   expectedUpdatedAt:"2026-10-14T12:00:00.000Z",confirmed:true};
 it("accepts a confirmed versioned transition, not question/tenant mutation",()=>{
  expect(facultyQuizCommandSchema.safeParse(close).success).toBe(true);
  expect(facultyQuizCommandSchema.safeParse({...close,confirmed:false}).success).toBe(false);
  expect(facultyQuizCommandSchema.safeParse({...close,questions:valid}).success).toBe(false);
  expect(facultyQuizCommandSchema.safeParse({...close,collegeId:close.quizId}).success).toBe(false);
 });
});


describe("Faculty draft title boundary", () => {
  it("blocks oversized names before quiz draft confirmation", () => {
    expect(facultyQuizDraftIssue("x".repeat(256), [])).toMatch(/255/);
  });
});
