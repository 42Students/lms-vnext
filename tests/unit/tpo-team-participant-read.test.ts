import {expect,it} from "vitest";
import {canReadInternalThread} from "@/modules/placements/tpo-team-internal-model";
it("never opens internal thread for third party recruiter",()=>{
 expect(canReadInternalThread({actorMembershipId:"other",startedByMembershipId:"owner",invitedMembershipId:"member"})).toBe(false);
});
