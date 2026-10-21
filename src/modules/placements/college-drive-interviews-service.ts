import "server-only";

import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementJobRounds, placementJobs } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requireCollegePlacementAdmin } from "./college-drive-read-service";
import { collegeDriveIdSchema } from "./college-drive-read-model";
import { driveInterviewsQuerySchema, DRIVE_INTERVIEW_PAGE_SIZE } from "./college-drive-interviews-model";

/** Only persisted GD/INTERVIEW rounds; no invented per-candidate time slots. */
export async function listCollegeDriveInterviews(
  context: RequestContext, jobIdInput: unknown, raw: unknown,
) {
  const jobId = collegeDriveIdSchema.parse(jobIdInput);
  const query = driveInterviewsQuerySchema.parse(raw);
  const collegeId = await requireCollegePlacementAdmin(context);
  const db = getDb();
  const [job] = await db.select({ id: placementJobs.id, title: placementJobs.title })
    .from(placementJobs).where(and(
      eq(placementJobs.id, jobId), eq(placementJobs.collegeId, collegeId),
    )).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const source = db.select({
    id: placementJobRounds.id,
    sequence: placementJobRounds.sequence,
    name: placementJobRounds.name,
    kind: placementJobRounds.kind,
    mode: placementJobRounds.mode,
    status: placementJobRounds.status,
    scheduledAt: placementJobRounds.scheduledAt,
    timezone: placementJobRounds.timezone,
    venue: placementJobRounds.venue,
    durationMinutes: placementJobRounds.durationMinutes,
  }).from(placementJobRounds).where(and(
    eq(placementJobRounds.jobId,jobId),
    query.kind === "ALL"
      ? inArray(placementJobRounds.kind, ["INTERVIEW","GD"])
      : eq(placementJobRounds.kind,query.kind),
    query.status === "ALL" ? undefined : eq(placementJobRounds.status,query.status),
  )).as("college_drive_interview_rounds");
  const [totals,items] = await Promise.all([
    db.select({total:count()}).from(source),
    db.select().from(source).orderBy(sql`${source.scheduledAt} asc nulls last`,asc(source.sequence),asc(source.id))
      .limit(DRIVE_INTERVIEW_PAGE_SIZE).offset((query.page-1)*DRIVE_INTERVIEW_PAGE_SIZE),
  ]);
  const total=totals[0]?.total ?? 0;
  return { job, query, items, total,
    // Registered candidate slots (0116) are loaded independently by the
    // appointment panel; no per-learner bookings are invented from round rows.
    individualSlotsAvailable: true as const,
    totalPages: Math.max(1,Math.ceil(total/DRIVE_INTERVIEW_PAGE_SIZE)) };
}
