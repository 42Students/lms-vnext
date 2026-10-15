import { describe, expect, it } from "vitest";
import { derivePlacementLateralEntry } from "@/modules/placements/eligibility-service";

describe("P-S2-03 lateral/diploma eligibility derived evidence",()=>{
  it("honours explicit lateral entry even if 12th marks exist",()=>{
    expect(derivePlacementLateralEntry({
      isLateralEntry:true,diplomaPctBasisPoints:null,twelfthPctBasisPoints:7000
    })).toBe(true);
  });
  it("derives lateral from diploma with no 12th",()=>{
    expect(derivePlacementLateralEntry({
      isLateralEntry:false,diplomaPctBasisPoints:6700,twelfthPctBasisPoints:null
    })).toBe(true);
  });
  it("does not fabricate lateral when diploma is missing or 12th exists",()=>{
    expect(derivePlacementLateralEntry(null)).toBe(false);
    expect(derivePlacementLateralEntry({
      isLateralEntry:false,diplomaPctBasisPoints:6700,twelfthPctBasisPoints:8200
    })).toBe(false);
  });
});
