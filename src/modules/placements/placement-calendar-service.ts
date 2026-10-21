import {
  and,
  asc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
} from "drizzle-orm";
import { z } from "zod";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import {sql} from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  placementCompanies,
  placementCompanyRelationships,
  placementJobRounds,
  placementJobs,
  placementTpoFollowups,
  placementTpoLeads,
} from "@/db/schema";

import { parseActivityDateBoundary } from "@/modules/activity/date-boundary";
import {importedJobImportantDates} from "./job-important-date-adapter";
import type { RequestContext } from "@/modules/identity/context";

import { requirePlacementManageScope } from "./scope";
import {
  createPlacementJobInputSchema,
  placementCompanyIdSchema,
  placementRoundKinds,
} from "./validation";

import {
  PLACEMENT_CALENDAR_KINDS,
  groupPlacementCalendarEvents,
  sortPlacementCalendarEvents,
  summarizePlacementCalendar,
  type PlacementCalendarEvent,
} from "./placement-calendar-model";

const DAY_MS = 24 * 60 * 60 * 1000;

const calendarDateSchema = z.iso
  .date()
  .refine((value) => {
    try {
      parseActivityDateBoundary(value, "from");
      return true;
    } catch {
      return false;
    }
  }, "Use a valid calendar date");

export const placementCalendarQuerySchema = z
  .object({
    collegeId:
      createPlacementJobInputSchema.shape.collegeId,

    from: calendarDateSchema,
    to: calendarDateSchema,

    companyId:
      placementCompanyIdSchema.optional(),

    // Supports free-text company filtering, including
    // recruiter leads not yet linked to a company record.
    company: z
      .string()
      .trim()
      .min(1)
      .max(150)
      .optional(),

    kind: z
      .enum(PLACEMENT_CALENDAR_KINDS)
      .optional(),

    // For interview-only calendars or specific round types.
    roundKind: z
      .enum(placementRoundKinds)
      .optional(),
    includeDraftDeadlines:z.boolean().optional(),
    tpoLegacyScope:z.boolean().optional(),
  })
  .strict()
  .superRefine((input, ctx) => {
    const start = parseActivityDateBoundary(
      input.from,
      "from",
    );

    const end = parseActivityDateBoundary(
      input.to,
      "to",
    );

    if (start.getTime() > end.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message:
          "Calendar end date must not precede the start date",
      });
    }

    const inclusiveDays =
      Math.floor(
        (end.getTime() -
          start.getTime() +
          1) /
          DAY_MS,
      );

    if (inclusiveDays > 366) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message:
          "Calendar requests cannot exceed 366 days",
      });
    }

    if (
      input.roundKind &&
      input.kind &&
      input.kind !== "ROUND" && input.kind !== "INTERVIEW_SLOT"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["roundKind"],
        message:
          "Round kind requires the ROUND or INTERVIEW_SLOT event category",
      });
    }
  });

export type PlacementCalendarQuery = z.input<
  typeof placementCalendarQuerySchema
>;

export type PlacementCalendarResult = {
  from: string;
  to: string;
  events: PlacementCalendarEvent[];
  days: ReturnType<
    typeof groupPlacementCalendarEvents
  >;
  summary: ReturnType<
    typeof summarizePlacementCalendar
  >;
};

/**
 * PostgreSQL LIKE wildcards must not turn a company name
 * into an unintended broad match.
 */
function companySearchPattern(value: string) {
  return (
    "%" +
    value.replace(
      /[\\%_]/g,
      "\\$&",
    ) +
    "%"
  );
}

