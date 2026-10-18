import {sql} from "drizzle-orm";

/** Status shortcuts are operational queues, not revision history. A prior
 * version must stop appearing in Pending review after a newer version is
 * approved, reopened, or replaced. The outer alias is intentionally fully
 * qualified to prevent correlated-subquery name shadowing.
 */
export function isCurrentProjectSubmissionSql() {
  return sql<boolean>`"project_submissions"."version" = (
    select max(latest.version)
    from project_submissions latest
    where latest.project_id = "project_submissions"."project_id"
  )`;
}
