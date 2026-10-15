import {expect,it} from "vitest";
import {tpoBulkConfirmRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
const id="11111111-1111-4111-8111-111111111111";
it("confirm forbids client-supplied actor, outcome or any extra fields",()=>{
 const p={target:"APPLICATIONS",jobId:id,action:"SHORTLISTED",note:"Reviewed candidate",
  ids:[id],selections:[{id,version:"2026-10-15T00:00:00.000Z"}],
  previewToken:"issued",confirmed:true};
 expect(tpoBulkConfirmRequestSchema.safeParse(p).success).toBe(true);
 expect(tpoBulkConfirmRequestSchema.safeParse({...p,collegeId:id}).success).toBe(false);
 expect(tpoBulkConfirmRequestSchema.safeParse({...p,confirmed:false}).success).toBe(false);
});
