import {expect,it} from "vitest";
import {learnerVerificationDateLabel} from "@/modules/placements/learner-verification-date-model";
it("formats recorded verification instants in IST without throwing for invalid values",()=>{
 expect(learnerVerificationDateLabel("2026-10-15T00:00:00Z")).toBeTruthy();
 expect(learnerVerificationDateLabel("not-a-date")).toBeNull();
 expect(learnerVerificationDateLabel(null)).toBeNull();
});
