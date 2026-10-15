import {expect,it} from "vitest";
import {learnerOfferDisplayDate} from "@/modules/placements/learner-offer-display-date-model";
it("never throws when displaying invalid persisted offer dates",()=>{
 expect(learnerOfferDisplayDate("2026-10-15T00:00:00Z")).toBeTruthy();
 expect(learnerOfferDisplayDate("invalid")).toBeNull();
 expect(learnerOfferDisplayDate(null)).toBeNull();
});
