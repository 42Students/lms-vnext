import {describe,it,expect} from "vitest";
import {learnerQuizReviewRows} from "@/modules/courses/learner-quiz-review-model";
const q=[{id:"q1",options:[{id:"a"},{id:"b"}]},{id:"q2",options:[{id:"c"}]}];
describe("pre-submit learner quiz review",()=>{
 it("summarizes only actual selected options in the authorized question set",()=>{
  expect(learnerQuizReviewRows(q,{q1:["a","a","forged"],q2:["forged"]})).toEqual([
   {questionId:"q1",selectedCount:1,answered:true},
   {questionId:"q2",selectedCount:0,answered:false},
  ]);
 });
 it("does not invent a grade or correctness flag",()=>{
  const rows=learnerQuizReviewRows(q,{});
  expect(rows[0]).not.toHaveProperty("correct");
  expect(rows.every(row=>!row.answered)).toBe(true);
 });
});
