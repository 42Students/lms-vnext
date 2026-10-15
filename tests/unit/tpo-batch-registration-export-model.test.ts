import {it,expect} from "vitest";
import {exportTpoBatchRegistrationsCsv} from "@/modules/placements/tpo-batch-registration-export-model";
it("protects spreadsheet formulas and preserves unrecorded as absence",()=>{
 const csv=exportTpoBatchRegistrationsCsv([{name:"=1+1",membershipId:"m",
  choice:null,source:null,updatedAt:null}]);
 expect(csv).toContain("'=1+1");
 expect(csv).toContain('"UNRECORDED"');
 expect(csv).toContain('"Membership reference"');
});
