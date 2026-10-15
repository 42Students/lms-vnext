import {expect,it} from "vitest";
import {learnerOffersEmptyState} from "@/modules/placements/learner-offers-empty-state-model";
it("distinguishes no saved offers, filter-empty and status-empty without inventing offers",()=>{
 expect(learnerOffersEmptyState(0,true).title).toBe("No offers recorded");
 expect(learnerOffersEmptyState(2,true).title).toBe("No matching offers");
 expect(learnerOffersEmptyState(2,false).title).toBe("No offers in this view");
 expect(learnerOffersEmptyState(2,true).description).toContain("selected filters");
});
