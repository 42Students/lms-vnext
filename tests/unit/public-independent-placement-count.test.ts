import {it,expect} from "vitest";
import {publicIndependentPlacementCount as count} from "@/modules/placements/public-page/independent-count-model";
it("permits multiple offers per safe learner cohort but suppresses small evidence",()=>{
 expect(count(12,5)).toBe(12);
 expect(count(4,25)).toBeNull();
 expect(count(12,4)).toBeNull();
 expect(count(12,null)).toBeNull();
});
