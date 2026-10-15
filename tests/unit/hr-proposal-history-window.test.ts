import {expect,it} from "vitest";
import {hrDriveProposalHistoryQuerySchema,hrProposalHistoryWindow} from "@/modules/placements/hr-drive-proposal-history-model";
it("clamps stale proposal pages with a deterministic 20-result window",()=>{
 expect(hrDriveProposalHistoryQuerySchema.parse({page:"3"}).page).toBe(3);
 expect(hrDriveProposalHistoryQuerySchema.safeParse({page:"0"}).success).toBe(false);
 expect(hrProposalHistoryWindow(500,22)).toEqual({page:2,pages:2,offset:20,total:22});
 expect(hrProposalHistoryWindow(2,0)).toEqual({page:1,pages:1,offset:0,total:0});
});
