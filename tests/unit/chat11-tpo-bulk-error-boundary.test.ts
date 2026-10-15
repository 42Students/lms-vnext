
import {expect,it} from "vitest";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
it("denies malformed client bulk actions before any write",()=>{
 expect(tpoBulkPreviewRequestSchema.safeParse({target:"APPLICATIONS",action:"REJECTED",ids:["oops"],note:"Too short"}).success).toBe(false);
});
