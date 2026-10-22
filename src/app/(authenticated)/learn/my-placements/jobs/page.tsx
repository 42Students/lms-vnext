import { Banner } from "@/components/ui/banner";
import {ErrorState} from "@/components/ui/error-state";
import {AuthorizationError} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "@/modules/placements/errors";
import { PageLoading } from "@/components/ui/page-loading";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import type { LearnerPlacementJobItem } from "@/components/placements/learner-placement-jobs";
import { LearnerJobsBrowse } from "@/components/placements/learner-jobs-browse";
import { Suspense } from "react";
import { getOwnLearnerDriveBrowse } from "@/modules/placements/learner-closing-drives-service";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import {listOwnPlacementSavedJobs} from "@/modules/placements/saved-job-service";
import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
import {learnerJobDetailFromDrivesHref} from "@/modules/placements/learner-drives-return-model";

function toItem(row: Awaited<ReturnType<typeof listLearnerPlacementJobs>>[number]): LearnerPlacementJobItem {
  return {
    job: {
      id: row.job.id,
      title: row.job.title,
      description: row.job.description,
      jobTypeLabel:row.job.jobTypeLabel,
      responsibilities:row.job.legacyPostingDetails?.responsibilities??"",
      targetProgramName:row.job.targetProgramName??null,
      targetDepartmentName:row.job.targetDepartmentName??null,
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

export default async function LearnerPlacementJobsPage() {
  const context = await getCurrentRequestContext();
  const browseRead=await getOwnLearnerDriveBrowse(context)
    .then(value=>({ok:true as const,value}))
    .catch((error:unknown)=>{
      // A denied, blocked or stale session must keep its existing error
      // boundary; never turn an authorization failure into a public Retry.
      if(error instanceof AuthorizationError||error instanceof PlacementsServiceError)
        throw error;
      return {ok:false as const};
    });
  if(!browseRead.ok)return <div className="min-w-0 space-y-5">
    <h2 className="text-[18px] font-semibold text-[var(--lms-heading)]">Drives</h2>
    <ErrorState title="Placement drives unavailable"
      description="Your placement drives could not be loaded. This is not an empty jobs list. Try again."
      action={<Link href="/learn/my-placements/jobs"
        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">
        Retry loading drives
      </Link>}/>
  </div>;
  const {rows,snapshotNowIso}=browseRead.value;
  const savedRead=await readOptionalLearnerPlacementSource(
    ()=>listOwnPlacementSavedJobs(context));
  const savedJobs=savedRead.value??[];

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex min-w-0 flex-col gap-2 border-b border-[var(--lms-canvas-border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[18px] font-semibold leading-6 text-[var(--lms-heading)]">Drives</h2>
        <Link href="/learn/my-placements/rules?from=drives"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline md:min-h-9">
          Review placement rules and preparation →
        </Link>
      </div>

      
      {!savedRead.available ? (
        <section aria-label="Placement drives read-only preview" className="space-y-4">
          <Banner tone="warning" role="alert">
            Your saved jobs could not be fully loaded. Save and unsave actions are
            temporarily unavailable until the existing bookmarks can be checked.
            <Link href="/learn/my-placements/jobs"
              className="ml-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">
              Retry saved jobs
            </Link>
          </Banner>
          <p role="status" className="text-sm text-body">
            {rows.length} available role option(s) loaded. Review a published drive
            below; bookmark controls will return after a successful refresh.
          </p>
          {rows.length ? <ul className="divide-y divide-border border-y border-border">
            {rows.slice(0,50).map(row=>{
              const href=learnerJobDetailFromDrivesHref(row.job.id,"");
              return <li key={row.roleOption.id} className="py-3">
                <strong className="block text-sm font-semibold text-foreground">
                  {row.company.name} · {row.job.title}
                </strong>
                <span className="block text-xs text-body">{row.roleOption.title} · {row.roleOption.locations.length?row.roleOption.locations.join(", "):"Not specified"}</span>
                {href ? <Link href={href} className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text underline">
                  Review drive details →
                </Link> : null}
              </li>;
            })}
          </ul> : <p role="status" className="text-sm text-body">No published drives were returned.</p>}
          {rows.length>50 ? <p className="text-xs text-muted-foreground">
            Showing the first 50 role options in this read-only recovery view. Reload saved jobs to restore full filters.
          </p> : null}
        </section>
      ) : (
        <Suspense fallback={<PageLoading label="Loading placement job cards" variant="card" count={5} />}>
          <LearnerJobsBrowse items={rows.map(toItem)} snapshotNowIso={snapshotNowIso}
            savedJobIds={savedJobs.map(job=>job.jobId)}
            savedHistory={savedJobs.map(job=>({
              jobId:job.jobId,title:job.title,status:job.jobStatus,
              deadline:job.applicationDeadline?.toISOString()??null,
            }))} />
        </Suspense>
      )}
    </div>
  );
}
