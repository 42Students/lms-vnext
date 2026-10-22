import {describe,expect,it} from "vitest";
import {
  legacyBooleanProjectReadinessState,
  readinessOverrideInputSchema,
  effectiveProjectSubmissionReady,
} from "@/modules/projects/readiness-override-model";

describe("legacy nullable readiness override adapter",()=>{
  it("maps all three Boolean states without truthiness coercion",()=>{
    expect(legacyBooleanProjectReadinessState(true)).toBe("FORCE_UNLOCK");
    expect(legacyBooleanProjectReadinessState(false)).toBe("FORCE_BLOCK");
    expect(legacyBooleanProjectReadinessState(null)).toBe("CLEAR");
  });
  it("requires an explicit safe note and rejects malformed controller variants",()=>{
    expect(readinessOverrideInputSchema.safeParse({state:"FORCE_UNLOCK",note:"Approved after review"}).success).toBe(true);
    expect(readinessOverrideInputSchema.safeParse({state:"FORCE_BLOCK",note:"Missing submission"}).success).toBe(true);
    expect(readinessOverrideInputSchema.safeParse({state:"CLEAR"}).success).toBe(true);
    expect(readinessOverrideInputSchema.safeParse({state:"FORCE_UNLOCK"}).success).toBe(false);
    expect(readinessOverrideInputSchema.safeParse({state:"FORCE_UNLOCK",accept:"yes",note:"Approved"}).success).toBe(false);
    expect(readinessOverrideInputSchema.safeParse({state:"CLEAR",note:"unexpected"}).success).toBe(false);
  });
  it("never overrides an already-finalized project",()=>{
    expect(effectiveProjectSubmissionReady(false,"FORCE_UNLOCK",true)).toBe(false);
    expect(effectiveProjectSubmissionReady(true,"FORCE_BLOCK",false)).toBe(false);
  });
});
