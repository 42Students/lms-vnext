import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
const mock=vi.hoisted(()=>({
 ctx:vi.fn(),enabled:vi.fn(),list:vi.fn(),get:vi.fn(),
 redirect:vi.fn(),notFound:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.ctx}));
vi.mock("@/modules/bug-tracker/readiness",()=>({trackerAdminRuntimeEnabled:mock.enabled}));
vi.mock("@/modules/bug-tracker/reporter-service",()=>({
 listMyTrackerReports:mock.list,getMyTrackerReport:mock.get,
}));
vi.mock("next/navigation",()=>({redirect:mock.redirect,notFound:mock.notFound}));
import MyTrackerReportsPage from "@/app/(authenticated)/tracker/mine/page";
import MyTrackerReportDetail from "@/app/(authenticated)/tracker/mine/[publicId]/page";

function text(node:ReactNode):string{
 if(node===null||node===undefined||typeof node==="boolean")return "";
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(Array.isArray(node))return node.map(text).join(" ");
 if(isValidElement(node))return text((node.props as {children?:ReactNode}).children);
 return "";
}
function hrefs(node:ReactNode):string[]{
 if(Array.isArray(node))return node.flatMap(hrefs);
 if(!isValidElement(node))return [];
 const props=node.props as {href?:string;children?:ReactNode};
 return [...(typeof props.href==="string"?[props.href]:[]),...hrefs(props.children)];
}

const report={publicId:"LMS-1234",issueType:"BUG",status:"OPEN",
 severity:"HIGH",description:"Existing bug",createdAt:new Date("2026-10-18T09:00:00Z")};

describe("HR-BREAK-tracker-pages-01: reporter-owned routes and recovery",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.ctx.mockResolvedValue({user:{platformStatus:"ACTIVE"}});
  mock.enabled.mockReturnValue(true);
  mock.list.mockResolvedValue([]);
  mock.get.mockResolvedValue(report);
  mock.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  mock.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
 });
 it("inactive/suspended account cannot access the report list",async()=>{
  mock.ctx.mockResolvedValue({user:{platformStatus:"SUSPENDED"}});
  await expect(MyTrackerReportsPage()).rejects.toThrow("REDIRECT");
  expect(mock.redirect).toHaveBeenCalledWith("/dashboard");
  expect(mock.list).not.toHaveBeenCalled();
 });
 it("feature-off state presents truthful unavailable copy without querying DB",async()=>{
  mock.enabled.mockReturnValue(false);
  const page=await MyTrackerReportsPage();
  expect(text(page)).toContain("Reports are temporarily unavailable");
  expect(mock.list).not.toHaveBeenCalled();
 });
 it("failed data fetch renders retry and does not masquerade as an empty list",async()=>{
  mock.list.mockRejectedValue(new Error("database unavailable"));
  const page=await MyTrackerReportsPage();
  expect(text(page)).toContain("We could not load your reports.");
  expect(hrefs(page)).toContain("/tracker/mine");
  expect(text(page)).not.toContain("You have not reported any issues yet.");
 });
 it("empty list has an actionable report route; persisted rows use encoded detail link",async()=>{
  const empty=await MyTrackerReportsPage();
  expect(text(empty)).toContain("You have not reported any issues yet.");
  expect(hrefs(empty)).toContain("/tracker");
  mock.list.mockResolvedValue([report]);
  const populated=await MyTrackerReportsPage();
  expect(text(populated)).toContain("Existing bug");
  expect(hrefs(populated)).toContain("/tracker/mine/LMS-1234");
 });
 it("malformed or other reporter's IDs cannot fetch report detail by guessing URLs",async()=>{
  await expect(MyTrackerReportDetail({params:Promise.resolve({publicId:"../../other"})})).rejects.toThrow("NOT_FOUND");
  expect(mock.get).not.toHaveBeenCalled();
  mock.get.mockResolvedValue(null);
  await expect(MyTrackerReportDetail({params:Promise.resolve({publicId:"LMS-1234"})})).rejects.toThrow("NOT_FOUND");
  expect(mock.get).toHaveBeenCalled();
 });
 it("detail view shows own report, non-secret severity and return path",async()=>{
  const page=await MyTrackerReportDetail({params:Promise.resolve({publicId:"LMS-1234"})});
  expect(text(page)).toMatch(/Status:\s+OPEN/);
  expect(text(page)).toMatch(/Severity:\s+HIGH/);
  expect(hrefs(page)).toContain("/tracker/mine");
  expect(mock.get).toHaveBeenCalledWith({user:{platformStatus:"ACTIVE"}},"LMS-1234");
 });
});