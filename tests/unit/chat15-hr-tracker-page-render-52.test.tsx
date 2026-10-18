import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),activeRecruiter:vi.fn(),redirect:vi.fn(),
 portfolio:vi.fn(),ready:vi.fn(),reports:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/identity/context",()=>({hasActiveRecruiter:mocks.activeRecruiter}));
vi.mock("next/navigation",()=>({
 redirect:mocks.redirect,
}));
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:React.ReactNode})=>
  React.createElement("a",{href},children),
}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,description}:{title:string;description?:string})=>
  React.createElement("header",null,React.createElement("h1",null,title),
   React.createElement("p",null,description)),
}));
vi.mock("@/components/placements/recruiter-placement-portfolio",()=>({
 RecruiterPlacementPortfolio:({jobs}:{jobs:unknown[]})=>
  React.createElement("section",{"data-testid":"authorized-portfolio","data-count":jobs.length},"Scoped drives"),
}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:mocks.portfolio,
}));
vi.mock("@/modules/bug-tracker/readiness",()=>({
 trackerAdminRuntimeEnabled:mocks.ready,
}));
vi.mock("@/modules/bug-tracker/reporter-service",()=>({
 listMyTrackerReports:mocks.reports,
}));
import HrPlacementsPage from "@/app/(authenticated)/hr/placements/page";
import MyTrackerReportsPage from "@/app/(authenticated)/tracker/mine/page";

const actor={user:{id:"recruiter-a",platformStatus:"ACTIVE"},recruiter:{
 userId:"recruiter-a",status:"ACTIVE",grants:[],
}};
describe("UX-CHAT15-SERVER-52 recruiter portfolio and reporter tracker real SSR states",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.context.mockResolvedValue(actor);
  mocks.activeRecruiter.mockReturnValue(true);
  mocks.redirect.mockImplementation(()=>{throw new Error("NEXT_REDIRECT");});
  mocks.portfolio.mockResolvedValue([]);
  mocks.reports.mockResolvedValue([]);
  mocks.ready.mockReturnValue(true);
 });
 it("HR-PORTFOLIO-52 sends authenticated context to the scoped job service and renders truthful empty portfolio",async()=>{
  const html=renderToStaticMarkup(await HrPlacementsPage());
  expect(mocks.portfolio).toHaveBeenCalledExactlyOnceWith(actor);
  expect(html).toContain("<h1>Drives</h1>");
  expect(html).toContain('data-testid="authorized-portfolio"');
  expect(html).toContain('data-count="0"');
  expect(html).toContain("Only opportunities belonging to your employer");
 });
 it("HR-PORTFOLIO-52 forwards only the exact authorized job records and never queries a global portfolio",async()=>{
  const authorized=[{job:{id:"own-job"}},{job:{id:"own-job-2"}}];
  mocks.portfolio.mockResolvedValue(authorized);
  const html=renderToStaticMarkup(await HrPlacementsPage());
  expect(mocks.portfolio).toHaveBeenCalledExactlyOnceWith(actor);
  expect(html).toContain('data-count="2"');
 });
 it("HR-PORTFOLIO-52 denies missing/inactive recruiter without accessing private jobs",async()=>{
  mocks.activeRecruiter.mockReturnValue(false);
  await expect(HrPlacementsPage()).rejects.toThrow("NEXT_REDIRECT");
  expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  expect(mocks.portfolio).not.toHaveBeenCalled();
 });
 it("TRACKER-REPORTER-52 denies a disabled platform account before querying reports",async()=>{
  mocks.context.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(MyTrackerReportsPage()).rejects.toThrow("NEXT_REDIRECT");
  expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  expect(mocks.ready).not.toHaveBeenCalled();
  expect(mocks.reports).not.toHaveBeenCalled();
 });
 it("TRACKER-REPORTER-52 surfaces a safe database-not-ready status without falsely accepting a report",async()=>{
  mocks.ready.mockReturnValue(false);
  const html=renderToStaticMarkup(await MyTrackerReportsPage());
  expect(html).toContain('role="status"');
  expect(html).toContain("Reports are temporarily unavailable.");
  expect(html).toContain("Try again soon.");
  expect(mocks.reports).not.toHaveBeenCalled();
 });
 it("TRACKER-REPORTER-52 shows a retryable private read failure rather than a stack trace",async()=>{
  mocks.reports.mockRejectedValue(new Error("INTERNAL_DB_CONNECTION_REFUSED"));
  const html=renderToStaticMarkup(await MyTrackerReportsPage());
  expect(html).toContain('role="alert"');
  expect(html).toContain("We could not load your reports.");
  expect(html).toContain('href="/tracker/mine"');
  expect(html).not.toContain("INTERNAL_DB_CONNECTION_REFUSED");
 });
 it("TRACKER-REPORTER-52 gives an authorized reporter the empty and actionable state",async()=>{
  const html=renderToStaticMarkup(await MyTrackerReportsPage());
  expect(mocks.reports).toHaveBeenCalledExactlyOnceWith(actor);
  expect(html).toContain("You have not reported any issues yet.");
  expect(html).toContain('href="/tracker"');
  expect(html).toContain("Report an issue");
 });
 it("TRACKER-REPORTER-52 renders only the caller's reports returned by the scoped service",async()=>{
  mocks.reports.mockResolvedValue([{publicId:"BUG-42",issueType:"BUG",
   status:"OPEN",description:"No submit result"}]);
  const html=renderToStaticMarkup(await MyTrackerReportsPage());
  expect(html).toContain('href="/tracker/mine/BUG-42"');
  expect(html).toContain("No submit result");
  expect(html).toContain("BUG-42");
  expect(html).not.toContain("You have not reported any issues yet.");
 });
});
