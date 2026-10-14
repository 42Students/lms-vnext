import {describe,expect,it} from "vitest";
import {collegeOfferingLifecycleSchema,offeringLifecycleConfirmation}
  from "@/modules/courses/college-offering-lifecycle-model";
describe("College offering lifecycle model",()=>{
  it("requires confirmation and optimistic state without foreign selector",()=>{
    expect(collegeOfferingLifecycleSchema.parse({
      action:"ARCHIVE",expectedStatus:"ACTIVE",confirm:true,
    }).action).toBe("ARCHIVE");
    for(const invalid of [
      {action:"RESTORE",expectedStatus:"ACTIVE",confirm:true},
      {action:"ARCHIVE",expectedStatus:"ACTIVE",confirm:false},
      {action:"RESTORE",expectedStatus:"ARCHIVED",confirm:true,collegeId:"fake"},
    ])expect(collegeOfferingLifecycleSchema.safeParse(invalid).success).toBe(false);
  });
  it("explains dependency and restore eligibility",()=>{
    expect(offeringLifecycleConfirmation("Math","ARCHIVE")).toContain("deliveries");
    expect(offeringLifecycleConfirmation("Math","RESTORE")).toContain("eligible");
  });
});
