import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("UX-hr-data-tables-chat15-01 responsive authorized data",()=>{
 it("UX-hr-profile-02 shows all grant fields in one accessible DataTable instead of nested mobile scrollers",()=>{
  const s=source("src/app/(authenticated)/hr/profile/page.tsx");
  expect(s).toContain('import { DataTable } from "@/components/ui/data-table"');
  expect(s).toContain('caption="Current college access"');
  expect(s).toContain("rows={overview.grants}");
  expect(s).toContain("getRowKey={grant => grant.id}");
  for(const label of ["College","Access status","Company relationship","Granted on (IST)","Access validity",
    "No active college grants are available.","The placement cell can extend it.",
    "This table does not change or revoke access."])expect(s).toContain(label);
  expect(s).not.toContain("<table");
  expect(s).not.toContain('role="region" aria-label="Profile table"');
 });
 it("UX-hr-company-reports-02 uses one shared table for authorized drives, including responsive collapsed metrics",()=>{
  const s=source("src/app/(authenticated)/hr/company/reports/page.tsx");
  expect(s).toContain('<HrCompanyReportsGrid');
  expect(s).toContain('rows={jobs.map(job=>({');
  expect(s).toContain('scopeKey={[context.user.id,collegeId].join(":")}');
  for(const label of ["No matching drives","Hiring activity by drive",
    "applications:job.applications","submittedApplications:job.submittedApplications",
    "withdrawnApplications:job.withdrawnApplications","outstandingOffers:job.outstandingOffers",
    "acceptedOffers:job.acceptedOffers","declinedOffers:job.declinedOffers",
    "joinedOffers:job.joinedOffers","recruiterCompanyReportsQuerySchema",
    "hasActiveRecruiter"])expect(s).toContain(label);
  expect(s).not.toContain("<table");
  expect(s).not.toContain('className="grid gap-3 md:hidden"');
 });
 it("UX-hr-data-table-scroll-01 scrolls with truthful keyboard and fade cues, mobile secondary details and 44px recovery links",()=>{
  const s=source("src/components/ui/data-table.tsx");
  expect(s).toContain('axis="x"');
  expect(s).toContain("min-h-11");
  expect(s).toContain("More details");
  expect(s).toContain("mobilePriority");
  expect(s).toContain("caption");
  const cue=source("src/components/ui/scroll-cue.tsx");
  expect(cue).toContain("overscroll-x-contain");
  expect(cue).toContain('data-scroll-fade="end"');
 });
});
