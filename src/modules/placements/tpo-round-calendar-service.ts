import "server-only";
import { and, asc, eq, ilike, inArray, isNull, ne, or } from "drizzle-orm";
import {z} from "zod";
import { getDb } from "@/db/client";
import { placementCompanies, placementCompanyRelationships, placementJobRounds, placementJobs } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { PlacementsServiceError } from "./errors";
import { actOnPlacementRound } from "./round-service";
import { projectTpoScheduleConflicts } from "./tpo-schedule-conflicts-model";
import { parseIstRoundLocalTime, tpoRoundCalendarMutationSchema } from "./tpo-round-calendar-model";

async function requireTpo(context: RequestContext) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "TPO"))
    throw new AuthorizationError("placements.manage");
  const collegeId = member.collegeId;
  if (!can(context, "placements.manage", { collegeId }))
    throw new AuthorizationError("placements.manage");
  requirePermission(context, "placements.manage", { collegeId });
  return requirePlacementManageScope(context, collegeId);
}

/** Pages may schedule a registered pending round or update/cancel a scheduled one. */
export async function listTpoCalendarRoundChoices(context: RequestContext,raw:unknown={}) {
  const input=z.strictObject({page:z.coerce.number().int().min(1).max(10000).default(1),
   q:z.string().trim().max(100).default("")}).parse(raw);
  const pattern="%"+input.q.replace(/[\\%_]/g,"\\export async function listTpoCalendarRoundChoices(context: RequestContext) {")+"%";
  const college = await requireTpo(context);
  const rows = await getDb().select({
    id: placementJobRounds.id,
    jobId: placementJobs.id,
    jobTitle: placementJobs.title,
    companyName: placementCompanies.name,
    name: placementJobRounds.name,
    kind: placementJobRounds.kind,
    status: placementJobRounds.status,
    updatedAt: placementJobRounds.updatedAt,
    scheduledAt: placementJobRounds.scheduledAt,
    mode: placementJobRounds.mode,
    venue: placementJobRounds.venue,
    meetingUrl: placementJobRounds.meetingUrl,
    durationMinutes: placementJobRounds.durationMinutes,
  }).from(placementJobRounds)
    .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
    .innerJoin(placementCompanyRelationships, and(
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, college.id),
    ))
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(
      eq(placementJobs.collegeId, college.id),
      eq(placementJobs.status, "PUBLISHED"),
      isNull(placementJobs.archivedAt),
      inArray(placementJobRounds.status, ["PENDING", "SCHEDULED"]),
      input.q?or(ilike(placementJobs.title,pattern),ilike(placementCompanies.name,pattern),ilike(placementJobRounds.name,pattern)):undefined,
    ))
    .orderBy(asc(placementJobRounds.updatedAt), asc(placementJobRounds.id))
    .limit(201).offset((input.page-1)*200);
  return { rows: rows.slice(0, 200), limited: rows.length > 200, page:input.page, q:input.q };
}

/**
 * Only existing registered rounds are scheduled. The round service writes
 * state + immutable round history in its own transaction. Venue detection is
 * conservative but the cross-writer serialization contract remains PARTIAL.
 */
export async function decideTpoCalendarRound(context: RequestContext, raw: unknown) {
  const college = await requireTpo(context);
  const input = tpoRoundCalendarMutationSchema.parse(raw);
  const [round] = await getDb().select({
    id: placementJobRounds.id,
    jobId: placementJobRounds.jobId,
    status: placementJobRounds.status,
    updatedAt: placementJobRounds.updatedAt,
    name: placementJobRounds.name,
    durationMinutes: placementJobRounds.durationMinutes,
  }).from(placementJobRounds)
    .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
    .where(and(
      eq(placementJobRounds.id, input.roundId),
      eq(placementJobs.collegeId, college.id),
      eq(placementJobs.status, "PUBLISHED"),
      isNull(placementJobs.archivedAt),
    )).limit(1);
  if (!round) throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
  if (round.updatedAt.toISOString() !== input.expectedUpdatedAt)
    throw new PlacementsServiceError("PLACEMENT_ROUND_INVALID_TRANSITION");
  if (round.status !== "PENDING" && round.status !== "SCHEDULED")
    throw new PlacementsServiceError("PLACEMENT_ROUND_INVALID_TRANSITION");
  if (input.action === "CANCEL") {
    return actOnPlacementRound(context, round.id, {
      action: "CANCEL", reason: input.reason,
    }, input.expectedUpdatedAt);
  }
  if (!input.localDateTime || !input.mode) throw new Error("Round schedule is incomplete");
  const start = parseIstRoundLocalTime(input.localDateTime);
  if (start.getTime() <= Date.now()) throw new Error("Round must be scheduled in the future");
  if (input.mode === "ON_CAMPUS") {
    if (!round.durationMinutes || round.durationMinutes <= 0)
      throw new Error("Record a positive round duration before booking an on-campus venue");
    const venue = input.venue?.trim() ?? "";
    const competitors = await getDb().select({
      id: placementJobRounds.id,
      jobId: placementJobs.id,
      jobTitle: placementJobs.title,
      companyName: placementCompanies.name,
      name: placementJobRounds.name,
      mode: placementJobRounds.mode,
      venue: placementJobRounds.venue,
      scheduledAt: placementJobRounds.scheduledAt,
      durationMinutes: placementJobRounds.durationMinutes,
    }).from(placementJobRounds)
      .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
      .innerJoin(placementCompanyRelationships, and(
        eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
        eq(placementCompanyRelationships.collegeId, college.id),
      ))
      .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
      .where(and(
        eq(placementJobs.collegeId, college.id),
        eq(placementJobs.status, "PUBLISHED"),
        isNull(placementJobs.archivedAt),
        eq(placementJobRounds.status, "SCHEDULED"),
        ne(placementJobRounds.id, round.id),
      )).limit(1001);
    if (competitors.length > 1000) throw new Error("Too many rounds to certify a venue; narrow scheduling first");
    const candidate = {
      id: round.id, jobId: round.jobId, jobTitle: "Selected drive",
      companyName: "Selected company", name: round.name,
      mode: input.mode, venue, scheduledAt: start, durationMinutes: round.durationMinutes,
    };
    const facts = competitors.flatMap((item) => item.scheduledAt ? [{
      ...item, scheduledAt: item.scheduledAt,
    }] : []);
    if (projectTpoScheduleConflicts([candidate, ...facts]).conflicts.some(
      (item) => item.left.id === round.id || item.right.id === round.id,
    )) throw new Error("Venue overlaps another scheduled round");
    const ambiguous = facts.some((item) =>
      item.mode === "ON_CAMPUS" &&
      item.venue?.trim().toLowerCase() === venue.toLowerCase() &&
      (!item.durationMinutes || item.durationMinutes <= 0));
    if (ambiguous) throw new Error("Same venue contains a round with unknown duration");
  }
  return actOnPlacementRound(context, round.id, {
    action: "SCHEDULE", scheduledAt: start, timezone: "Asia/Kolkata",
    mode: input.mode,
    ...(input.mode === "ON_CAMPUS" ? { venue: input.venue } : { meetingUrl: input.meetingUrl }),
  }, input.expectedUpdatedAt);
}
