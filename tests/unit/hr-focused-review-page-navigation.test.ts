import {expect,it} from "vitest";
import {focusedReviewNavigation} from "@/modules/placements/hr-focused-review-model";
const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
it("focus steps are only derived from authorized current-page applicant IDs",()=>{
 const nav=focusedReviewNavigation({candidateIds:[a,b],currentId:b});
 expect(nav.previous).toBe(a);
 expect(nav.next).toBeNull();
 expect(focusedReviewNavigation({candidateIds:[a],currentId:b}).index).toBe(-1);
});
