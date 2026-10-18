import { describe, expect, it } from "vitest";
import {
  canReleaseAnotherHeldOffer,
  minimumOfferResponseDeadline,
} from "@/modules/placements/offer-college-rules-policy";

describe("P-S1-01/P-S1-05 college-held-offer policy", () => {
  it("allows the first offer but requires the configured uplift past the cap", () => {
    const base = {
      maxHeldOffers: 1, upliftPct: 40, isDreamDrive: false,
      heldOffers: [{ annualCtcInr: 500_000 }],
    };
    expect(canReleaseAnotherHeldOffer({ ...base, heldOffers: [], annualCtcInr: null })).toBe(true);
    expect(canReleaseAnotherHeldOffer({ ...base, annualCtcInr: 699_999 })).toBe(false);
    expect(canReleaseAnotherHeldOffer({ ...base, annualCtcInr: 700_000 })).toBe(true);
    expect(canReleaseAnotherHeldOffer({ ...base, annualCtcInr: null })).toBe(false);
  });

  it("uses the highest held CTC and respects dream-drive exceptions", () => {
    const base = {
      maxHeldOffers: 2, upliftPct: 20, isDreamDrive: false,
      heldOffers: [{ annualCtcInr: 300_000 }, { annualCtcInr: 900_000 }],
    };
    expect(canReleaseAnotherHeldOffer({ ...base, annualCtcInr: 900_000 })).toBe(false);
    expect(canReleaseAnotherHeldOffer({ ...base, annualCtcInr: 1_080_000 })).toBe(true);
    expect(canReleaseAnotherHeldOffer({ ...base, isDreamDrive: true, annualCtcInr: null })).toBe(true);
    expect(canReleaseAnotherHeldOffer({ ...base, heldOffers: [{ annualCtcInr: null }, { annualCtcInr: null }], annualCtcInr: 800_000 })).toBe(false);
  });
});

describe("PLACEMENTS-HELD-POLICY-29 corrupt persisted policy denial",()=>{
 it("refuses malformed cap/uplift/CTC even for a dream-drive exception",()=>{
  const baseline={
   maxHeldOffers:1,upliftPct:40,isDreamDrive:false,
   heldOffers:[{annualCtcInr:500_000}],annualCtcInr:900_000,
  };
  expect(canReleaseAnotherHeldOffer(baseline)).toBe(true);
  const limits=[0,-1,Infinity,NaN,0.1,Number.MAX_SAFE_INTEGER+1];
  for(const maxHeldOffers of limits){
   expect(canReleaseAnotherHeldOffer({...baseline,maxHeldOffers})).toBe(false);
   expect(canReleaseAnotherHeldOffer({...baseline,maxHeldOffers,isDreamDrive:true})).toBe(false);
  }
  for(const upliftPct of [-1,1001,Infinity,NaN,0.01]){
   expect(canReleaseAnotherHeldOffer({...baseline,upliftPct})).toBe(false);
  }
  for(const annualCtcInr of [-1,0.5,Infinity,NaN,Number.MAX_SAFE_INTEGER+1]){
   expect(canReleaseAnotherHeldOffer({...baseline,annualCtcInr})).toBe(false);
   expect(canReleaseAnotherHeldOffer({...baseline,
      heldOffers:[{annualCtcInr}],annualCtcInr:900_000})).toBe(false);
  }
  expect(canReleaseAnotherHeldOffer({...baseline,annualCtcInr:null,
    heldOffers:[],maxHeldOffers:2})).toBe(true);
  expect(canReleaseAnotherHeldOffer({...baseline,annualCtcInr:null,
    isDreamDrive:true})).toBe(true);
 });
});

describe("P-S2-06 offer response minimum", () => {
  it("uses the configured minimum hours and skips Sunday in IST", () => {
    expect(minimumOfferResponseDeadline(
      new Date("2026-10-16T10:00:00.000Z"), 48,
    ).toISOString()).toBe("2026-10-19T10:00:00.000Z");
    expect(minimumOfferResponseDeadline(
      new Date("2026-10-12T06:30:00.000Z"), 1,
    ).toISOString()).toBe("2026-10-12T07:30:00.000Z");
  });
  it("does not credit partial Sunday hours across midnight in India",()=>{
    // 18 October 2026 23:30 IST is Sunday; the full hour starts Monday 00:00.
    expect(minimumOfferResponseDeadline(
      new Date("2026-10-18T18:00:00.000Z"),1,
    ).toISOString()).toBe("2026-10-18T19:30:00.000Z");
    // Saturday 23:30 IST contributes its first 30 minutes and Monday the rest.
    expect(minimumOfferResponseDeadline(
      new Date("2026-10-17T18:00:00.000Z"),1,
    ).toISOString()).toBe("2026-10-18T19:00:00.000Z");
  });
  it("rejects invalid response rules instead of producing an unsafe deadline", () => {
    expect(() => minimumOfferResponseDeadline(new Date(), 0)).toThrow();
    expect(() => minimumOfferResponseDeadline(new Date(), 1.5)).toThrow();
    expect(() => minimumOfferResponseDeadline(new Date("invalid"), 1)).toThrow();
  });
});

describe("P-S1-05 learner held-offer application boundary", () => {
  it("does not require uplift below the cap", () => {
    expect(canReleaseAnotherHeldOffer({
      maxHeldOffers: 2, upliftPct: 40,
      heldOffers: [{ annualCtcInr: 400_000 }],
      annualCtcInr: null, isDreamDrive: false,
    })).toBe(true);
  });
  it("blocks applications with unknown CTC at the held-offer cap", () => {
    expect(canReleaseAnotherHeldOffer({
      maxHeldOffers: 1, upliftPct: 40,
      heldOffers: [{ annualCtcInr: 400_000 }],
      annualCtcInr: null, isDreamDrive: false,
    })).toBe(false);
  });
});
