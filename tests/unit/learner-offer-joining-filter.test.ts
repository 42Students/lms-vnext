import {it,expect} from "vitest";
import {filterOwnOffersByJoining as f,learnerJoiningFilterSchema as s} from "@/modules/placements/learner-offer-joining-filter-model";
it("does not infer joining from offer acceptance",()=>{
 const rows=[{joining:null,offer:{status:"ACCEPTED"}},{joining:{status:"PENDING"},offer:{status:"ACCEPTED"}},{joining:{status:"JOINED"},offer:{status:"ACCEPTED"}}];
 expect(f(rows,"joined")).toEqual([rows[2]]);
 expect(f(rows,"all")).toHaveLength(3);
 expect(s.safeParse("accepted").success).toBe(false);
});
