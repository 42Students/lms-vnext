import {describe,it,expect} from "vitest";
import {collegeBatchRetireSchema,batchRetirementPrompt}
  from "@/modules/academics/college-batch-retire-model";
describe("Planned batch removal contract",()=>{
  it("requires explicit confirmation and a precision-safe optimistic token",()=>{
    expect(collegeBatchRetireSchema.parse({
      expectedUpdatedAt:"2026-10-14T12:00:00.123Z",confirm:true,
    }).confirm).toBe(true);
    for(const value of [{confirm:false},{expectedUpdatedAt:"not-a-date"},{collegeId:"fake"}])
      expect(collegeBatchRetireSchema.safeParse({
        expectedUpdatedAt:"2026-10-14T12:00:00.123Z",confirm:true,...value,
      }).success).toBe(false);
  });
  it("states archival and dependency behavior instead of pretending hard deletion",()=>{
    expect(batchRetirementPrompt("Batch A")).toContain("archives");
    expect(batchRetirementPrompt("Batch A")).toContain("progression");
  });
});
