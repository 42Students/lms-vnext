import "server-only";

import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementCompanies, placementCompanyRelationships,
  placementJobRounds, placementJobs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoReadCollege } from "./tpo-surface-access";
import { calendarIstBounds, tpoCalendarExportQuerySchema } from "./tpo-calendar-export-model";

/** Migrated P6B rounds only; no external calendar providers or ICS. */
export async function getTpoCalendarRoundExport(
  context: RequestContext, rawQuery: unknown,
  now: Date = new Date(),
) {
  const query = tpoCalendarExportQuerySchema.parse(rawQuery);
  const college = await requireTpoReadCollege(context);
  const bounds = calendarIstBounds(query.from, query.to);
  const starting = new Date(Math.max(bounds.start.getTime(), now.getTime()));

  const rows = await getDb().select({
    id: placementJobRounds.id,
    jobTitle: placementJobs.title,
    companyName: placementCompanies.name,
    roundName: placementJobRounds.name,
    kind: placementJobRounds.kind,
    mode: placementJobRounds.mode,
    status: placementJobRounds.status,
    scheduledAt: placementJobRounds.scheduledAt,
    venue: placementJobRounds.venue,
  }).from(placementJobRounds)
    .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
    .innerJoin(placementCompanyRelationships, and(
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, college.id),
    ))
    .innerJoin(placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(
      eq(placementJobs.collegeId, college.id),
      eq(placementJobs.status, "PUBLISHED"),
      inArray(placementJobRounds.status, ["PENDING", "SCHEDULED"]),
      gte(placementJobRounds.scheduledAt, starting),
      lt(placementJobRounds.scheduledAt, bounds.endExclusive),
    ))
    .orderBy(asc(placementJobRounds.scheduledAt), asc(placementJobRounds.id))
    .limit(501);
  // ScheduledAt is nullable in schema but the gte predicate removes nulls.
  const scheduled = rows.filter((row): row is typeof row & { scheduledAt: Date } =>
    row.scheduledAt !== null);
  return {
    from: query.from, to: query.to,
    rows: scheduled.slice(0, 500),
    truncated: rows.length > 500,
  };
}
