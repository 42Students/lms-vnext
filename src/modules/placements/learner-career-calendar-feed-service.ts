import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementJobs,placementCompanyRelationships,placementCompanies} from "@/db/schema";
import { listLearnerPlacementJobs } from "./learner-job-service";
import {importedImportantDateSourceState} from "./job-important-date-adapter";
import { careerDayKey,legacyJobImportantDatesToSupplements,
 type CareerCalendarSupplement } from "./learner-career-calendar-model";

/** Deadline feed comes from the cohort- and section-scoped learner job reader,
 * never a global scan of unpublished or cross-college drives. College exam
 * dates are loaded independently by learner-calendar-extras-service. */
export async function loadLearnerCareerCalendarSupplements(
  context: RequestContext,
): Promise<{ supplements: CareerCalendarSupplement[]; warnings: string[]; dateSourceSummary: { available: number; empty: number; unsupported: number; invalid: number } }> {
  const now = new Date();
  const jobs = await listLearnerPlacementJobs(context, now);
  const supplements: CareerCalendarSupplement[] = [];
  const warnings: string[] = [];
  const dateSourceSummary={available:0,empty:0,unsupported:0,invalid:0};
  const observedDateJobs=new Set<string>();
  const observeSource=(jobId:string,details:unknown)=>{
    if(observedDateJobs.has(jobId))return;
    observedDateJobs.add(jobId);
    const state=importedImportantDateSourceState(details);
    if(state==="AVAILABLE")dateSourceSummary.available++;
    else if(state==="EMPTY")dateSourceSummary.empty++;
    else if(state==="INVALID")dateSourceSummary.invalid++;
    else dateSourceSummary.unsupported++;
  };
  const historicalJobIds = new Set<string>();
  const appliedJobIds = new Set(
    jobs.filter(row => row.application !== null).map(row => row.job.id),
  );
  const seen = new Set<string>();
  const through = careerDayKey(new Date(now.getTime() + 366 * 86_400_000));
  for (const row of jobs) {
    const job = row.job;
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    observeSource(job.id,job.legacyPostingDetails);
    // Important dates in currently eligible/discoverable jobs belong on the
    // learner calendar even before application. An applied job is projected
    // only by the private application-history query below, so each source
    // index is emitted once rather than duplicated across the two feeds.
    if(!appliedJobIds.has(job.id)){
      const details=job.legacyPostingDetails?.importantDates;
      if(Array.isArray(details)){
        const dates=legacyJobImportantDatesToSupplements({
          jobId:job.id,companyName:row.company.name,roleTitle:job.title,
          importantDates:details,
        });
        const room=Math.max(0,500-supplements.length);
        supplements.push(...dates.slice(0,room));
        if(dates.length>room)warnings.push(
          "Showing the first 500 upcoming job calendar items. View Jobs for more dates.");
      }
    }
    const deadline = job.applicationDeadline;
    if (!deadline || deadline.getTime() < now.getTime() ||
        appliedJobIds.has(job.id)) continue;
    const day = careerDayKey(deadline);
    if (day > through) continue;
    supplements.push({
      key: job.id, jobId:job.id, kind: "APPLICATION_DEADLINE", day,
      title: "Apply by " + day,
      companyName: row.company.name,
      roleTitle: job.title,
      visible: true, applied: false,
    });
    if (supplements.length >= 500) {
      warnings.push("Showing the first 500 upcoming job deadlines. View Jobs for the full list.");
      break;
    }
  }
  // Applied-job history is owned by this learner, not by the current cohort's
  // published/targeted job discovery. An older applied drive may be closed or
  // archived and must still contribute its historic interview/application
  // milestones. Do not grant fresh job visibility from this history query.
  const member=context.membership;
  if(member){
   const past=await getDb().select({
    applicationId:placementApplications.id,
    submittedAt:placementApplications.submittedAt,
    jobId:placementJobs.id,jobTitle:placementJobs.title,
    deadline:placementJobs.applicationDeadline,
    posting:placementJobs.legacyPostingDetails,
    companyName:placementCompanies.name,
   }).from(placementApplications)
    .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
    .innerJoin(placementCompanyRelationships,
      eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
    .innerJoin(placementCompanies,
      eq(placementCompanies.id,placementCompanyRelationships.companyId))
    .where(and(eq(placementApplications.membershipId,member.id),
      eq(placementJobs.collegeId,member.collegeId),
      eq(placementCompanyRelationships.collegeId,member.collegeId)))
    .orderBy(desc(placementApplications.submittedAt),desc(placementApplications.id))
    .limit(501);
   if(past.length>500)warnings.push(
    "Showing calendar history for the 500 most recent applications. Open Applications for older records.");
   const seenHistory=new Set<string>();
   for(const row of past.slice(0,500)){
    historicalJobIds.add(row.jobId);
    if(seenHistory.has(row.jobId))continue;
    seenHistory.add(row.jobId);
    observeSource(row.jobId,row.posting);
    const details=row.posting?.importantDates;
    if(Array.isArray(details)){
     supplements.push(...legacyJobImportantDatesToSupplements({
      jobId:row.jobId,companyName:row.companyName,roleTitle:row.jobTitle,
      importantDates:details,
     }));
    }
    // Keep the historical application deadline even if the job is no longer
    // discoverable or the learner applied before that date.
    if(row.deadline){
     supplements.push({
      key:row.jobId+":own-past-deadline",jobId:row.jobId,
      kind:"JOB_IMPORTANT_DATE",day:careerDayKey(row.deadline),
      title:"Application deadline · "+row.jobTitle,
      companyName:row.companyName,roleTitle:row.jobTitle,
      visible:true,applied:true,note:"Historical deadline for your application",
     });
    }
   }
  }
  // One job belongs to one source in the calendar union. Historical owned
  // applications supersede discoverable-job previews, so a job deadline or
  // imported important date is not projected twice under different keys.
  const merged = supplements.filter(item => {
    const jobId = item.jobId;
    return item.applied || jobId == null || !historicalJobIds.has(jobId);
  });
  if(dateSourceSummary.invalid>0)
    warnings.push("Some imported job dates could not be verified. Check the affected job details.");
  return { supplements:merged, warnings, dateSourceSummary };
}
