import {it,expect} from "vitest";
import {canReadInternalThread,internalMessageSchema} from "@/modules/placements/tpo-team-internal-model";
it("allows only named internal participant memberships",()=>{
 expect(canReadInternalThread({actorMembershipId:"a",startedByMembershipId:"a",invitedMembershipId:"b"})).toBe(true);
 expect(canReadInternalThread({actorMembershipId:"recruiter",startedByMembershipId:"a",invitedMembershipId:"b"})).toBe(false);
 expect(internalMessageSchema.safeParse({threadId:"not-id",body:"x"}).success).toBe(false);
});
