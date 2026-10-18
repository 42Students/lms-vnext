import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
const m=vi.hoisted(()=>({ctx:vi.fn(),redirect:vi.fn(),ready:vi.fn(),list:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
vi.mock("@/modules/bug-tracker/readiness",()=>({trackerAdminRuntimeEnabled:m.ready}));
vi.mock("@/modules/bug-tracker/reporter-service",()=>({listMyTrackerReports:m.list}));
import MyTrackerReportsPage from "@/app/(authenticated)/tracker/mine/page";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"company",grants:[]}};
function text(node:ReactNode):string{
 if(Array.isArray(node))return node.map(text).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {title?:string;description?:string;children?:ReactNode};
 return [p.title??"",p.description??"",text(p.children)].join(" ");
}
function links(node:ReactNode):string[]{
 if(Array.isArray(node))return node.flatMap(links);
 if(!isValidElement(node))return [];
 const p=node.props as {href?:string;children?:ReactNode};
 return [...(p.href?[p.href]:[]),...links(p.children)];
}
describe("HR-TRACKER-PAGE-98 recruiter-owned bug reports survive transient failures",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);m.ready.mockReturnValue(true);
  m.list.mockResolvedValue([]);m.redirect.mockImplementation(()=>{throw Error("REDIRECT");});
 });
 it("disabled actor redirects before querying readiness or private reports",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(MyTrackerReportsPage()).rejects.toThrow("REDIRECT");
  expect(m.ready).not.toHaveBeenCalled();expect(m.list).not.toHaveBeenCalled();
 });
 it("unavailable reporting shows a truthful retry, not a false success or database error",async()=>{
  m.ready.mockReturnValue(false);
  const node=await MyTrackerReportsPage();
  expect(text(node)).toContain("Reports are temporarily unavailable.");
  expect(m.list).not.toHaveBeenCalled();
 });
 it("database timeout renders a recoverable inline error, not an invented empty list",async()=>{
  m.list.mockRejectedValue(new Error("relation internal.private failed"));
  const node=await MyTrackerReportsPage();
  expect(text(node)).toContain("We could not load your reports.");
  expect(text(node)).not.toContain("internal.private");
  expect(links(node)).toContain("/tracker/mine");
 });
 it("empty own-reports list invites the user to report an issue",async()=>{
  const node=await MyTrackerReportsPage();
  expect(text(node)).toContain("You have not reported any issues yet.");
  expect(links(node)).toContain("/tracker");
 });
 it("private report list links only data returned by the scoped reporter service",async()=>{
  m.list.mockResolvedValue([{publicId:"TRK-102",issueType:"BUG",status:"OPEN",
   description:"Hiring page issue"}]);
  const node=await MyTrackerReportsPage();
  expect(text(node)).toContain("Hiring page issue");
  expect(links(node)).toContain("/tracker/mine/TRK-102");
  expect(m.list).toHaveBeenCalledWith(actor);
 });
});