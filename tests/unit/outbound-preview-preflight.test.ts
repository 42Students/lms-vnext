import {expect,it,vi} from "vitest";
import {previewAudience,type DeliveryPolicy,type OutboundSendRequest} from "@/modules/messaging/model";
const policy:DeliveryPolicy={appEnv:"production",testEmails:[],testPhones:[],
 suppressed:new Set(),sentToday:0,dailyCap:50,recentRecipientSends:0,recipientWindowCap:5};
const valid:OutboundSendRequest={channel:"EMAIL",recipient:"alice@example.org",templateKey:"placement.notice",purpose:"NOTICE",variables:{}};
it("rejects a late invalid request without running any audience policy lookup",()=>{
 const lookup=vi.fn(()=>policy);
 expect(()=>previewAudience([valid,{...valid,templateKey:"header\nUnsafe"}],lookup)).toThrow();
 expect(lookup).not.toHaveBeenCalled();
});
it("continues to preview validated recipients",()=>{
 expect(previewAudience([valid],()=>policy)[0]?.status).toBe("QUEUED");
});
