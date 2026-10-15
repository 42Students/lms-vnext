import {expect,it} from "vitest";
import {hrDriveProposalHistoryQuerySchema} from "@/modules/placements/hr-drive-proposal-history-model";
it("does not allow arbitrary recruiter identifiers in proposal-history filters",()=>{
 expect(hrDriveProposalHistoryQuerySchema.safeParse({recruiterUserId:"someone-else"}).success).toBe(false);
});
