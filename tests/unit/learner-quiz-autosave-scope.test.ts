import {describe,it,expect} from "vitest";
import {learnerQuizDraftCanPersist} from "@/modules/courses/learner-quiz-autosave-scope-model";
const active={storageKey:"quiz:A:one",loadedScopeKey:"quiz:A:one",review:false,loading:false,hasQuiz:true};
describe("quiz draft persistence on route changes",()=>{
 it("ignores answers belonging to another quiz or delivery",()=>{
  expect(learnerQuizDraftCanPersist({...active,storageKey:"quiz:A:two"})).toBe(false);
  expect(learnerQuizDraftCanPersist({...active,storageKey:"quiz:B:one"})).toBe(false);
 });
 it("persists only loaded and active quizzes",()=>{
  expect(learnerQuizDraftCanPersist(active)).toBe(true);
  for(const patch of [{review:true},{loading:true},{hasQuiz:false},{loadedScopeKey:null}]){
   expect(learnerQuizDraftCanPersist({...active,...patch})).toBe(false);
  }
 });
});
