import { describe, expect, it } from "vitest";
import { learnerOfferDecisionDraftSchema,learnerOfferDecisionReady } from "@/modules/placements/learner-offer-decision-model";
const id="81818181-8181-4818-8818-818181818181";
const offer={offerId:id,companyName:"Co",roleTitle:"Developer",jobTitle:"Drive",annualCtcInr:1000000,joiningDate:null,expiresAt:"2026-11-01T00:00:00Z",status:"ISSUED" as const};
describe("learner offer decision confirmation",()=>{
  it("allows either decision only for an issued unexpired own offer",()=>{
    expect(learnerOfferDecisionReady(offer,{offerId:id,action:"DECLINE",confirmed:true},
      new Date("2026-10-15T00:00:00Z"))).toBe(true);
    expect(learnerOfferDecisionReady({...offer,status:"ACCEPTED"},{offerId:id,action:"ACCEPT",confirmed:true},
      new Date("2026-10-15T00:00:00Z"))).toBe(false);
    expect(learnerOfferDecisionReady(offer,{offerId:id,action:"ACCEPT",confirmed:true},
      new Date("2026-11-02T00:00:00Z"))).toBe(false);
  });
  it("rejects missing confirmation, role spoofing and long decline reasons",()=>{
    expect(learnerOfferDecisionDraftSchema.safeParse({offerId:id,action:"ACCEPT",confirmed:false}).success).toBe(false);
    expect(learnerOfferDecisionDraftSchema.safeParse({offerId:id,action:"DECLINE",confirmed:true,collegeId:id}).success).toBe(false);
    expect(learnerOfferDecisionDraftSchema.safeParse({offerId:id,action:"DECLINE",confirmed:true,reason:"x".repeat(2001)}).success).toBe(false);
  });
});
