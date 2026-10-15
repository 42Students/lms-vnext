import { describe, expect, it } from "vitest";
import { canReapplyWithdrawnPlacementApplication } from "@/modules/placements/application-service";

const ok={sameChannel:true,hasPriorOffer:false,hasPriorRound:false,screeningStatus:"PENDING"};
describe("P-S2-11 audited withdrawn application reapply",()=>{
  it("allows only a prior uncomplicated withdrawal",()=>{
    expect(canReapplyWithdrawnPlacementApplication(ok)).toBe(true);
  });
  it("never silently revives offers, round decisions or reviewed screening",()=>{
    expect(canReapplyWithdrawnPlacementApplication({...ok,hasPriorOffer:true})).toBe(false);
    expect(canReapplyWithdrawnPlacementApplication({...ok,hasPriorRound:true})).toBe(false);
    expect(canReapplyWithdrawnPlacementApplication({...ok,screeningStatus:"SHORTLISTED"})).toBe(false);
    expect(canReapplyWithdrawnPlacementApplication({...ok,sameChannel:false})).toBe(false);
  });
});
