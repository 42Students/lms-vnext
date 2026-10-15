import {it,expect} from "vitest";
import {searchOwnOffers,learnerOffersSearchSchema} from "@/modules/placements/learner-offers-search-model";
it("searches only already scoped persisted offer rows without mutation",()=>{
 const rows=[{offer:{roleTitle:"SDE 2"},company:{name:"Acme"},job:{title:"Backend Engineer"}},{offer:{roleTitle:"Analyst"},company:{name:"Beta"},job:{title:"Graduate Analyst"}}];
 expect(searchOwnOffers(rows,"ACME")).toEqual([rows[0]]);
 expect(searchOwnOffers(rows,"engineer")).toEqual([rows[0]]);
 expect(rows).toHaveLength(2);
 expect(learnerOffersSearchSchema.safeParse("x".repeat(81)).success).toBe(false);
});
