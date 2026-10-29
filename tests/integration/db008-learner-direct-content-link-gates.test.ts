import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import {
  getAuthorizedLessonContent,
  listLessonContents,
} from "@/modules/courses/lesson-content-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  cleanupLearnerCourseWriteFixture,
  newLearnerCourseWriteFixture,
  seedLearnerCourseWriteFixture,
  type LearnerCourseWriteFixture,
} from "../support/learner-course-write-fixture";

// Fail closed before a single fixture INSERT/UPDATE. Both the runtime and
// direct SQL pool must target exactly the same guarded disposable PG database.
if (!process.env.TEST_DATABASE_URL ||
  process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL) {
  throw new Error("DB008 content visibility requires identical disposable DATABASE_URL and TEST_DATABASE_URL");
}
const guard = spawnSync(process.execPath,
  [fileURLToPath(new URL("../../scripts/db01-test-database-guard.mjs", import.meta.url))],
  { env: { ...process.env, DATABASE_URL: "" },
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
if (guard.error || guard.status !== 0) {
  throw new Error("DB008 content visibility refused the PostgreSQL test target");
}
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
let fixture: LearnerCourseWriteFixture | null = null;
const manager = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE" as const,
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE" as const,
    roles: ["COLLEGE_ADMIN" as const],
  },
};

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

describe("DB008 learner direct lesson-content link parity", () => {
  it("sanitizes unsafe persisted resource URLs without altering manager authorship", async () => {
    const { ids, context } = fixture!;
    await pool.query("UPDATE lesson_contents SET external_url=$1,legacy_content_data=$2::jsonb WHERE id=$3",
      ["javascript:alert(1)", JSON.stringify({storageKey:"private/r2/key",token:"legacy-secret"}), ids.content]);
    const learner = await listLessonContents(context, ids.lesson, ids.delivery);
    expect(learner).toHaveLength(1);
    expect(learner[0]).toMatchObject({ id: ids.content, externalUrl: null, storageKey: null, legacyContentData: null });
    const bookmarked = await getAuthorizedLessonContent(context, ids.content, ids.delivery);
    expect(bookmarked.externalUrl).toBeNull();
    const admin = await listLessonContents(manager, ids.lesson, ids.delivery);
    expect(admin[0]?.externalUrl).toBe("javascript:alert(1)");
    expect(admin[0]?.legacyContentData).toMatchObject({storageKey:"private/r2/key",token:"legacy-secret"});

    // A valid HTTPS resource link remains available; no over-redaction.
    await pool.query("UPDATE lesson_contents SET external_url=$1 WHERE id=$2",
      ["https://example.org/reading?lesson=1", ids.content]);
    const allowed = await getAuthorizedLessonContent(context, ids.content, ids.delivery);
    expect(allowed.externalUrl).toBe("https://example.org/reading?lesson=1");
    const paged = await listLessonContents(context, ids.lesson, ids.delivery, false,
      { page: 1, pageSize: 1 });
    expect(paged[0]?.externalUrl).toBe("https://example.org/reading?lesson=1");
  }, 30_000);

  it("allows scheduled live links but hides expired meetings and credential URLs", async () => {
    const { ids, context } = fixture!;
    const upcomingStart = new Date(Date.now() + 2 * 86400_000);
    const upcomingEnd = new Date(Date.now() + 3 * 86400_000);
    // Registered content shape requires both bounds for a LIVE_CLASS.
    await pool.query(`UPDATE lesson_contents SET content_type='LIVE_CLASS',
      notes=null,external_url=$1,starts_at=$2,ends_at=$3 WHERE id=$4`,
      ["https://example.org/live/join", upcomingStart, upcomingEnd, ids.content]);
    const scheduled = await getAuthorizedLessonContent(context, ids.content, ids.delivery);
    expect(scheduled.externalUrl).toBe("https://example.org/live/join");

    await pool.query("UPDATE lesson_contents SET external_url=$1 WHERE id=$2",
      ["https://username:password@example.org/live/join", ids.content]);
    const credentialed = await getAuthorizedLessonContent(context, ids.content, ids.delivery);
    expect(credentialed.externalUrl).toBeNull();

    const pastStart = new Date(Date.now() - 3 * 86400_000);
    const pastEnd = new Date(Date.now() - 2 * 86400_000);
    await pool.query("UPDATE lesson_contents SET starts_at=$1,ends_at=$2,external_url=$3 WHERE id=$4",
      [pastStart, pastEnd, "https://example.org/live/join", ids.content]);
    const ended = await getAuthorizedLessonContent(context, ids.content, ids.delivery);
    expect(ended.externalUrl).toBeNull();
    const admin = await getAuthorizedLessonContent(manager, ids.content, ids.delivery);
    expect(admin.externalUrl).toBe("https://example.org/live/join");
  }, 30_000);
});
