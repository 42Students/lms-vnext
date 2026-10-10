import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  listOwnNotificationPage,
  markAllOwnNotificationsRead,
} from "@/modules/activity/notification-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("W06 notification page tests require disposable Postgres");
const pool = new Pool({ connectionString: databaseUrl, max: 2 });
const fixtureType = "w06_keyset_pagination_fixture";

const learner: RequestContext = {
  user: { id: SEED_IDS.learnerUser, identityUid: "seed-learner", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["LEARNER"],
  },
};
const faculty: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "seed-faculty", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["FACULTY"],
  },
};

async function cleanup() {
  await pool.query(
    "delete from in_app_notifications where event_id in (select id from activity_events where subject_type = $1)",
    [fixtureType],
  );
  await pool.query("delete from activity_events where subject_type = $1", [fixtureType]);
}

async function seed(count: number) {
  await pool.query(`
    with events as (
      insert into activity_events (
        organization_id, college_id, actor_user_id, module, event_type,
        importance, subject_type, subject_id, summary
      )
      select $1, $2, $3, 'PLATFORM', 'platform.college.created',
             'NORMAL', $4, gen_random_uuid()::text, 'W06 paging'
      from generate_series(1, $5) returnIng id
    )
    insert into in_app_notifications (user_id, event_id, title, body, created_at)
    select $6, id, 'Paging', 'Notification', now() -
             (row_number() over (order by id)) * interval '1 minute'
    from events
  `, [
    SEED_IDS.organization, SEED_IDS.collegeA, SEED_IDS.collegeAdminUser,
    fixtureType, count, SEED_IDS.learnerUser,
  ]);
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("W06 notification keyset history", () => {
  it("paginates all 115 rows with no skip/duplicate and never leaks another user", async () => {
    await seed(115);
    const allIds: string[] = [];
    let cursor: { beforeCreatedAt: Date; beforeId: string } | null = null;
    for (let pageNumber = 0; pageNumber < 4; pageNumber++) {
      const page = await listOwnNotificationPage(learner, {
        limit: 50, ...(cursor ?? {}),
      });
      allIds.push(...page.items.map((item) => item.notification.id));
      cursor = page.nextCursor;
      if (!cursor) break;
    }
    expect(allIds).toHaveLength(115);
    expect(new Set(allIds).size).toBe(115);
    expect(cursor).toBeNull();
    expect((await listOwnNotificationPage(faculty, { limit: 50 })).items)
      .toHaveLength(0);
  });

  it("preserves equal-timestamp UUID tie ordering and unread filter", async () => {
    await seed(3);
    await pool.query(
      "update in_app_notifications set created_at = $1 where event_id in (select id from activity_events where subject_type = $2)",
      ["2026-10-10T09:00:00.000Z", fixtureType],
    );
    const first = await listOwnNotificationPage(learner, { limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).toBeTruthy();
    const second = await listOwnNotificationPage(learner, {
      limit: 1, ...first.nextCursor!,
    });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.notification.id).not.toBe(first.items[0]?.notification.id);

    expect(await markAllOwnNotificationsRead(learner)).toBe(3);
    const unread = await listOwnNotificationPage(learner, { unreadOnly: true });
    expect(unread.items).toHaveLength(0);
  });
});
