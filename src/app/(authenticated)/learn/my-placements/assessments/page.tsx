import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCareerRounds } from "@/components/placements/learner-career-rounds";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";

export default async function LearnerPlacementAssessmentsPage() {
  const context = await getCurrentRequestContext();
  const workspace = await getLearnerPlacementRequestWorkspace(context);
  return <div className="space-y-6"><PageHeader eyebrow="My Placements" title="Assessments" description="Scheduled placement tests and assessments for your shortlisted applications." /><LearnerCareerRounds kind="ASSESSMENT" rounds={workspace.rounds.map((row) => ({ ...row, scheduledAt: row.scheduledAt?.toISOString() ?? null, exception: row.exception ? { scheduledAt: row.exception.scheduledAt.toISOString(), timezone: row.exception.timezone, mode: row.exception.mode, venue: row.exception.venue, meetingUrl: row.exception.meetingUrl } : null }))} /></div>;
}