import {describe,expect,it,vi} from "vitest";
import {deliverBatch,type DeliveryRecord,type DeliveryRepository} from "@/modules/messaging/service";
import type {DeliveryPolicy,OutboundSendRequest} from "@/modules/messaging/model";

const email=(recipient:string):OutboundSendRequest=>({
 channel:"EMAIL",recipient,templateKey:"campaign.notice",
 variables:{recipientName:"Recruiter"},purpose:"placement-update",
});
const policy:DeliveryPolicy={
 appEnv:"production",testEmails:[],testPhones:[],suppressed:new Set<string>(),
 sentToday:0,dailyCap:100,recentRecipientSends:0,recipientWindowCap:2,
};
const key=(request:OutboundSendRequest)=>Promise.resolve(
 request.recipient.startsWith("a")?"a".repeat(64):"b".repeat(64));

describe("chat-16 outbound messaging initial policy failure isolation",()=>{
 it("MSG-POLICY-INITIAL-14 records failed first recipient and safely continues the next, with complete audit",async()=>{
  const inserted:DeliveryRecord[]=[];
  const updated:DeliveryRecord[]=[];
  const audit=vi.fn(async (_batchId:string,_counts:{sent:number;failed:number;suppressed:number})=>{});
  const repository:DeliveryRepository={
   insert:async row=>{inserted.push({...row});},
   update:async row=>{updated.push({...row});},
   auditBatch:audit,
  };
  const send=vi.fn(async (_request:OutboundSendRequest)=>true);
  let calls=0;
  const result=await deliverBatch({
   batchId:"policy-outage-2099",
   requests:[email("a@example.org"),email("b@example.org")],
   provider:{send},repository,recipientKeyFor:key,
   policyFor:async()=>{if(++calls===1)throw new Error("DB private password");return policy;},
   runtimeEnv:{APP_ENV:"production"},
  });
  expect(result.map(row=>row.status)).toEqual(["FAILED","SENT"]);
  expect(result[0]?.reason).toBe("policy-read-failed");
  expect(inserted.map(row=>row.status)).toEqual(["FAILED","QUEUED"]);
  expect(updated.map(row=>row.status)).toEqual(["SENT"]);
  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith(expect.objectContaining({recipient:"b@example.org"}));
  expect(audit).toHaveBeenCalledWith("policy-outage-2099",{sent:1,failed:1,suppressed:0});
  expect(JSON.stringify({result,inserted,updated})).not.toContain("DB private password");
  expect(JSON.stringify({result,inserted,updated})).not.toContain("a@example.org");
 });
 it("MSG-POLICY-INITIAL-15 refuses all external sends on policy outage but finalizes receipt counts",async()=>{
  const inserted:DeliveryRecord[]=[];
  const audits:{sent:number;failed:number;suppressed:number}[]=[];
  const provider={send:vi.fn(async (_request:OutboundSendRequest)=>true)};
  const result=await deliverBatch({
   batchId:"policy-outage-2099",
   requests:[email("a@example.org"),email("b@example.org")],
   provider,
   repository:{
    insert:async row=>{inserted.push({...row});},
    update:async()=>{throw new Error("should never attempt to update a queued receipt");},
    auditBatch:async (_batch,counts)=>{audits.push(counts);},
   },
   recipientKeyFor:key,
   policyFor:async()=>{throw new Error("database timeout - secret");},
   runtimeEnv:{APP_ENV:"production"},
  });
  expect(result.every(row=>row.status==="FAILED"&&row.reason==="policy-read-failed")).toBe(true);
  expect(inserted).toHaveLength(2);
  expect(audits).toEqual([{sent:0,failed:2,suppressed:0}]);
  expect(provider.send).not.toHaveBeenCalled();
 });
});