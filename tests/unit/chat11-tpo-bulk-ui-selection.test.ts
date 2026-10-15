import {expect,it} from "vitest";
import {selectTpoBulkPage,toggleTpoBulkRow,TPO_BULK_UI_LIMIT} from "@/modules/placements/tpo-bulk-ui-model";
it("restricts bulk selection to a bounded current page without duplicating ids",()=>{
 const ids=Array.from({length:50},(_,i)=>String(i));
 const selected=selectTpoBulkPage(ids);
 expect(selected).toHaveLength(TPO_BULK_UI_LIMIT);
 expect(toggleTpoBulkRow(selected,"new",true)).toHaveLength(25);
 expect(toggleTpoBulkRow(selected,"1",false)).toHaveLength(24);
});
