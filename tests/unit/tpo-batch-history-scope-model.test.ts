import {it,expect} from "vitest";
import {buildBatchHistoryScope} from "@/modules/placements/tpo-batch-history-scope-model";
it("keeps cohort, active memberships and classes distinct and exposes caps",()=>{
 const value=buildBatchHistoryScope("c",["a","a","b","d"],["s","s"],2);
 expect(value.ids).toEqual(["c","a","b","s"]);
 expect(value.limited).toBe(true);
 expect(value.includesTransferredLearners).toBe(false);
});
