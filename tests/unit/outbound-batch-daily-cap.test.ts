import {expect,it,vi} from "vitest";
import {deliverBatch} from "@/modules/messaging/service";
import type {DeliveryPolicy,OutboundSendRequest} from "@/modules/messaging/model";
const policy:DeliveryPolicy={appEnv:"production",testEmails:[],testPhones:[],suppressed:new Set(),
 sentToday:4,dailyCap:5,recentRecipientSends:0,recipientWindowCap:20};
it("enforces a conservative in-batch daily provider acceptance cap",async()=>{
 const send=vi.fn(async()=>true);
 const req:OutboundSendRequest={channel:"EMAIL",recipient:"a@example.com",purpose:"invitation",templateKey:"invite",variables:{}};
 const records=await deliverBatch({batchId:"b",requests:[req,{...req,recipient:"b@example.com"}],
  runtimeEnv:{APP_ENV:"production"},policyFor:async()=>policy,
  recipientKeyFor:async r=>r.recipient.startsWith("a")?"a".repeat(64):"b".repeat(64),
  provider:{send},repository:{insert:async()=>{},update:async()=>{},auditBatch:async()=>{}},
 });
 expect(send).toHaveBeenCalledTimes(1);
 expect(records.map(x=>x.status)).toEqual(["SENT","SUPPRESSED"]);
 expect(records[1]?.reason).toBe("daily-cap");
});
