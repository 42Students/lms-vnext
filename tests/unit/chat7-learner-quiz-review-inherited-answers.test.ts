import {describe,expect,it} from "vitest";
import {learnerQuizReviewRows} from "@/modules/courses/learner-quiz-review-model";
const questions=[
 {id:"q1",options:[{id:"a"},{id:"b"}]},
 {id:"q2",options:[{id:"c"},{id:"d"}]},
];
describe("LEARNER-QUIZ-REVIEW-03 saved answer scope and embargo",()=>{
 it("counts only valid options for the currently viewed question and deduplicates selections",()=>{
  expect(learnerQuizReviewRows(questions,{q1:["a","a","deleted"],q2:[]}))
   .toEqual([{questionId:"q1",selectedCount:1,answered:true},
    {questionId:"q2",selectedCount:0,answered:false}]);
 });
 it("never accepts answer arrays inherited from a prototype or another draft namespace",()=>{
  const inherited=Object.create({q1:["a"]}) as Record<string,string[]>;
  inherited.q2=["d"];
  expect(learnerQuizReviewRows(questions,inherited))
   .toEqual([{questionId:"q1",selectedCount:0,answered:false},
    {questionId:"q2",selectedCount:1,answered:true}]);
 });
 it("does not reveal correctness, points, or option text in summary results",()=>{
  const rows=learnerQuizReviewRows(questions,{q1:["b"],q2:["c","d"]});
  for(const row of rows){
   expect(Object.keys(row).sort()).toEqual(["answered","questionId","selectedCount"]);
   expect(row).not.toHaveProperty("correct");
   expect(row).not.toHaveProperty("pointsAwarded");
   expect(row).not.toHaveProperty("options");
  }
 });
 it("returns no answers when the quiz has no questions, even with hostile stored values",()=>{
  expect(learnerQuizReviewRows([],{"__proto__":["answer"]})).toEqual([]);
 });
});
