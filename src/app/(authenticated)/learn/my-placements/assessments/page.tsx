import { Banner } from "@/components/ui/banner";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { resolveOwnAssessmentDeepLink } from "@/modules/placements/learner-assessment-deeplink-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCareerRoundsWorkspace } from "@/components/placements/learner-career-rounds-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerAssessmentBrowse } from "@/modules/placements/learner-assessment-browse-service";
import { learnerRoundSearchQuerySchema } from "@/modules/placements/learner-round-search-query-model";
import {learnerAssessmentDueBucketSchema} from "@/modules/placements/learner-assessment-due-buckets";

export default async function LearnerPlacementAssessmentsPage({searchParams}: {
  searchParams:Promise<{applicationId?:string|string[];roundId?:string|string[];q?:string|string[];due?:string|string[]}>;
}) {
  const query=await searchParams;
  // The historical Assessments bookmark was a moved-page alias to Schedule.
  // Redirect before database reads; retain modern record-specific deep links.
  if(query.applicationId===undefined&&query.roundId===undefined)
   redirect("/learn/my-placements/schedule");
  const context = await getCurrentRequestContext();
  const workspace = await getOwnLearnerAssessmentBrowse(context);
  const search=learnerRoundSearchQuerySchema.safeParse({q:query.q});
  if(!search.success)notFound();
  const due=learnerAssessmentDueBucketSchema.safeParse(query.due??"all");
  if(!due.success)notFound();
  const link=resolveOwnAssessmentDeepLink(workspace.rounds,{
    applicationId:query.applicationId,roundId:query.roundId,
  });
  if(!link.valid)notFound();
  const rounds = workspace.rounds.map((row) => ({
    ...row,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    exception: row.exception
      ? {
          scheduledAt: row.exception.scheduledAt.toISOString(),
          timezone: row.exception.timezone,
          mode: row.exception.mode,
          venue: row.exception.venue,
          meetingUrl: row.exception.meetingUrl,
        }
      : null,
  }));

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Assessments"
        description="Scheduled placement tests and assessments for your shortlisted applications."
        actions={
          <Link href="/learn/my-placements/assessments/results"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            View official assessment results →
          </Link>
        }
      />
      <details className="border-b border-border pb-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Assessment submission guidance</summary>
        <Banner tone="info" className="mt-3">
        <h2 className="m-0 font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">
          Submit assessments on the employer’s platform
        </h2>
        <p className="mt-2 text-sm text-body leading-[1.6]">
          Opening an employer assessment link does not submit your attempt or
          confirm receipt. Complete the assessment using the provider’s
          instructions. The recruiter controls official submission and results.
        </p>
        </Banner>
      </details>

      <LearnerCareerRoundsWorkspace
        key={link.key ?? "all-assessments"}
        initialSelectedKey={link.key}
        initialSearch={search.data.q}
        initialDueBucket={due.data}
        kind="ASSESSMENT"
        rounds={rounds}
        snapshotNowIso={new Date().toISOString()}
        membershipId={context.membership?.id ?? null}
      />
    </div>
  );
}
