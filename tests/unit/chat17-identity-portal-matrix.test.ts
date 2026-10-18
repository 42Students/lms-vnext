import { describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { deniedPortalHome, PORTAL_PERMISSION_DENIED } from "@/modules/identity/unauthorized-portal-home";
import { can } from "@/modules/permissions/policy";
import { assignSystemRole, type SystemRoleRepository } from "@/modules/system-roles/service";

const USER="11111111-1111-4111-8111-111111111111";
const OWN="22222222-2222-4222-8222-222222222222";
const FOREIGN="33333333-3333-4333-8333-333333333333";
const ORG="44444444-4444-4444-8444-444444444444";
type MembershipRole = NonNullable<RequestContext["membership"]>["roles"][number];
function actor(options:{
  roles?:MembershipRole[];
  membership?:"ACTIVE"|"SUSPENDED"|"ENDED"|null;
  disabled?:boolean;
  superAdmin?:boolean;
  recruiter?:boolean;
  scoped?:boolean;
}={}):RequestContext {
  return {
    user:{id:USER,identityUid:"lane17-user",platformStatus:options.disabled?"DISABLED":"ACTIVE",
      systemRoles:options.superAdmin?["SUPER_ADMIN"]:[]},
    membership:options.membership===null?null:{
      id:"55555555-5555-4555-8555-555555555555",
      collegeId:OWN,organizationId:ORG,status:options.membership??"ACTIVE",
      roles:options.roles??["LEARNER"]},
    adminScope:options.scoped?{collegeId:OWN,organizationId:ORG}:null,
    recruiter:options.recruiter?{
      userId:USER,companyId:"66666666-6666-4666-8666-666666666666",
      companyName:"Example",title:null,status:"ACTIVE",grants:[{
        id:"77777777-7777-4777-8777-777777777777",
        organizationId:ORG,collegeId:OWN,collegeName:"Test college",
        companyRelationshipId:"88888888-8888-4888-8888-888888888888",
      }],
    }:null,
  };
}
const permissionMatrix=[
  {roles:["LEARNER"] as MembershipRole[],route:"/learn/courses?access=denied",manage:false},
  {roles:["MENTOR"] as MembershipRole[],route:"/mentor/projects?access=denied",manage:false},
  {roles:["FACULTY"] as MembershipRole[],route:"/teacher/courses?access=denied",manage:false},
  {roles:["TPO"] as MembershipRole[],route:"/tpo/home?access=denied",manage:false},
  {roles:["COLLEGE_ADMIN"] as MembershipRole[],route:"/college?access=denied",manage:true},
];

describe("WEAK-identity role-journey denied portal and project scope matrix",()=>{
  it.each(permissionMatrix)("WEAK-identity-04 $route home is scoped and never grants foreign Projects writes",({roles,route,manage})=>{
    const context=actor({roles});
    expect(deniedPortalHome(context)).toBe(route);
    expect(can(context,"projects.read",{collegeId:OWN,organizationId:ORG})).toBe(true);
    expect(can(context,"projects.read",{collegeId:FOREIGN,organizationId:ORG})).toBe(false);
    expect(can(context,"projects.manage",{collegeId:OWN,organizationId:ORG})).toBe(manage);
    expect(can(context,"projects.manage",{collegeId:FOREIGN,organizationId:ORG})).toBe(false);
  });

  it("WEAK-identity-05 disabled, ended, absent and suspended account contexts never redirect into a role portal",()=>{
    for(const status of ["SUSPENDED","ENDED"] as const){
      expect(deniedPortalHome(actor({roles:["COLLEGE_ADMIN"],membership:status})))
        .toBe("/dashboard?access=denied");
      expect(can(actor({roles:["COLLEGE_ADMIN"],membership:status}),"projects.manage",
        {collegeId:OWN})).toBe(false);
    }
    expect(deniedPortalHome(actor({roles:["MENTOR"],disabled:true})))
      .toBe("/dashboard?access=denied");
    expect(deniedPortalHome(actor({membership:null}))).toBe("/dashboard?access=denied");
    expect(PORTAL_PERMISSION_DENIED).toMatch(/don't have permission/);
  });

  it("WEAK-identity-06 multiple roles resolve in documented priority without promoting to Super Admin",()=>{
    expect(deniedPortalHome(actor({roles:["LEARNER","MENTOR"]})))
      .toBe("/mentor/projects?access=denied");
    expect(deniedPortalHome(actor({roles:["MENTOR","TPO"]})))
      .toBe("/tpo/home?access=denied");
    expect(deniedPortalHome(actor({roles:["FACULTY","COLLEGE_ADMIN"]})))
      .toBe("/college?access=denied");
    expect(deniedPortalHome(actor({superAdmin:true,membership:null})))
      .toBe("/admin/tenants?access=denied");
    expect(deniedPortalHome(actor({recruiter:true,membership:null})))
      .toBe("/hr/home?access=denied");
    expect(can(actor({roles:["COLLEGE_ADMIN"]}),"system-role.manage")).toBe(false);
  });

  it("WEAK-system-roles-04 super admin global assignment cannot occur from scoped/stale roles",async()=>{
    const repo: SystemRoleRepository={
      persistBootstrapUser:vi.fn(async()=>{throw Error("unexpected bootstrap");}),
      loadUser:vi.fn(async()=>({id:USER,platformStatus:"ACTIVE" as const})),
      assignRole:vi.fn(async()=>["SUPER_ADMIN" as const]),
    };
    for(const context of [
      actor({superAdmin:true,scoped:true,membership:null}),
      actor({roles:["COLLEGE_ADMIN"]}),
      actor({superAdmin:true,disabled:true,membership:null}),
    ]){
      await expect(assignSystemRole(context,{userId:USER,role:"SUPER_ADMIN"},repo))
        .rejects.toThrow();
    }
    expect(repo.loadUser).not.toHaveBeenCalled();
    expect(repo.assignRole).not.toHaveBeenCalled();
    expect(can(actor({superAdmin:true,membership:null}),"system-role.manage")).toBe(true);
    expect(can(actor({superAdmin:true,scoped:true,membership:null}),"system-role.manage")).toBe(false);
  });

  it("WEAK-identity-07 acting-superadmin college scope cannot read a foreign college's Projects",()=>{
    const context=actor({superAdmin:true,scoped:true,membership:null});
    expect(can(context,"projects.manage",{collegeId:OWN,organizationId:ORG})).toBe(true);
    expect(can(context,"projects.manage",{collegeId:FOREIGN,organizationId:ORG})).toBe(false);
    expect(can(context,"projects.manage",{collegeId:OWN,organizationId:FOREIGN})).toBe(false);
    expect(can(context,"system-role.manage")).toBe(false);
  });
});