/**
 * Shared, read-only calendar for TPO and College Admin.
 *
 * Every source is college-scoped before rows are projected.
 * The central placements.manage permission admits TPO,
 * College Admin and an authorized SUPER_ADMIN acting in
 * the selected college. It does not admit learners or HR.
 *
 * All instants are queried with an inclusive IST day start
 * and an exclusive next-day boundary.
 *
 * DRAFT job deadlines are excluded by default; TPO Home may explicitly include
 * internal draft deadlines to plan the next week. ARCHIVED deadlines never appear.
 * Published job deadlines are actionable calendar
 * events. CANCELLED/PENDING rounds have no active interview
 * slot. Historical completed rounds and completed follow-ups
 * remain visible with their persisted status.
 */
export async function listPlacementCalendarEvents(
  context: RequestContext,
  rawInput: PlacementCalendarQuery,
): Promise<PlacementCalendarResult> {
  const input =
    placementCalendarQuerySchema.parse(
      rawInput,
    );

  const college =
    await requirePlacementManageScope(
      context,
      input.collegeId,
    );

  const startsAt = parseActivityDateBoundary(
    input.from,
    "from",
  );

  const inclusiveEnd =
    parseActivityDateBoundary(
      input.to,
      "to",
    );

  const endsBefore = new Date(
    inclusiveEnd.getTime() + 1,
  );

  const companyPattern = input.company
    ? companySearchPattern(input.company)
    : undefined;

  const readRounds =
    !input.kind || input.kind === "ROUND";

  const readDeadlines =
    !input.kind ||
    input.kind === "APPLICATION_DEADLINE"||input.kind==="JOB_IMPORTANT_DATE";

  const readFollowups =
    !input.kind ||
    input.kind === "FOLLOW_UP";

  // With a round subtype filter, only rounds qualify.
  const includeRounds = readRounds;
  const includeDeadlines =
    readDeadlines && !input.roundKind;
  const includeFollowups =
    readFollowups && !input.roundKind;

  const db = getDb();

  const [roundRows, deadlineRows, followupRows] =
    await Promise.all([
      includeRounds
        ? db
            .select({
              id: placementJobRounds.id,
              name: placementJobRounds.name,
              kind: placementJobRounds.kind,
              status: placementJobRounds.status,
              scheduledAt:
                placementJobRounds.scheduledAt,
              timezone:
                placementJobRounds.timezone,
              venue: placementJobRounds.venue,
              jobId: placementJobs.id,
              jobTitle: placementJobs.title,
              companyId: placementCompanies.id,
              companyName:
                placementCompanies.name,
            })
            .from(placementJobRounds)
            .innerJoin(
              placementJobs,
              eq(
                placementJobs.id,
                placementJobRounds.jobId,
              ),
            )
            .innerJoin(
              placementCompanyRelationships,
              and(
                eq(
                  placementCompanyRelationships.id,
                  placementJobs.companyRelationshipId,
                ),
                eq(
                  placementCompanyRelationships.collegeId,
                  college.id,
                ),
              ),
            )
            .innerJoin(
              placementCompanies,
              eq(
                placementCompanies.id,
                placementCompanyRelationships.companyId,
              ),
            )
            .where(
              and(
                eq(
                  placementJobs.collegeId,
                  college.id,
                ),
                isNull(
                  placementJobs.archivedAt,
                ),
                input.tpoLegacyScope?undefined:inArray(
                  placementJobRounds.status,
                  ["SCHEDULED", "COMPLETED"],
                ),
                input.tpoLegacyScope?inArray(placementJobs.status,["DRAFT","PUBLISHED"]):undefined,
                gte(
                  placementJobRounds.scheduledAt,
                  startsAt,
                ),
                lt(
                  placementJobRounds.scheduledAt,
                  endsBefore,
                ),
                input.roundKind
                  ? eq(
                      placementJobRounds.kind,
                      input.roundKind,
                    )
                  : undefined,
                input.companyId
                  ? eq(
                      placementCompanies.id,
                      input.companyId,
                    )
                  : undefined,
                companyPattern
                  ? ilike(
                      placementCompanies.name,
                      companyPattern,
                    )
                  : undefined,
              ),
            )
            .orderBy(
              asc(
                placementJobRounds.scheduledAt,
              ),
              asc(placementJobRounds.id),
            )
        : Promise.resolve([]),

      includeDeadlines
        ? db
            .select({
              jobId: placementJobs.id,
              jobTitle: placementJobs.title,
              status: placementJobs.status,
              applicationDeadline:
                placementJobs.applicationDeadline,
              legacyPostingDetails:placementJobs.legacyPostingDetails,
              companyId: placementCompanies.id,
              companyName:
                placementCompanies.name,
            })
            .from(placementJobs)
            .innerJoin(
              placementCompanyRelationships,
              and(
                eq(
                  placementCompanyRelationships.id,
                  placementJobs.companyRelationshipId,
                ),
                eq(
                  placementCompanyRelationships.collegeId,
                  college.id,
                ),
              ),
            )
            .innerJoin(
              placementCompanies,
              eq(
                placementCompanies.id,
                placementCompanyRelationships.companyId,
              ),
            )
            .where(
              and(
                eq(
                  placementJobs.collegeId,
                  college.id,
                ),
                isNull(
                  placementJobs.archivedAt,
                ),
                inArray(
                  placementJobs.status,
                  input.tpoLegacyScope?["PUBLISHED"]:
                  input.includeDraftDeadlines?["DRAFT","PUBLISHED","CLOSED"]:["PUBLISHED", "CLOSED"],
                ),
                or(and(
                  gte(placementJobs.applicationDeadline,startsAt),
                  lt(placementJobs.applicationDeadline,endsBefore)
                ),isNotNull(placementJobs.legacyPostingDetails)),
                input.companyId
                  ? eq(
                      placementCompanies.id,
                      input.companyId,
                    )
                  : undefined,
                companyPattern
                  ? ilike(
                      placementCompanies.name,
                      companyPattern,
                    )
                  : undefined,
              ),
            )
            .orderBy(
              asc(
                placementJobs.applicationDeadline,
              ),
              asc(placementJobs.id),
            )
        : Promise.resolve([]),

      includeFollowups
        ? db
            .select({
              id: placementTpoFollowups.id,
              dueAt: placementTpoFollowups.dueAt,
              doneAt: placementTpoFollowups.doneAt,
              note: placementTpoFollowups.note,
              leadId: placementTpoLeads.id,
              leadName: placementTpoLeads.name,
              leadCompanyName:
                placementTpoLeads.companyName,
              companyId: placementCompanies.id,
              linkedCompanyName:
                placementCompanies.name,
            })
            .from(placementTpoFollowups)
            .innerJoin(
              placementTpoLeads,
              and(
                eq(
                  placementTpoLeads.id,
                  placementTpoFollowups.leadId,
                ),
                eq(
                  placementTpoLeads.collegeId,
                  college.id,
                ),
              ),
            )
            .leftJoin(
              placementCompanyRelationships,
              and(
                eq(
                  placementCompanyRelationships.id,
                  placementTpoLeads.companyRelationshipId,
                ),
                eq(
                  placementCompanyRelationships.collegeId,
                  college.id,
                ),
              ),
            )
            .leftJoin(
              placementCompanies,
              eq(
                placementCompanies.id,
                placementCompanyRelationships.companyId,
              ),
            )
            .where(
              and(
                eq(
                  placementTpoFollowups.collegeId,
                  college.id,
                ),
                input.tpoLegacyScope?isNull(placementTpoFollowups.doneAt):undefined,
                gte(
                  placementTpoFollowups.dueAt,
                  startsAt,
                ),
                lt(
                  placementTpoFollowups.dueAt,
                  endsBefore,
                ),
                input.companyId
                  ? eq(
                      placementCompanies.id,
                      input.companyId,
                    )
                  : undefined,
                companyPattern
                  ? or(
                      ilike(
                        placementCompanies.name,
                        companyPattern,
                      ),
                      ilike(
                        placementTpoLeads.companyName,
                        companyPattern,
                      ),
                    )
                  : undefined,
              ),
            )
            .orderBy(
              asc(placementTpoFollowups.dueAt),
              asc(placementTpoFollowups.id),
            )
        : Promise.resolve([]),
    ]);

  // Candidate appointments are distinct from the job-wide round schedule.
  // Include historical imported interviews and cancelled/no-show/completed
  // appointments; do not silently reduce the calendar to booked slots only.
  const appointmentTime = sql<Date>`coalesce(${placementRoundCandidateSlots.legacyScheduledAt}, ${placementRoundCandidateSlots.startsAt})`;
  const appointmentRows = (!input.kind || input.kind === "INTERVIEW_SLOT")
    ? await db.select({
        id: placementRoundCandidateSlots.id,
        applicationId: placementRoundCandidateSlots.applicationId,
        scheduledAt: appointmentTime,
        endsAt: placementRoundCandidateSlots.endsAt,
        status: placementRoundCandidateSlots.status,
        interviewStatus: placementRoundCandidateSlots.legacyInterviewStatus,
        outcome: placementRoundCandidateSlots.interviewOutcome,
        legacyLocation: placementRoundCandidateSlots.legacyLocation,
        room: placementRoundCandidateSlots.room,
        interviewer: placementRoundCandidateSlots.legacyInterviewerName,
        roundId: placementJobRounds.id,
        roundName: placementJobRounds.name,
        roundKind: placementJobRounds.kind,
        timezone: placementJobRounds.timezone,
        jobId: placementJobs.id,
        jobTitle: placementJobs.title,
        companyId: placementCompanies.id,
        companyName: placementCompanies.name,
      })
      .from(placementRoundCandidateSlots)
      .innerJoin(placementJobRounds, and(
        eq(placementJobRounds.id, placementRoundCandidateSlots.roundId),
        eq(placementJobRounds.jobId, placementRoundCandidateSlots.jobId),
      ))
      .innerJoin(placementJobs, eq(placementJobs.id, placementRoundCandidateSlots.jobId))
      .innerJoin(placementCompanyRelationships, and(
        eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
        eq(placementCompanyRelationships.collegeId, college.id),
      ))
      .innerJoin(placementCompanies,
        eq(placementCompanies.id, placementCompanyRelationships.companyId))
      .where(and(
        eq(placementJobs.collegeId, college.id),
        or(
          isNotNull(placementRoundCandidateSlots.applicationId),
          isNotNull(placementRoundCandidateSlots.legacyInterviewId),
        ),
        gte(appointmentTime, startsAt),
        lt(appointmentTime, endsBefore),
        input.roundKind ? eq(placementJobRounds.kind, input.roundKind) : undefined,
        input.companyId ? eq(placementCompanies.id, input.companyId) : undefined,
        companyPattern ? ilike(placementCompanies.name, companyPattern) : undefined,
      ))
      .orderBy(asc(appointmentTime), asc(placementRoundCandidateSlots.id))
    : [];

  const appointments: PlacementCalendarEvent[] = appointmentRows.map(row => ({
    id: `appointment:${row.id}`,
    kind: "INTERVIEW_SLOT",
    startsAt: row.scheduledAt,
    endsAt: row.endsAt,
    title: `Interview: ${row.roundName}`,
    companyId: row.companyId,
    companyName: row.companyName,
    jobId: row.jobId,
    jobTitle: row.jobTitle,
    applicationId: row.applicationId,
    roundId: row.roundId,
    roundKind: row.roundKind,
    leadId: null,
    followupId: null,
    status: row.interviewStatus ?? row.outcome ??
      (row.status === "BOOKED" ? "SCHEDULED" : row.status),
    timezone: row.timezone,
    venue: row.legacyLocation ?? row.room,
    note: row.interviewer ? `Interviewer: ${row.interviewer}` : null,
    completedAt: null,
  }));

  const rounds: PlacementCalendarEvent[] =
    roundRows.flatMap(
      (row): PlacementCalendarEvent[] => {
        if (!row.scheduledAt) {
          return [];
        }

        return [
          {
            id: `round:${row.id}`,
            kind: "ROUND",
            startsAt: row.scheduledAt,
            title: row.name,
            companyId: row.companyId,
            companyName: row.companyName,
            jobId: row.jobId,
            jobTitle: row.jobTitle,
            roundId: row.id,
            roundKind: row.kind,
            leadId: null,
            followupId: null,
            status: row.status,
            timezone: row.timezone,
            venue: row.venue,
            note: null,
            completedAt: null,
          },
        ];
      },
    );

  const deadlines: PlacementCalendarEvent[] =
    deadlineRows.flatMap((row):PlacementCalendarEvent[]=>{
      const imported=importedJobImportantDates(row.jobId,row.legacyPostingDetails)
       .filter(item=>item.at>=startsAt&&item.at<endsBefore);
      const explicit=row.applicationDeadline;
      const firstMatching=explicit?imported.find(item=>item.applicationDeadline&&
        item.at.getTime()===explicit.getTime()):null;
      const standard:PlacementCalendarEvent[]=(explicit&&explicit>=startsAt&&explicit<endsBefore&&
        (!input.kind||input.kind==="APPLICATION_DEADLINE"))?[{
         id:"deadline:"+row.jobId,kind:"APPLICATION_DEADLINE",
         startsAt:explicit,
         title:firstMatching?.label??"Application deadline: "+row.jobTitle,
         eventType:firstMatching?.eventType??null,
         companyId:row.companyId,companyName:row.companyName,
         jobId:row.jobId,jobTitle:row.jobTitle,
         roundId:null,roundKind:null,leadId:null,followupId:null,
         status:row.status,timezone:null,venue:null,note:null,completedAt:null,
        }]:[];
      const additional:PlacementCalendarEvent[]=imported.filter(item=>
        !standard.length||!firstMatching||item.index!==firstMatching.index).filter(item=>
         !input.kind||input.kind==="JOB_IMPORTANT_DATE"||
         (input.kind==="APPLICATION_DEADLINE"&&item.applicationDeadline)
        ).map(item=>({
          id:item.id,kind:item.applicationDeadline?"APPLICATION_DEADLINE":"JOB_IMPORTANT_DATE",
          eventType:item.eventType,startsAt:item.at,title:item.label,
          companyId:row.companyId,companyName:row.companyName,
          jobId:row.jobId,jobTitle:row.jobTitle,roundId:null,roundKind:null,
          leadId:null,followupId:null,status:row.status,timezone:"Asia/Kolkata",
          venue:null,note:item.originalType,completedAt:null,
        }));
      return [...standard,...additional];
    });

  const followups: PlacementCalendarEvent[] =
    followupRows.map(
      (row): PlacementCalendarEvent => ({
        id: `followup:${row.id}`,
        kind: "FOLLOW_UP",
        startsAt: row.dueAt,
        title: `Follow up: ${row.leadName}`,
        companyId: row.companyId,
        companyName:
          row.linkedCompanyName ??
          row.leadCompanyName ??
          "Company not specified",
        jobId: null,
        jobTitle: null,
        roundId: null,
        roundKind: null,
        leadId: row.leadId,
        followupId: row.id,
        status: row.doneAt
          ? "DONE"
          : "OPEN",
        timezone: null,
        venue: null,
        note: row.note,
        completedAt: row.doneAt,
      }),
    );

  const events = sortPlacementCalendarEvents([
    ...appointments,
    ...rounds,
    ...deadlines,
    ...followups,
  ]);

  return {
    from: input.from,
    to: input.to,
    events,
    days: groupPlacementCalendarEvents(events),
    summary: summarizePlacementCalendar(events),
  };
}
