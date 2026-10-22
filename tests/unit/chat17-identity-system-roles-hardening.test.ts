import { describe, expect, it, vi } from "vitest";
import {
  isSuperAdmin, hasMembershipRole, hasActiveMembership, hasActiveRecruiter,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  assignSystemRole, assignSystemRoleInputSchema, bootstrapSuperAdminInputSchema,
  type SystemRoleRepository,
} from "@/modules/system-roles/service";

const USER="22222222-2222-4222-8222-222222222222";
const COLLEGE="33333333-3333-4333-8333-333333333333";
const MEMBER="44444444-4444-4444-8444-444444444444";
function context(options: {
  status?: "ACTIVE"|"DISABLED";
  membership?: "ACTIVE"|"SUSPENDED"|"ENDED"|null;
  roles?: ("COLLEGE_ADMIN"|"TPO"|"LEARNER"|"MENTOR")[];
  superAdmin?: boolean;
  recruiter?: boolean;
  scope?: boolean;
} = {}): RequestContext {
  return {
    user:{id:USER,identityUid:"test-user",platformStatus:options.status??"ACTIVE",
      systemRoles:options.superAdmin?["SUPER_ADMIN"]:[]},
    membership:options.membership === null ? null : {
      id:MEMBER, collegeId:COLLEGE, organizationId:"55555555-5555-4555-8555-555555555555",
      status:options.membership??"ACTIVE", roles:options.roles??["COLLEGE_ADMIN"]
    },
    adminScope:options.scope?{collegeId:COLLEGE,organizationId:"55555555-5555-4555-8555-555555555555"}:null,
    recruiter:options.recruiter?{
      userId:USER,companyId:"66666666-6666-4666-8666-666666666666",
      companyName:"Example",title:null,status:"ACTIVE",grants:[]
    }:null,
  };
}
const makeRepo = () => {
  const loadUser=vi.fn(async(_id:string)=>({id:USER,platformStatus:"ACTIVE" as const}));
  const assignRole=vi.fn(async()=>["SUPER_ADMIN" as const]);
  return { loadUser,assignRole,
    persistBootstrapUser:vi.fn(async()=>{throw new Error("unused");})
  } satisfies SystemRoleRepository;
};

describe("WEAK-identity and system-roles: stale membership, disabled actors and role escalation",()=>{
  it("WEAK-identity-01 disabled user NEVER gains membership role from stale active membership",()=>{
    const disabled=context({status:"DISABLED",membership:"ACTIVE",roles:["COLLEGE_ADMIN"]});
    expect(hasMembershipRole(disabled,"COLLEGE_ADMIN")).toBe(false);
    expect(hasActiveMembership(disabled)).toBe(false);
    expect(isSuperAdmin({...disabled,user:{...disabled.user,systemRoles:["SUPER_ADMIN"]}})).toBe(false);
    expect(hasActiveRecruiter({...disabled,recruiter:context({recruiter:true}).recruiter})).toBe(false);
  });
  it.each(["SUSPENDED","ENDED"] as const)("WEAK-identity-02 %s members are always denied even with stale role arrays",status=>{
    const actor=context({membership:status,roles:["TPO"]});
    expect(hasMembershipRole(actor,"TPO")).toBe(false);
    expect(hasActiveMembership(actor)).toBe(false);
    expect(isSuperAdmin(actor)).toBe(false);
  });
  it("WEAK-identity-03 active role, valid SA, recruiter and null contexts are differentiated",()=>{
    expect(hasMembershipRole(context({roles:["LEARNER"]}),"LEARNER")).toBe(true);
    expect(hasMembershipRole(context({roles:["LEARNER"]}),"TPO")).toBe(false);
    expect(hasMembershipRole(null,"TPO")).toBe(false);
    expect(hasActiveMembership(undefined)).toBe(false);
    expect(isSuperAdmin(context({superAdmin:true,membership:null}))).toBe(true);
    expect(hasActiveRecruiter(context({recruiter:true,membership:null}))).toBe(true);
  });
  it("WEAK-system-roles-01 only unscoped active SA can assign a valid system role",async()=>{
    const repo=makeRepo();
    await expect(assignSystemRole(context({superAdmin:true,membership:null}),{
      userId:USER,role:"SUPER_ADMIN"
    },repo)).resolves.toEqual(["SUPER_ADMIN"]);
    expect(repo.loadUser).toHaveBeenCalledOnce();
    expect(repo.assignRole).toHaveBeenCalledWith(USER,"SUPER_ADMIN",
      expect.objectContaining({adminScope:null,user:expect.objectContaining({id:USER})}));
    await expect(assignSystemRole(context({superAdmin:true,scope:true}),{
      userId:USER,role:"SUPER_ADMIN"
    },repo)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(assignSystemRole(context({roles:["COLLEGE_ADMIN"]}),{
      userId:USER,role:"SUPER_ADMIN"
    },repo)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(assignSystemRole(context({superAdmin:true,status:"DISABLED",membership:null}),{
      userId:USER,role:"SUPER_ADMIN"
    },repo)).rejects.toBeInstanceOf(AuthorizationError);
    expect(repo.assignRole).toHaveBeenCalledTimes(1);
  });
  it("WEAK-system-roles-02 disabled, deleted and malformed TARGETS are rejected before writes",async()=>{
    const repo=makeRepo();
    repo.loadUser.mockResolvedValueOnce(null as never);
    await expect(assignSystemRole(context({superAdmin:true,membership:null}),{
      userId:USER,role:"SUPER_ADMIN"
    },repo)).rejects.toMatchObject({code:"USER_NOT_FOUND"});
    repo.loadUser.mockResolvedValueOnce({id:USER,platformStatus:"DISABLED"} as never);
    await expect(assignSystemRole(context({superAdmin:true,membership:null}),{
      userId:USER,role:"SUPER_ADMIN"
    },repo)).rejects.toMatchObject({code:"USER_DISABLED"});
    await expect(assignSystemRole(context({superAdmin:true,membership:null}),{
      userId:"not-uuid",role:"SUPER_ADMIN"
    },repo)).rejects.toThrow();
    await expect(assignSystemRole(context({superAdmin:true,membership:null}),{
      userId:USER,role:"COLLEGE_ADMIN"
    },repo)).rejects.toThrow();
    expect(repo.assignRole).not.toHaveBeenCalled();
  });
  it("WEAK-system-roles-03 bootstrap/assign schemas fail closed and drop unknown role keys",()=>{
    expect(assignSystemRoleInputSchema.safeParse({userId:USER,role:"SUPER_ADMIN"}).success).toBe(true);
    expect(assignSystemRoleInputSchema.safeParse({userId:USER,role:"TPO"}).success).toBe(false);
    expect(bootstrapSuperAdminInputSchema.safeParse({
      phoneE164:"+919123456789",email:"admin@example.test",displayName:"Test Admin"
    }).success).toBe(true);
    expect(bootstrapSuperAdminInputSchema.safeParse({
      phoneE164:"12",email:"bad",displayName:""
    }).success).toBe(false);
  });
});
