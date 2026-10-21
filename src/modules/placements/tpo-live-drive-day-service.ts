import "server-only";
import { and, desc, eq, gte, isNull, lt, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementJobRounds, placementJobs, placementCompanies, placementCompanyRelationships } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { getTpoRoundDriveDay } from "./tpo-round-drive-day-service";
import { isTpoRoundOnDriveDay, summarizeTpoLiveAttendance, tpoIstDayWindow } from "./tpo-live-drive-day-model";

/** Legacy drive-day/mine equivalent: the ENTIRE college's ON_CAMPUS
 * schedule on the current India date. Includes completed rounds, excludes
 * cancelled rounds, and never assumes an active duration is required.
 * The primary list is one tenant-scoped SQL read with no 20/100 row cap. */
export async function getTpoDriveDayQueue(
  context: RequestContext, now: Date = new Date(),
) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context,"TPO") ||
      member.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = member.collegeId;
  if (!can(context,"placements.manage",{collegeId})) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context,"placements.manage",{collegeId});
  await requirePlacementManageScope(context,collegeId);
  const day = tpoIstDayWindow(now.toISOString());
  return getDb().select({
    id: placementJobRounds.id,
    name: placementJobRounds.name,
    kind: placementJobRounds.kind,
    status: placementJobRounds.status,
    jobId: placementJobs.id,
    jobTitle: placementJobs.title,
    companyName: placementCompanies.name,
    venue: placementJobRounds.venue,
    scheduledAt: placementJobRounds.scheduledAt,
    durationMinutes: placementJobRounds.durationMinutes,
  }).from(placementJobRounds)
    .innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
    .innerJoin(placementCompanyRelationships,and(
      eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId,collegeId),
    ))
    .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
    .where(and(
      eq(placementJobs.collegeId,collegeId),
      eq(placementJobs.status,"PUBLISHED"),
      isNull(placementJobs.archivedAt),
      eq(placementJobs.recruiterDriveMode,"ON_CAMPUS"),
      ne(placementJobRounds.status,"CANCELLED"),
      gte(placementJobRounds.scheduledAt,day.start),
      lt(placementJobRounds.scheduledAt,day.end),
    ))
    .orderBy(desc(placementJobRounds.scheduledAt),desc(placementJobRounds.id));
}

/** Live attendance is an optional drill-down, separate from the complete
 * legacy all-day list. Bound detail reads here, never the day queue itself. */
export async function getTpoLiveDriveDaySummary(
  context: RequestContext, now: Date = new Date(),
) {
  const dayRows = await getTpoDriveDayQueue(context,now);
  const live = dayRows.filter(round=>isTpoRoundOnDriveDay({
    status:round.status,
    scheduledAt:round.scheduledAt?.toISOString()??null,
    durationMinutes:round.durationMinutes,
  },now.toISOString()));
  const rows = await Promise.all(live.slice(0,20).map(async round=>{
    const roster = await getTpoRoundDriveDay(context,round.id);
    return {
      id:round.id,
      name:roster.round.name,
      companyName:roster.companyName,
      jobTitle:roster.job.title,
      jobId:roster.job.id,
      venue:roster.round.venue,
      scheduledAt:round.scheduledAt?.toISOString()??null,
      durationMinutes:round.durationMinutes,
      counts:summarizeTpoLiveAttendance(roster.counts),
    };
  }));
  return {
    dayRows, rows,
    // Only the optional live-attendance detail can be truncated.
    truncated:live.length>20,
    asOf:now.toISOString(),
  };
}
