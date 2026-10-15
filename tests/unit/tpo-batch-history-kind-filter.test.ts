import {it,expect} from "vitest";
import {batchHistoryViewSchema,filterTpoBatchHistoryKind} from "@/modules/placements/tpo-batch-history-view-model";
it("filters the authorized, capped event sample and preserves original order",()=>{
 const rows=[{kind:"DECIDE"},{kind:"UNDO"},{kind:"DECIDE"}];
 expect(filterTpoBatchHistoryKind(rows,"UNDO")).toEqual([rows[1]]);
 expect(filterTpoBatchHistoryKind(rows,"ALL")).toEqual(rows);
 expect(batchHistoryViewSchema.safeParse({kind:"DELETE"}).success).toBe(false);
});
