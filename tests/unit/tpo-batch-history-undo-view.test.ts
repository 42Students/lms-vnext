import {expect,it} from "vitest";
import {actionableBatchHistory} from "@/modules/placements/tpo-batch-history-undo-model";
import {filterTpoBatchHistoryKind} from "@/modules/placements/tpo-batch-history-view-model";
it("never offers undo on older history actions after filtering the list",()=>{
 const rows=[{id:"new",actionId:"new",kind:"DECIDE",scopeType:"COHORT",reversesActionId:null},{id:"old",actionId:"old",kind:"DECIDE",scopeType:"COHORT",reversesActionId:null}];
 const annotated=actionableBatchHistory(rows);
 expect(filterTpoBatchHistoryKind(annotated,"DECIDE").filter(row=>row.canRequestUndo).map(row=>row.id)).toEqual(["new"]);
});
it("suppresses undo when newest recorded event was itself a reversal",()=>{
 const rows=[{actionId:"undo",kind:"UNDO",scopeType:"COHORT",reversesActionId:"previous"},{actionId:"previous",kind:"DECIDE",scopeType:"COHORT",reversesActionId:null}];
 expect(actionableBatchHistory(rows).every(row=>!row.canRequestUndo)).toBe(true);
});
