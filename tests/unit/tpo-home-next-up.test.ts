import {describe,expect,it} from "vitest";
import {buildTpoLegacyNextUp,operationalHomeNeeds} from "@/modules/placements/tpo-home-next-up";
describe("TPO-home-11 priority and exact legacy action copy",()=>{
 it("prefers urgency to incoming order and maps each legacy action",()=>{
  const types=[
   ["DRIVE_REQUESTS","Review requests"],["RECRUITER_ACCESS","Review recruiters"],
   ["SHARE_APPLICANTS","Share applicants"],["DEADLINE_TODAY","Remind students"],
   ["SLOTS_TO_CONFIRM","Confirm slots"],["RESULTS_READY","Apply results"],
   ["SELECTIONS_TO_VERIFY","Verify selections"],["REQUESTS","Decide requests"],
   ["RECRUITER_MESSAGES","Reply"],["FOLLOW_UPS","See follow-ups"],
   ["NO_DEADLINE","Set a deadline"],["CLOSING_SOON","Remind students"],
   ["TEAM_ASKS","See what you were asked"],
  ] as const;
  for(const [type,action] of types)expect(buildTpoLegacyNextUp({
   needsYou:[{type,priority:2,count:1,title:type,link:"/tpo/requests"}],batches:[],checklist:[],
  })?.action).toBe(action);
  const next=buildTpoLegacyNextUp({needsYou:[
   {type:"RESULTS_READY",priority:12,count:1,title:"Results",link:"/x"},
   {type:"REQUESTS",priority:1,count:2,title:"Requests",link:"/tpo/requests"}],
   batches:[],checklist:[]});
  expect(next).toEqual({title:"Requests",text:"Then 1 more thing after this.",
   action:"Decide requests",href:"/tpo/requests"});
 });
 it("maps actual operational results without fabricated urgency classes",()=>{
  const signals=operationalHomeNeeds([{code:"RESULTS_AWAITING_APPLY",priority:"HIGH",
   jobId:"j",jobTitle:"Engineer",companyName:"Acme",count:2}]);
  expect(signals[0]).toMatchObject({type:"RESULTS_READY",priority:1});
  expect(buildTpoLegacyNextUp({needsYou:signals,batches:[],checklist:[]})?.action).toBe("Apply results");
 });
});
