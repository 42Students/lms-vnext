import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ActiveMembership,RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),actor:vi.fn(),feedback:vi.fn(),redirect:vi.fn(),notFound:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({
 redirect:(url:string)=>{mocks.redirect(url);throw new Error("REDIRECT_TO_"+url);},
 notFound:()=>{mocks.notFound();throw new Error("NOT_FOUND");},
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 requireTpoBatchActor:mocks.actor,
}));
vi.mock("@/modules/placements/tpo-company-feedback-service",()=>({
 getTpoCompanyFeedback:mocks.feedback,
}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:({title}:{title:string})=><h1>{title}</h1>}));
const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const context=(roles:ActiveMembership["roles"]):RequestContext=>({
 user:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",identityUid:"tpo-company-feedback",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  collegeId:COLLEGE,organizationId:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  status:"ACTIVE",roles},
});
import TpoCompanyFeedbackPage from "@/app/(authenticated)/tpo/companies/[companyId]/feedback/page";
const open=(query:Record<string,string|string[]>={})=>TpoCompanyFeedbackPage({
 params:Promise.resolve({companyId:COMPANY}),searchParams:Promise.resolve(query),
});
describe("UX-tpo-company-feedback-01 internal CRM note scope and malformed URL denial",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.context.mockResolvedValue(context(["TPO"]));
  mocks.actor.mockResolvedValue(COLLEGE);
  mocks.feedback.mockResolvedValue(null);
 });
 it("denies foreign roles or a revoked persisted placement actor before feedback reads",async()=>{
  mocks.context.mockResolvedValueOnce(context(["LEARNER"]));
  await expect(open()).rejects.toThrow("REDIRECT_TO_/dashboard");
  mocks.actor.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
  await expect(open()).rejects.toBeInstanceOf(AuthorizationError);
  expect(mocks.feedback).not.toHaveBeenCalled();
 });
 it("rejects duplicate page params without selecting another company's private notes",async()=>{
  await expect(open({page:["1","2"]})).rejects.toThrow("NOT_FOUND");
  expect(mocks.feedback).not.toHaveBeenCalled();
 });
 it("genuinely missing company uses not-found instead of fabricating an empty private note list",async()=>{
  await expect(open({page:"1"})).rejects.toThrow("NOT_FOUND");
  expect(mocks.feedback).toHaveBeenCalledWith(context(["TPO"]),{
   companyId:COMPANY,page:1,
  });
 });
 it("shows unavailable storage as unavailable instead of claiming there are zero company notes",async()=>{
  mocks.feedback.mockResolvedValueOnce({
   companyName:"Employer",available:false,notes:[],contacts:[],writeEnabled:false,
   total:null,totalPages:null,page:1,
  });
  const html=renderToStaticMarkup(await open({page:"1"}));
  expect(html).toContain("Registered recruiter note storage is unavailable");
  expect(html).not.toContain("No saved NOTE-type CRM activities appear");
 });
});
