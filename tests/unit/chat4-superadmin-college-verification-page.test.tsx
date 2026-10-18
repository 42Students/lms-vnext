import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),guard:vi.fn(),tenant:vi.fn(),queue:vi.fn(),
 policy:vi.fn(),notFound:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/verification/super-admin-scope",()=>({
 requireSuperAdminVerificationCollege:mocks.guard,
}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",()=>({
 getSuperAdminTenantLifecycleDetail:mocks.tenant,
}));
vi.mock("@/modules/verification/staff-queue-service",()=>({
 listCollegeVerificationQueue:mocks.queue,
 VerificationQueueLimitError:class VerificationQueueLimitError extends Error {},
}));
vi.mock("@/modules/verification/staff-auth",()=>({
 VerificationUnavailableError:class VerificationUnavailableError extends Error {},
}));
vi.mock("@/db/client",()=>({getDb:()=>({
 select:()=>({from(){return this;},where(){return this;},
  limit:()=>Promise.resolve(mocks.policy()),
 }),
})}));
vi.mock("@/components/verification/SuperAdminVerificationPanel",async()=>{
 const {createElement}=await import("react");
 return {SuperAdminVerificationPanel:(props:{
  collegeId:string;rows:unknown[];page:number;
 })=>createElement("section",{"data-college":props.collegeId,
  "data-rows":props.rows.length,"data-page":props.page},"Profile verification queue")};
});
vi.mock("@/components/verification/TpoVerificationSwitch",async()=>{
 const {createElement}=await import("react");
 return {TpoVerificationSwitch:(props:{collegeId:string;initialEnabled:boolean})=>
  createElement("span",{"data-policy":props.initialEnabled?"enabled":"disabled"},
   "TPO verification policy")};
});
vi.mock("next/navigation",()=>({
 notFound:()=>{mocks.notFound();throw new Error("NEXT_NOT_FOUND");},
}));
import AdminCollegeVerification from "@/app/(authenticated)/admin/colleges/[collegeId]/verification/page";
import {VerificationQueueLimitError} from "@/modules/verification/staff-queue-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor={
 user:{id:"sa",identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:org},
};
const props=(search:Record<string,string|string[]|undefined>)=>({
 params:Promise.resolve({collegeId}),searchParams:Promise.resolve(search),
});
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.guard.mockResolvedValue(undefined);
 mocks.tenant.mockResolvedValue({id:collegeId,name:"IIT Dharwad",organizationId:org});
 mocks.queue.mockResolvedValue({
  rows:[],counts:{},filter:{tab:"WAITING",kind:"EDUCATION"},page:1,
  total:0,hasMore:false,
 });
 mocks.policy.mockReturnValue([]);
});
describe("SA-colleges-verification-FILTER-01 scoped queue and fail-closed paging",()=>{
 it("rejects scientific, hexadecimal, blank, repeated and unknown pagination before private verification reads",async()=>{
  for(const value of ["1e2","0x10"," 2 ","","-1","1.5"]){
   const html=renderToStaticMarkup(await AdminCollegeVerification(props({page:value})));
   expect(html).toContain("Invalid verification filters");
   expect(html).toContain("Reset");
  }
  const repeated=renderToStaticMarkup(await AdminCollegeVerification(props({page:["1","2"]})));
  expect(repeated).toContain("Invalid verification filters");
  expect(mocks.queue).not.toHaveBeenCalled();
  expect(mocks.policy).not.toHaveBeenCalled();
 });
 it("checks persisted Super Admin authority before any queue or college details",async()=>{
  mocks.guard.mockRejectedValueOnce(new Error("FORBIDDEN"));
  await expect(AdminCollegeVerification(props({page:"1e2"}))).rejects.toThrow("FORBIDDEN");
  expect(mocks.tenant).not.toHaveBeenCalled();
  expect(mocks.queue).not.toHaveBeenCalled();
 });
 it("renders only selected-college queue and true persisted policy on a valid filter",async()=>{
  mocks.policy.mockReturnValue([{enabled:false}]);
  const html=renderToStaticMarkup(await AdminCollegeVerification(props({page:"2",tab:"WAITING"})));
  expect(html).toContain("IIT Dharwad");
  expect(html).toContain('data-college="'+collegeId+'"');
  expect(html).toContain('data-policy="disabled"');
  expect(html).toContain("Profile verification queue");
  expect(mocks.queue).toHaveBeenCalledWith(actor,expect.objectContaining({page:2,tab:"WAITING"}),collegeId);
 });
 it("shows a safe recovery state instead of returning a partial private queue on scan overflow",async()=>{
  mocks.queue.mockRejectedValueOnce(new VerificationQueueLimitError("too many"));
  const html=renderToStaticMarkup(await AdminCollegeVerification(props({page:"1"})));
  expect(html).toContain("safe scan cap");
  expect(html).toContain("Retry");
  expect(mocks.policy).not.toHaveBeenCalled();
 });
});
