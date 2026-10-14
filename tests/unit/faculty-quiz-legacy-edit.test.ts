import { describe, expect, it } from "vitest";
import { facultyQuizLegacyEdit, facultyQuizCommandSchema } from "@/modules/courses/faculty-quiz-authoring-model";
const current={id:"10000000-0000-4000-8000-000000000001",title:"Draft",description:null,dueAt:null,maxAttempts:2,sequence:0};
const token={expectedUpdatedAt:"2026-10-14T09:00:00Z",confirmed:true};
const question={type:"SINGLE_CHOICE",prompt:"FIFO?",points:3,sequence:0,options:[{text:"Queue",correct:true,sequence:0},{text:"Stack",correct:false,sequence:1}]};
describe("Faculty legacy quiz edit adapter", () => {
 it("preserves the choice bank when only metadata changes and requires the client token", () => {
  const result=facultyQuizLegacyEdit(current,{title:"Changed",...token});
  expect(result).toMatchObject({action:"EDIT",title:"Changed",maxAttempts:2,...token});
  expect(result).not.toHaveProperty("questions");
  expect(() => facultyQuizLegacyEdit(current,{title:"Bypass"})).toThrow();
  expect(() => facultyQuizLegacyEdit(current,{title:"Bypass",...token,confirmed:false})).toThrow();
 });
 it("validates replacement questions and prevents silent sequence or token-only edits", () => {
  expect(facultyQuizLegacyEdit(current,{questions:[question],...token})).toMatchObject({questions:[question]});
  expect(() => facultyQuizLegacyEdit(current,{questions:[],...token})).toThrow();
  expect(() => facultyQuizLegacyEdit(current,{sequence:2,...token})).toThrow();
  expect(() => facultyQuizLegacyEdit(current,token)).toThrow();
 });
 it("still requires a nonempty question bank for new quizzes", () => {
  expect(facultyQuizCommandSchema.safeParse({action:"CREATE",lessonId:current.id,sequence:0,title:"New",description:null,dueAt:null,maxAttempts:1,confirmed:true}).success).toBe(false);
 });
});
