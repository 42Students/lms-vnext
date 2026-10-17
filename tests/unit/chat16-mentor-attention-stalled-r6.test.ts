import {describe,expect,it} from "vitest";
import {deriveMentorProjectAttention,type MentorProjectAttentionSource} from "@/modules/projects/mentor-attention";
import {selectMentorAttention} from "@/modules/projects/mentor-attention-kind-model";

const old=new Date("2099-01-01T00:00:00Z");
const fixture=(status:string,lastActivityAt:Date|null=null):MentorProjectAttentionSource=>({
 projectId:"p1",projectTitle:"Project",projectStatus:status,
 projectUpdatedAt:old,lastActivityAt,submission:null,meetings:[],
});
describe("chat-16 mentor stalled attention semantics",()=>{
 it("MEN-projects-meetings-73 includes idle planned projects at seven days but excludes blocked, completed and archived",()=>{
   const now=new Date("2099-01-08T00:00:00Z");
   for(const status of ["PLANNED","ACTIVE"])
    expect(deriveMentorProjectAttention([fixture(status)],now).some(x=>x.kind==="STALLED")).toBe(true);
   for(const status of ["BLOCKED","COMPLETED","ARCHIVED"])
    expect(deriveMentorProjectAttention([fixture(status)],now).some(x=>x.kind==="STALLED")).toBe(false);
 });
 it("MEN-projects-meetings-73 avoids a false stale notice when real activity is recent",()=>{
   const now=new Date("2099-01-08T00:00:00Z");
   expect(deriveMentorProjectAttention([fixture("PLANNED",new Date("2099-01-07T00:00:00Z"))],now)
     .some(x=>x.kind==="STALLED")).toBe(false);
   expect(deriveMentorProjectAttention([fixture("PLANNED")],new Date("2099-01-07T23:59:59Z"))
     .some(x=>x.kind==="STALLED")).toBe(false);
 });
 it("MEN-projects-meetings-73 preserves project-local priority order without mixing unread inbox and announcements",()=>{
   const now=new Date("2099-01-08T00:00:00Z");
   const rows=deriveMentorProjectAttention([{...fixture("ACTIVE"),
      submission:{id:"s1",status:"SUBMITTED",submittedAt:new Date("2099-01-07T23:00:00Z")},
      meetings:[{id:"m1",status:"REQUESTED",title:"Sync",startsAt:new Date("2099-01-08T04:00:00Z")}],
   }],now);
   expect(selectMentorAttention(rows,"ALL",undefined,"REVIEW_FIRST").map(x=>x.kind))
     .toEqual(["REVIEW","REQUESTED","STALLED"]);
 });
});
