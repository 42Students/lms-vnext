import {it,expect} from "vitest";
import {internalThreadSchema} from "@/modules/placements/tpo-team-internal-model";
it("requires a recipient membership and a meaningful topic",()=>{
 expect(internalThreadSchema.safeParse({recipientMembershipId:"11111111-1111-4111-8111-111111111111",topic:"Review"}).success).toBe(true);
 expect(internalThreadSchema.safeParse({recipientMembershipId:"recruiter",topic:"Review"}).success).toBe(false);
});
