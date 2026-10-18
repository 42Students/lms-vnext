import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({
 context:vi.fn(),report:vi.fn(),enabled:vi.fn(),redirect:vi.fn(),
 notFound:vi.fn(),
}));
vi.mock("next/navigation",()=>({
 redirect:(path:string)=>{mocks.redirect(path);throw new Error("NEXT_REDIRECT");},
 notFound:()=>{mocks.notFound();throw new Error("NEXT_NOT_FOUND");},
}));
vi.mock("next/link",()=>({default:({children}:{children:unknown})=>children}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:()=>null}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/bug-tracker/reporter-service",()=>({getMyTrackerReport:mocks.report}));
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
  expect(view.type).toBe("p");
  expect(view.props.role).toBe("status");
  expect(mocks.report).not.toHaveBeenCalled();
 });
 it("passes only the authenticated reporter context into the scoped query",async()=>{
  const view=await MyTrackerReportDetail(params("LMS-1234"));
  expect(view.type).toBe("article");
  expect(mocks.report).toHaveBeenCalledTimes(1);
  expect(mocks.report).toHaveBeenCalledWith(context,"LMS-1234");
 });
});
