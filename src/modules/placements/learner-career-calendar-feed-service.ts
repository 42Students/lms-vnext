import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { listLearnerPlacementJobs } from "./learner-job-service";
import { careerDayKey, type CareerCalendarSupplement } from "./learner-career-calendar-model";

/** Deadline feed comes from the cohort- and section-scoped learner job reader,
 * never a global scan of unpublished or cross-college drives. College exam
 * dates are loaded independently by learner-calendar-extras-service. */
export async function loadLearnerCareerCalendarSupplements(
  context: RequestContext,
): Promise<{ supplements: CareerCalendarSupplement[]; warnings: string[] }> {
  const now = new Date();
  const jobs = await listLearnerPlacementJobs(context, now);
  const supplements: CareerCalendarSupplement[] = [];
  const warnings: string[] = [];
  const appliedJobIds = new Set(
    jobs.filter(row => row.application !== null).map(row => row.job.id),
  );
  const seen = new Set<string>();
  const through = careerDayKey(new Date(now.getTime() + 366 * 86_400_000));
  for (const row of jobs) {
    const job = row.job;
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    const deadline = job.applicationDeadline;
    if (!deadline || deadline.getTime() < now.getTime() ||
        appliedJobIds.has(job.id)) continue;
    const day = careerDayKey(deadline);
    if (day > through) continue;
    supplements.push({
      key: job.id, kind: "APPLICATION_DEADLINE", day,
      title: "Apply by " + day,
      companyName: row.company.name,
      roleTitle: job.title,
      visible: true, applied: false,
    });
    if (supplements.length >= 500) {
      warnings.push("Showing the first 500 upcoming job deadlines. View Jobs for the full list.");
      break;
    }
  }
  return { supplements, warnings };
}
