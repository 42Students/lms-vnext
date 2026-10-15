
import {expect,it} from "vitest";
import {isTpoBulkPageSelected} from "@/modules/placements/tpo-bulk-ui-model";
it("only checks select-all when the actual first page rows are selected",()=>{
 expect(isTpoBulkPageSelected(["a","b"],["a","z"])).toBe(false);
 expect(isTpoBulkPageSelected(["a","b"],["b","a"])).toBe(true);
 expect(isTpoBulkPageSelected([],[])).toBe(false);
});
