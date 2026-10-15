import {expect,it} from "vitest";
import {internalMessageSchema,canReadInternalThread} from "@/modules/placements/tpo-team-internal-model";
it("rejects oversized messages and thread impersonation",()=>{
 const threadId="11111111-1111-4111-8111-111111111111";
 expect(internalMessageSchema.safeParse({threadId,body:"a".repeat(4001)}).success).toBe(false);
 expect(internalMessageSchema.safeParse({threadId,body:"Message"}).success).toBe(true);
 expect(canReadInternalThread({actorMembershipId:"unrelated",startedByMembershipId:"creator",invitedMembershipId:"recipient"})).toBe(false);
});
