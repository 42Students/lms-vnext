import {expect,it} from "vitest";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
it("requires explicit bounded POST preview selection and no client-provided labels",()=>{
 const row="11111111-1111-4111-8111-111111111111";
 expect(tpoBulkPreviewRequestSchema.safeParse({target:"STUDENTS",action:"ELIGIBLE",ids:[row]}).success).toBe(true);
 expect(tpoBulkPreviewRequestSchema.safeParse({target:"STUDENTS",action:"ELIGIBLE",ids:[row],label:"PII"}).success).toBe(false);
});
