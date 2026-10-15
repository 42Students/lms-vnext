import {expect,it} from "vitest";
import {deliverBatch} from "@/modules/messaging/service";
const request={channel:"EMAIL" as const,recipient:"real@example.com",templateKey:"notice",variables:{},purpose:"notice"};
const policy={appEnv:"production",testEmails:[],testPhones:[],suppressed:new Set<string>(),sentToday:0,dailyCap:100,recentRecipientSends:0,recipientWindowCap:3};
it("rejects a permissive caller policy for non-production contacts",async()=>{
 let sent=0,created="";
 const rows=await deliverBatch({
  batchId:"batch-1",requests:[request],runtimeEnv:{APP_ENV:"staging",AUTH_TEST_EMAILS:"tester@example.com"},
  policyFor:async()=>policy,recipientKeyFor:async()=>"a".repeat(64),
  provider:{send:async()=>{sent++;return true;}},
  repository:{insert:async(row)=>{created=row.status;},update:async()=>{},auditBatch:async()=>{}},
 });
 expect(sent).toBe(0);expect(created).toBe("SUPPRESSED");
 expect(rows[0]?.reason).toBe("nonprod-not-allowlisted");
});
it("rejects non-HMAC recipient keys before persistence",async()=>{
 await expect(deliverBatch({batchId:"x",requests:[request],runtimeEnv:{APP_ENV:"production"},
  policyFor:async()=>policy,recipientKeyFor:async()=>"real@example.com",
  provider:{send:async()=>true},repository:{insert:async()=>{},update:async()=>{},auditBatch:async()=>{}},
 })).rejects.toThrow("INVALID_RECIPIENT_KEY");
});
