import {expect,it} from "vitest";
import {selectedBulkActionRows} from "@/modules/placements/tpo-bulk-workflow-model";
it("renders only generic row identifiers in bulk preview, not names or contact fields",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const view=selectedBulkActionRows([id],new Map([[id,{version:"v",ready:true}]]));
 expect(view[0].label).toBe("Selected row 1");
 expect(JSON.stringify(view)).not.toMatch(/@example|phone|displayName|email/i);
});
