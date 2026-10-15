import {expect,it} from "vitest";
import {tpoBulkConfirmRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
const id="11111111-1111-4111-8111-111111111111";
it("confirm requires exact selected row versions and an explicit action confirmation",()=>{
 const base={target:"STUDENTS",action:"ELIGIBLE",note:"",ids:[id],
  selections:[{id,version:"cas-token"}],previewToken:"signed",confirmed:true};
 expect(tpoBulkConfirmRequestSchema.safeParse(base).success).toBe(true);
 expect(tpoBulkConfirmRequestSchema.safeParse({...base,confirmed:false}).success).toBe(false);
 expect(tpoBulkConfirmRequestSchema.safeParse({...base,selections:[{id,version:""}]}).success).toBe(false);
});
