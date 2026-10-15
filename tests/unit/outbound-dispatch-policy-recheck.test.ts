import {expect,it,vi} from "vitest";
import {deliverBatch} from "@/modules/messaging/service";
import type {DeliveryPolicy,OutboundSendRequest} from "@/modules/messaging/model";
const request:OutboundSendRequest={channel:"EMAIL",recipient:"recipient@example.org",
 templateKey:"placement.notice",purpose:"REMINDER",variables:{}};
const base:DeliveryPolicy={appEnv:"production",testEmails:[],testPhones:[],suppressed:new Set(),
 sentToday:0,dailyCap:10,recentRecipientSends:0,recipientWindowCap:5};
it("suppresses a queued recipient if they unsubscribe before provider send",async()=>{
 const provider={send:vi.fn(async()=>true)}, inserts:unknown[]=[];
 const repository={insert:vi.fn(async(r:unknown)=>{inserts.push({...r as object});}),
 update:vi.fn(async()=>{}),auditBatch:vi.fn(async()=>{})};
 let calls=0;
 const records=await deliverBatch({batchId:"batch",requests:[request],provider,repository,
  policyFor:async()=>++calls===1?base:{...base,suppressed:new Set(["EMAIL:recipient@example.org"])},
  recipientKeyFor:async()=> "a".repeat(64),runtimeEnv:{APP_ENV:"production"}});
 expect(inserts).toHaveLength(1);
 expect(provider.send).not.toHaveBeenCalled();
 expect(records[0]).toMatchObject({status:"SUPPRESSED",reason:"unsubscribed"});
 expect(repository.auditBatch).toHaveBeenCalledWith("batch",{sent:0,failed:0,suppressed:1});
});
it("fails closed and records a dispatch failure if fresh policy cannot be loaded",async()=>{
 const provider={send:vi.fn(async()=>true)};
 const repository={insert:vi.fn(async()=>{}),update:vi.fn(async()=>{}),auditBatch:vi.fn(async()=>{})};
 let calls=0;
 const records=await deliverBatch({batchId:"batch2",requests:[request],provider,repository,
  policyFor:async()=>{if(++calls===2)throw new Error("policy unavailable");return base;},
  recipientKeyFor:async()=>"b".repeat(64),runtimeEnv:{APP_ENV:"production"}});
 expect(provider.send).not.toHaveBeenCalled();
 expect(records[0]).toMatchObject({status:"FAILED",reason:"policy-recheck-failed"});
});
