import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
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
  const [{ rows, snapshotNowIso },savedRead] = await Promise.all([
    getOwnLearnerDriveBrowse(context),
    readOptionalLearnerPlacementSource(() => listOwnPlacementSavedJobs(context)),
  ]);
  const savedJobs=savedRead.value??[];

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader title="Drives" actions={(
        <Link href="/learn/my-placements/rules?from=drives"
        className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
        Review placement rules and preparation →
      </Link>
      )} />

      
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
                <span className="block text-xs text-body">{row.roleOption.title}</span>
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
        <Suspense fallback={<PageLoading label="Loading drive filters" variant="form" count={2} />}>
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
