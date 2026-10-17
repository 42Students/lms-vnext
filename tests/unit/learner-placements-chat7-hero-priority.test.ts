import {describe,expect,it} from "vitest";
import {learnerPlacementHeroPriority} from "@/modules/placements/learner-dashboard-hero-priority-model";
import {readFileSync} from "node:fs";
const fallback={label:"Explore",title:"Browse drives",detail:"See eligible roles",href:"/learn/my-placements/jobs",when:null};
describe("learner placements next-action hero",()=>{
 it("LEARNER-placements-05 prioritizes offer over registration and respects a saved accepted offer",()=>{
  const make=(changes:Partial<Parameters<typeof learnerPlacementHeroPriority>[0]>={})=>
   learnerPlacementHeroPriority({pendingOffers:0,registration:{stage:"OPEN",choice:null},acceptedOffer:null,fallback,...changes});
  expect(make({pendingOffers:1})?.href).toBe("/learn/my-placements/offers?status=pending");
  expect(make()?.href).toBe("/learn/my-placements#registration");
  expect(make({registration:{stage:"CLOSED",choice:"PLACEMENTS"},acceptedOffer:true})?.href).toBe("/learn/my-placements/offers");
  expect(make({registration:{stage:"CLOSED",choice:"PLACEMENTS"},acceptedOffer:null})).toEqual(fallback);
  expect(make({registration:null,pendingOffers:null,acceptedOffer:null,fallback:null})).toBeNull();
 });
 it("LEARNER-placements-05 reads accepted offers from scoped server source",()=>{
  const page=readFileSync(new URL("../../src/app/(authenticated)/learn/my-placements/page.tsx",import.meta.url),"utf8");
  expect(page).toContain('acceptedOffer={offerRows?offerRows.some(row=>row.offer.status==="ACCEPTED"):null}');
 });
});
