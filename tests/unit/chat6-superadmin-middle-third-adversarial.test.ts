import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  driveApplicationsHref, driveApplicationsParams, DRIVE_APPLICATION_EXPORT_CAP,
} from "@/modules/placements/college-drive-applications-model";
import {
  readAdminQuery, superAdminReadHref, superAdminReadPages, scopedSearchLike,
} from "@/modules/admin-ui/super-admin-read-directory-model";
const source=(path:string)=>readFileSync(path,"utf8");
const jobId="11111111-1111-4111-8111-111111111111";
const departmentId="22222222-2222-4222-8222-222222222222";
const programId="33333333-3333-4333-8333-333333333333";
const cohortId="44444444-4444-4444-8444-444444444444";

describe("Chat-6 /admin middle-third read and application correctness",()=>{
 it("SA-admin-middle-applications-export-01 exports exactly the current filtered roster, not hidden candidates",()=>{
  const params=driveApplicationsParams({
   q:"test",status:"SUBMITTED",screening:"SHORTLISTED",source:"INTERNAL",
   stage:"INTERVIEW",departmentId,programId,cohortId,page:"5",
  });
  expect(params).not.toBeNull();
  const link=driveApplicationsHref(jobId,params!,true);
  expect(link).not.toContain("page=");
  const exportedSearch=new URL(link,"https://lms.test").searchParams;
  const roundtrip=driveApplicationsParams(Object.fromEntries(exportedSearch));
  expect(roundtrip).toEqual({...params,page:1});
  const route=source("src/app/api/college/placements/jobs/[jobId]/applications/export/route.ts");
  // The export route delegates complete query parsing to the shared Zod-backed
  // export parser, rather than manually reading individual search keys.
  expect(route).toContain("driveApplicationsExportParams(search)");
  expect(route).toContain("if(!parsed.ok)");
  const exportParser=source("src/modules/placements/college-drive-applications-model.ts");
  for(const key of ["q","status","screening","source","stage","departmentId","programId","cohortId"]){
   expect(exportParser).toContain('"'+key+'"');
  }
  expect(exportParser).toContain("if(!allowed.has(key)||raw[key]!==undefined)");
  expect(exportParser).toContain("const query=driveApplicationsParams(raw)");
  expect(route).toContain("exportCollegeDriveApplicationsCsv(context,jobId,query)");
  const service=source("src/modules/placements/college-drive-applications-service.ts");
  expect(service).toContain('eq(placementApplications.channel,query.source)');
  expect(service).toContain('eq(departments.id,query.departmentId)');
  expect(service).toContain('eq(programs.id,query.programId)');
  expect(service).toContain('eq(cohorts.id,query.cohortId)');
  expect(service).toContain('eq(base.stage,query.stage)');
  expect(service).toContain("DRIVE_APPLICATION_EXPORT_CAP");
  expect(DRIVE_APPLICATION_EXPORT_CAP).toBeLessThanOrEqual(1000);
  const page=source("src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx");
  expect(page).toContain("adminHref(jobId,query,true)");
 });
 it("SA-admin-middle-applications-filters-02 rejects wrong-shape and cross-tenant filter IDs before querying",()=>{
  for(const data of [
   {departmentId:"other-college"},{programId:"' OR 1=1"},{cohortId:"not-a-uuid"},
  ])expect(driveApplicationsParams(data)).toBeNull();
  for(const legacyFilter of [{source:"HACK"},{stage:"DISABLED"},{page:"0"}]){
   const normalized=driveApplicationsParams(legacyFilter);
   expect(normalized).not.toBeNull();
   expect(normalized?.source).toBe("ALL");
   expect(normalized?.stage).toBe("ALL");
   expect(normalized?.page).toBe(1);
  }
  expect(driveApplicationsParams({source:["INTERNAL","EXTERNAL"]})).toBeNull();
  const service=source("src/modules/placements/college-drive-applications-service.ts");
  expect(service).toContain("requireCollegePlacementAdmin(context)");
  expect(service).toContain("eq(placementJobs.collegeId, collegeId)");
  expect(service).toContain("eq(collegeMemberships.collegeId, collegeId)");
  expect(service).toContain("eq(departments.collegeId,collegeId)");
  const scope=source("src/modules/placements/college-drive-read-service.ts");
  expect(scope).toContain('resolveActingCollege(context,"placements.manage")');
 });
 it("SA-admin-middle-read-03 treats invalid filters as errors and limits per-page records",()=>{
  for(const input of [
   {page:"0"}, {page:"1001"}, {pageSize:"1000"},
   {status:"NOT_AUTHORIZED"}, {jobId:"other"}, {pipelineStage:"EXECUTE"},
  ])expect(readAdminQuery(input).success).toBe(false);
  const query=readAdminQuery({status:"ISSUED",page:"2",pageSize:"10",source:"EXTERNAL",pipelineStage:"INTERVIEW"});
  expect(query.success).toBe(true);
  if(!query.success)return;
  expect(superAdminReadHref("/admin/placements/offers",query.data)).toContain("page=2");
  expect(superAdminReadHref("/admin/placements/offers",query.data)).toContain("source=EXTERNAL");
  expect(superAdminReadPages(0)).toBe(1);
  expect(superAdminReadPages(101,25)).toBe(5);
  expect(scopedSearchLike("a%_b")).toBe("%a\\%\\_b%");
 });
 it("SA-admin-middle-placements-settings-01 uses IST for an instant near midnight rather than UTC calendar day",()=>{
  const nearMidnight=new Date("2026-10-18T20:00:00Z");
  const local=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(nearMidnight);
  const utc=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(nearMidnight);
  expect(local).not.toBe(utc);
  const settings=source("src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx");
  expect(settings).toContain('Application deadline (IST):');
  expect(settings).toContain("driveSettingsIstDate(job.applicationDeadline)");
  expect(source("src/modules/placements/admin-drive-settings-date-model.ts")).toContain('timeZone:"Asia/Kolkata"');
  expect(settings).not.toContain("applicationDeadline?.toISOString().slice(0,10)");
  expect(settings).toContain("<SuperAdminDriveArchive");
  expect(settings).toContain("<SuperAdminDriveDeadline");
 });
 it("SA-admin-middle-read-04 rejects missing college selection before rendering candidate-level data",()=>{
  const shared=source("src/components/admin/admin-scoped-read-page.tsx");
  expect(shared).toContain('if(!context.adminScope?.collegeId)');
  expect(shared).toContain("readAdminQuery(await searchParams)");
  expect(shared).toContain('ErrorState title="Invalid directory filters"');
  expect(shared).toContain("if(!context.adminScope?.collegeId)");
  expect(shared).toContain('title==="Registered Students"?"Select a College to manage Learners"');
  expect(shared).toContain('"Select a college to continue"');
  for(const screen of ["applications","job-settings","joining","offers","screenings","seasons"]){
   const page=source("src/app/(authenticated)/admin/placements/"+screen+"/page.tsx");
   expect(page).toContain("<AdminScopedReadPage");
  }
  // Legacy Interviews renders a candidate appointment roster rather than a generic directory.
  // It still must fail closed before loading or joining candidate-level records.
  const interviews=source("src/app/(authenticated)/admin/placements/interviews/page.tsx");
  expect(interviews).toContain("if(!context.adminScope?.collegeId)");
  expect(interviews).toContain("listSuperAdminInterviews(context,");
  expect(interviews).toContain("eq(collegeMemberships.collegeId,context.adminScope.collegeId)");
  expect(interviews).toContain("eq(departments.collegeId,context.adminScope.collegeId)");
  const hiring=source("src/app/(authenticated)/admin/placements/hiring/page.tsx");
  expect(hiring).toContain('redirect("/admin/placements/analytics"');
  expect(hiring).not.toContain("listSuperAdminApplications");
 });
});
