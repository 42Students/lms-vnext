/**
 * DB045 disposable PG17 integration fixture teardown only.
 *
 * Production grade history is immutable. These legacy integration suites
 * deliberately create and remove their own graded submissions after each
 * case; only a superuser of an explicitly protected disposable PostgreSQL
 * target may temporarily disable row triggers ON ITS OWN CONNECTION while
 * deleting those test-owned rows. Never expose this in application code.
 *
 * session_replication_role is transaction-local; it is restored at COMMIT
 * before any parent rows are removed using normal FK constraints.
 */
import { assertDb018DisposableTarget } from "./db018-test-target.mjs";

export async function deleteDisposableFixtureGradeEvents(pool, statement, parameters = []) {
  assertDb018DisposableTarget(process.env, { serviceBound: true });
  if (typeof statement !== "string" ||
      !/^\s*delete\s+from\s+assignment_grade_events\s+where\s+assignment_submission_id\s+in\s*\(/i.test(statement) ||
      !/join\s+courses\s+c\s+on\s+c\.id\s*=/.test(statement) ||
      !/where\s+c\.code\s+like\s+/i.test(statement) ||
      statement.includes(";")) {
    throw new Error("DB045 fixture teardown refused: only a scoped test-owned grade-event DELETE is allowed");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // This privileged override is limited to a disposable database and
    // this single connection/transaction, never to normal product writes.
    await client.query("SET LOCAL session_replication_role = replica");
    await client.query(statement, parameters);
    await client.query("SET LOCAL session_replication_role = origin");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
