import {describe,expect,it} from "vitest";
import {normalizeLearnerQuizDraftForQuestions} from "@/modules/courses/learner-quiz-draft-scope-model";
const questions=[
 {id:"one",type:"SINGLE_CHOICE" as const,options:[{id:"a"},{id:"b"}]},
 {id:"two",type:"MULTIPLE_CHOICE" as const,options:[{id:"c"},{id:"d"}]},
];
describe("learner quiz draft ownership and content scope",()=>{
 it("drops stale questions/options and limits single-choice to one permitted response",()=>{
  const draft={answers:{one:["unknown","a","b"],two:["c","c","d","e"],removed:["foreign"]},step:1};
  expect(normalizeLearnerQuizDraftForQuestions(draft,questions)).toEqual({
   answers:{one:["a"],two:["c","d"]},step:1,
  });
 });
 it("invalid step and no available questions produce an empty scoped draft",()=>{
  expect(normalizeLearnerQuizDraftForQuestions({answers:{one:["a"]},step:8},[]))
   .toEqual({answers:{},step:0});
 });
});
