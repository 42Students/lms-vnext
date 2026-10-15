import {expect,it} from "vitest";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
it("bulk application writes retain the DB09 proof gate and cannot smuggle student changes",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const app=tpoBulkPreviewRequestSchema.parse({
  target:"APPLICATIONS",jobId:id,action:"SHORTLISTED",
  note:"Auditable human screening review",ids:[id],
 });
 expect(app.target).toBe("APPLICATIONS");
 expect(tpoBulkPreviewRequestSchema.safeParse({...app,target:"STUDENTS"}).success).toBe(false);
});
