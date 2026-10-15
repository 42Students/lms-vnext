import {expect,it} from "vitest";
import {learnerPlacementVerificationCue} from "@/modules/placements/learner-verification-cue-model";
it("only offers edit-shortcut for a persisted sent-back section",()=>{
 expect(learnerPlacementVerificationCue("SENT_BACK","VERIFIED").editHref).toBe("/learn/profile?section=education");
 expect(learnerPlacementVerificationCue("WAITING","SENT_BACK").editHref).toBe("/learn/profile?section=identity");
 expect(learnerPlacementVerificationCue("VERIFIED","VERIFIED").editHref).toBeNull();
});
