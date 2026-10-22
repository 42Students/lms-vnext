import {describe,expect,it} from "vitest";
import {collegeShortlistedQuery,collegeShortlistedHref} from "@/modules/placements/college-shortlisted-query";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("College Admin shortlist page recovery",()=>{
  const id="7b515d51-4f53-4d09-a606-365c44cd77cb";
  it("round-trips an exact search and resets overrun pages to known valid values",()=>{
    expect(collegeShortlistedHref(id,{q:"Ana & Co",page:1})).toContain("q=Ana+%26+Co");
    expect(collegeShortlistedQuery({q:"test",page:"1001"}).success).toBe(false);
    expect(collegeShortlistedQuery({page:"0"}).success).toBe(false);
  });
  it("recovers a stale bookmark only after an authorized scoped read",()=>{
    const src=readFileSync(join(process.cwd(),
      "src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx"),"utf8");
    const guard=src.search(/hasMembershipRole\(context,\s*"COLLEGE_ADMIN"\)/);
    const scopedRead=src.indexOf("getCollegeApplicationPipeline(context, jobId, query)");
    const recovery=src.indexOf("if (query.page > data.totalPages) redirect(");
    expect(guard).toBeGreaterThan(0);
    expect(scopedRead).toBeGreaterThan(guard);
    expect(recovery).toBeGreaterThan(scopedRead);
    expect(src).toContain("redirect(href({ ...query, page: data.totalPages }))");
  });
});
