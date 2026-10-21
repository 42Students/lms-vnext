import "server-only";
import { and, desc, eq, gte, isNull, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementJobRounds, placementJobs } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { getTpoRoundDriveDay } from "./tpo-round-drive-day-service";
import { isTpoRoundOnDriveDay, summarizeTpoLiveAttendance, tpoIstDayWindow } from "./tpo-live-drive-day-model";

/** TPO-only snapshot. Max 20 live rounds; never infer current activity from date alone. */
export async function getTpoLiveDriveDaySummary(context: RequestContext, now: Date = new Date()) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "TPO") ||
      member.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = member.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const { start: earliest, end: dayEnd } = tpoIstDayWindow(now.toISOString());
  const candidates = await getDb().select({
    id: placementJobRounds.id,
    status: placementJobRounds.status,
    scheduledAt: placementJobRounds.scheduledAt,
    durationMinutes: placementJobRounds.durationMinutes,
  }).from(placementJobRounds)
    .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
    .where(and(
      eq(placementJobs.collegeId, collegeId),
      eq(placementJobs.status, "PUBLISHED"),
      isNull(placementJobs.archivedAt),
      eq(placementJobRounds.status, "SCHEDULED"),
      gte(placementJobRounds.scheduledAt, earliest),
      lt(placementJobRounds.scheduledAt, dayEnd),
    ))
    .orderBy(desc(placementJobRounds.scheduledAt), desc(placementJobRounds.id))
    .limit(101);
  const live = candidates.filter((round) => isTpoRoundOnDriveDay({
    status: round.status,
    scheduledAt: round.scheduledAt?.toISOString() ?? null,
    durationMinutes: round.durationMinutes,
  }, now.toISOString()));
  const rows = await Promise.all(live.slice(0, 20).map(async (round) => {
    const roster = await getTpoRoundDriveDay(context, round.id);
    return {
      id: round.id,
      name: roster.round.name,
      companyName: roster.companyName,
      jobTitle: roster.job.title,
      jobId: roster.job.id,
      venue: roster.round.venue,
      scheduledAt: round.scheduledAt?.toISOString() ?? null,
      durationMinutes: round.durationMinutes,
      counts: summarizeTpoLiveAttendance(roster.counts),
    };
  }));
  return {
    rows,
    truncated: live.length > 20 || candidates.length === 101,
    asOf: now.toISOString(),
  };
}
