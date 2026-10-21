import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentRequestContext } from "@/auth/request-context";
import type { LearnerPlacementJobItem } from "@/components/placements/learner-placement-jobs";
import { LearnerPlacementJobDetail } from "@/components/placements/learner-placement-job-detail";
import {LearnerOwnDriveJourney} from "@/components/placements/learner-own-drive-journey";
import {getOwnLearnerDriveJourney} from "@/modules/placements/learner-historical-drive-service";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import {listOwnPlacementSavedJobs} from "@/modules/placements/saved-job-service";
import {learnerJobReturnToDrivesHref} from "@/modules/placements/learner-drives-return-model";
import {placementJobIdSchema} from "@/modules/placements/validation";

function toItem(row: Awaited<ReturnType<typeof listLearnerPlacementJobs>>[number]): LearnerPlacementJobItem {
  return {
    job: {
      id: row.job.id,
      title: row.job.title,
      description: row.job.description,
      employmentType: row.job.employmentType,
      workMode: row.job.workMode,
      locations: row.job.locations,
      openings: row.job.openings,
      minimumAnnualCtcInr: row.job.minimumAnnualCtcInr,
      maximumAnnualCtcInr: row.job.maximumAnnualCtcInr,
      applicationMode: row.job.applicationMode,
      externalApplicationUrl: row.job.externalApplicationUrl,
      applicationDeadline: row.job.applicationDeadline?.toISOString() ?? null,
      publishedAt: row.job.publishedAt?.toISOString() ?? null,
      stipendPerMonthInr:row.job.stipendPerMonthInr,
      recruiterDriveMode:row.job.recruiterDriveMode,
      campusPool:row.job.legacyPostingDetails?.campusPool??null,
      candidatePreferences:row.job.legacyPostingDetails?.candidatePreferences??null,
    },
    roleOption: {
      id: row.roleOption.id,
      title: row.roleOption.title,
      employmentType: row.roleOption.employmentType,
      workMode: row.roleOption.workMode,
      locations: row.roleOption.locations,
      openings: row.roleOption.openings,
      minimumAnnualCtcInr: row.roleOption.minimumAnnualCtcInr,
      maximumAnnualCtcInr: row.roleOption.maximumAnnualCtcInr,
      isPrimary: row.roleOption.isPrimary,
      fixedLpa:row.roleOption.fixedLpa,
      variableLpa:row.roleOption.variableLpa,
      joiningBonusLpa:row.roleOption.joiningBonusLpa,
    },
    company: row.company,
    application: row.application
      ? {
          ...row.application,
          submittedAt: row.application.submittedAt.toISOString(),
          withdrawnAt: row.application.withdrawnAt?.toISOString() ?? null,
        }
      : null,
    eligibility: row.eligibility,
    deadlinePassed: row.deadlinePassed,
    canApply: row.canApply,
    applicationBlockers: row.applicationBlockers,
  };
}

export default async function LearnerPlacementJobDetailPage({
  params,searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{back?:string|string[];returnTo?:string|string[]}>;
}) {
  const { jobId } = await params;
  const context = await getCurrentRequestContext();
  const query=await searchParams;
  const back=learnerJobReturnToDrivesHref(query.back??query.returnTo);
  // Malformed and old integer URLs never reach a UUID database query.
  if(!placementJobIdSchema.safeParse(jobId).success){
   return <div className="space-y-4">
    <PageHeader title="This job link isn't valid"
     description="The link may be outdated. Browse current drives or find your application in My applications."/>
    <div className="flex flex-wrap gap-4">
     <Link href={back} className="text-sm font-semibold text-primary-text underline">Browse drives</Link>
     <Link href="/learn/my-placements/applications" className="text-sm font-semibold text-primary-text underline">My applications</Link>
    </div>
   </div>;
  }
  const [feed,savedJobs]=await Promise.all([
    listLearnerPlacementJobs(context,new Date(),jobId),listOwnPlacementSavedJobs(context),
  ]);
  const rows=feed.filter(row=>row.job.id===jobId);
  const journey=await getOwnLearnerDriveJourney(context,jobId);
  if(rows.length===0&&!journey)notFound();
  return <div className="min-w-0 space-y-5">
   {rows.length===0 && journey ? (
    <PageHeader title="Placement drive history" description="Your recorded application journey remains available."
      actions={<Link href={back} className="inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9">← Back to drives</Link>} />
   ) : null}
   {rows.length>0?<LearnerPlacementJobDetail items={rows.map(toItem)}
    returnHref={back} initialSaved={savedJobs.some(row=>row.jobId===jobId)}/>:null}
   {journey?<LearnerOwnDriveJourney journey={journey}/>:null}
  </div>;
}
