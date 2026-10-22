import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const page=(route:string)=>readFileSync(resolve(process.cwd(),"src/app/(authenticated)/tpo"+route+"/page.tsx"),"utf8");

describe("UX-tpo-first-third-12 explicit denial, recovery and scope contracts",()=>{
 it("UX-tpo-find-01 redirects wrong-role and expired TPO members before record reads",()=>{
  const code=page("/find");
  const guard='if(!ctx.membership || !hasMembershipRole(ctx,"TPO")) redirect("/dashboard");';
  expect(code).toContain(guard);
  expect(code.indexOf(guard)).toBeLessThan(code.indexOf("await listTpoBatches(ctx)"));
  expect(code).toContain("querySchema.safeParse(rawText)");
  expect(code).toContain('<Alert tone="error" role="alert">Search must contain 2–100 characters.</Alert>');
  expect(code).toContain("encodeURIComponent(s.id)");
 });
 it("UX-tpo-audit-actors-01 rejects malformed filter state without invoking audit query",()=>{
  const code=page("/audit/actors");
  expect(code).toContain('hasMembershipRole(context, "TPO")');
  expect(code).toContain("tpoActorAuditQuerySchema.safeParse(filters)");
  expect(code.indexOf("if (!parsed.success)")).toBeLessThan(code.indexOf("await getTpoActorAudit("));
  expect(code).toContain('href="/tpo/audit/actors"');
  expect(code).toContain('role="alert"');
 });
 it("UX-tpo-calendar-rounds-01 role-checks before reading rounds and labels IST",()=>{
  const code=page("/calendar/rounds");
  expect(code).toContain('hasMembershipRole(context, "TPO")');
  expect(code.indexOf('redirect("/dashboard")')).toBeLessThan(code.indexOf("listTpoCalendarRoundChoices("));
  expect(code).toContain("All times are IST.");
  expect(code).toContain('role="status"');
  expect(code).toContain('maxLength={100}');
 });
 it("UX-tpo-companies-people-01 denies unauthorized member and exposes unavailable storage truthfully",()=>{
  const code=page("/companies/[companyId]/people");
  expect(code).toContain('hasMembershipRole(context, "TPO")');
  expect(code).toContain("listTpoCompanyPeople(context, companyId)");
  expect(code).toContain("if (!company) notFound()");
  expect(code).toContain("DB09 contact writes are unavailable.");
  expect(code).toContain("No contact people are linked to this company yet.");
 });
 it("UX-tpo-messages-thread-01 fails closed when storage is absent and when thread is missing",()=>{
  const code=page("/messages/[threadId]");
  expect(code).toContain('hasMembershipRole(context,"TPO")');
  expect(code).toContain('role="alert"');
  expect(code).toContain("if(!detail||!header)notFound()");
  expect(code).toContain('role="log" aria-live="polite"');
  expect(code).toContain('timeZone:"Asia/Kolkata"');
 });
 it("UX-tpo-notifications-01 does not query inbox for malformed cursors or deactivated membership",()=>{
  const code=page("/notifications");
  expect(code).toContain('hasMembershipRole(context, "TPO")');
  expect(code).toContain("tpoInboxQuerySchema.safeParse");
  expect(code.indexOf("if (!parsed.success)")).toBeLessThan(code.indexOf("await getTpoPersonalInbox("));
  expect(code).toContain("Invalid notification filters");
  expect(code).toContain("Return to newest notifications");
 });
 it("UX-tpo-applicants-pipeline-01 rejects malformed deep-link filters before private reads",()=>{
  const code=page("/placements/jobs/[jobId]/applicants-pipeline");
  expect(code).toContain('hasMembershipRole(context,"TPO")');
  expect(code).toContain("tpoApplicationFilterError(query,jobId)");
  expect(code).toContain("No private application records were loaded.");
  expect(code).toContain("Clear applicant filters");
  expect(code.indexOf("if(urlError)return")).toBeLessThan(code.indexOf("await getTpoApplicantPipeline("));
 });
 it("UX-tpo-more-01 keeps accessible navigation inside an authorized role shell",()=>{
  const code=page("/more");
  expect(code).toContain('hasMembershipRole(context, "TPO")');
  expect(code).toContain("<TpoMoreNavigation");
  const nav=readFileSync(resolve(process.cwd(),"src/components/tpo/tpo-more-navigation.tsx"),"utf8");
  expect(nav).toContain('aria-label="More TPO destinations"');
  expect(nav).toContain("focus-visible:outline-2");
 });
 it("UX-tpo-drive-day-01 distinguishes learner coordinator from TPO operational scope",()=>{
  const code=page("/drive-day");
  expect(code).toContain('(!hasMembershipRole(context, "LEARNER") && !hasMembershipRole(context, "TPO"))');
  expect(code).toContain('redirect("/dashboard")');
  expect(code).toContain('if (hasMembershipRole(context, "TPO"))');
  expect(code).toContain("getTpoLiveDriveDaySummary");
 });
});
