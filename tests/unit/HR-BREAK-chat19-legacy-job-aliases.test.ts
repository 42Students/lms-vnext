import {beforeEach,describe,expect,it,vi} from "vitest";
import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
const m=vi.hoisted(()=>({ctx:vi.fn(),read:vi.fn(),redirect:vi.fn(),notFound:vi.fn(),
 alias:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/hr-job-read-service",()=>({getHrJobRead:m.read}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
vi.mock("@/app/(authenticated)/hr/conversations/page",()=>({default:m.alias}));
import HrJobPage from "@/app/(authenticated)/hr/placements/jobs/[jobId]/page";
import HrCollegesRetiredRoute from "@/app/(authenticated)/hr/colleges/page";
import HrMessagesAlias from "@/app/(authenticated)/hr/messages/page";

const job="11111111-1111-4111-8111-111111111111";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter",companyId:"employer",companyName:"Employer",title:null,status:"ACTIVE",
  grants:[{id:"grant",organizationId:"org",collegeId:"22222222-2222-4222-8222-222222222222",
   collegeName:"College",companyRelationshipId:"relation"}]},
};
const page=(jobId=job,q:Record<string,unknown>={})=>HrJobPage({
 params:Promise.resolve({jobId}),searchParams:Promise.resolve(q) as never,
});
describe("HR-BREAK-chat19-legacy-navigation-job-page: authorize then redirect",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  m.read.mockRejectedValue(new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND"));
 });
 it("an expired recruiter cannot load a URL-guessed hiring job",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(m.redirect).toHaveBeenCalledWith("/dashboard");
  expect(m.read).not.toHaveBeenCalled();
 });
 it("active recruiter cannot open a job outside their persisted employer grant",async()=>{
  await expect(page()).rejects.toThrow("NOT_FOUND");
  expect(m.read).toHaveBeenCalledWith(actor,job,expect.objectContaining({}));
  expect(m.notFound).toHaveBeenCalled();
 });
 it("malformed path UUID becomes 404 rather than raw Zod text",async()=>{
  m.read.mockImplementation(async(_ctx:unknown,id:string)=>z.string().uuid().parse(id));
  await expect(page("../other-tenant")).rejects.toThrow("NOT_FOUND");
  expect(m.notFound).toHaveBeenCalled();
 });
 it("legacy Messages redirect happens only after hiring job authorization",async()=>{
  m.read.mockResolvedValue({workspace:{job:{id:job}}});
  await expect(page(job,{tab:"messages"})).rejects.toThrow("REDIRECT");
  expect(m.read).toHaveBeenCalledWith(actor,job,expect.objectContaining({tab:"overview"}));
  expect(m.redirect).toHaveBeenCalledWith(expect.stringContaining(job));
 });
 it("retired recruiter college directory resolves to scoped Today, not an exposed index",()=>{
  expect(()=>HrCollegesRetiredRoute()).toThrow("REDIRECT");
  expect(m.redirect).toHaveBeenCalledWith("/hr/home");
 });
 it("legacy /hr/messages exports the recruiter conversation inbox, not notification bell",()=>{
  expect(HrMessagesAlias).toBe(m.alias);
 });
});
