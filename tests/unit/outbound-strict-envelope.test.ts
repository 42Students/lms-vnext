import {expect,it} from "vitest";
import {outboundSendSchema} from "@/modules/messaging/model";
const payload={channel:"EMAIL",recipient:"member@example.com",templateKey:"placement.reminder",
 purpose:"PLACEMENT_NOTICE",variables:{}};
it("rejects extra recipient identity or provider override fields",()=>{
 expect(outboundSendSchema.safeParse({...payload,learnerId:"private-id"}).success).toBe(false);
 expect(outboundSendSchema.safeParse({...payload,providerOverride:"send-now"}).success).toBe(false);
});
it("accepts the known outbound envelope",()=>expect(outboundSendSchema.safeParse(payload).success).toBe(true));
