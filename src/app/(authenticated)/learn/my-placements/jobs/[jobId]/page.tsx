import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCurrentRequestContext } from "@/auth/request-context";
import type { LearnerPlacementJobItem } from "@/components/placements/learner-placement-jobs";
import { LearnerPlacementJobDetail } from "@/components/placements/learner-placement-job-detail";
import {LearnerJobDescriptionLink} from "@/components/placements/learner-job-description-link";
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
      jobTypeLabel: row.job.jobTypeLabel,
      responsibilities: row.job.legacyPostingDetails?.responsibilities ?? "",
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
  // Legacy returnTo carries an internal pathname; the new back parameter
  // only carries validated job-list filters. Reject arbitrary origins.
  const legacyReturn=typeof query.returnTo==="string" &&
    /^\/learn\/my-placements\/jobs(?:\?|$)/.test(query.returnTo) ? query.returnTo : "";
  const back=legacyReturn || learnerJobReturnToDrivesHref(query.back??query.returnTo);
  const shell=<>
    <Tabs renderPanel={false} ariaLabel="Placements sections" value="/learn/my-placements/jobs" items={[
      {value:"/learn/my-placements",label:"Home",href:"/learn/my-placements"},
      {value:"/learn/my-placements/jobs",label:"Jobs",href:"/learn/my-placements/jobs"},
      {value:"/learn/my-placements/applications",label:"Applications",href:"/learn/my-placements/applications"},
      {value:"/learn/my-placements/calendar",label:"Schedule",href:"/learn/my-placements/calendar"},
      {value:"/learn/my-placements/offers",label:"Offers",href:"/learn/my-placements/offers"},
      {value:"/learn/my-placements/announcements",label:"Announcements",href:"/learn/my-placements/announcements"},
      {value:"/learn/my-placements/rules",label:"Placements",href:"/learn/my-placements/rules"},
    ]}/>
  </>;
  // Malformed and old integer URLs never reach a UUID database query.
  if(!placementJobIdSchema.safeParse(jobId).success){
   return <div className="space-y-4">
    <PageHeader title="This job link isn't valid"
     description="The link may be outdated. Browse current drives or find your application in My applications."/>
    {shell}
    <div className="flex flex-wrap gap-4">
     <Link href={back} className="text-sm font-semibold text-primary-text underline">Browse drives</Link>
     <Link href="/learn/my-placements/applications" className="text-sm font-semibold text-primary-text underline">My applications</Link>
    </div>
   </div>;
  }
  const [feedResult,savedJobsResult,journeyResult]=await Promise.allSettled([
    listLearnerPlacementJobs(context,new Date(),jobId),
    readOptionalLearnerPlacementSource(()=>listOwnPlacementSavedJobs(context)),
    getOwnLearnerDriveJourney(context,jobId),
  ]);
  // A suspended account or revoked placement permission is never a soft
  // not-found; do not turn an authorization failure into a retriable 404.
  for(const source of [feedResult,savedJobsResult,journeyResult]){
    if(source.status==="rejected"&&source.reason instanceof AuthorizationError)
      throw source.reason;
  }
  const failedFeed=feedResult.status==="rejected";
  const failedJourney=journeyResult.status==="rejected";
  const savedJobs=savedJobsResult.status==="fulfilled"?savedJobsResult.value:
    {available:false as const,value:[]};
  // A failed publication lookup cannot tell us whether the link is revoked.
  // Keep its error distinct from a genuine absent/unpublished scoped drive.
  if(failedFeed)return <div className="min-w-0 space-y-4">
    <PageHeader title="My Placements" description="Opportunities and your application journey"/>
    {shell}
    <ErrorState title="We couldn't load this drive"
      description="The drive could not be checked right now. Retry before assuming it is no longer available."
      action={<nav aria-label="Drive recovery" className="flex flex-wrap gap-4">
        <Link href={"/learn/my-placements/jobs/"+encodeURIComponent(jobId)} className="inline-flex min-h-11 items-center font-semibold text-link underline">Retry loading drive</Link>
        <Link href={back} className="inline-flex min-h-11 items-center font-semibold text-link underline">Browse drives</Link>
      </nav>}/>
  </div>;
  const rows=feedResult.value.filter(row=>row.job.id===jobId);
  const journey=journeyResult.status==="fulfilled"?journeyResult.value:null;
  if(rows.length===0&&failedJourney)return <div className="min-w-0 space-y-4">
    <PageHeader title="My Placements" description="Opportunities and your application journey"/>
    {shell}
    <ErrorState title="We couldn't load this drive"
      description="Drive history could not be checked. Your earlier applications have not been treated as missing."
      action={<nav aria-label="Drive recovery" className="flex flex-wrap gap-4">
        <Link href={"/learn/my-placements/jobs/"+encodeURIComponent(jobId)} className="inline-flex min-h-11 items-center font-semibold text-link underline">Retry loading drive</Link>
        <Link href={back} className="inline-flex min-h-11 items-center font-semibold text-link underline">Browse drives</Link>
      </nav>}/>
  </div>;
  if(rows.length===0&&!journey)return <div className="min-w-0 space-y-4">
    <PageHeader title="My Placements" description="Opportunities and your application journey" />
    {shell}
    <EmptyState title="This drive can't be shown" description="The link is unavailable, unpublished, or no longer visible to your selected college. No application history for this drive could be found in your account."
      action={<nav aria-label="Other placement options" className="flex flex-wrap gap-4">
        <Link href={back} className="inline-flex min-h-11 items-center font-semibold text-link underline">Browse drives</Link>
        <Link href="/learn/my-placements/applications" className="inline-flex min-h-11 items-center font-semibold text-link underline">My applications</Link>
      </nav>} />
  </div>;
  return <div className="min-w-0 space-y-5">
   {rows.length===0 && journey ?
    <PageHeader title="Placement drive history" description="Your recorded application journey remains available."
      actions={<Link href={back} className="inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9">← Back to drives</Link>} /> : null}
   {/* Published jobs supply their own PageHeader through LearnerPlacementJobDetail.
       Do not duplicate the h1 from this route. */}
   {shell}
   {failedJourney?<Banner tone="warning" role="alert">
     Your saved drive history could not be loaded. Current published job information is available; retry before assuming there is no earlier application.
     <Link href={"/learn/my-placements/jobs/"+encodeURIComponent(jobId)} className="ml-2 font-semibold underline">Retry history</Link>
   </Banner>:null}
   {!savedJobs.available ? <Banner tone="warning" role="alert">Your saved-job status could not be verified. Bookmark controls may show an outdated selection; refresh before changing saved jobs. Drive details remain available. <Link href={"/learn/my-placements/jobs/"+encodeURIComponent(jobId)} className="font-semibold underline">Retry saved jobs</Link></Banner> : null}
   {rows.length>0 && rows.some(row => Boolean(row.job.jobDescriptionObjectPath)) ?
     <LearnerJobDescriptionLink jobId={jobId}/> : null}
   {rows.length>0?<LearnerPlacementJobDetail items={rows.map(toItem)}
    returnHref={back} initialSaved={savedJobs.available&&savedJobs.value.some(row=>row.jobId===jobId)}
    bookmarkActionsEnabled={savedJobs.available}
    journey={journey?<LearnerOwnDriveJourney journey={journey}/>:null}/>:null}
   {rows.length===0&&journey?<LearnerOwnDriveJourney journey={journey}/>:null}
  </div>;
}
