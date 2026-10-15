import {describe,it,expect} from "vitest";
import {readinessOverrideInputSchema,effectiveProjectSubmissionReady} from "@/modules/projects/readiness-override-model";
import {readFileSync} from "node:fs";
const files=["readiness-override-service.ts","submission-service.ts","readiness-service.ts"].map(n=>readFileSync(new URL("../../src/modules/projects/"+n,import.meta.url),"utf8"));
describe("PR-S2-05 admin submission readiness override",()=>{
  it("requires explanatory notes except for clearing",()=>{
    expect(readinessOverrideInputSchema.safeParse({state:"FORCE_UNLOCK",note:"Manual review"}).success).toBe(true);
    expect(readinessOverrideInputSchema.safeParse({state:"FORCE_BLOCK",note:" "}).success).toBe(false);
    expect(readinessOverrideInputSchema.safeParse({state:"CLEAR"}).success).toBe(true);
    expect(readinessOverrideInputSchema.safeParse({state:"CLEAR",note:"no"}).success).toBe(false);
  });
  it("handles both override directions without lying about raw completion",()=>{
    expect(effectiveProjectSubmissionReady(false,"FORCE_UNLOCK")).toBe(true);
    expect(effectiveProjectSubmissionReady(true,"FORCE_BLOCK")).toBe(false);
    expect(effectiveProjectSubmissionReady(false,"CLEAR")).toBe(false);
  });
  it("uses college-scoped audited events and enforces the decision in submission transaction",()=>{
    expect(files[0]).toContain("ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN");
    expect(files[0]).toContain("eq(activityEvents.collegeId,collegeId)");
    expect(files[1]).toContain("effectiveProjectSubmissionReady(");
    expect(files[2]).toContain("effectiveProjectSubmissionReady(");
  });
});
