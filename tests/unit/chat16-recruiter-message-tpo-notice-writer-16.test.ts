import {describe,expect,it,vi} from "vitest";
import {notifyTpoOfRecruiterMessage}
 from "@/modules/placements/recruiter-message-tpo-notification-service";

const college="11111111-1111-4111-8111-111111111111";
const thread="22222222-2222-4222-8222-222222222222";
const message="33333333-3333-4333-8333-333333333333";
const recruiter="44444444-4444-4444-8444-444444444444";
const occurredAt=new Date("2026-10-18T00:00:00Z");
const input={collegeId:college,threadId:thread,messageId:message,
 senderUserId:recruiter,at:occurredAt};

function makeTransaction(options:{activeCollege?:boolean;recipients?:string[];
 source?:string|null;auditCommitted?:boolean}={}){
 const collegeLimit=vi.fn(async()=>options.activeCollege===false?[]:[{organizationId:"org"}]);
 const membersWhere=vi.fn(async()=>(options.recipients??["tpo-1"]).map(userId=>({userId})));
 const sourceLimit=vi.fn(async()=>options.source===null?[]:[{body:options.source??"Please review the hiring update"}]);
 const select=vi.fn()
  .mockImplementationOnce(()=>({from:()=>({where:()=>({limit:collegeLimit})})}))
  .mockImplementationOnce(()=>({from:()=>({innerJoin:()=>({innerJoin:()=>({where:membersWhere})})})}))
  .mockImplementationOnce(()=>({from:()=>({innerJoin:()=>({where:()=>({limit:sourceLimit})})})}));
 const auditReturning=vi.fn(async()=>options.auditCommitted===false?[]:[{id:"event-1"}]);
 const auditConflict=vi.fn(()=>({returning:auditReturning}));
 const auditValues=vi.fn((_row:unknown)=>({onConflictDoNothing:auditConflict}));
 const noticeValues=vi.fn(async(_rows:unknown)=>undefined);
 const insert=vi.fn().mockImplementationOnce(()=>({values:auditValues}))
  .mockImplementationOnce(()=>({values:noticeValues}));
 const tx={select,insert};
 return {tx,collegeLimit,membersWhere,sourceLimit,auditValues,noticeValues};
}
const send=(tx:ReturnType<typeof makeTransaction>["tx"])=>
 notifyTpoOfRecruiterMessage(
  tx as unknown as Parameters<typeof notifyTpoOfRecruiterMessage>[0],input,
 );

describe("chat-16 in-transaction recruiter message notification writer",()=>{
 it("HR-recruiter-message-notice-16 refuses an inactive or foreign college before recipient or body read",async()=>{
  const f=makeTransaction({activeCollege:false});
  await expect(send(f.tx)).rejects.toThrow("RECRUITER_MESSAGE_COLLEGE_INACTIVE");
  expect(f.membersWhere).not.toHaveBeenCalled();
  expect(f.sourceLimit).not.toHaveBeenCalled();
  expect(f.tx.insert).not.toHaveBeenCalled();
 });
 it("HR-recruiter-message-notice-17 performs no preview read or event when no active TPO exists",async()=>{
  const f=makeTransaction({recipients:[]});
  await expect(send(f.tx)).resolves.toEqual({notified:0});
  expect(f.sourceLimit).not.toHaveBeenCalled();
  expect(f.tx.insert).not.toHaveBeenCalled();
 });
 it("HR-recruiter-message-notice-18 rejects a missing or mismatched message before notifying anyone",async()=>{
  const f=makeTransaction({source:null});
  await expect(send(f.tx)).rejects.toThrow("RECRUITER_MESSAGE_NOTIFICATION_SOURCE_MISSING");
  expect(f.auditValues).not.toHaveBeenCalled();
  expect(f.noticeValues).not.toHaveBeenCalled();
 });
 it("HR-recruiter-message-notice-19 records source-scoped TPO event and only active TPO recipients in the same transaction",async()=>{
  const f=makeTransaction({recipients:["tpo-1","tpo-2"]});
  await expect(send(f.tx)).resolves.toEqual({notified:2});
  expect(f.auditValues).toHaveBeenCalledWith(expect.objectContaining({
   collegeId:college,subjectId:thread,actorUserId:recruiter,
   eventType:"placements.recruiter.message.received",
   dedupeKey:"placements.recruiter.message.received:"+message,
  }));
  expect(f.noticeValues).toHaveBeenCalledOnce();
  const rows=f.noticeValues.mock.calls[0]?.[0] as Array<{
   userId:string;eventId:string;title:string;actionHref:string;
  }>;
  expect(rows).toHaveLength(2);
  expect(rows.map(r=>r.userId)).toEqual(["tpo-1","tpo-2"]);
  expect(rows[0]).toMatchObject({eventId:"event-1",
   actionHref:"/tpo/messages/"+thread,
  });
 });
 it("HR-recruiter-message-notice-20 never double-notifies on a deduplicated event",async()=>{
  const f=makeTransaction({auditCommitted:false});
  await expect(send(f.tx)).resolves.toEqual({notified:0});
  expect(f.auditValues).toHaveBeenCalledOnce();
  expect(f.noticeValues).not.toHaveBeenCalled();
 });
});