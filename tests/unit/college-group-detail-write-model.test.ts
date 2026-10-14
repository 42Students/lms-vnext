import {describe,it,expect} from "vitest";
import {collegeGroupDetailWriteSchema,collegeGroupDetailActionLabel,collegeWaitlistPromotionBlocker}
  from "@/modules/groups/college-group-detail-write-model";
const a="10000000-0000-4000-8000-000000000001";
describe("College Group waitlist and rule writes",()=>{
  it("preserves FIFO, capacity, locks and active learner eligibility",()=>{
    const ready={accountStatus:"ACTIVE",membershipStatus:"ACTIVE",state:"WAITLISTED",
      memberType:"LEARNER",locked:false,memberVersion:1,expectedMemberVersion:1,
      firstInQueue:true,capacity:1,activeCount:0};
    expect(collegeWaitlistPromotionBlocker(ready)).toBeNull();
    for(const patch of [{accountStatus:"DISABLED"},{membershipStatus:"SUSPENDED"},
      {state:"REMOVED"},{memberType:"MENTOR"},{locked:true}])
      expect(collegeWaitlistPromotionBlocker({...ready,...patch})).toBe("MEMBER_NOT_FOUND");
    expect(collegeWaitlistPromotionBlocker({...ready,expectedMemberVersion:0})).toBe("MEMBER_STALE");
    expect(collegeWaitlistPromotionBlocker({...ready,firstInQueue:false})).toBe("WAITLIST_OUT_OF_ORDER");
    expect(collegeWaitlistPromotionBlocker({...ready,activeCount:1})).toBe("GROUP_CAPACITY_FULL");
    expect(collegeWaitlistPromotionBlocker({...ready,capacity:null,activeCount:1000})).toBeNull();
  });
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
