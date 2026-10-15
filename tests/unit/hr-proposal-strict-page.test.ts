import {it,expect} from "vitest";
import {hrDriveProposalHistoryQuerySchema} from "@/modules/placements/hr-drive-proposal-history-model";
it("accepts current page links without implicit coercion",()=>{
 expect(hrDriveProposalHistoryQuerySchema.parse({page:"2"}).page).toBe(2);
 expect(hrDriveProposalHistoryQuerySchema.parse({}).page).toBe(1);
});
it.each([true,false,"01","1e2"," 2 ","2.0",null,0,10001])(
 "rejects ambiguous sent-proposal pages %s",page=>{
 expect(hrDriveProposalHistoryQuerySchema.safeParse({page}).success).toBe(false);
});
