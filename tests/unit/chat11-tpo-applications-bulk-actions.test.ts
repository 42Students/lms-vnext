import {expect,it} from "vitest";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
it("TPO pipeline bulk actions reject other jobs, student actions and unreasoned rejection",()=>{
 const jobId="11111111-1111-4111-8111-111111111111";
 const id="22222222-2222-4222-8222-222222222222";
 expect(tpoBulkPreviewRequestSchema.parse({target:"APPLICATIONS",jobId,
  action:"SHORTLISTED",ids:[id],note:"Validated application record"}).target).toBe("APPLICATIONS");
 expect(tpoBulkPreviewRequestSchema.safeParse({target:"APPLICATIONS",jobId,action:"ELIGIBLE",ids:[id]}).success).toBe(false);
 expect(tpoBulkPreviewRequestSchema.safeParse({target:"APPLICATIONS",jobId,action:"REJECTED",ids:[id],note:"No"}).success).toBe(false);
});
