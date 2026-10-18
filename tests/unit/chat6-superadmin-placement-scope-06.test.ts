import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const root="src/app/(authenticated)/admin/placements";
const get=(route:string)=>readFileSync(root+route+"/page.tsx","utf8");
describe("SA-admin-middle-placement-scope-06 private Super Admin screen entrypoints",()=>{
 const cases=[
  ["/calendar",'requireSuperAdminSelectedCollege(context,"placements.read")',"return (\n    <PlacementCalendarWorkspace"],
  ["/jobs/[jobId]/schedule",'requireSuperAdminSelectedCollege(context,"placements.manage")',"listCollegeDriveInterviews(context,jobId,query)"],
  ["/jobs/[jobId]/applications",'requireSuperAdminSelectedCollege(context,"placements.manage")',"getCollegeApplicationPipeline(context,jobId,query)"],
  ["/jobs/[jobId]/settings",'requireSuperAdminSelectedCollege(context,"placements.manage")',"await getPlacementJob(context,jobId)"],
  ["/analytics",'requireSuperAdminSelectedCollege(context,"placements.read")',"getSuperAdminCompanyHiringReport(context,parsed.data)"],
  ["/retention",'requireSuperAdminSelectedCollege(context,"placements.read")',"await getSuperAdminPlacementRetentionReport(context)"],
 ] as const;
 for(const [route,gate,lookup] of cases){
  it(route+" checks persisted selected-college actor before first private lookup",()=>{
   const code=get(route);
   expect(code).toContain("getCurrentRequestContext");
   expect(code).toContain(gate);
   expect(code).toContain(lookup);
   expect(code.indexOf(gate)).toBeLessThan(code.indexOf(lookup));
  });
 }
 it("bounded hiring analytics explicitly warns that a truncated sample cannot represent total KPIs",()=>{
  const code=get("/analytics");
  expect(code).toContain("data.truncated?<p role=\"alert\"");
  expect(code).toContain("headline metrics, funnel, company totals and CSV may be incomplete");
  expect(code).toContain("Narrow the filters");
 });
});
