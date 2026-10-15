import {expect,it} from "vitest";
import {hrDriveProposalHistoryQuerySchema} from "@/modules/placements/hr-drive-proposal-history-model";
it("rejects caller-owned exports and bounds the selected export page",()=>{
 expect(hrDriveProposalHistoryQuerySchema.safeParse({
  collegeId:"11111111-1111-4111-8111-111111111111",
  sort:"OLDEST",page:"2",q:"Analyst",
 }).success).toBe(true);
 expect(hrDriveProposalHistoryQuerySchema.safeParse({organizationId:"foreign"}).success).toBe(false);
 expect(hrDriveProposalHistoryQuerySchema.safeParse({page:"10001"}).success).toBe(false);
});
