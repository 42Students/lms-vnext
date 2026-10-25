import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";

const routes=[
 ["after-college","src/app/api/placements/tpo/reports/after-college/route.ts","getTpoAfterCollegeReport("],
 ["branch-season","src/app/api/placements/tpo/reports/branch-season/export/route.ts","getTpoBranchSeasonDashboard("],
 ["engagement","src/app/api/placements/tpo/reports/engagement/route.ts","getPlacementReportWorkspace("],
 ["intelligence","src/app/api/placements/tpo/reports/intelligence/export/route.ts","getTpoPerformanceIntelligence("],
 ["round-failures","src/app/api/placements/tpo/reports/round-failures/route.ts","getPlacementFailureReasonsReport("],
 ["unplaced","src/app/api/placements/tpo/reports/unplaced/route.ts","getPlacementReportDetails("],
] as const;
describe("UX-tpo-last-third-CSV-01 private report export ambiguity and tenant contract",()=>{
 it("rejects every duplicate key independently of query order and keeps unique filter sets",()=>{
  for(const query of [
   "batchId=a&batchId=b","seasonId=a&seasonId=b",
   "jobId=a&jobId=b","branchId=a&branchId=b",
   "companyId=a&companyId=b","page=1&page=2",
   "purpose=x&purpose=y","q=a&q=b",
  ])expect(tpoReportHasRepeatedSearchParams(new URLSearchParams(query)),query).toBe(true);
  expect(tpoReportHasRepeatedSearchParams(new URLSearchParams("batchId=a&branchId=b"))).toBe(false);
  expect(tpoReportHasRepeatedSearchParams(new URLSearchParams(""))).toBe(false);
 });
 it.each(routes)("UX-tpo-last-third-CSV-02 %s rejects duplicate selectors before private read",(_name,path,service)=>{
  const s=readFileSync(path,"utf8");
  expect(s).toMatch(/tpoReportHasRepeatedSearchParams\((?:params|q)\)/);
  expect(s).toContain('error:"INVALID_QUERY"');
  expect(s).toContain('status:400');
  const check=s.indexOf("tpoReportHasRepeatedSearchParams(");
  expect(check).toBeGreaterThan(-1);
  expect(check).toBeLessThan(s.indexOf(service));
  expect(s).toContain('"Cache-Control":"private, no-store"');
  expect(s).toContain("getCurrentRequestContext");
  expect(s).not.toContain("dangerouslySetInnerHTML");
 });
 it("UX-tpo-last-third-CSV-03 after-college rejects unknown filters instead of ignoring them",()=>{
  const s=readFileSync(routes[0][1],"utf8");
  expect(s).toContain('key!=="batchId"&&key!=="branchId"');
  expect(s).toContain('params.parse({...(q.get("batchId")?{batchId:q.get("batchId")}:{}),');
  expect(s).toContain('listTpoBatches(ctx)');
  expect(s).toContain('INVALID_BATCH');
  expect(s).toContain('INVALID_BRANCH');
 });
});
