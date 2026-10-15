import {expect,it} from "vitest";
import {learnerPlacementCellOfferEmptyMessage} from "@/modules/placements/learner-placement-cell-offer-empty-model";
it("distinguishes no issued official offers from application and round decisions",()=>{
 expect(learnerPlacementCellOfferEmptyMessage(0)).toContain("not offer letters");
 expect(learnerPlacementCellOfferEmptyMessage(2)).toContain("available below");
});
