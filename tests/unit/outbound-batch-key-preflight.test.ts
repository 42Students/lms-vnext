import {expect,it,vi} from "vitest";
import {deliverBatch} from "@/modules/messaging/service";
import type {OutboundSendRequest,DeliveryPolicy} from "@/modules/messaging/model";
const policy:DeliveryPolicy={appEnv:"production",testEmails:[],testPhones:[],
 suppressed:new Set(),sentToday:0,dailyCap:100,recentRecipientSends:0,recipientWindowCap:100};
it("never sends the first valid contact when a subsequent HMAC recipient key is invalid",async()=>{
 const send=vi.fn(async()=>true),insert=vi.fn(async()=>{});
 const first:OutboundSendRequest={channel:"EMAIL",recipient:"alpha@example.com",purpose:"notice",templateKey:"message",variables:{}};
 await expect(deliverBatch({batchId:"b",requests:[first,{...first,recipient:"beta@example.com"}],
  runtimeEnv:{APP_ENV:"production"},policyFor:async()=>policy,
  recipientKeyFor:async request=>request.recipient.startsWith("alpha")?"a".repeat(64):"plaintext@example.com",
  provider:{send},repository:{insert,update:async()=>{},auditBatch:async()=>{}},
 })).rejects.toThrow("INVALID_RECIPIENT_KEY");
 expect(send).not.toHaveBeenCalled();
 expect(insert).not.toHaveBeenCalled();
});
