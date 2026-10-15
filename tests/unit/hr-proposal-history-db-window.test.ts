import {expect,it} from "vitest";
import {hrProposalHistoryWindow} from "@/modules/placements/hr-drive-proposal-history-model";
it("caps last-page SQL offsets after the exact persisted proposal count",()=>{
 expect(hrProposalHistoryWindow(2,45)).toEqual({page:2,pages:3,offset:20,total:45});
 expect(hrProposalHistoryWindow(10000,1).offset).toBe(0);
});
