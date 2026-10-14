import {describe,expect,it} from "vitest";
import {learnerExpiringOffer} from "@/modules/placements/learner-dashboard-offer-priority-model";
const now=Date.parse("2026-10-14T00:00:00Z");
describe("actionable learner offer urgency",()=>{
  it("selects only the earliest still-actionable issued offer within 24 hours",()=>{
    const soon=new Date(now+60*60*1000);
    expect(learnerExpiringOffer([
      {status:"ACCEPTED",expiresAt:new Date(now+10)},
      {status:"ISSUED",expiresAt:new Date(now-1)},
      {status:"ISSUED",expiresAt:new Date(now+48*60*60*1000)},
      {status:"ISSUED",expiresAt:soon},
    ],now)).toEqual({expiresAt:soon});
  });
  it("does not fabricate urgency from a missing expiry, expired or declined offer",()=>{
    expect(learnerExpiringOffer([
      {status:"ISSUED",expiresAt:null},
      {status:"DECLINED",expiresAt:new Date(now+5000)},
    ],now)).toBeNull();
  });
});