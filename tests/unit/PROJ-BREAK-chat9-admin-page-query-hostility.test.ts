import {describe, expect, it} from "vitest";
import {parseProjectAdminRiskQuery} from "@/modules/projects/admin-risk-query-model";
import {parseProjectAdminSubmissionsQuery} from "@/modules/projects/admin-submissions-query-model";

describe("IIT Dharwad Projects: college and Super Admin page URL hostility",()=>{
  it("PROJ-BREAK-ux-19 accepts the intended risk controls without changing pagination or status",()=>{
    expect(parseProjectAdminRiskQuery({})).toMatchObject({
      success:true, data:{page:1,pageSize:25},
    });
    expect(parseProjectAdminRiskQuery({
      riskBucket:"BLOCKER",riskSort:"SEVERITY",q:"  Dharwad  ",
      status:"ACTIVE",page:"2",pageSize:"50",
    })).toMatchObject({
      success:true,
      data:{riskBucket:"BLOCKER",riskSort:"SEVERITY",q:"Dharwad",status:"ACTIVE",page:2,pageSize:50},
    });
    // Empty form selectors remain intentionally optional.
    expect(parseProjectAdminRiskQuery({q:"",status:""}).success).toBe(true);
  });

  it("PROJ-BREAK-ux-19 rejects duplicate, undisclosed and nondecimal risk filters before querying",()=>{
    for(const params of [
      {page:"0x10"},{page:"1e2"},{page:"1.0"},{page:"+1"},
      {page:""},{page:" "},{page:"Infinity"},{page:"100001"},
      {pageSize:""},{pageSize:"1e2"},{pageSize:"0"},{pageSize:"101"},
      {pageSize:" 50"},{riskBucket:"INJECTED"},
      {q:"x".repeat(121)}, {page:["1","2"]},
      {status:["ACTIVE","ARCHIVED"]},{search:"cross-tenant"},
    ]){
      expect(parseProjectAdminRiskQuery(params).success,JSON.stringify(params)).toBe(false);
    }
  });

  it("PROJ-BREAK-ux-20 accepts documented submissions views and the unchanged customer filters",()=>{
    expect(parseProjectAdminSubmissionsQuery({})).toMatchObject({
      success:true,data:{view:"ALL",page:1,pageSize:25},
    });
    expect(parseProjectAdminSubmissionsQuery({
      view:"NOT_SUBMITTED",q:"  workspaces ",status:"ACTIVE",
      submissionStatus:"UNDER_REVIEW",page:"3",pageSize:"100",
    })).toMatchObject({
      success:true,
      data:{view:"NOT_SUBMITTED",q:"workspaces",status:"ACTIVE",
        submissionStatus:"UNDER_REVIEW",page:3,pageSize:100},
    });
    expect(parseProjectAdminSubmissionsQuery({q:"",submissionStatus:""}).success).toBe(true);
  });

  it("PROJ-BREAK-ux-20 rejects multiple interpretations of submissions-page URLs",()=>{
    for(const params of [
      {page:"0x10"},{page:"1e3"},{page:"1.0"},{page:"-1"},
      {page:""},{page:" "},{page:"NaN"},{page:"100001"},
      {pageSize:""},{pageSize:"1e2"},{pageSize:"9"},{pageSize:"101"},
      {view:"NOT_SUBMITTED",page:["1","4"]},
      {submissionStatus:["SUBMITTED","APPROVED"]},
      {submissionStatus:"FORGED"},{q:"y".repeat(121)},
      {fromMentorId:"other-college"},
    ]){
      expect(parseProjectAdminSubmissionsQuery(params).success,JSON.stringify(params)).toBe(false);
    }
  });
});
