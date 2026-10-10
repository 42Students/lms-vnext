import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  countOwnUnreadNotifications,
  listOwnNotifications,
  markAllOwnNotificationsRead,
} from "@/modules/activity/notification-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const connection = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connection) {
  throw new Error("DB10 integration tests require TEST_DATABASE_URL or DATABASE_URL");
}
const pool = new Pool({ connectionString: connection, max: 2 });
const fixtureType = "w06_read_all_fixture";

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};
const other: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
};

async function cleanup() {
  await pool.query(
    "delete from in_app_notifications where event_id in (select id from activity_events where subject_type = $1)",
    [fixtureType],
  );
  await pool.query("delete from activity_events where subject_type = $1", [fixtureType]);
}

async function seedNotifications(quantity: number) {
  await pool.query(
    `with events as (
      insert into activity_events (
        organization_id, college_id, actor_user_id,
        module, event_type, importance, subject_type, subject_id, summary
      )
      select $1, $2, $3, 'PLATFORM', 'platform.college.created',
             'NORMAL', $4, gen_random_uuid()::text, 'W06 read-all integration fixture'
      from generate_series(1, $5) returning id
    )
    insert into in_app_notifications(user_id, event_id, title, body)
    select recipient.user_id, e.id, 'W06 fixture', 'Read acknowledgment'
    from events e
    cross join (values ($6::uuid), ($7::uuid)) as recipient(user_id)`,
    [
      SEED_IDS.organization, SEED_IDS.collegeA,
      SEED_IDS.collegeAdminUser, fixtureType,
      quantity, SEED_IDS.learnerUser, SEED_IDS.facultyUser,
    ],
  );
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("W06 mark-all notification isolation", () => {
  it("acknowledges the entire inbox, including rows past the 100-item page", async () => {
    await seedNotifications(105);
    expect(await listOwnNotifications(learner, { limit: 100 })).toHaveLength(100);
    expect(await countOwnUnreadNotifications(learner)).toBe(105);
    expect(await markAllOwnNotificationsRead(learner)).toBe(105);
    expect(await countOwnUnreadNotifications(learner)).toBe(0);
    expect(await markAllOwnNotificationsRead(learner)).toBe(0);

    // Same event reaches another user; their inbox must not be touched.
    expect(await countOwnUnreadNotifications(other)).toBe(105);
    expect(await listOwnNotifications(other, { unreadOnly: true, limit: 100 }))
      .toHaveLength(100);
  });

  it("multiple simultaneous mark-all calls cannot mutate other users", async () => {
    await seedNotifications(6);
    const [a, b] = await Promise.all([
      markAllOwnNotificationsRead(learner),
      markAllOwnNotificationsRead(learner),
    ]);
    expect(a + b).toBe(6);
    expect(await countOwnUnreadNotifications(learner)).toBe(0);
    expect(await countOwnUnreadNotifications(other)).toBe(6);
  });
});
