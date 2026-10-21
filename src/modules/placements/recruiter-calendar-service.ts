import "server-only";

import {
  and,
  asc,
  gte,
  inArray,
  lt,
  or,
} from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import {
  hrInterviewSlots,
  placementJobRounds,
} from "@/db/schema";

import {
  parseActivityDateBoundary,
} from "@/modules/activity/date-boundary";
import type {
  RequestContext,
} from "@/modules/identity/context";

import {
  groupPlacementCalendarEvents,
  summarizePlacementCalendar,
} from "./placement-calendar-model";
import {
  buildRecruiterCalendarEvents,
  buildRecruiterResultsDueItems,
  type RecruiterCalendarJob,
} from "./recruiter-calendar-model";
import {
  listOwnRecruiterPlacementJobs,
} from "./recruiter-service";

const DAY_MS = 24 * 60 * 60 * 1000;

export const recruiterCalendarQuerySchema = z
  .object({
    // Accept legacy offset-aware ISO instants as well as the existing
    // recruiter UI's IST-local calendar dates.
    from: z.union([z.iso.date(),z.iso.datetime({offset:true})]),
    to: z.union([z.iso.date(),z.iso.datetime({offset:true})]),
  })
  .strict()
  .superRefine((input, ctx) => {
    let start: Date;
    let end: Date;

    try {
      start = parseActivityDateBoundary(
        input.from,
        "from",
      );

      end = parseActivityDateBoundary(
        input.to,
        "to",
      );
    } catch {
      ctx.addIssue({
        code: "custom",
        path: ["from"],
        message: "Invalid calendar date",
      });
      return;
    }

    if (start.getTime() > end.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message:
          "Calendar end date must not precede the start date",
      });
      return;
    }

    const endExclusive = input.to.includes("T") ? end.getTime() : end.getTime()+1;
    if ((endExclusive - start.getTime()) > 120 * DAY_MS) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "Choose a range of up to 120 days",
      });
    }
  });

export type RecruiterCalendarQuery = z.input<
  typeof recruiterCalendarQuerySchema
>;

/**
 * Read-only recruiter calendar.
 *
 * The existing HR portfolio service supplies the complete allowlist
 * of recruiter-visible jobs. It performs central
 * placements.recruiter.read authorization, including exact college
 * and company-relationship grant checks.
 *
 * No college ID, company ID, job ID, or relationship ID is accepted
 * from request query parameters.
 *
 * Recruiters with multiple grants see only jobs authorized through
 * those grants. Recruiters with no active grants see an empty
 * calendar without any unscoped database read.
 *
 * Only round and deadline data from the authorized jobs are queried
 * or projected. No candidate, registration, external-offer or
 * college-private CRM data is accessed.
 */
export async function listRecruiterCalendarEvents(
  context: RequestContext,
  rawInput: RecruiterCalendarQuery,
  collegeId?: string,
) {
  const input =
    recruiterCalendarQuerySchema.parse(rawInput);

  const startsAt = parseActivityDateBoundary(
    input.from,
    "from",
  );

  const inclusiveEnd = parseActivityDateBoundary(
    input.to,
    "to",
  );

  // Date-only 'to' includes that entire IST day; an ISO instant is an
  // exclusive upper bound, exactly as on the legacy recruiter controller.
  const endsBefore = new Date(
    inclusiveEnd.getTime() + (input.to.includes("T") ? 0 : 1),
  );

  const authorizedRows =
    await listOwnRecruiterPlacementJobs(context, collegeId);

  const jobs: RecruiterCalendarJob[] =
    authorizedRows.map((row) => ({
      id: row.job.id,
      title: row.job.title,
      status: row.job.status,
      archivedAt: row.job.archivedAt,
      companyId: row.companyId,
      companyName: row.companyName,
      collegeName: row.collegeName,
      applicationDeadline:
        row.job.applicationDeadline,
    }));

  const authorizedJobIds = [
    ...new Set(
      jobs
        .filter(
          (job) =>
            (job.status === "PUBLISHED" ||
              job.status === "CLOSED") &&
            job.archivedAt === null,
        )
        .map((job) => job.id),
    ),
  ];

  const rounds =
    authorizedJobIds.length === 0
      ? []
      : await getDb()
          .select({
            id: placementJobRounds.id,
            jobId: placementJobRounds.jobId,
            name: placementJobRounds.name,
            kind: placementJobRounds.kind,
            status: placementJobRounds.status,
            scheduledAt:
              placementJobRounds.scheduledAt,
            durationMinutes: placementJobRounds.durationMinutes,
            timezone:
              placementJobRounds.timezone,
            venue: placementJobRounds.venue,
            resultsDueAt: placementJobRounds.resultsDueAt,
          })
          .from(placementJobRounds)
          .where(
            and(
              inArray(
                placementJobRounds.jobId,
                authorizedJobIds,
              ),
              // Published-drive rounds are visible as soon as dated, including PENDING.
              or(
                and(
                  gte(placementJobRounds.scheduledAt, startsAt),
                  lt(placementJobRounds.scheduledAt, endsBefore),
                ),
                and(
                  gte(placementJobRounds.resultsDueAt, startsAt),
                  lt(placementJobRounds.resultsDueAt, endsBefore),
                ),
              ),
            ),
          )
          .orderBy(
            asc(
              placementJobRounds.scheduledAt,
            ),
            asc(placementJobRounds.id),
          );

  const slots=authorizedJobIds.length===0?[]:await getDb()
    .select({id:hrInterviewSlots.id,jobId:hrInterviewSlots.jobId,
      roundId:hrInterviewSlots.roundId,startAt:hrInterviewSlots.startAt,
      status:hrInterviewSlots.status,timezone:hrInterviewSlots.timezone,
      meetingLocation:hrInterviewSlots.meetingLocation})
    .from(hrInterviewSlots)
    .where(and(inArray(hrInterviewSlots.jobId,authorizedJobIds),
      inArray(hrInterviewSlots.status,["PROPOSED","OFFERED","BOOKED"]),
      gte(hrInterviewSlots.startAt,startsAt),lt(hrInterviewSlots.startAt,endsBefore)))
    .orderBy(asc(hrInterviewSlots.startAt),asc(hrInterviewSlots.id));

  const resultsDue = buildRecruiterResultsDueItems({jobs,rounds,startsAt,endsBefore});

  const events = buildRecruiterCalendarEvents({
    jobs,
    rounds,
    slots,
    startsAt,
    endsBefore,
  });

  return {
    from: input.from,
    to: input.to,
    events,
    resultsDue,
    days: groupPlacementCalendarEvents(events),
    summary: summarizePlacementCalendar(
      events,
      new Date(),
    ),
    authorizedJobCount:
      authorizedJobIds.length,
  };
}
