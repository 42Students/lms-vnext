import Link from "next/link";
import { notFound } from "next/navigation";
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
  const context = await getCurrentRequestContext();
  const workspace = await getOwnLearnerAssessmentBrowse(context);
  const query=await searchParams;
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
        eyebrow="My Placements"
        title="Assessments"
        description="Scheduled placement tests and assessments for your shortlisted applications."
      />
      <aside role="note" className="rounded-xl border border-info/40 bg-primary-subtle p-4">
        <h2 className="m-0 text-sm font-semibold text-foreground">
          Submit assessments on the employer’s platform
        </h2>
        <p className="mt-2 text-sm leading-6 text-body">
          Opening an employer assessment link does not submit your attempt or
          confirm receipt. Complete the assessment using the provider’s
          instructions. The recruiter controls official submission and results.
        </p>
      </aside>
      <Link href="/learn/my-placements/assessments/results"
        className="inline-flex min-h-9 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
        View official assessment results →
      </Link>
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
