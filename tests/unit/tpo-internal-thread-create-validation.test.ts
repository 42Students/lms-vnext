import {expect,it} from "vitest";
import {internalThreadSchema} from "@/modules/placements/tpo-team-internal-model";
it("bounds recipient and topic without client-controlled college",()=>{
 const valid={recipientMembershipId:"11111111-1111-4111-8111-111111111111",topic:"Drive logistics"};
 expect(internalThreadSchema.parse(valid)).toEqual(valid);
 expect(internalThreadSchema.safeParse({...valid,collegeId:"foreign"}).success).toBe(false);
 expect(internalThreadSchema.safeParse({...valid,topic:" ".repeat(4)}).success).toBe(false);
});
