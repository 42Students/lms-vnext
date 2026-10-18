import {describe,expect,it} from "vitest";
import {
  verifiedMembershipRoleReceipt,
  verifiedMembershipLifecycleReceipt,
} from "@/modules/people/membership-action-receipt";

describe("SA-PEOPLE-BREAK-01 membership mutation response integrity",()=>{
  it("accepts persisted role grant and revoke receipts only after the intended role transition",()=>{
    expect(verifiedMembershipRoleReceipt({
      roles:["FACULTY","MENTOR"],
    },"MENTOR",false)).toEqual(["FACULTY","MENTOR"]);
    expect(verifiedMembershipRoleReceipt({
      roles:["FACULTY"],
    },"MENTOR",true)).toEqual(["FACULTY"]);
    expect(verifiedMembershipRoleReceipt({
      roles:["FACULTY","COLLEGE_ADMIN"],
    },"COLLEGE_ADMIN",false)).toEqual(["FACULTY","COLLEGE_ADMIN"]);
  });

  it("rejects 200 OK HTML, missing role arrays, duplicate roles, invalid roles and empty role lists",()=>{
    for(const raw of [null,undefined,"ok",{},{"roles":null},{"roles":[]},
      {"roles":"COLLEGE_ADMIN"},{"roles":["MENTOR","MENTOR"]},
      {"roles":["FACULTY","SUPER_ADMIN"]},{"roles":["MENTOR",null]}]){
      expect(verifiedMembershipRoleReceipt(raw,"MENTOR",false)).toBeNull();
    }
  });

  it("does not falsely report a grant or revoke if the server returned unchanged roles",()=>{
    expect(verifiedMembershipRoleReceipt({roles:["FACULTY"]},"MENTOR",false)).toBeNull();
    expect(verifiedMembershipRoleReceipt({roles:["FACULTY","MENTOR"]},"MENTOR",true)).toBeNull();
    expect(verifiedMembershipRoleReceipt({roles:["FACULTY"]},"COLLEGE_ADMIN",false)).toBeNull();
    expect(verifiedMembershipRoleReceipt({roles:["FACULTY","COLLEGE_ADMIN"]},"COLLEGE_ADMIN",true)).toBeNull();
  });

  it("validates every lifecycle response against its requested action and not the former UI status",()=>{
    const wrapped=(status:string)=>({person:{membership:{status}}});
    expect(verifiedMembershipLifecycleReceipt(wrapped("SUSPENDED"),"SUSPEND")).toBe("SUSPENDED");
    expect(verifiedMembershipLifecycleReceipt(wrapped("ACTIVE"),"REACTIVATE")).toBe("ACTIVE");
    expect(verifiedMembershipLifecycleReceipt(wrapped("ENDED"),"END")).toBe("ENDED");
    expect(verifiedMembershipLifecycleReceipt(wrapped("ACTIVE"),"SUSPEND")).toBeNull();
    expect(verifiedMembershipLifecycleReceipt(wrapped("SUSPENDED"),"END")).toBeNull();
    expect(verifiedMembershipLifecycleReceipt(wrapped("ENDED"),"REACTIVATE")).toBeNull();
  });

  it("does not turn an absent or malformed backend response into a misleading success",()=>{
    for(const raw of [null,undefined,{},{person:null},{person:{}},
      {person:{membership:null}},{person:{membership:{}}},
      {person:{membership:{status:"DELETED"}}},
      {person:{membership:{status:0}}},
    ]){
      expect(verifiedMembershipLifecycleReceipt(raw,"END")).toBeNull();
    }
  });
});
