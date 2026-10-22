import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const page=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)"+route+"/page.tsx"),"utf8");
type RouteCheck={route:string; guards:readonly string[]; states:readonly string[]};
const canonical:readonly RouteCheck[]=[
 {route:"/hr/activity",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Hiring activity"','<ErrorState title="Invalid activity filters"','<EmptyState']},
 {route:"/hr/calendar",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Calendar"','role="status"',"IST"]},
 {route:"/hr/company",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:["Company & Team","Invalid college selection","Invalid team filter","<ErrorState"]},
 {route:"/hr/company/reports",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Company & Team"',"Invalid report filters","No active college access","<HrCompanyReportsGrid"]},
 {route:"/hr/conversations",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Messages"','<ErrorState title="Invalid conversation filters"',"No conversations match your search"]},
 {route:"/hr/conversations/[threadId]",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:["No access to this college","No messages on this page","<PageHeader"]},
 {route:"/hr/drives",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:["Invalid drive filters","Drive access is not switched on","<EmptyState"]},
 {route:"/hr/drives/[jobId]/interview-slots",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Interview slots"',"No persisted employer time blocks","No"]},
 {route:"/hr/drives/[jobId]/messages",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Messages"',"No conversation has been started for this drive.","<PageHeader"]},
 {route:"/hr/drives/[jobId]/rounds/editor",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Edit hiring rounds"',"rounds.length===0","<PageHeader"]},
 {route:"/hr/drives/[jobId]/rounds/editor/remove/[roundId]",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Confirm unused round removal"',"roundId","<PageHeader"]},
 {route:"/hr/drives/new",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:["Request a drive","No college selected","<EmptyState"]},
 {route:"/hr/drives/proposals",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Sent drive proposals"',"NO_ACCESS",'role="status"']},
 {route:"/hr/drives/recorded-outside",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:["Record an outside-platform drive","External drive record saved. It was not published as a job."]},
 {route:"/hr/home",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Today"',"Invalid college selection","<EmptyState"]},
 {route:"/hr/notifications",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:['title="Notifications"',"Invalid inbox filter",'<EmptyState title="No matching notifications"']},
 {route:"/hr/placements/jobs/[jobId]",guards:["hasActiveRecruiter(context)",'title="No access to this college"'],
  states:["workspace.job.title",'role="status"',"rounds"]},
 {route:"/hr/profile",guards:["hasActiveRecruiter(context)",'title="Recruiter profile access denied"'],
  states:['title="Your Profile"',"<DataTable","No active college grants are available."]},
 {route:"/hr/round-results",guards:["hasActiveRecruiter(context)",'redirect("/dashboard")'],
  states:["Round Results","Invalid round filters","No hiring drives","No rounds yet"]},
];
describe("UX-hr-page-states-chat15-01 recruiter route coverage",()=>{
 it.each(canonical)("HR-page $route has role isolation, safe UX states and exact relevant copy",({route,guards,states})=>{
  const s=page(route);
  for(const guard of guards)expect(s).toContain(guard);
  for(const text of states)expect(s).toContain(text);
  expect(s).toContain("PageHeader");
  expect(s).not.toMatch(/<\/?(?:script|iframe)\b/);
 });
 it("HR-page /hr/messages keeps legacy Messages mapped to college-scoped conversations, not notifications",()=>{
  const s=page("/hr/messages");
  expect(s).toContain('from "@/app/(authenticated)/hr/conversations/page"');
  expect(s).not.toContain('from "@/app/(authenticated)/hr/notifications/page"');
 });
 it("HR-page /hr/colleges scopes the current college directory to authorized recruiter grants",()=>{
  const s=page("/hr/colleges");
  expect(s).toContain("hasActiveRecruiter(context)");
  expect(s).toContain("getRecruiterSelfGrantOverview(context)");
  expect(s).toContain('aria-label="Authorized colleges"');
  expect(s).toContain('<PageHeader title="Colleges"');
 });
 it("HR-page /hr/placements remains a real role-gated Drives alias",()=>{
  const s=page("/hr/placements");
  expect(s).toContain("hasActiveRecruiter");
  expect(s).toContain('redirect("/dashboard")');
  expect(s).toContain("Drives");
 });
});
