import {it,expect} from "vitest";
import {learnerVerificationSubmitLabel as label} from "@/modules/placements/learner-verification-submit-label";
it("distinguishes initial, sent-back and verified re-submissions",()=>{
 expect(label("NOT_SUBMITTED")).toBe("Submit for review");
 expect(label("SENT_BACK")).toBe("Resubmit for review");
 expect(label("VERIFIED")).toBe("Submit updated evidence");
});
