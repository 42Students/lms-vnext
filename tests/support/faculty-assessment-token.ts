import type { Pool } from "pg";

/** Read the actual fixture version; never synthesize a production token. */
export async function facultyAssessmentFixtureToken(
  pool: Pool, kind: "ASSIGNMENT" | "QUIZ", id: string,
) {
  const result = await pool.query<{updated_at: Date}>(
    kind === "ASSIGNMENT"
      ? "select updated_at from course_assignments where id=$1"
      : "select updated_at from course_quizzes where id=$1",
    [id],
  );
  if (!result.rows[0]) throw new Error("Missing assessment fixture");
  return {expectedUpdatedAt:result.rows[0].updated_at.toISOString(),confirmed:true as const};
}
