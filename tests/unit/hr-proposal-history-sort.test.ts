import {expect,it} from "vitest";
import {hrDriveProposalHistoryQuerySchema} from "@/modules/placements/hr-drive-proposal-history-model";
it("validates chronological proposal history order with latest as default",()=>{
 expect(hrDriveProposalHistoryQuerySchema.parse({}).sort).toBe("LATEST");
 expect(hrDriveProposalHistoryQuerySchema.parse({sort:"OLDEST"}).sort).toBe("OLDEST");
 expect(hrDriveProposalHistoryQuerySchema.safeParse({sort:"EXTERNAL"}).success).toBe(false);
});
