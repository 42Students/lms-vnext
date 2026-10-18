import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getSuperAdminMembershipDetail } from "@/modules/people/admin-membership-detail-service";
import { projectAdminMembershipDetail } from "@/modules/people/admin-membership-detail-model";
import MembershipDetail from "@/app/(authenticated)/admin/people/directory/[membershipId]/page";

vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/people/admin-membership-detail-service",()=>({
  getSuperAdminMembershipDetail:vi.fn(),
}));
vi.mock("@/components/admin/super-admin-platform-block-action",()=>({
  SuperAdminPlatformBlockAction:({userId}:{userId:string})=><span>GLOBAL_BLOCK:{userId}</span>,
}));
vi.mock("next/navigation",()=>({
  notFound:()=>{throw new Error("NEXT_NOT_FOUND");},
}));

const membershipId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const orgId="33333333-3333-4333-8333-333333333333";
const otherCollege="44444444-4444-4444-8444-444444444444";
const ctx=(college:string|null,organization:string|null)=>({
  user:{id:"admin",identityUid:"platform-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:{collegeId:college,organizationId:organization},
});
const person={
  id:membershipId,userId:"user-of-membership",name:"Example Learner",collegeName:"One College",
  platformStatus:"ACTIVE" as const,membershipStatus:"ACTIVE",
  roles:["LEARNER"],email:"private@example.test",phoneE164:"+919999999999",
  createdAt:new Date("2099-01-01T00:00:00Z"),updatedAt:new Date("2099-01-02T00:00:00Z"),
};
const route={params:Promise.resolve({membershipId})};

beforeEach(()=>{
  vi.resetAllMocks();
  vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx(collegeId,orgId) as never);
});

describe("SA-admin-middle-people-03 person view fails private-contact disclosure tests",()=>{
  it("SA-admin-middle-people-03 an organization/global view cannot infer contact data from a person DTO",()=>{
    const orgView=projectAdminMembershipDetail(person,null,collegeId);
    const wrongCollegeView=projectAdminMembershipDetail(person,otherCollege,collegeId);
    for(const hidden of [orgView,wrongCollegeView]){
      expect(hidden.contactVisible).toBe(false);
      expect(hidden.email).toBeNull();
      expect(hidden.phoneE164).toBeNull();
    }
    const allowed=projectAdminMembershipDetail(person,collegeId,collegeId);
    expect(allowed.contactVisible).toBe(true);
    expect(allowed.email).toBe("private@example.test");
  });

  it("SA-admin-middle-people-03 renders no phone/email even if an improperly populated service object still has raw data",async()=>{
    vi.mocked(getSuperAdminMembershipDetail).mockResolvedValue({
      ...person,contactVisible:false,
    } as never);
    const html=renderToStaticMarkup(await MembershipDetail(route));
    expect(html).toContain("Masked outside selected college");
    expect(html).not.toContain("private@example.test");
    expect(html).not.toContain("+919999999999");
    expect(html).not.toContain("GLOBAL_BLOCK:");
    expect(getCurrentRequestContext).toHaveBeenCalledOnce();
    expect(getSuperAdminMembershipDetail).toHaveBeenCalledWith(
      expect.objectContaining({adminScope:{collegeId,organizationId:orgId}}),membershipId,
    );
  });

  it("SA-admin-middle-people-03 selected-college exact match retains legitimate contact fields",async()=>{
    vi.mocked(getSuperAdminMembershipDetail).mockResolvedValue({
      ...person,contactVisible:true,
    } as never);
    const html=renderToStaticMarkup(await MembershipDetail(route));
    expect(html).toContain("private@example.test");
    expect(html).toContain("+919999999999");
    expect(html).not.toContain("GLOBAL_BLOCK:");
  });

  it("SA-admin-middle-people-03 does not render a foreign membership or activity link on a 404",async()=>{
    vi.mocked(getSuperAdminMembershipDetail).mockResolvedValue(null);
    await expect(MembershipDetail(route)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getSuperAdminMembershipDetail).toHaveBeenCalledOnce();
  });
});
