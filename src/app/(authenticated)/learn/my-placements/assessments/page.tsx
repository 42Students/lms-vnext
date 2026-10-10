import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCareerRounds } from "@/components/placements/learner-career-rounds";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";

export default async function LearnerPlacementAssessmentsPage() {
  const context = await getCurrentRequestContext();
  const workspace = await getLearnerPlacementRequestWorkspace(context);
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
    <div className="space-y-6">
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
      <LearnerCareerRounds kind="ASSESSMENT" rounds={rounds} />
    </div>
  );
}
