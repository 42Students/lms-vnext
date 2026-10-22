import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {buildRecruiterCompanyReportRows} from "@/modules/placements/recruiter-company-reports-model";
const source=readFileSync("src/modules/placements/recruiter-company-reports-service.ts","utf8");
describe("HR-BREAK-REPORT-JOINED-51: employer joined stage only includes accepted offers",()=>{
 it("funnel filters JOINED evidence by accepted persisted offer status",()=>{
  const section=source.split("as offered,")[1]?.split("as hired")[0]??"";
  expect(section).toContain("join placement_joining_outcomes j on j.offer_id=o.id");
  expect(section).toContain("j.status='JOINED' and o.status='ACCEPTED'");
  expect(section).not.toContain("o.status='ISSUED'");
 });
 it("page counts and entire-portfolio funnel use the identical accepted+joined interpretation",()=>{
  expect(source).toContain("where ${placementOffers.status} = 'ACCEPTED'");
  expect(source).toContain("${placementJoiningOutcomes.status} = 'JOINED'");
  const jobs=[{id:"a",title:"Role",status:"CLOSED",employmentType:"FULL_TIME",
   publishedAt:new Date("2099-01-01"),closedAt:new Date("2099-02-01")}];
  expect(buildRecruiterCompanyReportRows(jobs,[{
   jobId:"a",applications:3,submittedApplications:1,withdrawnApplications:2,
   outstandingOffers:0,acceptedOffers:1,declinedOffers:1,joinedOffers:1,
  }])[0]).toMatchObject({joinedOffers:1,acceptedOffers:1,withdrawnApplications:2});
 });
 it("retains historical college applicants in page counts after graduation or deactivation",()=>{
  const section=source.split("const reportCounts =")[1]?.split("const summaryRecord")[0]??"";
  expect(section).toMatch(/eq\(\s*collegeMemberships\.collegeId,\s*collegeId,\s*\)/);
  expect(section).toContain("eq(users.id,collegeMemberships.userId)");
  expect(section).not.toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(section).not.toContain('eq(users.platformStatus,"ACTIVE")');
  // The employer grant remains enforced at the job/relationship boundary.
  expect(source).toContain("placementCompanyRelationshipId: relationshipId");
  expect(source).toContain("eq(placementJobs.collegeId, collegeId)");
 });
 it("leaves no shared applicant names or contacts in the funnel SQL",()=>{
  const section=source.split("with jobs as (")[1]?.split("const totalFunnel")[0]??"";
  expect(section).toContain("and m.college_id=${collegeId}::uuid");
  // Status changes never rewrite historical employer hiring metrics.
  expect(section).toContain("join college_memberships m on m.id=a.membership_id");
  expect(section).toContain("join users u on u.id=m.user_id");
  expect(section).not.toContain("m.status='ACTIVE'");
  expect(section).not.toContain("u.platform_status='ACTIVE'");
  expect(section).toContain("s.status='SHORTLISTED'");
 });
});
