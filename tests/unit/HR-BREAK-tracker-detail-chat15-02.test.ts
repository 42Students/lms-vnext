import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
function textOf(node:ReactNode):string{
 if(Array.isArray(node))return node.map(textOf).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const props=node.props as {title?:ReactNode;description?:ReactNode;children?:ReactNode};
 return [textOf(props.title),textOf(props.description),textOf(props.children)].join(" ");
}
const mocks=vi.hoisted(()=>({
 context:vi.fn(),report:vi.fn(),history:vi.fn(),screenshots:vi.fn(),enabled:vi.fn(),redirect:vi.fn(),
 notFound:vi.fn(),
}));
vi.mock("next/navigation",()=>({
 redirect:(path:string)=>{mocks.redirect(path);throw new Error("NEXT_REDIRECT");},
 notFound:()=>{mocks.notFound();throw new Error("NEXT_NOT_FOUND");},
}));
vi.mock("next/link",()=>({default:({children}:{children:unknown})=>children}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:()=>null}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/bug-tracker/reporter-service",()=>({getMyTrackerReport:mocks.report,
 listMyTrackerReportHistory:mocks.history,listMyTrackerReportScreenshots:mocks.screenshots}));
vi.mock("@/modules/bug-tracker/readiness",()=>({trackerAdminRuntimeEnabled:mocks.enabled}));

import MyTrackerReportDetail from "@/app/(authenticated)/tracker/mine/[publicId]/page";
import {TrackerAdminError} from "@/modules/bug-tracker/admin-errors";

const params=(publicId:string)=>({params:Promise.resolve({publicId})});
const context={user:{id:"reporter-a",platformStatus:"ACTIVE"}};
const example={publicId:"LMS-1234",issueType:"Bug",severity:"MAJOR",
 status:"OPEN",description:"The button does not respond",
 createdAt:new Date("2026-10-18T08:00:00Z")};

describe("HR-BREAK-tracker-detail-chat15-02: reporter privacy and failure semantics",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.context.mockResolvedValue(context);
  mocks.enabled.mockReturnValue(true);
  mocks.report.mockResolvedValue(example);
  mocks.history.mockResolvedValue([]);
  mocks.screenshots.mockResolvedValue([]);
 });
 it("rejects an expired or deactivated session before touching private report storage",async()=>{
  mocks.context.mockResolvedValue({user:{id:"reporter-a",platformStatus:"SUSPENDED"}});
  await expect(MyTrackerReportDetail(params("LMS-1234"))).rejects.toThrow("NEXT_REDIRECT");
  expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  expect(mocks.report).not.toHaveBeenCalled();
 });
 it("rejects a malformed public ID before reading the report",async()=>{
  await expect(MyTrackerReportDetail(params("../other-college"))).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mocks.report).not.toHaveBeenCalled();
 });
 it("converts only an authorized report-not-found outcome into a 404",async()=>{
  mocks.report.mockRejectedValue(new TrackerAdminError("ISSUE_NOT_FOUND"));
  await expect(MyTrackerReportDetail(params("LMS-1234"))).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mocks.report).toHaveBeenCalledWith(context,"LMS-1234");
 });
 it("does not disguise PostgreSQL and transient dependency failures as not-found",async()=>{
  const dbFailure=new Error("database timeout with private details");
  mocks.report.mockRejectedValue(dbFailure);
  await expect(MyTrackerReportDetail(params("LMS-1234"))).rejects.toBe(dbFailure);
  expect(mocks.notFound).not.toHaveBeenCalled();
 });
 it("renders a non-querying availability state when the tracker is disabled",async()=>{
  mocks.enabled.mockReturnValue(false);
  const view=await MyTrackerReportDetail(params("LMS-1234"));
  expect(view.type).toBe("div");
  expect(textOf(view)).toContain("Reports are temporarily unavailable");
  expect(mocks.report).not.toHaveBeenCalled();
 });
 it("keeps the issue visible if independent activity and screenshot reads fail",async()=>{
  mocks.history.mockRejectedValue(new Error("private database timeout"));
  mocks.screenshots.mockRejectedValue(new Error("private file store timeout"));
  const view=await MyTrackerReportDetail(params("LMS-1234"));
  expect(view.type).toBe("article");
  const copy=textOf(view);
  expect(copy).toContain("Activity could not be loaded");
  expect(copy).toContain("Screenshots could not be loaded");
  expect(copy).not.toContain("private database timeout");
  expect(copy).not.toContain("No screenshots attached");
 });
 it("passes only the authenticated reporter context into the scoped query",async()=>{
  const view=await MyTrackerReportDetail(params("LMS-1234"));
  expect(view.type).toBe("article");
  expect(mocks.report).toHaveBeenCalledTimes(1);
  expect(mocks.report).toHaveBeenCalledWith(context,"LMS-1234");
  expect(mocks.history).toHaveBeenCalledWith(context,"LMS-1234");
  expect(mocks.screenshots).toHaveBeenCalledWith(context,"LMS-1234");
 });
});
