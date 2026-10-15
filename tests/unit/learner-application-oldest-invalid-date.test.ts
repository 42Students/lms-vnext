import {describe,it,expect} from "vitest";
import {browseLearnerApplications,DEFAULT_LEARNER_APPLICATION_FILTERS} from "@/modules/placements/learner-applications-browse-model";
const row=(id:string,submitted:string)=>({
 applicationId:id,jobTitle:"Role",companyName:"Employer",applicationStatus:"SUBMITTED",
 submittedAt:new Date(submitted),withdrawnAt:null,
 screening:{status:"UNDER_REVIEW",decidedAt:null},results:[],
});
describe("learner applications oldest-sort with incomplete historical dates",()=>{
 it("puts valid earliest submissions first and malformed submissions last",()=>{
  const items=[row("unknown","invalid"),row("late","2026-10-10T00:00:00Z"),row("early","2026-10-01T00:00:00Z")];
  const view=browseLearnerApplications(items,{...DEFAULT_LEARNER_APPLICATION_FILTERS,sort:"oldest"});
  expect(view.map(x=>x.applicationId)).toEqual(["early","late","unknown"]);
 });
 it("maintains a stable ID ordering for two invalid dates",()=>{
  expect(browseLearnerApplications([row("z","bad"),row("a","bad")],{
   ...DEFAULT_LEARNER_APPLICATION_FILTERS,sort:"oldest",
  }).map(x=>x.applicationId)).toEqual(["a","z"]);
 });
});