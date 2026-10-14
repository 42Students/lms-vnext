import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  createCourseDiscussionMessage,
  deleteCourseDiscussionMessage,
  listCourseDiscussionMessages,
  toggleCourseDiscussionPin,
} from "@/modules/courses/discussion-service";
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
let foreign: LearnerCourseWriteFixture | null = null;

beforeEach(async () => {
  fixture = newLearnerCourseWriteFixture();
  await seedLearnerCourseWriteFixture(pool, fixture);
}, 45_000);
afterEach(async () => {
  const cleanupOther = foreign;
  const cleanupOwn = fixture;
  foreign = null;
  fixture = null;
  try {
    if (cleanupOther) await cleanupLearnerCourseWriteFixture(pool, cleanupOther);
  } finally {
    if (cleanupOwn) await cleanupLearnerCourseWriteFixture(pool, cleanupOwn);
  }
}, 45_000);
afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
}, 30_000);

describe("learner Section discussions with fresh PostgreSQL actors", () => {
  it("posts and replies in the enrolled delivery, rejects pin and audits exactly once", async () => {
    const { context, ids } = fixture!;
    const posted = await createCourseDiscussionMessage(context, ids.delivery, {
      messageText: "First class question",
    });
    const reply = await createCourseDiscussionMessage(context, ids.delivery, {
      messageText: "Follow up",
      replyToMessageId: posted.id,
    });
    expect(reply.messageText).toContain(posted.id.slice(0, 8));
    const feed = await listCourseDiscussionMessages(context, ids.delivery);
    expect(feed.messages.map(message => message.id)).toEqual(
      expect.arrayContaining([posted.id, reply.id]),
    );
    await expect(toggleCourseDiscussionPin(context, posted.id, ids.delivery))
      .rejects.toBeDefined();
    const audit = await pool.query<{ total: string }>(
      "SELECT count(*)::text AS total FROM activity_events WHERE subject_id=$1 AND event_type='courses.discussion.posted'",
      [posted.id],
    );
    expect(audit.rows[0]?.total).toBe("1");
    const removed = await deleteCourseDiscussionMessage(context, reply.id, ids.delivery);
    expect(removed.id).toBe(reply.id);
    const after = await listCourseDiscussionMessages(context, ids.delivery);
    expect(after.messages.some(message => message.id === reply.id)).toBe(false);
  }, 30_000);

  it("denies forged-college, suspended, wrong-role and swapped actor writes", async () => {
    const { context, ids } = fixture!;
    const posted = await createCourseDiscussionMessage(context, ids.delivery, {
      messageText: "Own class question",
    });
    const denied: RequestContext[] = [
      { ...context, membership: { ...context.membership!, collegeId: SEED_IDS.collegeB } },
      { ...context, membership: { ...context.membership!, status: "SUSPENDED" } },
      { ...context, membership: { ...context.membership!, roles: ["FACULTY"] } },
      { ...context, user: { ...context.user, id: SEED_IDS.facultyUser } },
    ];
    for (const actor of denied) {
      await expect(createCourseDiscussionMessage(actor, ids.delivery, {
        messageText: "Forged class question",
      })).rejects.toBeDefined();
      await expect(deleteCourseDiscussionMessage(actor, posted.id, ids.delivery))
        .rejects.toBeDefined();
    }
    const stored = await pool.query(
      "SELECT id FROM course_discussion_messages WHERE delivery_id=$1",
      [ids.delivery],
    );
    expect(stored.rows.map(row => row.id)).toEqual([posted.id]);
  }, 30_000);

  it("denies replies and delete requests across separate Section deliveries", async () => {
    const { context, ids } = fixture!;
    foreign = newLearnerCourseWriteFixture();
    await seedLearnerCourseWriteFixture(pool, foreign);
    const second = await createCourseDiscussionMessage(foreign.context, foreign.ids.delivery, {
      messageText: "Second Section message",
    });
    await expect(createCourseDiscussionMessage(context, ids.delivery, {
      messageText: "Cross-Section reply",
      replyToMessageId: second.id,
    })).rejects.toBeDefined();
    await expect(deleteCourseDiscussionMessage(context, second.id, ids.delivery))
      .rejects.toBeDefined();
    expect((await listCourseDiscussionMessages(foreign.context, foreign.ids.delivery))
      .messages.some(message => message.id === second.id)).toBe(true);
  }, 30_000);
});
