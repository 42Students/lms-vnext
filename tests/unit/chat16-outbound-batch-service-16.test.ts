import {describe,expect,it,vi} from "vitest";
import {createHash} from "node:crypto";
import {
  deliverBatch,validOutboundBatchId,
  type DeliveryRecord,type DeliveryRepository,type OutboundProvider,
} from "@/modules/messaging/service";
import type {DeliveryPolicy,OutboundSendRequest} from "@/modules/messaging/model";

const initial:OutboundSendRequest={
 channel:"EMAIL",recipient:"alice@example.org",templateKey:"campaign.notice",
 variables:{name:"Alice"},purpose:"placement-campaign",
};
const productionEnv={APP_ENV:"production"};
const policy:DeliveryPolicy={
 appEnv:"production",testEmails:[],testPhones:[],suppressed:new Set<string>(),
 sentToday:0,dailyCap:20,recentRecipientSends:0,recipientWindowCap:3,
};
function fixtures(){
 const inserted:DeliveryRecord[]=[];
 const updated:DeliveryRecord[]=[];
 const audited:{batchId:string;sent:number;failed:number;suppressed:number}[]=[];
 const repository:DeliveryRepository={
  async insert(record){inserted.push({...record});},
  async update(record){updated.push({...record});},
  async auditBatch(batchId,counts){audited.push({batchId,...counts});},
 };
 const send=vi.fn(async(_request:OutboundSendRequest)=>true);
 const provider:OutboundProvider={send};
 const recipientKeyFor=async(request:OutboundSendRequest)=>
  createHash("sha256").update(request.recipient.trim().toLowerCase()).digest("hex");
 const args:Parameters<typeof deliverBatch>[0]={
  batchId:"batch-001",requests:[initial],provider,repository,
  policyFor:async()=>policy,recipientKeyFor,runtimeEnv:productionEnv,
 };
 return {args,inserted,updated,audited,send};
}

describe("chat-16 end-to-end in-memory outbound batch policy",()=>{
 it("messaging-batch-execution-01 validates the entire input and keyed recipients before any send or audit",async()=>{
  expect(validOutboundBatchId("safe:campaign-1")).toBe(true);
  for(const invalid of ["","../bad","space key","x".repeat(121)]){
   expect(validOutboundBatchId(invalid),invalid).toBe(false);
  }
  const f=fixtures();
  await expect(deliverBatch({...f.args,batchId:"invalid batch"})).rejects.toThrow("INVALID_OUTBOUND_BATCH_ID");
  await expect(deliverBatch({...f.args,requests:Array.from({length:501},()=>initial)}))
   .rejects.toThrow("OUTBOUND_BATCH_CAP_EXCEEDED");
  await expect(deliverBatch({...f.args,requests:[
   initial,{...initial,templateKey:"not a template"},
  ] as OutboundSendRequest[]})).rejects.toThrow();
  await expect(deliverBatch({...f.args,recipientKeyFor:async()=> "too-short"}))
   .rejects.toThrow("INVALID_RECIPIENT_KEY");
  expect(f.send).not.toHaveBeenCalled();
  expect(f.inserted).toHaveLength(0);
  expect(f.audited).toHaveLength(0);
 });
 it("messaging-batch-execution-02 persists queue and final accepted state without writing raw email addresses",async()=>{
  const f=fixtures();
  const records=await deliverBatch(f.args);
  expect(records).toMatchObject([{status:"SENT",reason:null,channel:"EMAIL"}]);
  expect(f.inserted).toMatchObject([{status:"QUEUED"}]);
  expect(f.updated).toMatchObject([{status:"SENT"}]);
  expect(f.audited).toEqual([{batchId:"batch-001",sent:1,failed:0,suppressed:0}]);
  expect(JSON.stringify({records,inserted:f.inserted,updated:f.updated,audited:f.audited}))
   .not.toContain("alice@example.org");
  expect(f.send).toHaveBeenCalledOnce();
  expect(f.send).toHaveBeenCalledWith(expect.objectContaining({recipient:"alice@example.org"}));
 });
 it("messaging-batch-execution-03 rechecks opt-out after persistence and never calls provider for revoked consent",async()=>{
  const f=fixtures();
  let call=0;
  const freshPolicy=async()=>{
   call++;
   return call===1?policy:{...policy,suppressed:new Set(["EMAIL:alice@example.org"])};
  };
  const records=await deliverBatch({...f.args,policyFor:freshPolicy});
  expect(records).toMatchObject([{status:"SUPPRESSED",reason:"unsubscribed"}]);
  expect(f.inserted).toMatchObject([{status:"QUEUED"}]);
  expect(f.updated).toMatchObject([{status:"SUPPRESSED",reason:"unsubscribed"}]);
  expect(f.send).not.toHaveBeenCalled();
  expect(f.audited).toEqual([{batchId:"batch-001",sent:0,failed:0,suppressed:1}]);
 });
 it("messaging-batch-execution-04 fails closed when live revalidation throws, without leaving an invented sent status",async()=>{
  const f=fixtures();
  let call=0;
  const records=await deliverBatch({...f.args,policyFor:async()=>{
   if(++call===2)throw new Error("temporary policy read error");
   return policy;
  }});
  expect(records).toMatchObject([{status:"FAILED",reason:"policy-recheck-failed"}]);
  expect(f.send).not.toHaveBeenCalled();
  expect(f.audited).toEqual([{batchId:"batch-001",sent:0,failed:1,suppressed:0}]);
 });
 it("messaging-batch-execution-05 enforces cumulative per-recipient caps across differing templates",async()=>{
  const f=fixtures();
  const requests=[
   initial,{...initial,templateKey:"campaign.followup"},{...initial,templateKey:"campaign.third"},
  ];
  const records=await deliverBatch({...f.args,requests,policyFor:async()=>({
   ...policy,recipientWindowCap:2,
  })});
  expect(records.map(row=>row.status)).toEqual(["SENT","SENT","SUPPRESSED"]);
  expect(records[2]).toMatchObject({reason:"rate-limited"});
  expect(f.send).toHaveBeenCalledTimes(2);
  expect(f.audited).toEqual([{batchId:"batch-001",sent:2,failed:0,suppressed:1}]);
 });
 it("messaging-batch-execution-06 suppresses duplicated channel/recipient/purpose/template regardless of email case",async()=>{
  const f=fixtures();
  const records=await deliverBatch({...f.args,requests:[
   initial,{...initial,recipient:"ALICE@EXAMPLE.ORG"},
  ]});
  expect(records.map(row=>row.status)).toEqual(["SENT","SUPPRESSED"]);
  expect(records[1]).toMatchObject({reason:"duplicate-in-batch"});
  expect(f.send).toHaveBeenCalledOnce();
 });
 it("messaging-batch-execution-07 fails closed for nonproduction recipients even if policy mistakenly permits them",async()=>{
  const f=fixtures();
  const records=await deliverBatch({...f.args,runtimeEnv:{
   APP_ENV:"development",AUTH_TEST_EMAILS:"test@example.org",
  }});
  expect(records).toMatchObject([{status:"SUPPRESSED",reason:"nonprod-not-allowlisted"}]);
  expect(f.send).not.toHaveBeenCalled();
 });
});
