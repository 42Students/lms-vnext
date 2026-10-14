import "server-only";

import { and, asc, eq, gte, isNull, lt, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementCompanies,
  placementCompanyRelationships,
  placementJobRounds,
  placementJobs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoReadCollege } from "./tpo-surface-access";
import {
  projectTpoScheduleConflicts,
  tpoScheduleConflictsQuerySchema,
} from "./tpo-schedule-conflicts-model";

/**
 * Only published, non-archived drives with pending/active, upcoming rounds
 * are considered. A 1000-round cap is explicit and never represented as a
 * complete clear schedule. Venue conflicts need recorded duration and mode.
 */
export async function getTpoScheduleConflicts(
  context: RequestContext,
  rawQuery: unknown,
  now: Date = new Date(),
) {
  const college = await requireTpoReadCollege(context);
  const query = tpoScheduleConflictsQuerySchema.parse(rawQuery);
  const until = new Date(now.getTime() + query.days * 86_400_000);
  const rows = await getDb().select({
    id: placementJobRounds.id,
    jobId: placementJobs.id,
    jobTitle: placementJobs.title,
    companyName: placementCompanies.name,
    name: placementJobRounds.name,
    mode: placementJobRounds.mode,
    venue: placementJobRounds.venue,
    scheduledAt: placementJobRounds.scheduledAt,
    durationMinutes: placementJobRounds.durationMinutes,
  })
    .from(placementJobRounds)
    .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
    .innerJoin(placementCompanyRelationships, and(
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, college.id),
    ))
    .innerJoin(placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(and(
      eq(placementJobs.collegeId, college.id),
      eq(placementJobs.status, "PUBLISHED"),
      isNull(placementJobs.archivedAt),
      ne(placementJobRounds.status, "CANCELLED"),
      ne(placementJobRounds.status, "COMPLETED"),
      gte(placementJobRounds.scheduledAt, now),
      lt(placementJobRounds.scheduledAt, until),
    ))
    .orderBy(asc(placementJobRounds.scheduledAt), asc(placementJobRounds.id))
    .limit(1001);
  const limited = rows.length > 1000;
  const facts = rows.slice(0, 1000).flatMap((row) =>
    row.scheduledAt ? [{ ...row, scheduledAt: row.scheduledAt }] : [],
  );
  return {
    ...projectTpoScheduleConflicts(facts),
    days: query.days,
    windowStartsAt: now,
    windowEndsAt: until,
    limited,
  };
}
