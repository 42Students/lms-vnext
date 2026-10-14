import {describe,expect,it} from "vitest";
import {collegeHallCancelSchema,hallCancellationPrompt}
  from "@/modules/academics/college-hall-cancel-model";
describe("Hall cancellation",()=>{
  const good={expectedUpdatedAt:"2026-10-14T12:00:00.123Z",
    reason:"Instructor requested a new date",confirm:true};
  it("requires explanation, confirmation and valid optimistic token",()=>{
    expect(collegeHallCancelSchema.parse(good)).toEqual(good);
    for(const patch of [{confirm:false},{expectedUpdatedAt:"invalid"},
      {reason:"x"},{collegeId:"foreign"}])
      expect(collegeHallCancelSchema.safeParse({...good,...patch}).success).toBe(false);
  });
  it("warns about evidence and auditing",()=>{
    expect(hallCancellationPrompt("Math")).toContain("attendance");
    expect(hallCancellationPrompt("Math")).toContain("audited");
  });
});
