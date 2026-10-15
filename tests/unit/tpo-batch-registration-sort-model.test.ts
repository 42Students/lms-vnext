import {it,expect} from "vitest";
import {sortTpoBatchRegistrationRows,tpoRegistrationSortSchema} from "@/modules/placements/tpo-batch-registration-sort-model";
it("sorts before pagination with unavailable timestamps last",()=>{
 const rows=[{membershipId:"b",name:"Beta",updatedAt:null},{membershipId:"a",name:"Alpha",updatedAt:"2026-10-14T10:00:00Z"},{membershipId:"c",name:"Gamma",updatedAt:"2026-10-15T10:00:00Z"}];
 expect(sortTpoBatchRegistrationRows(rows,"UPDATED_NEWEST").map(r=>r.membershipId)).toEqual(["c","a","b"]);
 expect(sortTpoBatchRegistrationRows(rows,"UPDATED_OLDEST").map(r=>r.membershipId)).toEqual(["a","c","b"]);
 expect(sortTpoBatchRegistrationRows(rows,"NAME_DESC")[0].name).toBe("Gamma");
 expect(rows[0].membershipId).toBe("b");
 expect(tpoRegistrationSortSchema.safeParse("RANDOM").success).toBe(false);
});
