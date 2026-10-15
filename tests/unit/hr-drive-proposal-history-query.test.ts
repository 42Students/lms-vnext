import {expect,it} from "vitest";
import {hrDriveProposalHistoryQuerySchema} from "@/modules/placements/hr-drive-proposal-history-model";
it("accepts only a validated college filter for persisted proposal history",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 expect(hrDriveProposalHistoryQuerySchema.safeParse({collegeId:id}).success).toBe(true);
 expect(hrDriveProposalHistoryQuerySchema.safeParse({collegeId:id,companyId:id}).success).toBe(false);
 expect(hrDriveProposalHistoryQuerySchema.safeParse({collegeId:"../../other"}).success).toBe(false);
});
