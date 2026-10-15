import {it,expect} from "vitest";
import {learnerVerificationSubmissionFeedback as f} from "@/modules/placements/learner-verification-submit-feedback-model";
it("handles stale and unchanged versions distinctly without leaking private evidence",()=>{
 expect(f(409,"STALE_VERSION").refreshRequired).toBe(true);
 expect(f(409,"NOTHING_CHANGED").message).toMatch(/No new evidence/);
 expect(f(422,"INCOMPLETE_DOCUMENTS").refreshRequired).toBe(false);
 expect(f(403,"secret-provider-error").message).not.toContain("secret-provider-error");
});
