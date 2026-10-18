import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),tenant:vi.fn(),domains:vi.fn(),managed:vi.fn(),notFound:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",()=>({
 getSuperAdminTenantLifecycleDetail:mocks.tenant,
}));
vi.mock("@/modules/tenant-domains/runtime",()=>({
 listTenantDomainsWithRuntime:mocks.domains,
}));
vi.mock("@/modules/tenant-domains/managed-subdomain-service",()=>({
 getManagedCollegeSubdomain:mocks.managed,
}));
vi.mock("@/components/admin/tenant-domain-manager",async()=>{
 const {createElement}=await import("react");
 return {TenantDomainManager:(props:{collegeId:string;domains:{host:string}[]})=>
  createElement("section",{"data-college":props.collegeId,"data-count":props.domains.length},
   props.domains.map(row=>createElement("span",{key:row.host},row.host)))};
});
vi.mock("@/components/admin/managed-college-subdomain",async()=>{
 const {createElement}=await import("react");
 return {ManagedCollegeSubdomain:(props:{collegeId:string})=>
  createElement("section",{"data-managed-college":props.collegeId},"Managed subdomain")};
});
vi.mock("next/navigation",()=>({
 notFound:()=>{mocks.notFound();throw new Error("NEXT_NOT_FOUND");},
}));
import CollegeWebAddress from "@/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page";
import {CollegeServiceError} from "@/modules/colleges/service";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor={
 user:{id:"super-admin",identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:org},
};
const props={params:Promise.resolve({collegeId})};
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.tenant.mockResolvedValue({id:collegeId,name:"IIT Dharwad",organizationId:org,
  status:"ACTIVE",organizationStatus:"ACTIVE"});
 mocks.domains.mockResolvedValue([]);
 mocks.managed.mockResolvedValue(null);
});

describe("SA-colleges-domains-page-01 verified domain admin scope",()=>{
 it("allows managing only the selected authorized college and renders an empty state without fabricated hosts",async()=>{
  const html=renderToStaticMarkup(await CollegeWebAddress(props));
  expect(html).toContain("IIT Dharwad");
  expect(html).toContain("Only a verified address can become primary");
  expect(html).toContain('data-college="'+collegeId+'"');
  expect(html).toContain('data-count="0"');
  expect(mocks.domains).toHaveBeenCalledWith(actor,collegeId);
  expect(mocks.managed).toHaveBeenCalledWith(actor,collegeId);
 });
 it("passes persisted tenant domain facts and host ownership to the manager",async()=>{
  mocks.domains.mockResolvedValue([{
   id:"domain-1",host:"lms.college.example.edu",
   isPrimary:true,isVerified:true,verificationToken:"server-only-token",
   verifiedAt:new Date("2099-01-01T00:00:00Z"),
   lastCheckedAt:new Date("2099-01-02T00:00:00Z"),lastCheckResult:"OK",
  }]);
  const html=renderToStaticMarkup(await CollegeWebAddress(props));
  expect(html).toContain("lms.college.example.edu");
  expect(html).toContain('data-count="1"');
  expect(html).toContain("Moving an address between colleges is not supported");
 });
 it("denies a non-Super Admin role before domain metadata or tokens are queried",async()=>{
  mocks.context.mockResolvedValue({
   user:{...actor.user,systemRoles:[]},
   membership:{id:"learner",collegeId,organizationId:org,status:"ACTIVE",roles:["LEARNER"]},
  });
  await expect(CollegeWebAddress(props)).rejects.toBeDefined();
  expect(mocks.domains).not.toHaveBeenCalled();
  expect(mocks.managed).not.toHaveBeenCalled();
 });
 it("404s an unknown or out-of-scope tenant before reading domain metadata",async()=>{
  mocks.tenant.mockRejectedValueOnce(new CollegeServiceError("COLLEGE_NOT_FOUND"));
  await expect(CollegeWebAddress(props)).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mocks.notFound).toHaveBeenCalledOnce();
  expect(mocks.domains).not.toHaveBeenCalled();
 });
});
