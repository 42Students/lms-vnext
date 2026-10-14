import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import { learnerAssessmentClock } from "@/modules/courses/learner-assessment-clock-model";
import { quizOverviewActionState } from "@/components/courses/quiz-overview-state";
import { learnerQuizMobileState } from "@/modules/courses/learner-quiz-mobile-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { newLearnerLearningFixture, seedLearnerLearningFixture } from "../support/learner-learning-surface-fixture";
if (!process.env.TEST_DATABASE_URL) throw new Error("Requires disposable TEST_DATABASE_URL");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const fixture = newLearnerLearningFixture();
beforeAll(async () => {
  await seedLearnerLearningFixture(pool, fixture);
  await pool.query("UPDATE course_quizzes SET due_at=now()+interval '1 hour' WHERE id=$1", [fixture.ids.quiz]);
}, 45000);
afterAll(async () => {
  // Retain append-only fixture events and referenced identities in this disposable DB.
  await pool.end(); await closeDatabaseConnection();
}, 30000);
describe("persisted own assessment deadline with advancing display clock", () => {
  it("switches the authorized quiz to review without claiming unpublished results", async () => {
    const overview = await getLearnerAssessmentOverview(fixture.learner.context);
    const row = overview.quizzes.find(item => item.id === fixture.ids.quiz);
    if (!row) throw new Error("Own quiz fixture missing");
    const quiz = { ...row, dueAt: row.dueAt?.toISOString() ?? null, progressStatus: row.progress.status };
    expect(quizOverviewActionState(quiz, overview.snapshotNowMs).review).toBe(false);
    const now = learnerAssessmentClock(overview.snapshotNowMs, 3_600_001);
    expect(quizOverviewActionState(quiz, now).review).toBe(true);
    expect(learnerQuizMobileState(quiz, now).label).toBe("Closed");
    expect(quiz.resultsPublished).toBe(false);
  });
  it("denies foreign-college, suspended and wrong-role reads", async () => {
    const base = fixture.learner.context;
    const denied: RequestContext[] = [
      { ...base, membership: { ...base.membership!, collegeId: SEED_IDS.collegeB } },
      { ...base, membership: { ...base.membership!, status: "SUSPENDED" } },
      { ...base, membership: { ...base.membership!, roles: ["FACULTY"] } },
    ];
    for (const context of denied) await expect(getLearnerAssessmentOverview(context)).rejects.toBeDefined();
  });
});
