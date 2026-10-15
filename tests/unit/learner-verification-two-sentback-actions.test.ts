import {expect,it} from "vitest";
import {learnerPlacementVerificationCue} from "@/modules/placements/learner-verification-cue-model";
it("links both independent sent-back profile sections without claiming placement eligibility",()=>{
 const cue=learnerPlacementVerificationCue("SENT_BACK","SENT_BACK");
 expect(cue.editHrefs.map(x=>x.href)).toEqual(["/learn/profile?section=education","/learn/profile?section=identity"]);
 expect(cue.summary).toContain("sent back");
 expect(learnerPlacementVerificationCue("VERIFIED","VERIFIED").editHrefs).toEqual([]);
});
