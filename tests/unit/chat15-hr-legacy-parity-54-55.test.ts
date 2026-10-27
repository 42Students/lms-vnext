import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterDriveListQuerySchema}
 from "@/modules/placements/recruiter-drive-list-model";

const page=(route:string)=>readFileSync(
 "src/app/(authenticated)/"+route+"/page.tsx","utf8");

describe("HR legacy inventory B explicit UNKNOWN routes, source parity audit",()=>{
 it("HR-PARITY-54 legacy Closed drives tab reaches the actual scoped recruiter filter",()=>{
  const drives=page("hr/drives");
  const alias=page("recruiter/drives");
  expect(alias).toContain('from "@/app/(authenticated)/hr/drives/page"');
  expect(drives).toContain('case "closed":return "CLOSED"');
  expect(drives).toContain("legacyDriveTab(first(raw.tab))");
  expect(drives).toContain("recruiterDriveListQuerySchema.safeParse");
  expect(drives).toContain("searchOwnRecruiterDrives");
  const parsed=recruiterDriveListQuerySchema.safeParse({view:"CLOSED"});
  expect(parsed.success).toBe(true);
  if(parsed.success)expect(parsed.data.view).toBe("CLOSED");
  expect(recruiterDriveListQuerySchema.safeParse({view:"TPO_INTERNAL"}).success).toBe(false);
 });
 it("HR-PARITY-55 legacy job Requests tab is mapped after the scoped hiring read",()=>{
  const job=page("hr/placements/jobs/[jobId]");
  const alias=page("recruiter/drives/[jobId]");
  expect(alias).toContain('from "@/app/(authenticated)/hr/placements/jobs/[jobId]/page"');
  const authorize=job.indexOf("getHrJobRead(context, jobId");
  const resolve=job.indexOf('const requestsTab=query.tab==="requests"');
  const load=job.indexOf("getDriveChangeRequests(context,workspace.job.id)");
  expect(authorize).toBeGreaterThan(-1);
  expect(resolve).toBeGreaterThan(authorize);
  expect(load).toBeGreaterThan(resolve);
  // The legacy request surface is now its own authorized tab instead of
  // being hidden inside the employer messaging Discussion panel.
  expect(job).toContain('href:"/recruiter/drives/"+workspace.job.id+"?tab=requests"');
  expect(job).toContain('href:"/recruiter/drives/"+workspace.job.id+"?tab=discussion"');
  expect(job).toContain('const discussionTab=query.tab==="discussion"');
  expect(job).toContain('const requestData=requestsTab||discussionTab?');
  expect(job).toContain('requestsTab&&requestData?.party==="COMPANY"');
  expect(job).toContain('<TpoDriveChangeRequests');
  expect(job).toContain('jobId={workspace.job.id} party="COMPANY"');
 });
 it("HR-PARITY-55 direct change-request page rejects the TPO party with the same 404 as missing jobs",()=>{
  const direct=page("recruiter/drives/[jobId]/change-requests");
  expect(direct).toContain("getDriveChangeRequests(context,jobId)");
  expect(direct).toContain('if(data.party!=="COMPANY")notFound()');
  expect(direct).toContain('e.code==="PLACEMENT_JOB_NOT_FOUND"');
  expect(direct).toContain("notFound()");
 });
});
