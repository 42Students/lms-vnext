import {describe,expect,it} from "vitest";
import {learnerProfileCanRefresh,learnerProfileReconcile}
 from "@/modules/people/learner-profile-refresh-model";
describe("learner profile refresh without unsaved-data loss",()=>{
 const base={headline:"Saved",contacts:{alternatePhone:""}};
 it("refreshes on visibility after cooldown only when all editors are closed",()=>{
  const req={visible:true,editing:false,saving:false,nowMs:100_000,lastRefreshMs:30_000};
  expect(learnerProfileCanRefresh(req)).toBe(true);
  for(const change of [{editing:true},{saving:true},{visible:false},{nowMs:31_000}])
   expect(learnerProfileCanRefresh({...req,...change})).toBe(false);
 });
 it("reconciles external server updates only if current local state is unmodified",()=>{
  const incoming={...base,headline:"Updated in another tab"};
  expect(learnerProfileReconcile(base,base,incoming)).toEqual(incoming);
  const draft={...base,headline:"My unsaved change"};
  expect(learnerProfileReconcile(draft,base,incoming)).toEqual(draft);
 });
});