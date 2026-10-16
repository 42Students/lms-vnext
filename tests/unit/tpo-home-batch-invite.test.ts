import {describe,expect,it} from "vitest";
import {buildTpoLegacyNextUp} from "@/modules/placements/tpo-home-next-up";
const need={type:"REGISTRATION_CLOSED",priority:0,title:"Invite batch",count:30,link:"/tpo/batches"};
describe("TPO-home-12 legacy batch invitation card",()=>{
 it("puts uninvited eligible students first with exact label and target",()=>{
  const result=buildTpoLegacyNextUp({needsYou:[{type:"REQUESTS",priority:4,
   title:"Requests",count:4,link:"/tpo/requests"},need],
   batches:[{batchId:"b1",name:"2026",eligible:30,registered:11,invitedAt:null}],
   checklist:[]});
  expect(result).toEqual({
   title:"Invite the 2026 to register",
   text:"19 eligible students haven't registered; they can't until you invite the batch.",
   action:"Invite 19 students",href:"/tpo/batches/b1"});
 });
 it("keeps singular legacy copy and never produces a negative invite count",()=>{
  expect(buildTpoLegacyNextUp({needsYou:[need],batches:[
   {batchId:"b1",name:"2027",eligible:12,registered:11,invitedAt:null}],checklist:[]})?.action)
   .toBe("Invite 1 student");
  expect(buildTpoLegacyNextUp({needsYou:[need],batches:[
   {batchId:"b2",name:"2028",eligible:4,registered:6,invitedAt:null}],checklist:[]})?.action)
   .toBe("Invite 0 students");
 });
});
