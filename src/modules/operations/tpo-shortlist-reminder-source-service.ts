import "server-only";
import { and, eq, gte, lt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, placementJobs, placementTpoShareEvents, placementTpoShareLinks } from "@/db/schema";
import { tomorrowInIndiaUtcWindow } from "./scheduled-job-runner";
import { generateShortlistTomorrowEvents } from "./tpo-reminder-source-events";

/**
 * Read-only, tenant-joined source for the legacy 08:00 IST shortlist reminder.
 * This function does not send email or mark the reminder delivered. Its result
 * must be passed to a fenced, durable email-outbox producer before enabling
 * tpo.shortlistDueTomorrow in the scheduler registry.
 */
export async function readDueShortlistReminderSources(now: Date = new Date()) {
  const window = tomorrowInIndiaUtcWindow(now);
  const todayStart = new Date(window.from.getTime() - 86_400_000);
  const db = getDb();
  const rows = await db.select({
    shareId: placementTpoShareLinks.id,
    collegeId: placementTpoShareLinks.collegeId,
    recipientEmail: placementTpoShareLinks.recipientEmail,
    jobTitle: placementJobs.title,
    shortlistBy: placementTpoShareLinks.shortlistBy,
    revokedAt: placementTpoShareLinks.revokedAt,
    collegeName: colleges.name,
  }).from(placementTpoShareLinks)
    .innerJoin(placementJobs, and(
      eq(placementJobs.id, placementTpoShareLinks.jobId),
      eq(placementJobs.collegeId, placementTpoShareLinks.collegeId),
    ))
    .innerJoin(colleges, and(
      eq(colleges.id, placementTpoShareLinks.collegeId),
      eq(colleges.status, "ACTIVE"),
    ))
    .where(and(
      isNull(placementTpoShareLinks.revokedAt),
      gte(placementTpoShareLinks.shortlistBy, window.from),
      lt(placementTpoShareLinks.shortlistBy, window.to),
      sql`not exists (
        select 1 from ${placementTpoShareEvents} prior
        where prior.share_id = ${placementTpoShareLinks.id}
          and prior.action = 'SHORTLIST_REMINDER'
          and prior.created_at >= ${todayStart}
          and prior.created_at < ${window.from}
      )`,
    ))
    .orderBy(placementTpoShareLinks.id)
    .limit(501);
  if (rows.length > 500) throw new Error("TPO_SHORTLIST_REMINDER_BATCH_TOO_LARGE");
  return generateShortlistTomorrowEvents(rows.filter(
    (row): row is typeof row & { shortlistBy: Date } => row.shortlistBy !== null,
  ).map(row => ({
    shareId: row.shareId,
    collegeId: row.collegeId,
    recipientEmail: row.recipientEmail,
    jobTitle: row.jobTitle,
    companyName: row.collegeName,
    shortlistBy: row.shortlistBy,
    revoked: row.revokedAt !== null,
    alreadyRemindedOnIstDate: false,
  })), now);
}
