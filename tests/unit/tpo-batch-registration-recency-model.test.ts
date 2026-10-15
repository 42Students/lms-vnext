import {it,expect} from "vitest";
import {filterTpoRegistrationRecency,tpoRegistrationRecencySchema} from "@/modules/placements/tpo-batch-registration-recency-model";
it("filters dates against a deterministic server snapshot, separating no-record",()=>{
 const now=new Date("2026-10-15T10:00:00Z");
 const rows=[{updatedAt:"2026-10-14T10:00:00Z"},{updatedAt:"2026-08-15T10:00:00Z"},{updatedAt:null},{updatedAt:"invalid"}];
 expect(filterTpoRegistrationRecency(rows,"UPDATED_7_DAYS",now)).toEqual([rows[0]]);
 expect(filterTpoRegistrationRecency(rows,"OLDER_30_DAYS",now)).toEqual([rows[1]]);
 expect(filterTpoRegistrationRecency(rows,"NO_RECORD",now)).toEqual([rows[2]]);
 expect(tpoRegistrationRecencySchema.safeParse("LAST_YEAR").success).toBe(false);
});
