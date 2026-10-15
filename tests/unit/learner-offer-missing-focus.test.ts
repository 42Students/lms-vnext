import {expect,it} from "vitest";
import {learnerOfferFocusMissing} from "@/modules/placements/learner-offer-deep-link-model";
it("reports a missing own-offer focus without reflecting forged ids or non-owned details",()=>{
 const id="5ec51b46-f89f-46c4-b6f5-6d88928681c2";
 expect(learnerOfferFocusMissing(id,false)).toBe(true);
 expect(learnerOfferFocusMissing(id,true)).toBe(false);
 expect(learnerOfferFocusMissing(["x",id],false)).toBe(false);
 expect(learnerOfferFocusMissing("javascript:alert(1)",false)).toBe(false);
});
