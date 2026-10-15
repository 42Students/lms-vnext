import {expect,it} from "vitest";
import {tpoBulkPreviewRequestSchema,tpoBulkConfirmRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
const id="11111111-1111-4111-8111-111111111111";
it("student bulk preview cannot smuggle free text, and signatures are bounded",()=>{
 expect(tpoBulkPreviewRequestSchema.safeParse({target:"STUDENTS",action:"ELIGIBLE",ids:[id],note:"private"}).success).toBe(false);
 expect(tpoBulkConfirmRequestSchema.safeParse({target:"STUDENTS",action:"ELIGIBLE",ids:[id],
 selections:[{id,version:"v1"}],previewToken:"x".repeat(1000),confirmed:true}).success).toBe(false);
});
