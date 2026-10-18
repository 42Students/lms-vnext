import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const base="src/app/(authenticated)/";
const code=(path:string)=>readFileSync(base+path,"utf8");

describe("UX-CHAT15-ROUTES-41 HR, recruiter and tracker access and state matrix",()=>{
 const canonical=[
  "home","activity","calendar","company","company/reports",
  "conversations","conversations/[threadId]","drives","drives/new",
  "drives/proposals","drives/recorded-outside",
  "drives/[jobId]/interview-slots","drives/[jobId]/messages",
  "drives/[jobId]/rounds/editor",
  "drives/[jobId]/rounds/editor/remove/[roundId]",
  "notifications","placements","placements/jobs/[jobId]",
  "profile","round-results",
 ];
 it.each(canonical)("HR-ROUTE-GATE-41 %s checks authenticated active recruiter before private reads",path=>{
  const source=code("hr/"+path+"/page.tsx");
  const auth=source.indexOf("await getCurrentRequestContext()");
  const gate=source.indexOf("hasActiveRecruiter(context)");
  expect(auth).toBeGreaterThan(-1);
  expect(gate).toBeGreaterThan(auth);
  expect(source).toContain('redirect("/dashboard")');
 });
 const detail=[
  "conversations/[threadId]",
  "drives/[jobId]/interview-slots",
  "drives/[jobId]/messages",
  "drives/[jobId]/rounds/editor",
  "drives/[jobId]/rounds/editor/remove/[roundId]",
  "placements/jobs/[jobId]",
 ];
 it.each(detail)("HR-DETAIL-404-41 %s rejects malformed identifiers rather than redirecting to another tenant",path=>{
  const source=code("hr/"+path+"/page.tsx");
  expect(source).toContain("safeParse(");
  expect(source).toContain("notFound()");
  expect(source).not.toContain("getAllPlacementJobs(");
 });
 const aliases=[
  ["calendar","calendar"],["company","company"],
  ["drives","drives"],["drives/new","drives/new"],
  ["drives/proposals","drives/proposals"],
  ["drives/recorded-outside","drives/recorded-outside"],
  ["drives/[jobId]/interview-slots","drives/[jobId]/interview-slots"],
  ["drives/[jobId]/messages","drives/[jobId]/messages"],
  ["drives/[jobId]/rounds/editor","drives/[jobId]/rounds/editor"],
  ["drives/[jobId]/rounds/editor/remove/[roundId]","drives/[jobId]/rounds/editor/remove/[roundId]"],
  ["home","home"],["messages","conversations"],["profile","profile"],
 ] as const;
 it.each(aliases)("HR-ALIAS-GATE-41 /recruiter/%s delegates to /hr/%s with no parallel unaudited implementation",(from,to)=>{
  const source=code("recruiter/"+from+"/page.tsx");
  expect(source).toContain('from "@/app/(authenticated)/hr/'+to+'/page"');
  expect(source).not.toContain("getDb(");
  expect(source).not.toContain("fetch(");
 });
 it("HR-ALIAS-LEGACY-41 old recruiter root and college selector do not expose independent workspaces",()=>{
  expect(code("recruiter/page.tsx")).toContain('redirect("/hr/home")');
  expect(code("recruiter/colleges/page.tsx")).toContain('redirect("/hr/home")');
  expect(code("hr/colleges/page.tsx")).toContain('redirect("/hr/home")');
  expect(code("hr/messages/page.tsx")).toContain('/hr/conversations/page');
 });
 it("HR-RECRUITER-CHANGE-41 stand-alone request page checks the COMPANY party before rendering",()=>{
  const source=code("recruiter/drives/[jobId]/change-requests/page.tsx");
  expect(source).toContain("getCurrentRequestContext()");
  expect(source).toContain("getDriveChangeRequests(context,jobId)");
  expect(source).toContain('data.party!=="COMPANY"');
  expect(source).toContain("notFound()");
  expect(source).toContain("!data.storageReady");
 });
 it("HR-FILTER-RECOVERY-41 activity, messages, drives, rounds and company reports expose recoverable invalid filters",()=>{
  for(const [route,validation,recovery] of [
   ["drives","recruiterDriveListQuerySchema.safeParse","Clear filters"],
   ["activity","hrActivityQuerySchema.safeParse","Choose again"],
   ["round-results","recruiterResultTableQuerySchema.safeParse","Invalid round filters"],
   ["company/reports","recruiterCompanyReportsQuerySchema.safeParse","Invalid report filters"],
   ["conversations","hrConversationQuerySchema.safeParse","Invalid conversation filters."],
   ["notifications","hrNotificationsQuerySchema.safeParse","Invalid inbox filter."],
  ]){
   const source=code("hr/"+route+"/page.tsx");
   expect(source).toContain(validation);
   expect(source).toContain(recovery);
  }
 });
 const privileged=[
  "issues","issues/[publicId]","logs","audit-findings",
 ];
 it.each(privileged)("TRACKER-ADMIN-ROLE-41 %s denies ordinary reporters before private database lookup",route=>{
  const source=code("tracker/"+route+"/page.tsx");
  expect(source).toContain("getCurrentRequestContext()");
  expect(source).toContain("isSuperAdmin(");
  expect(source).toContain('redirect("/dashboard")');
 });
 it("TRACKER-REPORTER-41 reporter self pages enforce live session and do not expose admin issue lists",()=>{
  for(const route of ["tracker","tracker/mine","tracker/mine/[publicId]"]){
   const source=code(route+"/page.tsx");
   expect(source).toContain("getCurrentRequestContext()");
   expect(source).toContain('redirect("/dashboard")');
   expect(source).toContain('platformStatus');
   expect(source).not.toContain("listAllIssuesUnscoped(");
  }
 });
});
