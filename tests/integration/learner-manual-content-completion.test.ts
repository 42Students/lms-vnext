import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  getLearnerContentProgress,
  saveLearnerContentProgress,
} from "@/modules/courses/progress-service";
import { getLearnerCourseWorkspace } from "@/modules/courses/learner-course-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  cleanupLearnerCourseWriteFixture,
  newLearnerCourseWriteFixture,
  seedLearnerCourseWriteFixture,
  type LearnerCourseWriteFixture,
} from "../support/learner-course-write-fixture";

if (!process.env.TEST_DATABASE_URL) throw new Error("Disposable TEST_DATABASE_URL required");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
let fixture: LearnerCourseWriteFixture | null = null;
beforeEach(async () => {
  fixture = newLearnerCourseWriteFixture();
  await seedLearnerCourseWriteFixture(pool, fixture, { content: true });
}, 45_000);
afterEach(async () => {
  const current = fixture;
  fixture = null;
  if (current) await cleanupLearnerCourseWriteFixture(pool, current);
}, 45_000);
afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
}, 30_000);

describe("learner manual completion with fresh PostgreSQL actor and course", () => {
  it("marks first completion, preserves timestamp on retry and updates own workspace", async () => {
    const { context, ids } = fixture!;
    const first = await saveLearnerContentProgress(context, ids.content, {
      deliveryId: ids.delivery, completed: true,
    });
    expect(first.status).toBe("COMPLETED");
    const again = await saveLearnerContentProgress(context, ids.content, {
      deliveryId: ids.delivery, completed: true,
    });
    expect(again.completedAt?.getTime()).toBe(first.completedAt?.getTime());
    const read = await getLearnerContentProgress(context, ids.content, ids.delivery);
    expect(read.status).toBe("COMPLETED");
    const workspace = await getLearnerCourseWorkspace(context, ids.delivery);
    expect(workspace.lessons.flatMap(lesson => lesson.contents)
      .find(row => row.id === ids.content)?.progress.status).toBe("COMPLETED");

    const audit = await pool.query<{
      total: string; actor_user_id: string; actor_membership_id: string;
    }>(
      "SELECT count(*)::text AS total, min(actor_user_id::text) AS actor_user_id, min(actor_membership_id::text) AS actor_membership_id FROM activity_events WHERE dedupe_key=$1",
      ["learner-content:" + ids.membership + ":" + ids.content + ":attempt:1:completed"],
    );
    expect(audit.rows[0]).toMatchObject({
      total: "1", actor_user_id: ids.user, actor_membership_id: ids.membership,
    });
  }, 30_000);

  it("denies forged-college, suspended, wrong-role and swapped actor without writes", async () => {
    const { context, ids } = fixture!;
    const denied: RequestContext[] = [
      { ...context, membership: { ...context.membership!, collegeId: SEED_IDS.collegeB } },
      { ...context, membership: { ...context.membership!, status: "SUSPENDED" } },
      { ...context, membership: { ...context.membership!, roles: ["FACULTY"] } },
      { ...context, user: { ...context.user, id: SEED_IDS.facultyUser } },
    ];
    for (const actor of denied) {
      await expect(saveLearnerContentProgress(actor, ids.content, {
        deliveryId: ids.delivery, completed: true,
      })).rejects.toBeDefined();
    }
    const persisted = await pool.query(
      "SELECT id FROM learner_content_progress WHERE lesson_content_id=$1", [ids.content],
    );
    expect(persisted.rows).toHaveLength(0);
    const audit = await pool.query(
      "SELECT id FROM activity_events WHERE dedupe_key=$1",
      ["learner-content:" + ids.membership + ":" + ids.content + ":attempt:1:completed"],
    );
    expect(audit.rows).toHaveLength(0);
  }, 30_000);
});
