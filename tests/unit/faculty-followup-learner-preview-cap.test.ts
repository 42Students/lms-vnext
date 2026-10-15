import {expect,it} from "vitest";
import {limitedMissingLearners} from "@/modules/courses/faculty-response-followup-model";
it("never exposes more than twelve learner preview entries",()=>{
 const learners=Array.from({length:20},(_,i)=>i);
 expect(limitedMissingLearners(learners)).toMatchObject({total:20,hiddenCount:8});
 expect(limitedMissingLearners(learners,0)).toMatchObject({total:20,preview:[],hiddenCount:20});
 for(const limit of [-1,13,Infinity,1.5,Number.NaN]){
  expect(()=>limitedMissingLearners(learners,limit)).toThrow("INVALID_FOLLOWUP_PREVIEW_LIMIT");
 }
});
