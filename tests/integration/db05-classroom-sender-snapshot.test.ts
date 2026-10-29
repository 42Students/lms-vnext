import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { closeDatabaseConnection } from "@/db/client";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  createCourseDiscussionMessage,
  listCourseDiscussionChanges,
  listCourseDiscussionMessages,
  listLessonContentDiscussionMessages,
} from "@/modules/courses/discussion-service";
import {
  cleanupLearnerCourseWriteFixture,
  newLearnerCourseWriteFixture,
  seedLearnerCourseWriteFixture,
  type LearnerCourseWriteFixture,
} from "../support/learner-course-write-fixture";

// Never perform fixture writes against an unapproved or split database target.
if (!process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
  throw new Error("DB05 immutable attribution requires identical disposable DATABASE_URL and TEST_DATABASE_URL");
}
const preflight = spawnSync(process.execPath,
  [fileURLToPath(new URL("../../scripts/db01-test-database-guard.mjs", import.meta.url))], {
    env: { ...process.env, DATABASE_URL: "" },
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
if (preflight.error || preflight.status !== 0) {
  throw new Error("DB05 sender snapshot tests refused an unsafe PostgreSQL target");
}
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
let fixture: LearnerCourseWriteFixture | null = null;

beforeEach(async () => {
  fixture = newLearnerCourseWriteFixture();
  await seedLearnerCourseWriteFixture(pool, fixture, { content: true });
  // The fixture content starts unscoped; the classroom thread must be tied
  // to the exact delivery before the content-scoped consumer may read it.
  await pool.query("UPDATE lesson_contents SET delivery_id=$1 WHERE id=$2",
    [fixture.ids.delivery, fixture.ids.content]);
}, 45_000);
afterEach(async () => {
  const current = fixture;
  fixture = null;
  if (current) {
    // DB-005 registered curriculum seeds program_term_courses on course
    // creation. Retire only this fixture's mapping before its course parent.
    await pool.query("DELETE FROM program_term_courses WHERE course_id=$1",
      [current.ids.course]);
    await cleanupLearnerCourseWriteFixture(pool, current);
  }
}, 45_000);
afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
}, 30_000);

describe("DB05 classroom sender snapshot end-to-end PostgreSQL contract", () => {
  it("retains the same sender in timeline, delta and lesson thread after profile rename", async () => {
    const { ids, context } = fixture!;
    const posted = await createCourseDiscussionMessage(context, ids.delivery, {
      messageText: "Name remains historically attributable",
      lessonContentId: ids.content,
    });
    const snapshot = await pool.query<{sender_name_snapshot:string}>(
      "SELECT sender_name_snapshot FROM course_discussion_messages WHERE id=$1", [posted.id]);
    const originalName = snapshot.rows[0]?.sender_name_snapshot;
    expect(originalName).toBeTruthy();

    const changedName = "Updated identity " + ids.user.slice(0, 8);
    await pool.query("UPDATE users SET display_name=$1 WHERE id=$2", [changedName, ids.user]);
    // Arrange a pinned persisted message without giving this learner a
    // moderation grant. Read-only highlighted-pin projection must also use
    // the write-time attribution instead of the renamed current directory.
    await pool.query(
      "UPDATE course_discussion_messages SET pinned=true,pinned_by_user_id=$1 WHERE id=$2",
      [SEED_IDS.collegeAdminUser, posted.id],
    );
    const timeline = await listCourseDiscussionMessages(context, ids.delivery);
    expect(timeline.messages.find(row => row.id === posted.id)?.senderName).toBe(originalName);
    expect(timeline.highlightedPinned?.senderName).toBe(originalName);
    expect(timeline.pinnedCount).toBe(1);
    const lesson = await listLessonContentDiscussionMessages(context, ids.delivery, ids.content);
    expect(lesson.messages.find(row => row.id === posted.id)?.senderName).toBe(originalName);
    const changes = await listCourseDiscussionChanges(context, ids.delivery, {
      since: new Date(posted.createdAt.getTime() - 1_000).toISOString(),
    });
    expect(changes.changes.find(row => row.id === posted.id))
      .toMatchObject({ senderName: originalName, deleted: false });
    expect(originalName).not.toBe(changedName);
  }, 30_000);

  it("rejects direct SQL attempts to rewrite historical attribution", async () => {
    const { ids, context } = fixture!;
    const posted = await createCourseDiscussionMessage(context, ids.delivery, {
      messageText: "Immutable attribution", lessonContentId: ids.content,
    });
    await expect(pool.query(
      "UPDATE course_discussion_messages SET sender_name_snapshot=$1 WHERE id=$2",
      ["Forged historical display name", posted.id],
    )).rejects.toMatchObject({ code: "23514" });
    const row = await pool.query<{sender_name_snapshot:string}>(
      "SELECT sender_name_snapshot FROM course_discussion_messages WHERE id=$1", [posted.id]);
    expect(row.rows[0]?.sender_name_snapshot).toContain("Course learner");
  }, 30_000);
});
