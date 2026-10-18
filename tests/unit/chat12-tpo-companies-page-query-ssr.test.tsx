import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mocked=vi.hoisted(()=>({context:vi.fn(),actor:vi.fn(),view:vi.fn(),redirect:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:(href:string)=>{
 mocked.redirect(href);throw new Error("REDIRECT_TO_"+href);
}}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocked.context}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 requireTpoBatchActor:mocked.actor,
}));
vi.mock("@/modules/placements/tpo-companies-view-service",()=>({
 getTpoCompaniesView:mocked.view,
 tpoCompaniesQuerySchema:{
  safeParse:(raw:Record<string,unknown>)=>({success:true,data:raw}),
 },
}));
vi.mock("@/components/tpo/tpo-company-memory-workspace",()=>({
 TpoCompanyMemoryWorkspace:({companyName}:{companyName:string})=><p>Company Memory: {companyName}</p>,
}));
vi.mock("@/components/tpo/tpo-company-create-form",()=>({TpoCompanyCreateForm:()=>null}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:({title}:{title:string})=><h1>{title}</h1>}));
const college="11111111-1111-4111-8111-111111111111";
const ctx:RequestContext={
 user:{id:"22222222-2222-4222-8222-222222222222",
  identityUid:"tpo-company-page",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"33333333-3333-4333-8333-333333333333",
  collegeId:college,organizationId:"44444444-4444-4444-8444-444444444444",
  status:"ACTIVE",roles:["TPO"]},
};
import TpoCompaniesPage from "@/app/(authenticated)/tpo/companies/page";
const page=(values:Record<string,string|string[]>={})=>
 TpoCompaniesPage({searchParams:Promise.resolve(values)});

describe("UX-tpo-companies-duplicate-filters-01 SSR invalid, denied and legacy links",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocked.context.mockResolvedValue(ctx);
  mocked.actor.mockResolvedValue(college);
 });
 it("redirects non-placement roles before parsing private employer deep-links",async()=>{
  mocked.context.mockResolvedValueOnce({...ctx,membership:{...ctx.membership!,roles:["LEARNER"]}});
  await expect(page({name:"Employer"})).rejects.toThrow("REDIRECT_TO_/dashboard");
  expect(mocked.view).not.toHaveBeenCalled();
 });
 it("fails closed when the persisted officer role was removed after sign-in",async()=>{
  mocked.actor.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
  await expect(page({name:"Employer"})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mocked.view).not.toHaveBeenCalled();
 });
 it("renders friendly correction for repeated, forged and oversized filters without company reads",async()=>{
  for(const invalid of [
   {name:["Employer A","Employer B"]},
   {directory:"1",page:["1","2"]},
   {collegeId:"other-college"},
   {directory:"0"},
   {name:"A".repeat(161)},
  ]){
   const html=renderToStaticMarkup(await page(invalid));
   expect(html).toContain("Invalid companies filters");
   expect(html).toContain("No company data was loaded.");
   expect(html).toContain("Clear filters");
   expect(html).toContain('role="alert"');
  }
  expect(mocked.view).not.toHaveBeenCalled();
 });
 it("retains existing named Company Memory navigation after live officer authorization",async()=>{
  const html=renderToStaticMarkup(await page({name:"Example Employer Pvt Ltd"}));
  expect(html).toContain("Company Memory: Example Employer Pvt Ltd");
  expect(mocked.view).not.toHaveBeenCalled();
  expect(mocked.actor).toHaveBeenCalledWith(ctx);
 });
 it("keeps the original unfiltered companies redirect, not an empty fabricated directory",async()=>{
  await expect(page()).rejects.toThrow("REDIRECT_TO_/tpo/recruiters?view=companies");
  expect(mocked.view).not.toHaveBeenCalled();
 });
});
