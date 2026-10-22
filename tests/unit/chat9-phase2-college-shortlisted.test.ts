import {describe,expect,it} from "vitest";
import {collegeShortlistedQuery,collegeShortlistedHref} from "@/modules/placements/college-shortlisted-query";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const id="7b515d51-4f53-4d09-a606-365c44cd77cb";
describe("college shortlisted route",()=>{
  it("accepts bounded search and strict paging only",()=>{
    expect(collegeShortlistedQuery({q:"A",page:"2"}).success).toBe(true);
    expect(collegeShortlistedQuery({screening:"REJECTED"}).success).toBe(false);
    expect(collegeShortlistedQuery({page:["1","2"]}).success).toBe(false);
    expect(collegeShortlistedHref(id,{q:"A B",page:3})).toContain("q=A+B&page=3");
  });
  it("enforces submitted applications and explicit pipeline stage through the authorized college applicant read",()=>{
    const src=readFileSync(join(process.cwd(),
      "src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx"),"utf8");
    expect(src).toContain('hasMembershipRole(context, "COLLEGE_ADMIN")');
    expect(src).toContain('status: "SUBMITTED"');
    expect(src).toContain('stage: requested["stage"] ?? "ASSESSMENT"');
    expect(src).toContain('screening: "ALL"');
    // The stage-aware pipeline service is the authorized college applicant read.
    // Drive metadata is resolved only AFTER that service establishes collegeId,
    // then explicitly scoped by job and college (not a global applicant feed).
    expect(src).toContain("getCollegeApplicationPipeline(context, jobId, query)");
    expect(src).toContain("eq(placementCompanyRelationships.collegeId,data.collegeId)");
    expect(src).toContain("eq(placementJobs.collegeId,data.collegeId)");
    expect(src).not.toContain("listAllApplications(");
  });
});
