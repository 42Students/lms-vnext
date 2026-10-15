import {expect,it} from "vitest";
import {learnerOfferApplicationHref} from "@/modules/placements/learner-offer-application-link-model";
it("provides only same-app UUID application details from a currently owned rendered offer",()=>{
 const id="00000000-0000-4000-8000-000000000001";
 expect(learnerOfferApplicationHref(id)).toBe("/learn/my-placements/applications/"+id);
 expect(learnerOfferApplicationHref("../../college")).toBeNull();
 expect(learnerOfferApplicationHref("")).toBeNull();
});
