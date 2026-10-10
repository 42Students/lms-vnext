import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { isCareerRoundVisible } from "@/modules/placements/learner-round-visibility-policy";

export type LearnerCareerRound = {
  applicationId: string;
  roundId: string;
  roundName: string;
  roundKind: string;
  testUrl: string | null;
  sequence: number;
  scheduledAt: string | null;
  timezone: string | null;
  mode: string | null;
  venue: string | null;
  meetingUrl: string | null;
  roleTitle: string;
  companyName: string;
  exception: {
    scheduledAt: string;
    timezone: string;
    mode: string;
    venue: string | null;
    meetingUrl: string | null;
  } | null;
};

function safeHref(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatWhen(value: string | null) {
  if (!value) return "Schedule pending";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(date);
}

export function LearnerCareerRounds({
  rounds,
  kind,
}: {
  rounds: readonly LearnerCareerRound[];
  kind: "ASSESSMENT" | "INTERVIEW" | "CALENDAR";
}) {
  const filtered = rounds.filter((round) =>
    isCareerRoundVisible(kind, round.roundKind),
  );

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={kind === "ASSESSMENT" ? "No assessments scheduled" : kind === "INTERVIEW" ? "No interviews scheduled" : "No career events scheduled"}
        description="Scheduled placement rounds appear here after your application is shortlisted."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {filtered.map((round) => {
        const schedule = round.exception ?? round;
        const meetingUrl = safeHref(schedule.meetingUrl);
        const assessmentLink = kind === "ASSESSMENT" ? safeHref(round.testUrl) : null;
        return (
          <article key={round.applicationId + ":" + round.roundId} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">{round.companyName}</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{round.roleTitle}</h2>
                <p className="mt-1 text-sm font-semibold text-body">Round {round.sequence} · {round.roundName}</p>
              </div>
              <StatusBadge tone="info">{schedule.mode === "VIRTUAL" ? "Virtual" : schedule.mode === "ON_CAMPUS" ? "On campus" : "Scheduled"}</StatusBadge>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-body sm:grid-cols-2">
              <p className="m-0"><span className="font-semibold text-foreground">When:</span> {formatWhen(schedule.scheduledAt)}</p>
              <p className="m-0"><span className="font-semibold text-foreground">Where:</span> {schedule.mode === "VIRTUAL" ? "Online" : schedule.venue || "Venue pending"}</p>
            </div>
            {round.exception ? <p className="mt-3 text-xs font-semibold text-warning">This schedule includes your approved reschedule request.</p> : null}
            <div className="mt-4 flex flex-wrap gap-3">
              {meetingUrl ? <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary-text">Open meeting ↗</a> : null}
              {assessmentLink ? <a href={assessmentLink} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary-text">Open employer assessment ↗</a> : null}
              <Link href={"/learn/my-placements/applications?applicationId=" + encodeURIComponent(round.applicationId)} className="text-sm font-semibold text-primary-text">View application</Link>
            </div>
            {kind === "ASSESSMENT" ? (
              <p className="mt-3 text-sm text-body" role="note">
                {assessmentLink
                  ? "Complete and submit the assessment on the employer’s platform. Opening this link does not submit your work."
                  : "The employer assessment link is not available yet. Check your placement updates for instructions."}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
