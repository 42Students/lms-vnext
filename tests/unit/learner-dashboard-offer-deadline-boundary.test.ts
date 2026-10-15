import {describe,expect,it} from "vitest";
import {learnerPlacementDashboard} from "@/modules/placements/learner-dashboard-model";
const now=new Date("2026-10-15T12:00:00.000Z");
const empty={jobs:[],applications:[],rounds:[],offers:[]};
describe("learner dashboard offer-response boundary",()=>{
 it("excludes exactly expired, past-expiry, malformed and resolved offers",()=>{
  const state=learnerPlacementDashboard({...empty,offers:[
   {status:"ISSUED",expiresAt:new Date("2026-10-15T12:00:00.000Z")},
   {status:"ISSUED",expiresAt:new Date("2026-10-15T11:59:59.999Z")},
   {status:"ISSUED",expiresAt:new Date("invalid")},
   {status:"ACCEPTED",expiresAt:null},
   {status:"ISSUED",expiresAt:new Date("2026-10-15T12:00:00.001Z")},
   {status:"ISSUED",expiresAt:null},
  ]},now);
  expect(state.activeOfferCount).toBe(2);
 });
 it("does not infer actionable offers from corrupted historical deadline values",()=>{
  expect(learnerPlacementDashboard({...empty,offers:[
   {status:"ISSUED",expiresAt:new Date("invalid")},
  ]},now).activeOfferCount).toBe(0);
 });
});