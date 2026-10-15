import {expect,it,vi} from "vitest";
import {deliverBatch} from "@/modules/messaging/service";
import type {DeliveryPolicy,OutboundSendRequest} from "@/modules/messaging/model";
const policy:DeliveryPolicy={appEnv:"production",testEmails:[],testPhones:[],suppressed:new Set(),
 sentToday:0,dailyCap:10,recentRecipientSends:0,recipientWindowCap:1};
it("caps repeated same-recipient sends even across different campaign templates",async()=>{
 const send=vi.fn(async()=>true);
 const req:OutboundSendRequest={channel:"EMAIL",recipient:"a@example.com",purpose:"outreach",templateKey:"initial",variables:{}};
 const items=await deliverBatch({batchId:"b",requests:[req,{...req,templateKey:"reminder"}],
  runtimeEnv:{APP_ENV:"production"},policyFor:async()=>policy,
  recipientKeyFor:async()=> "a".repeat(64),provider:{send},
  repository:{insert:async()=>{},update:async()=>{},auditBatch:async()=>{}},
 });
 expect(send).toHaveBeenCalledTimes(1);
 expect(items[1]?.reason).toBe("rate-limited");
});
