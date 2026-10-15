import {expect,it} from "vitest";
import {filterTpoBatchHistoryOutcome,batchHistoryViewSchema} from "@/modules/placements/tpo-batch-history-view-model";
it("compares persisted after-state and preserves explicit NOT_DECIDED null",()=>{
 const rows=[{after:"ELIGIBLE"},{after:"INELIGIBLE"},{after:null}];
 expect(filterTpoBatchHistoryOutcome(rows,"INELIGIBLE")).toEqual([rows[1]]);
 expect(filterTpoBatchHistoryOutcome(rows,"NOT_DECIDED")).toEqual([rows[2]]);
 expect(batchHistoryViewSchema.safeParse({after:"FINISHED"}).success).toBe(false);
});
