import {expect,it,vi} from "vitest";
import {deliverBatch} from "@/modules/messaging/service";
import type {OutboundSendRequest,DeliveryPolicy} from "@/modules/messaging/model";
const policy:DeliveryPolicy={appEnv:"production",testEmails:[],testPhones:[],
 suppressed:new Set(),sentToday:0,dailyCap:100,recentRecipientSends:0,recipientWindowCap:100};
it("rejects any later malformed request without persisting or contacting a provider",async()=>{
 const send=vi.fn(async()=>true),insert=vi.fn(async()=>{});
 const valid:OutboundSendRequest={channel:"EMAIL",recipient:"alpha@example.com",
  purpose:"outreach",templateKey:"notice",variables:{}};
 await expect(deliverBatch({batchId:"batch",requests:[valid,{...valid,recipient:""}],
  policyFor:async()=>policy,recipientKeyFor:async()=>"a".repeat(64),
  runtimeEnv:{APP_ENV:"production"},provider:{send},
  repository:{insert,update:async()=>{},auditBatch:async()=>{}},
 })).rejects.toThrow();
 expect(insert).not.toHaveBeenCalled();
 expect(send).not.toHaveBeenCalled();
});
