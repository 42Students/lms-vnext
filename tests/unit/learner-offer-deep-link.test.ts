import {expect,it} from "vitest";
import {learnerOfferAnchor,learnerOfferHref} from "@/modules/placements/learner-offer-deep-link-model";
it("anchors only UUID-identified own offer cards without public or arbitrary URLs",()=>{
 const id="5ec51b46-f89f-46c4-b6f5-6d88928681c2";
 expect(learnerOfferAnchor(id)).toBe("offer-"+id);
 expect(learnerOfferHref(id)).toBe("/learn/my-placements/offers#offer-"+id);
 expect(learnerOfferHref("../../admin")).toBeNull();
 expect(learnerOfferHref("javascript:alert(1)")).toBeNull();
});
