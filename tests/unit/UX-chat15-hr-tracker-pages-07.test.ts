import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const root="src/app/(authenticated)/";
const read=(path:string)=>readFileSync(join(process.cwd(),root,path),"utf8");

describe("UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts",()=>{
 const pages=[
  "hr/home/page.tsx","hr/calendar/page.tsx","hr/drives/page.tsx",
  "hr/company/page.tsx","hr/conversations/page.tsx",
  "hr/notifications/page.tsx","hr/profile/page.tsx","hr/placements/page.tsx",
 ];
 it.each(pages)("UX-HR-ROLE-07: %s rejects an inactive recruiter before private data",path=>{
  const code=read(path);
  const context=code.indexOf("await getCurrentRequestContext()");
  const guard=code.indexOf("hasActiveRecruiter(context)");
  expect(context).toBeGreaterThan(-1);
  expect(guard).toBeGreaterThan(context);
  if(path==="hr/profile/page.tsx"){
   expect(code).toContain('title="Recruiter profile access denied"');
   expect(code).toContain('href="/dashboard"');
  }else expect(code).toContain('redirect("/dashboard")');
  expect(code).toContain("<PageHeader");
 });
 it("UX-HR-INPUT-07: malformed recruiter page filters keep a visible recovery path",()=>{
  const drives=read("hr/drives/page.tsx");
  expect(drives).toContain("recruiterDriveListQuerySchema.safeParse");
  expect(drives).toContain('title="Invalid drive filters"');
  expect(drives).toContain("Clear filters");
  const company=read("hr/company/page.tsx");
  expect(company).toContain('title="Invalid college selection"');
  expect(company).toContain('title="Invalid team filter"');
  const conversations=read("hr/conversations/page.tsx");
  expect(conversations).toContain("hrConversationQuerySchema.safeParse");
  expect(conversations).toContain('title="Invalid conversation filters"');
  const notifications=read("hr/notifications/page.tsx");
  expect(notifications).toContain("hrNotificationsQuerySchema.safeParse");
  expect(notifications).toContain('title="Invalid inbox filter"');
  expect(notifications).toContain("Reset");
  const calendar=read("hr/calendar/page.tsx");
  expect(calendar).toContain("validDay(");
  expect(calendar).toContain("hrCalendarCategorySchema.safeParse");
 });
 it("UX-HR-ALIAS-07: recruiter URLs reuse the protected HR pages, not a weaker second implementation",()=>{
  for(const [alias,target] of [
   ["home","home"],["drives","drives"],["profile","profile"],
  ]){
   const source=read("recruiter/"+alias+"/page.tsx");
   if(alias==="home"){
    expect(source).toContain('import HrHome from "@/app/(authenticated)/hr/home/page"');
    expect(source).toContain("<HrHome searchParams={searchParams}/>");
   }else expect(source)
    .toContain('export { default } from "@/app/(authenticated)/hr/'+target+'/page"');
  }
  expect(read("hr/messages/page.tsx")).toContain(
   'export {default} from "@/app/(authenticated)/hr/conversations/page"');
 });
 it("UX-TRACKER-ERROR-06: ordinary reporters never see migration flags or server configuration",()=>{
  const page=read("tracker/page.tsx");
  expect(page).toContain('context.user.platformStatus!=="ACTIVE"');
  expect(page).toContain('title="Sign in to report an issue"');
  expect(page).toContain('href="/login?returnTo=%2Ftracker"');
  expect(page).toContain("Reports are temporarily unavailable.");
  expect(page).toContain("Your report has not been submitted.");
  expect(page).not.toContain("DB10_TRACKER_READY");
  expect(page).not.toContain("DB10_VERIFIED");
  expect(page).not.toContain("Migration 0076");
  expect(page).toContain("isSuperAdmin(context) && knownErrorId !== undefined ? {knownErrorId} : {}");
 });
 it("UX-TRACKER-RECOVERY-07: reporters get meaningful empty, failed and retryable states",()=>{
  const mine=read("tracker/mine/page.tsx");
  expect(mine).toContain('context.user.platformStatus!=="ACTIVE"');
  expect(mine).toContain("We could not load your reports.");
  expect(mine).toContain('href="/tracker/mine"');
  expect(mine).toContain("Retry");
  expect(mine).toContain("You have not reported any issues yet.");
  expect(mine).toContain('href="/tracker"');
  expect(mine).toContain("trackerAdminRuntimeEnabled()");
 });
});
