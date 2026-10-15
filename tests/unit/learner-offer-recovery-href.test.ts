import {expect,it} from "vitest";
import {learnerOfferRecoveryHref} from "@/modules/placements/learner-offer-deep-link-model";
it("keeps only a validated offer id while removing filters and tenant selectors",()=>{
 const id="5ec51b46-f89f-46c4-b6f5-6d88928681c2";
 expect(learnerOfferRecoveryHref(id)).toBe("/learn/my-placements/offers?focus="+id);
 expect(learnerOfferRecoveryHref(["any",id])).toBe("/learn/my-placements/offers");
 expect(learnerOfferRecoveryHref("javascript:alert(1)")).toBe("/learn/my-placements/offers");
});
