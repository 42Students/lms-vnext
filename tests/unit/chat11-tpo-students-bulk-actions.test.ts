import {expect,it} from "vitest";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
it("the TPO students panel uses membership-scope eligible/clear actions only",()=>{
 const membershipId="11111111-1111-4111-8111-111111111111";
 for(const action of ["ELIGIBLE","CLEAR_OVERRIDE"]){
  expect(tpoBulkPreviewRequestSchema.parse({target:"STUDENTS",action,ids:[membershipId]}).target).toBe("STUDENTS");
 }
 expect(tpoBulkPreviewRequestSchema.safeParse({target:"STUDENTS",action:"REJECTED",ids:[membershipId]}).success).toBe(false);
});
