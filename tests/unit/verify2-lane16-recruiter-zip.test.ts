import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("G2-11-002-072 legacy recruiter resume ZIP action",()=>{
 it("keeps bulk download reachable when files are shared on a different applicant page",()=>{
  const page=readFileSync("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx","utf8");
  expect(page).toContain("<RecruiterResumesZipDownload jobId={workspace.job.id}/>");
  expect(page).not.toContain("applicants.rows.some(row=>row.resumeShared)?<RecruiterResumesZipDownload");
  const zip=readFileSync("src/components/placements/recruiter-resumes-zip-download.tsx","utf8");
  expect(zip).toContain("Download resumes (ZIP)");
  expect(zip).toContain('"/applicants/resumes/export"');
 });
 it("still uses per-file authorized sharing and limits ZIP scope server-side",()=>{
  const route=readFileSync("src/app/api/placements/recruiter/jobs/[jobId]/applicants/resumes/export/route.ts","utf8");
  expect(route).toContain("hasActiveRecruiter(context)");
  expect(route).toContain("row.resumeShared");
  expect(route).toContain('row.status==="SUBMITTED"');
  expect(route).toContain("grantRecruiterSharedResume(context,jobId,id)");
  expect(route).toContain("const MAX_FILES=20");
  expect(route).toContain('"This ZIP is not the complete applicant history."');
 });
});
