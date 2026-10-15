import {expect,it} from "vitest";
import {outboundSendSchema} from "@/modules/messaging/model";
const base={channel:"EMAIL",recipient:"a@example.com",templateKey:"notice",purpose:"outreach"};
it("blocks unbounded or unsafe dynamic provider merge variables",()=>{
 expect(outboundSendSchema.safeParse({...base,variables:{first_name:"A"}}).success).toBe(true);
 expect(outboundSendSchema.safeParse({...base,variables:{"bad.key":"x"}}).success).toBe(false);
 expect(outboundSendSchema.safeParse({...base,variables:Object.fromEntries(
  Array.from({length:26},(_,n)=>["variable_"+n,"x"]))}).success).toBe(false);
 expect(outboundSendSchema.safeParse({...base,variables:{a:"x".repeat(4000),b:"x".repeat(4000),c:"x".repeat(4000),d:"x"}}).success).toBe(false);
});
