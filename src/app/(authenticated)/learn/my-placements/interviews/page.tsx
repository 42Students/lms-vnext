import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCareerRoundsWorkspace } from "@/components/placements/learner-career-rounds-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { resolveOwnInterviewDeepLink } from "@/modules/placements/learner-interview-deeplink-model";
import { learnerInterviewScheduleViewSchema } from "@/modules/placements/learner-interview-view-model";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";

export default async function LearnerPlacementInterviewsPage({ searchParams }: {
  searchParams: Promise<{
    applicationId?: string | string[];
    roundId?: string | string[];
    view?: string | string[];
  }>;
}) {
  const context = await getCurrentRequestContext();
  // Rows are membership-scoped in the placement service, not selected by a caller ID.
  const workspace = await getLearnerPlacementRequestWorkspace(context);
  const query = await searchParams;
  const view=learnerInterviewScheduleViewSchema.safeParse(query.view??"all");
  if(!view.success)notFound();
  const link = resolveOwnInterviewDeepLink(workspace.rounds, {
    applicationId:query.applicationId,roundId:query.roundId,
  });
  if (!link.valid) notFound();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="My Placements" title="Interviews"
        description="Your scheduled placement interview rounds and joining details." />
      <LearnerCareerRoundsWorkspace
        key={link.key ?? "all-interviews"}
        kind="INTERVIEW"
        initialSelectedKey={link.key}
        initialTimeView={view.data}
        snapshotNowIso={new Date().toISOString()}
        rounds={workspace.rounds.map(row => ({
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
        }))}
      />
    </div>
  );
}
