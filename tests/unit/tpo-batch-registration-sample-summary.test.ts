import {expect,it} from "vitest";
import {summarizeSampledBatchRegistrations} from "@/modules/placements/tpo-batch-registration-sample-summary-model";
it("counts actual recorded source and choice facts without assigning missing consent",()=>{
 const rows=[{choice:"PLACEMENTS",source:"SELF"},{choice:"HIGHER_STUDIES",source:"TPO"},{choice:null,source:null}];
 const total=summarizeSampledBatchRegistrations(rows);
 expect(total).toMatchObject({sample:3,recorded:2,unrecorded:1,bySource:{SELF:1,TPO:1,BACKFILL:0}});
 expect(total.byChoice.PLACEMENTS).toBe(1);
 expect(summarizeSampledBatchRegistrations([]).sample).toBe(0);
});
