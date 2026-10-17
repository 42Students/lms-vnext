import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {learnerPlacementHeroPriority} from "@/modules/placements/learner-dashboard-hero-priority-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-7 learner Placements legacy tabs and hero",()=>{
it("LEARNER-placements-03 has no duplicate heading below shared tab strip",()=>{
 for(const p of ["src/app/(authenticated)/learn/my-placements/applications/page.tsx","src/app/(authenticated)/learn/my-placements/jobs/page.tsx","src/app/(authenticated)/learn/my-placements/schedule/page.tsx","src/app/(authenticated)/learn/my-placements/offers/page.tsx","src/app/(authenticated)/learn/my-placements/placement/page.tsx"]){expect(read(p)).not.toContain("<PageHeader");}
 expect(read("src/app/(authenticated)/learn/my-placements/schedule/page.tsx")).toContain("Your tests, talks and interviews.");
});
it("LEARNER-placements-05 uses persisted registration and offer priority",()=>{
 const base={pendingOffers:0,registration:{stage:"OPEN",choice:null},acceptedOffer:false,fallback:null};
 expect(learnerPlacementHeroPriority({...base,pendingOffers:1})?.label).toBe("You have an offer");
 expect(learnerPlacementHeroPriority(base)?.label).toBe("First step");
 expect(learnerPlacementHeroPriority({...base,registration:{stage:"OPEN",choice:"HIGHER_STUDIES"}})?.label).toBe("You chose higher studies");
 expect(learnerPlacementHeroPriority({...base,registration:{stage:"OPEN",choice:"NOT_INTERESTED"}})?.label).toBe("You are not taking part in placements");
 expect(learnerPlacementHeroPriority({...base,registration:{stage:"CLOSED",choice:"PLACEMENTS"},acceptedOffer:true})?.label).toBe("Congratulations");
 expect(learnerPlacementHeroPriority({...base,registration:{stage:"CLOSED",choice:"PLACEMENTS"}})?.title).toBe("Nothing needs you right now");
 expect(learnerPlacementHeroPriority({...base,registration:null,pendingOffers:null,acceptedOffer:null})).toBeNull();
});
});