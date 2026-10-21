import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementTpoBlockedDates } from "@/db/schema/tpo-configuration";
import type { RequestContext } from "@/modules/identity/context";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { listLearnerPlacementJobs } from "./learner-job-service";
import { placementTableExists } from "./staged-tables";
import { careerDayKey, type CareerCalendarSupplement } from "./learner-career-calendar-model";

/**
 * The learner schedule's two supplementary sources have independent failure
 * boundaries. A college blackout is shown even with zero visible drives.
 * Job deadlines reuse the existing cohort/section-targeted learner job
 * reader: never project all published jobs into a student's calendar.
 */
export async function loadLearnerCareerCalendarSupplements(
  context: RequestContext,
): Promise<{ supplements: CareerCalendarSupplement[]; warnings: string[] }> {
  const learner = await requireLearnerPlacementAccess(context);
  const now = new Date();
  const fromDay = careerDayKey(new Date(now.getTime() - 90 * 86_400_000));
  const toDay = careerDayKey(new Date(now.getTime() + 366 * 86_400_000));
  const [jobResult, blockedResult] = await Promise.allSettled([
    listLearnerPlacementJobs(context, now),
    (async () => {
      if (!(await placementTableExists("placement_tpo_blocked_dates"))) {
        return { available: false as const, rows: [] };
      }
      const rows = await getDb().select({
        id: placementTpoBlockedDates.id,
        day: placementTpoBlockedDates.day,
        reason: placementTpoBlockedDates.reason,
      }).from(placementTpoBlockedDates)
        .where(and(
          eq(placementTpoBlockedDates.collegeId, learner.collegeId),
          gte(placementTpoBlockedDates.day, fromDay),
          lte(placementTpoBlockedDates.day, toDay),
        ))
        .orderBy(asc(placementTpoBlockedDates.day), asc(placementTpoBlockedDates.id))
        .limit(367);
      return { available: true as const, rows };
    })(),
  ]);
  const warnings: string[] = [];
  const supplements: CareerCalendarSupplement[] = [];

  if (blockedResult.status === "fulfilled" && blockedResult.value.available) {
    for (const item of blockedResult.value.rows) {
      supplements.push({
        key: item.id, kind: "EXAM_BLOCK", day: item.day,
        title: item.reason, visible: true,
        note: "College no-drive / examination date",
      });
    }
  } else {
    warnings.push("College examination / blocked dates are unavailable.");
  }

  if (jobResult.status === "fulfilled") {
    // One deadline per job, not one per role option. An existing application
    // on any role suppresses the job's un-applied deadline reminder.
    const jobs = jobResult.value;
    const appliedJobIds = new Set(
      jobs.filter(row => row.application !== null).map(row => row.job.id),
    );
    const seen = new Set<string>();
    for (const row of jobs) {
      const job = row.job;
      if (seen.has(job.id)) continue;
      seen.add(job.id);
      const deadline = job.applicationDeadline;
      if (!deadline || deadline.getTime() < now.getTime() ||
          appliedJobIds.has(job.id)) continue;
      const day = careerDayKey(deadline);
      if (day > toDay) continue;
      supplements.push({
        key: job.id, kind: "APPLICATION_DEADLINE", day,
        title: "Apply by " + day,
        companyName: row.company.name,
        roleTitle: job.title,
        visible: true, applied: false,
      });
      if (seen.size >= 500) break;
    }
    if (jobs.length > 500) {
      warnings.push("Showing the first 500 eligible job deadlines. Use Jobs to see the full list.");
    }
  } else {
    warnings.push("Un-applied job deadlines could not be loaded.");
  }
  return { supplements, warnings };
}
