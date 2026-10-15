
import {expect,it} from "vitest";
import {isTpoBulkPreviewCurrent} from "@/modules/placements/tpo-bulk-ui-model";
it("only allows a visible preview when every selected item remains on screen",()=>{
 expect(isTpoBulkPreviewCurrent(["1"],["1","2"])).toBe(true);
 expect(isTpoBulkPreviewCurrent(["1","2"],["1"])).toBe(false);
});
