import {expect,it} from "vitest";
import {filterTpoBatchRegistrationSource,tpoBatchRegistrationSourceSchema} from "@/modules/placements/tpo-batch-registration-source-model";
it("shows only persisted source types, never assumes missing source means SELF",()=>{
 const rows=[{source:"SELF"},{source:"TPO"},{source:"BACKFILL"},{source:null}];
 expect(filterTpoBatchRegistrationSource(rows,"SELF")).toEqual([rows[0]]);
 expect(filterTpoBatchRegistrationSource(rows,"UNRECORDED")).toEqual([rows[3]]);
 expect(filterTpoBatchRegistrationSource(rows,"ALL")).toHaveLength(4);
 expect(tpoBatchRegistrationSourceSchema.safeParse("UNKNOWN").success).toBe(false);
});
