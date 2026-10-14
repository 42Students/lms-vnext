import {describe,expect,it} from "vitest";
import {learnerQuizAnswerProgress} from "@/modules/courses/learner-quiz-answer-progress-model";
const questions=[
 {id:"one",options:[{id:"a"},{id:"b"}]},
 {id:"two",options:[{id:"c"}]},
 {id:"three",options:[{id:"d"}]},
];
describe("learner quiz answer progress",()=>{
 it("counts only valid options and identifies the first unanswered question",()=>{
  expect(learnerQuizAnswerProgress(questions,{one:["a"],two:["forged"],three:["d"]}))
   .toEqual({total:3,answered:2,firstUnanswered:1});
 });
 it("reports all answered and no jump target when complete",()=>{
  expect(learnerQuizAnswerProgress(questions,{one:["a"],two:["c"],three:["d"]}))
   .toEqual({total:3,answered:3,firstUnanswered:null});
 });
});
