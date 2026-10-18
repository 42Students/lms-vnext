import {describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {notifyTpoOfRecruiterAction}
 from "@/modules/placements/hr-tpo-notification-service";

const context:RequestContext={
 user:{id:"11111111-1111-4111-8111-111111111111",
  identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"11111111-1111-4111-8111-111111111111",
  companyId:"22222222-2222-4222-8222-222222222222",
  companyName:"Acme",title:null,status:"ACTIVE",grants:[]},
};
const college="33333333-3333-4333-8333-333333333333";
const jobId="44444444-4444-4444-8444-444444444444";
function fixture(collegeExists=true,recipients=["tpo-1","tpo-2"]){
 const collegeLimit=vi.fn(async()=>collegeExists?[{organizationId:"org-a"}]:[]);
 const select=vi.fn(()=>({from:vi.fn(()=>({where:vi.fn(()=>({limit:collegeLimit}))}))}));
 const auditValues=vi.fn(()=>({returning:vi.fn(async()=>[{id:"event-1"}])}));
 const noticeValues=vi.fn((_input:unknown)=>({onConflictDoNothing:vi.fn(async()=>undefined)}));
 const insert=vi.fn().mockImplementationOnce(()=>({values:auditValues}))
  .mockImplementationOnce(()=>({values:noticeValues}));
 const recipientWhere=vi.fn(async()=>recipients.map(userId=>({userId})));
 const selectDistinct=vi.fn(()=>({from:vi.fn(()=>({
  innerJoin:()=>({innerJoin:()=>({where:recipientWhere})}),
 }))}));
 const tx={select,selectDistinct,insert};
 return {tx,collegeLimit,auditValues,noticeValues,recipientWhere};
}
const call=(tx:ReturnType<typeof fixture>["tx"],action:
 "ROUND_CREATED"|"SLOT_OFFERED")=>notifyTpoOfRecruiterAction(
 tx as unknown as Parameters<typeof notifyTpoOfRecruiterAction>[0],context,
 {collegeId:college,jobId,subjectId:"round-1",action},
);

describe("chat-16 recruiter action to TPO notification transactional writer",()=>{
 it("HR-notification-writer-16 refuses to post event if the college cannot be resolved",async()=>{
  const f=fixture(false);
  await call(f.tx,"ROUND_CREATED");
  expect(f.tx.insert).not.toHaveBeenCalled();
  expect(f.tx.selectDistinct).not.toHaveBeenCalled();
 });
 it("HR-notification-writer-17 records a placement event and scoped bell for each eligible TPO",async()=>{
  const f=fixture(true);
  await call(f.tx,"ROUND_CREATED");
  expect(f.auditValues).toHaveBeenCalledWith(expect.objectContaining({
   collegeId:college,actorUserId:context.user.id,
   eventType:"placements.hr_round.created",module:"PLACEMENTS",
   subjectType:"placement_job",subjectId:jobId,
  }));
  expect(f.noticeValues).toHaveBeenCalledOnce();
  const rows=f.noticeValues.mock.calls[0]?.[0] as Array<{
   userId:string;eventId:string;actionHref:string;title:string;
  }>;
  expect(rows).toHaveLength(2);
  expect(rows.map(x=>x.userId)).toEqual(["tpo-1","tpo-2"]);
  expect(rows[0]).toMatchObject({
   eventId:"event-1",actionHref:"/tpo/placements/jobs/"+jobId+"?tab=rounds",
   title:"A recruiter added a round",
  });
 });
 it("HR-notification-writer-18 maps interview-slot actions to the authorized job slots page",async()=>{
  const f=fixture(true,["tpo-1"]);
  await call(f.tx,"SLOT_OFFERED");
  expect(f.auditValues).toHaveBeenCalledWith(expect.objectContaining({
   eventType:"placements.hr_slot.offered",
  }));
  const rows=f.noticeValues.mock.calls[0]?.[0] as Array<{actionHref:string}>;
  expect(rows[0]?.actionHref).toBe("/tpo/placements/jobs/"+jobId+"/interview-slots");
 });
 it("HR-notification-writer-19 avoids creating an empty notice batch when no active TPO recipients remain",async()=>{
  const f=fixture(true,[]);
  await call(f.tx,"ROUND_CREATED");
  expect(f.tx.selectDistinct).toHaveBeenCalledOnce();
  expect(f.noticeValues).not.toHaveBeenCalled();
 });
});