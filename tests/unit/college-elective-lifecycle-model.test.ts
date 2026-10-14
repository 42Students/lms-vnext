import {describe,expect,it} from "vitest";
import {electiveLifecycleSchema,electiveLifecyclePrompt}
  from "@/modules/electives/college-elective-lifecycle-model";
describe("College elective slot lifecycle",()=>{
  it("requires confirmation and strict optimistic integer version",()=>{
    const good={action:"ARCHIVE",expectedVersion:0,confirm:true};
    expect(electiveLifecycleSchema.parse(good)).toEqual(good);
    for(const input of [{...good,confirm:false},{...good,expectedVersion:-1},
      {...good,collegeId:"forged"},{...good,action:"FINALIZE"}])
      expect(electiveLifecycleSchema.safeParse(input).success).toBe(false);
  });
  it("does not imply finalization exists",()=>{
    expect(electiveLifecyclePrompt("Math","ARCHIVE")).toContain("offerings");
    expect(electiveLifecyclePrompt("Math","RESTORE")).toContain("program");
  });
});
