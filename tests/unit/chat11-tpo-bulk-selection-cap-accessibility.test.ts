import {expect,it} from "vitest";
import {canSelectTpoBulkRow,TPO_BULK_VIEW_LIMIT} from "@/modules/placements/tpo-bulk-ui-model";
it("keeps selected checkboxes removable but prevents adding a row past the limit",()=>{
 const selected=Array.from({length:TPO_BULK_VIEW_LIMIT},(_,i)=>String(i));
 expect(canSelectTpoBulkRow(selected,"4")).toBe(true);
 expect(canSelectTpoBulkRow(selected,"new")).toBe(false);
 expect(canSelectTpoBulkRow(selected.slice(1),"new")).toBe(true);
});
