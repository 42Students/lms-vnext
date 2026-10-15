import {expect,it} from "vitest";
import {learnerVerificationSubmissionDateFallback} from "@/modules/placements/learner-verification-date-model";
it("distinguishes missing submission from a corrupt saved timestamp",()=>{
 expect(learnerVerificationSubmissionDateFallback(null)).toBe("Not yet submitted");
 expect(learnerVerificationSubmissionDateFallback("invalid")).toBe("Saved submission time unavailable");
});
