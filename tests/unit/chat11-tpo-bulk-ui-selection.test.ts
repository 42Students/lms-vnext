import {expect,it} from "vitest";
import {selectTpoBulkPage,toggleTpoBulkRow,TPO_BULK_VIEW_LIMIT} from "@/modules/placements/tpo-bulk-ui-model";
it("restricts bulk selection to a bounded current page without duplicating ids",()=>{
 const ids=Array.from({length:TPO_BULK_VIEW_LIMIT+50},(_,i)=>String(i));
 const selected=selectTpoBulkPage(ids);
 expect(selected).toHaveLength(TPO_BULK_VIEW_LIMIT);
 expect(toggleTpoBulkRow(selected,"new",true)).toHaveLength(TPO_BULK_VIEW_LIMIT);
 expect(toggleTpoBulkRow(selected,"1",false)).toHaveLength(TPO_BULK_VIEW_LIMIT-1);
});
