import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCareerRounds } from "@/components/placements/learner-career-rounds";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";

export default async function LearnerCareerCalendarPage() {
  const context = await getCurrentRequestContext();
  const workspace = await getLearnerPlacementRequestWorkspace(context);
  return <div className="space-y-6"><PageHeader eyebrow="My Placements" title="Career Calendar" description="Your upcoming assessments, interviews and other scheduled placement rounds." /><LearnerCareerRounds kind="CALENDAR" rounds={workspace.rounds.map((row) => ({ ...row, scheduledAt: row.scheduledAt?.toISOString() ?? null, exception: row.exception ? { scheduledAt: row.exception.scheduledAt.toISOString(), timezone: row.exception.timezone, mode: row.exception.mode, venue: row.exception.venue, meetingUrl: row.exception.meetingUrl } : null }))} /></div>;
}