import {expect,it} from "vitest";
import {hrDriveProposalHistoryCsv} from "@/modules/placements/hr-drive-proposal-export-model";
it("neutralizes spreadsheet formulas and never exports the private proposal body",()=>{
 const csv=hrDriveProposalHistoryCsv([{
  referenceId:"11111111-1111-4111-8111-111111111111",title:'=HYPERLINK("bad")',
  createdAt:new Date("2026-10-15T08:00:00.000Z"),
 }]);
 expect(csv).toContain("'=HYPERLINK");
 expect(csv).toContain("DISCUSSION_ONLY");
 expect(csv).not.toContain("description");
 expect(csv).not.toContain("body");
 expect(csv).not.toContain("recipient");
});
