import {expect,it} from "vitest";
import {learnerPlacementVerificationCue} from "@/modules/placements/learner-verification-cue-model";
it("never equates verification with placement eligibility",()=>{
 expect(learnerPlacementVerificationCue("VERIFIED","VERIFIED").summary).toContain("assessed separately");
 expect(learnerPlacementVerificationCue("SENT_BACK","WAITING").summary).toContain("sent back");
 expect(learnerPlacementVerificationCue("WAITING","NOT_SUBMITTED").identityLabel).toBe("Not submitted");
});
