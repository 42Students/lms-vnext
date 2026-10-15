import {expect,it} from "vitest";
import {browseOwnLearnerOffers} from "@/modules/placements/learner-offers-browse-model";
it("separates declined and placement-withdrawn official offer states without inferring hiring",()=>{
 const issuedAt=new Date("2026-10-15T00:00:00Z");
 const rows=[{offer:{id:"declined",status:"DECLINED",issuedAt}},{offer:{id:"withdrawn",status:"WITHDRAWN",issuedAt}}];
 expect(browseOwnLearnerOffers(rows,"declined").items.map(x=>x.offer.id)).toEqual(["declined"]);
 expect(browseOwnLearnerOffers(rows,"withdrawn").items.map(x=>x.offer.id)).toEqual(["withdrawn"]);
 expect(browseOwnLearnerOffers(rows,"closed").counts.closed).toBe(2);
});
