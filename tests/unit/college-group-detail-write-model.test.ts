import {describe,it,expect} from "vitest";
import {collegeGroupDetailWriteSchema,collegeGroupDetailActionLabel}
  from "@/modules/groups/college-group-detail-write-model";
const a="10000000-0000-4000-8000-000000000001";
describe("College Group waitlist and rule writes",()=>{
  it("requires both group and member optimistic versions for promotion",()=>{
    const valid={action:"PROMOTE_WAITLIST",memberId:a,expectedGroupVersion:1,
      expectedMemberVersion:0,confirm:true};
    expect(collegeGroupDetailWriteSchema.parse(valid)).toEqual(valid);
    for(const change of [{expectedGroupVersion:-1},{expectedMemberVersion:-1},
      {confirm:false},{collegeId:a}])
      expect(collegeGroupDetailWriteSchema.safeParse({...valid,...change}).success).toBe(false);
  });
  it("rejects empty, unsupported or unscoped rule criteria",()=>{
    const valid={action:"SAVE_RULE",expectedGroupVersion:0,confirm:true,
      autoRefresh:false,criteria:{allowedPassingYears:[2028]}};
    expect(collegeGroupDetailWriteSchema.safeParse(valid).success).toBe(true);
    for(const criteria of [{},{allowedPassingYears:[]},{allowedPassingYears:[2028],foreignFlag:true}])
      expect(collegeGroupDetailWriteSchema.safeParse({...valid,criteria}).success).toBe(false);
  });
  it("explains that saving a rule is not automatically running it",()=>{
    expect(collegeGroupDetailActionLabel("SAVE_RULE")).toContain("does not immediately refresh");
    expect(collegeGroupDetailActionLabel("PROMOTE_WAITLIST")).toContain("first waitlisted");
  });
});
