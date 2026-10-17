import {describe,it,expect} from "vitest";
import {learnerWaitingOnYou} from "@/modules/placements/learner-waiting-on-you-model";
describe("LEARNER-placements-04 waiting on you",()=>{
 it("LEARNER-placements-04 includes offer reply and open registration with actionable links",()=>{
  const rows=learnerWaitingOnYou({pendingOffers:1,urgentAssessment:null,urgentInterview:null,nextAction:null,
   registration:{stage:"OPEN",choice:null},eligibleToApply:2,applications:0});
  expect(rows.map(r=>r.key)).toContain("offers");
  expect(rows.map(r=>r.key)).toContain("register");
  expect(rows.find(r=>r.key==="offers")?.href).toContain("/offers");
  expect(rows.find(r=>r.key==="register")?.priority).toBe("URGENT");
 });
 it("LEARNER-placements-04 does not ask an already registered learner to register again",()=>{
  const rows=learnerWaitingOnYou({pendingOffers:0,urgentAssessment:null,urgentInterview:null,nextAction:null,
   registration:{stage:"OPEN",choice:"PLACEMENTS"},eligibleToApply:0,applications:1});
  expect(rows.some(r=>r.key==="register")).toBe(false);
 });
});