import {describe,it,expect} from "vitest";
import {requireLearnerQuizResponseId} from "@/modules/courses/learner-quiz-response-id-model";
const a="00000000-0000-4000-8000-000000000001",b="00000000-0000-4000-8000-000000000002";
describe("learner Quiz GET response identity",()=>{
 it("accepts only the requested own Quiz UUID",()=>expect(()=>requireLearnerQuizResponseId(a,a)).not.toThrow());
 it("rejects mismatched, missing or malformed response ids",()=>{
  for(const value of [b,null,"forged",123])expect(()=>requireLearnerQuizResponseId(a,value)).toThrow("does not match");
 });
});
