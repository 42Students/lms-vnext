import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";

const m=vi.hoisted(()=>({
 context:vi.fn(),read:vi.fn(),jobs:vi.fn(),changes:vi.fn(),
 redirect:vi.fn(),notFound:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.context}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({
 readRecruiterThreadMessages:m.read,
 TpoMessagingError:class TpoMessagingError extends Error {
  constructor(public readonly code:string){super(code);}
 },
}));
vi.mock("@/modules/placements/recruiter-service",()=>({listOwnRecruiterPlacementJobs:m.jobs}));
vi.mock("@/modules/placements/tpo-drive-change-request-service",()=>({getDriveChangeRequests:m.changes}));
import RecruiterConversationDetail from "@/app/(authenticated)/hr/conversations/[threadId]/page";
import {TpoMessagingError} from "@/modules/placements/tpo-messaging-service";

const id="11111111-1111-4111-8111-111111111111";
const college="22222222-2222-4222-8222-222222222222";
const user="33333333-3333-4333-8333-333333333333";
const context:RequestContext={
 user:{id:user,identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:user,companyId:"company-a",companyName:"Employer",
  title:null,status:"ACTIVE",grants:[{
   id:"grant",organizationId:"org",collegeId:college,collegeName:"College",
   companyRelationshipId:"relationship",
  }]},
};
const data={
 thread:{id,collegeId:college,jobId:null},
 messages:[{id:"message-a",senderType:"TPO",senderDisplayName:"Placement office",
  body:"Welcome to your authorized conversation",
  createdAt:new Date("2026-10-18T10:00:00Z")}],
 unread:1,total:1,page:1,pages:1,
};
const page=(threadId=id,page:unknown="1")=>RecruiterConversationDetail({
 params:Promise.resolve({threadId}),
 searchParams:Promise.resolve({page}) as never,
});
function textOf(node:ReactNode):string {
 if(Array.isArray(node))return node.map(textOf).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {children?:ReactNode,title?:string,description?:string,action?:ReactNode};
 return [p.title??"",p.description??"",textOf(p.children),textOf(p.action)].join(" ");
}

describe("HR-BREAK-chat19-conversation-page: actual async role, IDOR and recovery boundary",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  m.context.mockResolvedValue(context);
  m.jobs.mockResolvedValue([]);
  m.changes.mockResolvedValue(null);
  m.read.mockResolvedValue(data);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
 });
 it.each(["DISABLED"] as const)("denies %s sessions before looking up any messages",async status=>{
  m.context.mockResolvedValue({...context,user:{...context.user,platformStatus:status}});
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(m.read).not.toHaveBeenCalled();
  expect(m.redirect).toHaveBeenCalledWith("/dashboard");
 });
 it("rejects removed recruiter profiles before lookup",async()=>{
  m.context.mockResolvedValue({...context,recruiter:null});
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(m.read).not.toHaveBeenCalled();
 });
 it.each(["../other-college","not-uuid","javascript:alert(1)"])(
  "denies forged conversation ID %s before the read service",async bad=>{
   await expect(page(bad)).rejects.toThrow("NOT_FOUND");
   expect(m.read).not.toHaveBeenCalled();
 });
 it.each(["0","-2","2.5","10001","NaN","Infinity"])(
  "rejects hostile or unbounded pagination %s before the DB read",async bad=>{
   await expect(page(id,bad)).rejects.toThrow("NOT_FOUND");
   expect(m.read).not.toHaveBeenCalled();
 });
 it("renders live scoped messages with an explicit company-to-placement-cell return path",async()=>{
  const rendered=await page();
  const content=textOf(rendered);
  expect(content).toContain("Welcome to your authorized conversation");
  expect(content).toContain("Placement office");
  expect(m.read).toHaveBeenCalledWith(context,id,1);
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.changes).not.toHaveBeenCalled();
 });
 it("turns revoked college access into safe recovery, not private thread details",async()=>{
  m.read.mockRejectedValue(new TpoMessagingError("TPO_MESSAGE_FORBIDDEN"));
  const result=await page();
  const content=textOf(result);
  expect(content).toContain("No access to this college");
  expect(content).toContain("Return to Today");
  expect(content).not.toContain("Welcome to your authorized conversation");
  expect(m.jobs).not.toHaveBeenCalled();
 });
 it.each([
  {collegeId:"different-college",companyId:"company-a"},
  {collegeId:college,companyId:"company-b"},
 ])("rejects contaminated job rows from other college/company (%j)",async invalid=>{
  m.read.mockResolvedValue({...data,thread:{...data.thread,jobId:id}});
  m.jobs.mockResolvedValue([{...invalid,job:{id,title:"Private drive"}}]);
  const rendered=await page();
  const content=textOf(rendered);
  expect(content).toContain("Drive unavailable");
  expect(content).not.toContain("Private drive");
  expect(m.changes).not.toHaveBeenCalled();
 });
 it("keeps messages and draft access during an optional change-request outage",async()=>{
  m.read.mockResolvedValue({...data,thread:{...data.thread,jobId:id}});
  m.jobs.mockResolvedValue([{
   collegeId:college,companyId:"company-a",job:{id,title:"Authorized drive"},
  }]);
  m.changes.mockRejectedValue(new Error("private internal storage error"));
  const rendered=await page();
  const content=textOf(rendered);
  expect(content).toContain("Welcome to your authorized conversation");
  expect(content).toContain("Change request updates are temporarily unavailable.");
  expect(content).toContain("Messages remain available");
  expect(content).not.toContain("private internal storage error");
  expect(m.changes).toHaveBeenCalledWith(context,id);
 });
 it("HR-BREAK-CONVO-05 isolates an optional employer drive outage from authorized thread history",async()=>{
  m.read.mockResolvedValue({...data,thread:{...data.thread,jobId:id}});
  m.jobs.mockRejectedValue(new Error("private datastore error: employer directory"));
  const rendered=await page();
  const content=textOf(rendered);
  expect(content).toContain("Welcome to your authorized conversation");
  expect(content).toContain("Hiring drive details are temporarily unavailable.");
  expect(content).toContain("You can still read and reply");
  expect(content).toContain("Drive unavailable");
  expect(content).not.toContain("private datastore error");
  expect(m.jobs).toHaveBeenCalledWith(context,college);
  expect(m.changes).not.toHaveBeenCalled();
  expect(content).not.toContain("Open drive: ");
 });
 it("does not query unrelated employer inventory for the general recruiter thread",async()=>{
  const rendered=await page();
  expect(textOf(rendered)).toContain("General");
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.changes).not.toHaveBeenCalled();
 });
 it("links only the current employer's current college drive",async()=>{
  m.read.mockResolvedValue({...data,thread:{...data.thread,jobId:id}});
  m.jobs.mockResolvedValue([{
   collegeId:college,companyId:"company-a",job:{id,title:"Authorized drive"},
  }]);
  m.changes.mockResolvedValue({party:"COMPANY",requests:[]});
  const rendered=await page();
  expect(textOf(rendered)).toContain("Authorized drive");
  expect(m.changes).toHaveBeenCalledWith(context,id);
 });
 it("HR-BREAK-CONVO-PRINCIPAL-28 denies mismatched recruiter before thread reads",async()=>{
  m.context.mockResolvedValue({...context,recruiter:{...context.recruiter!,userId:"other-user"}});
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(m.read).not.toHaveBeenCalled();
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.changes).not.toHaveBeenCalled();
 });
});
