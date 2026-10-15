import {describe,expect,it} from "vitest";
import {facultyQuizDraftReview} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz draft preview",()=>{
 it("summarizes scores and unanswered items before publication",()=>{
  expect(facultyQuizDraftReview([{points:5,options:[{correct:true},{correct:false}]},{points:3,options:[{correct:false},{correct:false}]}]))
   .toEqual({questionCount:2,optionCount:4,totalPoints:8,missingCorrect:1});
 });
 it("never shows a NaN score when points input is incomplete",()=>{
  expect(facultyQuizDraftReview([{points:Number.NaN,options:[]}]).totalPoints).toBe(0);
 });
});