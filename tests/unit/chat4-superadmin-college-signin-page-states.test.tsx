import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks=vi.hoisted(()=>({context:vi.fn(),policy:vi.fn(),notFound:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/colleges/admin-signin-policy-service",()=>({
 readAdminCollegeSignInPolicy:mocks.policy,
}));
vi.mock("next/navigation",()=>({
 notFound:()=>{mocks.notFound();throw new Error("NEXT_NOT_FOUND");},
}));
vi.mock("@/components/admin/college-signin-method-form",async()=>{
 const {createElement}=await import("react");
 return {CollegeSigninMethodForm:(props:{
  collegeId:string;method:string;version:number;ready:boolean;
 })=>createElement("div",{
  "data-testid":"sign-in-policy-form",
  "data-college":props.collegeId,
  "data-method":props.method,
  "data-version":String(props.version),
  "data-ready":String(props.ready),
 })};
});
import CollegeSignInMethods from "@/app/(authenticated)/admin/colleges/[collegeId]/signin/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor={
 user:{id:"super-admin",identityUid:"super-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:org},
};
const props={params:Promise.resolve({collegeId})};
const stored=(policy:{kind:"CONFIGURED"|"MIGRATION_PENDING"|"INVALID_POLICY"|"NOT_CONFIGURED";method:string|null},
 version:number|null)=>({
 college:{id:collegeId,name:"IIT Dharwad",organizationId:org},
 policy,version,
});
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.policy.mockResolvedValue(stored({kind:"CONFIGURED",method:"EMAIL_ONLY"},7));
});

describe("SA-colleges-signin-page-01 actual Super Admin page state and authorization",()=>{
 it("renders scoped persisted method and optimistic version, without enabling wrong channels",async()=>{
  const html=renderToStaticMarkup(await CollegeSignInMethods(props));
  expect(html).toContain("IIT Dharwad");
  expect(html).toContain('data-method="EMAIL_ONLY"');
  expect(html).toContain('data-version="7"');
  expect(html).toContain('data-ready="true"');
  expect(html).toContain("Existing sessions are not revoked");
  expect(mocks.policy).toHaveBeenCalledWith(actor,collegeId);
 });
 it("does not offer an enabled editor before college policy migration exists",async()=>{
  mocks.policy.mockResolvedValue(stored({kind:"MIGRATION_PENDING",method:null},null));
  const html=renderToStaticMarkup(await CollegeSignInMethods(props));
  expect(html).toContain('data-ready="false"');
  expect(html).toContain('data-method="EMAIL_AND_PHONE"');
  expect(html).toContain('data-version="0"');
 });
 it("displays a safe support message and disables saving a corrupt stored policy",async()=>{
  mocks.policy.mockResolvedValue(stored({kind:"INVALID_POLICY",method:null},2));
  const html=renderToStaticMarkup(await CollegeSignInMethods(props));
  expect(html).toContain("Stored sign-in method is invalid");
  expect(html).toContain('data-ready="false"');
  expect(html).not.toContain("UNRECOGNIZED_CHANNEL");
 });
 it("blocks unauthorized College Admin before reading any college sign-in settings",async()=>{
  mocks.context.mockResolvedValue({
   user:{...actor.user,systemRoles:[]},
   membership:{id:"local-member",collegeId,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  });
  await expect(CollegeSignInMethods(props)).rejects.toBeDefined();
  expect(mocks.policy).not.toHaveBeenCalled();
 });
 it("invalid college IDs 404 before scoped policy access",async()=>{
  await expect(CollegeSignInMethods({params:Promise.resolve({collegeId:"forged"})}))
   .rejects.toThrow("NEXT_NOT_FOUND");
  expect(mocks.notFound).toHaveBeenCalledOnce();
  expect(mocks.policy).not.toHaveBeenCalled();
 });
});
