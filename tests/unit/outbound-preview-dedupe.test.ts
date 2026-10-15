import {expect,it} from "vitest";
import {previewAudience,type DeliveryPolicy,type OutboundSendRequest} from "@/modules/messaging/model";
const policy:DeliveryPolicy={appEnv:"production",testEmails:[],testPhones:[],suppressed:new Set(),
 sentToday:0,dailyCap:20,recentRecipientSends:0,recipientWindowCap:5};
const first:OutboundSendRequest={channel:"EMAIL",recipient:"ALICE@example.org",templateKey:"placement.notice",purpose:"NOTICE",variables:{}};
it("matches actual batch recipient/purpose/template identity in preview",()=>{
 const result=previewAudience([first,{...first,recipient:" alice@example.org "},
 {...first,purpose:"SECOND_NOTICE"}],()=>policy);
 expect(result.map(row=>row.status)).toEqual(["QUEUED","SUPPRESSED","QUEUED"]);
 expect(result[1]).toMatchObject({reason:"duplicate-in-batch",recipient:"alice@example.org"});
});
