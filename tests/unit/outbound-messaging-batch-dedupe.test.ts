import {expect,it} from "vitest";
import {deliverBatch} from "@/modules/messaging/service";
import {outboundSendSchema,type DeliveryPolicy} from "@/modules/messaging/model";
it("persists duplicate suppression while making only one outbound provider call",async()=>{
 const req=outboundSendSchema.parse({channel:"EMAIL",recipient:"test@example.com",
  purpose:"campaign-1",templateKey:"notice",variables:{}});
 const policy:DeliveryPolicy={appEnv:"development",testEmails:["test@example.com"],
  testPhones:[],suppressed:new Set(),sentToday:0,dailyCap:100,
  recentRecipientSends:0,recipientWindowCap:3};
 const inserts:string[]=[];let sends=0;
 const result=await deliverBatch({
  batchId:"same",requests:[req,{...req,recipient:"TEST@EXAMPLE.COM"}],
  policyFor:async()=>policy,recipientKeyFor:async()=>"a".repeat(64),
  runtimeEnv:{APP_ENV:"development",AUTH_TEST_EMAILS:"test@example.com"},
  provider:{send:async()=>{sends++;return true;}},
  repository:{insert:async row=>{inserts.push(row.status);},
   update:async()=>{},auditBatch:async()=>{}},
 });
 expect(sends).toBe(1);
 expect(inserts).toEqual(["QUEUED","SUPPRESSED"]);
 expect(result.map(row=>row.status)).toEqual(["SENT","SUPPRESSED"]);
 expect(result[1]?.reason).toBe("duplicate-in-batch");
});
