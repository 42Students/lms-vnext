import {sql} from "drizzle-orm";

/** The Reviewed KPI counts only the latest non-reopened approved version.
 * Correlation must stay fully qualified: unqualified "id" inside a
 * subquery would bind to the submission itself instead of the project.
 */
export function latestReviewedProjectSubmissionSql() {
  const instanceId=sql.raw('"project_instances"."id"');
  return sql<boolean>`coalesce((
    select (sub.status = 'APPROVED' and sub.reopened_at is null)
    from project_submissions sub
    where sub.project_id = ${instanceId}
    order by sub.version desc limit 1
  ), false)`;
}
