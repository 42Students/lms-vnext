import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 buildRecruiterCompanyReportRows,
 clampRecruiterCompanyReportPage,
 recruiterCompanyReportsQuerySchema,
} from "@/modules/placements/recruiter-company-reports-model";

describe("HR-REPORT-ARCHIVE-31 published/closed company report portfolio parity",()=>{
 it("summary, selected rows, and funnel all use the same nonarchived scoped job predicate",()=>{
  const source=readFileSync(
   "src/modules/placements/recruiter-company-reports-service.ts","utf8");
  const condition=source.slice(source.indexOf("const visibleCondition"),
   source.indexOf("const selectedCondition"));
  expect(condition).toContain("eq(placementJobs.collegeId, collegeId)");
  expect(condition).toContain("placementJobs.companyRelationshipId,");
  expect(condition).toContain('["PUBLISHED", "CLOSED"]');
  expect(condition).toContain("isNull(placementJobs.archivedAt)");
  expect(source).toContain("where(visibleCondition)");
  expect(source).toContain("where(selectedCondition)");
  expect(source).toContain("where college_id=${collegeId}::uuid");
  expect(source).toContain("company_relationship_id=${relationshipId}::uuid");
  expect(source).toContain("and status in ('PUBLISHED','CLOSED') and archived_at is null");
 });
 it("a removed drive from another page cannot shift the remaining report's applicant counts",()=>{
  const live={id:"active",title:"Engineer",status:"PUBLISHED",
   employmentType:"FULL_TIME",publishedAt:new Date("2099-01-01T00:00:00Z"),
   closedAt:null};
  const rows=buildRecruiterCompanyReportRows([live],[{
   jobId:"archived",applications:15,submittedApplications:15,
   withdrawnApplications:0,outstandingOffers:4,acceptedOffers:2,
  }]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({id:"active",applications:0,outstandingOffers:0});
  expect(clampRecruiterCompanyReportPage(5,1,25)).toBe(1);
  expect(recruiterCompanyReportsQuerySchema.safeParse({status:"ARCHIVED"}).success).toBe(false);
 });
 it("HR-REPORT-MEMBER-42 retains historically authorized college applicants without exposing other tenants",()=>{
  const source=readFileSync("src/modules/placements/recruiter-company-reports-service.ts","utf8");
  const aggregation=source.slice(source.indexOf("const reportCounts"),
   source.indexOf("const summaryRecord"));
  expect(aggregation).toMatch(/collegeMemberships\.collegeId,\s*collegeId/);
  expect(aggregation).not.toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(aggregation).toMatch(/eq\(users\.id,\s*collegeMemberships\.userId\)/);
  expect(aggregation).not.toContain('eq(users.platformStatus,"ACTIVE")');
  // Shortlist stage is computed in the funnel, not the per-job offer tally.
  expect(source).toContain("where s.status='SHORTLISTED'");
  const funnel=source.slice(source.indexOf("const funnelRows="));
  expect(funnel).toContain("and m.college_id=${collegeId}::uuid");
  expect(funnel).not.toContain("m.status='ACTIVE'");
  expect(funnel).toContain("join users u on u.id=m.user_id");
  expect(funnel).not.toContain("u.platform_status='ACTIVE'");
  expect(funnel).toContain("s.application_id=a.id");
  expect(funnel).toContain("where s.status='SHORTLISTED'");
  expect(source).toContain("matchedTotal = selectedTotal");
 });
});
