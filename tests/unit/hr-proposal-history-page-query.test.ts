import {expect,it} from "vitest";
import {hrDriveProposalHistoryQuerySchema} from "@/modules/placements/hr-drive-proposal-history-model";
it("keeps exact college plus bounded page in a proposal history navigation",()=>{
 const parsed=hrDriveProposalHistoryQuerySchema.parse({collegeId:"11111111-1111-4111-8111-111111111111",page:"2"});
 expect(parsed.page).toBe(2);
 expect(parsed.collegeId).toBe("11111111-1111-4111-8111-111111111111");
});
