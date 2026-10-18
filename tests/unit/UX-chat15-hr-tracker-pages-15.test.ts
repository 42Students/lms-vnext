import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)",path),"utf8");

describe("UX-HR-TRACKER-15 recruiter reports and tracker security boundaries",()=>{
 const recruiterPages=[
  "hr/activity/page.tsx","hr/round-results/page.tsx","hr/company/reports/page.tsx",
 ];
 it.each(recruiterPages)("UX-HR-TRACKER-15 %s checks active employer session before reading scoped data",path=>{
  const source=read(path);
  const context=source.indexOf("await getCurrentRequestContext()");
  const guard=source.indexOf("hasActiveRecruiter(context)");
  expect(context).toBeGreaterThan(-1);
  expect(guard).toBeGreaterThan(context);
  expect(source).toContain('redirect("/dashboard")');
  expect(source).toContain("safeParse");
 });
 it("HR activity never loads invalid filters or exposes a private application list",()=>{
  const source=read("hr/activity/page.tsx");
  expect(source).toContain("hrActivityQuerySchema.safeParse");
  expect(source).toContain("Invalid activity filters.");
  expect(source).toContain("Choose again");
  expect(source).toContain("listRecruiterJobActivity(context,input.data)");
  expect(source).toContain("No private applicant information.");
 });
 it("HR round results authorize the exact job before showing any round or staged data",()=>{
  const source=read("hr/round-results/page.tsx");
  expect(source).toContain("recruiterResultTableQuerySchema.safeParse");
  expect(source).toContain("Invalid round filters");
  expect(source).toContain("getRecruiterPlacementWorkspace(context,query.data.jobId)");
  expect(source).toContain('error.code==="PLACEMENT_JOB_NOT_FOUND"');
  expect(source).toContain("notFound()");
  expect(source).toContain("projectRecruiterRoundResults");
  expect(source).toContain("There are no authorized drives available for round review.");
 });
 it("company reports explicitly choose college scope and keep a retry for invalid controls",()=>{
  const source=read("hr/company/reports/page.tsx");
  expect(source).toContain("recruiterCompanyReportsQuerySchema.safeParse");
  expect(source).toContain("getRecruiterCompanyReports(");
  expect(source).toContain("Check the selected college, drive status and page values.");
  expect(source).toContain("No active college access");
  expect(source).toContain("Choose a college");
  expect(source).toContain("Reports from different college relationships are never combined.");
 });
 const adminPages=["tracker/issues/page.tsx","tracker/issues/[publicId]/page.tsx",
  "tracker/logs/page.tsx","tracker/audit-findings/page.tsx"];
 it.each(adminPages)("UX-TRACKER-ADMIN-15 %s checks global role before sensitive service access",path=>{
  const source=read(path);
  const identity=source.indexOf("await getCurrentRequestContext()");
  const guard=source.indexOf("isSuperAdmin(");
  expect(identity).toBeGreaterThan(-1);
  expect(guard).toBeGreaterThan(identity);
  expect(source).toContain('redirect("/dashboard")');
 });
 it("issue detail validates public ID then maps only genuine missing issues to 404",()=>{
  const source=read("tracker/issues/[publicId]/page.tsx");
  expect(source).toContain("trackerPublicIdSchema.safeParse(publicId)");
  expect(source).toContain('error.code === "ISSUE_NOT_FOUND"');
  expect(source).toContain("throw error;");
  expect(source).toContain("The tracker is temporarily unavailable.");
 });
 it("tracker global logs and audit findings never use a college-admin or scoped Super Admin bypass",()=>{
  const logs=read("tracker/logs/page.tsx");
  expect(logs).toContain('context.adminScope?.collegeId || context.adminScope?.organizationId');
  expect(logs).toContain("Clear the Super Admin organization/college safety scope");
  const findings=read("tracker/audit-findings/page.tsx");
  expect(findings).toContain('ctx.adminScope?.collegeId||ctx.adminScope?.organizationId');
  expect(findings).toContain('requirePermission(ctx,"admin-scope.select")');
  expect(findings).toContain("Invalid audit findings filters.");
 });
 it("tracker reporter detail guards the owner context, validates URL ID and retains retryable failures",()=>{
  const source=read("tracker/mine/[publicId]/page.tsx");
  expect(source).toContain('context.user.platformStatus!=="ACTIVE"');
  expect(source).toContain("trackerPublicIdSchema.safeParse(publicId)");
  expect(source).toContain('error.code==="ISSUE_NOT_FOUND"');
  expect(source).toContain("throw error;");
  expect(source).toContain("Reports are temporarily unavailable.");
  expect(source).toContain("Back to my reports");
 });
});
