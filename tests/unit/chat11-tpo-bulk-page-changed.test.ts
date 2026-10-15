
import {expect,it} from "vitest";
import {isTpoBulkPreviewCurrent} from "@/modules/placements/tpo-bulk-ui-model";
it("blocks confirmation of rows no longer rendered on a changed roster",()=>{
 expect(isTpoBulkPreviewCurrent(["a","b"],["a","b","c"])).toBe(true);
 expect(isTpoBulkPreviewCurrent(["a","b"],["a","c"])).toBe(false);
 expect(isTpoBulkPreviewCurrent([],["a"])).toBe(false);
});
