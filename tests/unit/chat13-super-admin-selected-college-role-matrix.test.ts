import {describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
vi.mock("server-only",()=>({}));
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";

const base:RequestContext={
  user:{id:"admin",identityUid:"id-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  adminScope:{organizationId:"org-a",collegeId:"college-a"},
  membership:null,
};

describe("SA-ADMIN-SELECTED-COLLEGE-11 tenant/role matrix for every Super Admin placement directory",()=>{
  it("returns exactly the selected college and organization, regardless of unrelated account memberships",()=>{
    const dual:RequestContext={...base,membership:{
      id:"member-b",collegeId:"college-b",organizationId:"org-b",status:"ACTIVE",roles:["COLLEGE_ADMIN"],
    }};
    expect(requireSuperAdminSelectedCollege(dual,"placements.read")).toEqual({
      collegeId:"college-a",organizationId:"org-a",
    });
    expect(requireSuperAdminSelectedCollege(base,"placements.manage")).toEqual({
      collegeId:"college-a",organizationId:"org-a",
    });
  });
  it("denies missing college, disabled user, College Admin-only, TPO-only and forged selected IDs",()=>{
    const cases:RequestContext[]=[
      {...base,adminScope:null},
      {...base,adminScope:{organizationId:"org-a",collegeId:null}},
      {...base,user:{...base.user,platformStatus:"DISABLED"}},
      {...base,user:{...base.user,systemRoles:[]}},
      {...base,user:{...base.user,systemRoles:[]},membership:{
        id:"member-a",collegeId:"college-a",organizationId:"org-a",status:"ACTIVE",roles:["COLLEGE_ADMIN"],
      }},
      {...base,user:{...base.user,systemRoles:[]},membership:{
        id:"tpo-a",collegeId:"college-a",organizationId:"org-a",status:"ACTIVE",roles:["TPO"],
      }},
    ];
    for(const actor of cases)expect(()=>requireSuperAdminSelectedCollege(actor,"placements.read"))
      .toThrow(/Missing permission/);
  });
});
