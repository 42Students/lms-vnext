import {it,expect} from "vitest";
import {ownOffersDueWithinWeek as f} from "@/modules/placements/learner-offers-due-model";
it("only includes issued own offers with a recorded future deadline within one week",()=>{
 const now=Date.parse("2026-10-15T00:00:00Z");
 const x=(status:string,days:number|null)=>({offer:{status,expiresAt:days===null?null:new Date(now+days*86400000)}});
 const rows=[x("ISSUED",7),x("ISSUED",0),x("ACCEPTED",1),x("ISSUED",8),x("ISSUED",null)];
 expect(f(rows,now)).toEqual([rows[0]]);
});
