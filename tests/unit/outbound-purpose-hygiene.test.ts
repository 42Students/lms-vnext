import {expect,it} from "vitest";
import {outboundSendSchema} from "@/modules/messaging/model";
const payload={channel:"EMAIL",recipient:"member@example.com",
 templateKey:"placement.notice",purpose:"Drive reminder",variables:{}};
it.each(["Drive\rBCC","Drive\nNewline","Drive\tTab","Drive\u0000Nul"])(
 "rejects control-bearing delivery purpose %s",purpose=>{
 expect(outboundSendSchema.safeParse({...payload,purpose}).success).toBe(false);
});
it("permits ordinary purpose labels",()=>expect(outboundSendSchema.safeParse(payload).success).toBe(true));
