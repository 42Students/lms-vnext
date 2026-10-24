import {
  sortPlacementCalendarEvents,
  type PlacementCalendarEvent,
} from "./placement-calendar-model";

/** A round ends only when its persisted duration is a valid positive number
 * of minutes. Never guess an end time from a missing or malformed value. */
export function recruiterRoundEndTime(
  start: Date | null, durationMinutes: number | null | undefined,
): Date | null {
  if (!start || !Number.isFinite(start.getTime()) ||
      durationMinutes == null || !Number.isInteger(durationMinutes) ||
      durationMinutes <= 0 || durationMinutes > 24 * 60) return null;
  return new Date(start.getTime() + durationMinutes * 60_000);
}

export const RECRUITER_CALENDAR_EVENT_STYLE={
 ROUND:{label:"Round",color:"blue"},
 INTERVIEW_SLOT:{label:"Interview slot",color:"green"},
 APPLICATION_DEADLINE:{label:"Deadline",color:"orange"},
 RESULTS_DUE:{label:"Results due",color:"gold"},
} as const;
export type RecruiterCalendarJob = {
  id: string;
  title: string;
  status: string;
  archivedAt: Date | null;
  companyId: string;
  companyName: string;
  collegeName?: string | null;
  applicationDeadline: Date | null;
};

export type RecruiterCalendarRound = {
  id: string;
  jobId: string;
  name: string;
  kind: string;
  status: string;
  scheduledAt: Date | null;
  durationMinutes?: number | null;
  timezone: string | null;
  venue: string | null;
  resultsDueAt?: Date | null;
};

export type RecruiterCalendarSlot = {
 id:string; jobId:string; roundId:string; startAt:Date;
 status:string; timezone:string; meetingLocation:string|null;
};

/**
 * Legacy recruiter calendar projection: ROUND→ROUND (round:<UUID>), SLOT→
 * INTERVIEW_SLOT (slot:<UUID>), DEADLINE→APPLICATION_DEADLINE (deadline:<job UUID>).
 * Legacy RESULTS_DUE is kept in buildRecruiterResultsDueItems as distinct
 * round-ID keyed reminders, not fabricated dated interview slots. Source
 * jobId maps to an authorized placement job UUID; start→startsAt and optional
 * end→endsAt (only if persisted duration), where→venue, status and timezone
 * remain from persisted round/slot, not caller-supplied labels. Filtered-out
 * canceled, draft, archived or cross-college events never receive IDs.
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
 * unpublished jobs and staged results are excluded. Slots come from persisted rows.
 */
export function buildRecruiterCalendarEvents(input: {
  jobs: readonly RecruiterCalendarJob[];
  rounds: readonly RecruiterCalendarRound[];
  slots?: readonly RecruiterCalendarSlot[];
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
  // Slots are already read under the recruiter grant in the calendar service.
  const slotCounts=new Map<string,number>();
  for(const slot of input.slots??[]){
    if(!authorizedJobs.has(slot.jobId)||!insideWindow(slot.startAt)||
      !["PROPOSED","OFFERED","BOOKED"].includes(slot.status))continue;
    slotCounts.set(slot.roundId,(slotCounts.get(slot.roundId)??0)+1);
  }

  for (const job of authorizedJobs.values()) {
    if (!insideWindow(job.applicationDeadline)) {
      continue;
    }

    events.push({
      id: `deadline:${job.id}`,
      kind: "APPLICATION_DEADLINE",
      startsAt: job.applicationDeadline!,
      title: `Applications close`,
      companyId: job.companyId,
      companyName: job.companyName,
      collegeName: job.collegeName ?? null,
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
      (round.status === "CANCELLED") ||
      !insideWindow(round.scheduledAt)
    ) {
      continue;
    }

    events.push({
      id: `round:${round.id}`,
      kind: "ROUND",
      startsAt: round.scheduledAt!,
      endsAt: recruiterRoundEndTime(round.scheduledAt, round.durationMinutes),
      title: round.name,
      companyId: job.companyId,
      companyName: job.companyName,
      collegeName: job.collegeName ?? null,
      jobId: job.id,
      jobTitle: job.title,
      roundId: round.id,
      roundKind: round.kind,
      leadId: null,
      followupId: null,
      status: round.status,
      timezone: round.timezone,
      venue: round.venue,
      note:slotCounts.has(round.id)
        ? `${slotCounts.get(round.id)} interview slot${slotCounts.get(round.id)===1?"":"s"}`
        : null,
      completedAt: null,
    });
  }

  for (const slot of input.slots ?? []) {
    const job = authorizedJobs.get(slot.jobId);
    if (!job || !insideWindow(slot.startAt) ||
        !["PROPOSED","OFFERED","BOOKED"].includes(slot.status)) continue;
    events.push({
      id:`slot:${slot.id}`,kind:"INTERVIEW_SLOT",startsAt:slot.startAt,
      title:"Interview slot",companyId:job.companyId,companyName:job.companyName,
      collegeName:job.collegeName??null,jobId:job.id,jobTitle:job.title,roundId:slot.roundId,roundKind:"INTERVIEW",
      leadId:null,followupId:null,status:slot.status,timezone:slot.timezone,
      venue:slot.meetingLocation,note:null,completedAt:null,
    });
  }
  return sortPlacementCalendarEvents(events);
}

/** Employer-visible results due dates. No candidate-level data or imaginary
 * interview slots are exposed. Dates are absolute instants, displayed in IST. */
export function buildRecruiterResultsDueItems(input: {
  jobs: readonly RecruiterCalendarJob[];
  rounds: readonly RecruiterCalendarRound[];
  startsAt: Date;
  endsBefore: Date;
}) {
  const authorized = new Map(input.jobs.filter(job =>
    job.archivedAt === null && (job.status === "PUBLISHED" || job.status === "CLOSED")
  ).map(job => [job.id, job]));
  return input.rounds.flatMap(round => {
    const job = authorized.get(round.jobId);
    const due = round.resultsDueAt;
    if (!job || !due || (round.status !== "SCHEDULED" && round.status !== "COMPLETED") ||
      !Number.isFinite(due.getTime()) ||
      due.getTime() < input.startsAt.getTime() || due.getTime() >= input.endsBefore.getTime()) return [];
    return [{ id:round.id, jobId:round.jobId, jobTitle:job.title,
      roundName:round.name,roundKind:round.kind,dueAt:due,status:round.status,
      category:"RESULTS_DUE" as const,label:"Results due" as const,
      color:"gold" as const }];
  }).sort((a,b)=>a.dueAt.getTime()-b.dueAt.getTime()||a.id.localeCompare(b.id));
}
