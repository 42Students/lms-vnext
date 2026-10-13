import {
  sortPlacementCalendarEvents,
  type PlacementCalendarEvent,
} from "./placement-calendar-model";

export type RecruiterCalendarJob = {
  id: string;
  title: string;
  status: string;
  archivedAt: Date | null;
  companyId: string;
  companyName: string;
  applicationDeadline: Date | null;
};

export type RecruiterCalendarRound = {
  id: string;
  jobId: string;
  name: string;
  kind: string;
  status: string;
  scheduledAt: Date | null;
  timezone: string | null;
  venue: string | null;
};

/**
 * Project recruiter-visible jobs and their rounds into the shared
 * placement calendar model.
 *
 * The caller supplies jobs obtained through the central
 * placements.recruiter.read authorization path. Round records
 * must be restricted to those jobs by the database query.
 *
 * This helper independently rejects unknown job IDs, draft or
 * archived jobs, inactive rounds, and out-of-window events.
 *
 * Only persisted scheduled/completed rounds and application
 * deadlines are represented. TPO follow-ups, candidate details,
 * unpublished jobs, staged results, and invented slot events
 * are deliberately excluded.
 */
export function buildRecruiterCalendarEvents(input: {
  jobs: readonly RecruiterCalendarJob[];
  rounds: readonly RecruiterCalendarRound[];
  startsAt: Date;
  endsBefore: Date;
}): PlacementCalendarEvent[] {
  const { startsAt, endsBefore } = input;

  const insideWindow = (value: Date | null) =>
    value !== null &&
    Number.isFinite(value.getTime()) &&
    value.getTime() >= startsAt.getTime() &&
    value.getTime() < endsBefore.getTime();

  const authorizedJobs = new Map(
    input.jobs
      .filter(
        (job) =>
          (job.status === "PUBLISHED" ||
            job.status === "CLOSED") &&
          job.archivedAt === null,
      )
      .map((job) => [job.id, job]),
  );

  const events: PlacementCalendarEvent[] = [];

  for (const job of authorizedJobs.values()) {
    if (!insideWindow(job.applicationDeadline)) {
      continue;
    }

    events.push({
      id: `deadline:${job.id}`,
      kind: "APPLICATION_DEADLINE",
      startsAt: job.applicationDeadline!,
      title: `Application deadline: ${job.title}`,
      companyId: job.companyId,
      companyName: job.companyName,
      jobId: job.id,
      jobTitle: job.title,
      roundId: null,
      roundKind: null,
      leadId: null,
      followupId: null,
      status: job.status,
      timezone: null,
      venue: null,
      note: null,
      completedAt: null,
    });
  }

  for (const round of input.rounds) {
    const job = authorizedJobs.get(round.jobId);

    if (
      !job ||
      (round.status !== "SCHEDULED" &&
        round.status !== "COMPLETED") ||
      !insideWindow(round.scheduledAt)
    ) {
      continue;
    }

    events.push({
      id: `round:${round.id}`,
      kind: "ROUND",
      startsAt: round.scheduledAt!,
      title: round.name,
      companyId: job.companyId,
      companyName: job.companyName,
      jobId: job.id,
      jobTitle: job.title,
      roundId: round.id,
      roundKind: round.kind,
      leadId: null,
      followupId: null,
      status: round.status,
      timezone: round.timezone,
      venue: round.venue,
      note: null,
      completedAt: null,
    });
  }

  return sortPlacementCalendarEvents(events);
}
