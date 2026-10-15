import {expect,it} from "vitest";
import {searchOwnOffers,learnerOffersSearchSchema} from "@/modules/placements/learner-offers-search-model";
it("searches only already-visible own offers with folded whitespace and case",()=>{
 const rows=[{id:"a",offer:{roleTitle:"Backend Engineer"},company:{name:"Example  Industries"},job:{title:"Campus Recruit"}},
 {id:"b",offer:{roleTitle:"Designer"},company:{name:"Other"},job:{title:"Intern"}}];
 expect(searchOwnOffers(rows,"  EXAMPLE  industries ").map(x=>x.id)).toEqual(["a"]);
 expect(searchOwnOffers(rows,"BACKEND\tENGINEER").map(x=>x.id)).toEqual(["a"]);
 expect(searchOwnOffers(rows,"private")).toEqual([]);
 expect(learnerOffersSearchSchema.safeParse("x".repeat(81)).success).toBe(false);
});
