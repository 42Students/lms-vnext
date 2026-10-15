import {expect,it} from "vitest";
import {outboundSendSchema} from "@/modules/messaging/model";
const payload={channel:"SMS",recipient:"+919876543210",templateKey:"placement.notice",purpose:"REMINDER",variables:{}};
it.each(["header\nBcc:bad@example.com","x\rInject","../token"," bad key","x\u0000y"])(
 "rejects unsafe template identifiers %s",templateKey=>{
 expect(outboundSendSchema.safeParse({...payload,templateKey}).success).toBe(false);
});
it.each(["auth.otp","placement.notice","hr:drive_invite"])(
 "keeps existing safe token syntax %s",templateKey=>{
 expect(outboundSendSchema.safeParse({...payload,templateKey}).success).toBe(true);
});
