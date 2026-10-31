import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  countOwnUnreadNotifications,
  listOwnNotifications,
  markAllOwnNotificationsRead,
} from "@/modules/activity/notification-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const connection = process.env.TEST_DATABASE_URL;
if (!connection) {
  throw new Error("DB10 requires an explicitly disposable TEST_DATABASE_URL");
}
assertDb018DisposableTarget(process.env, {serviceBound: true});
const pool = new Pool({ connectionString: connection, max: 2 });
const fixtureType = "w06_read_all_fixture";

// Fresh recipients per run: leftover inbox rows written for the shared seeded
// users by earlier integration files must not skew exact counts.
type Recipient = { userId: string; membershipId: string; context: RequestContext };
let learner: RequestContext;
let other: RequestContext;
const recipients: Recipient[] = [];

async function newRecipient(
  collegeId: string,
  role: "LEARNER" | "FACULTY",
): Promise<Recipient> {
  const userId = randomUUID();
  const membershipId = randomUUID();
  const identityUid = `w06-read-all-${userId}`;
  await pool.query(
    "insert into users (id, identity_uid, display_name) values ($1, $2, $3)",
    [userId, identityUid, "W06 notification recipient"],
  );
  await pool.query(
    "insert into college_memberships (id, user_id, college_id, status) values ($1, $2, $3, 'ACTIVE')",
    [membershipId, userId, collegeId],
  );
  await pool.query(
    "insert into membership_roles (membership_id, role) values ($1, $2)",
    [membershipId, role],
  );
  const recipient: Recipient = {
    userId,
    membershipId,
    context: {
      user: { id: userId, identityUid, platformStatus: "ACTIVE", systemRoles: [] },
      membership: {
        id: membershipId,
        collegeId,
        organizationId: SEED_IDS.organization,
        status: "ACTIVE",
        roles: [role],
      },
    },
  };
  recipients.push(recipient);
  return recipient;
}

async function cleanup() {
  for (const recipient of recipients) {
    await pool.query("delete from in_app_notifications where user_id = $1", [recipient.userId]);
  }
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
      select $1, NULL::uuid, $2, 'PLATFORM', 'platform.college.created',
             'NORMAL', $3, gen_random_uuid()::text, 'W06 read-all integration fixture'
      from generate_series(1, $4) returning id
    )
    insert into in_app_notifications(user_id, event_id, title, body)
    select recipient.user_id, e.id, 'W06 fixture', 'Read acknowledgment'
    from events e
    cross join (values ($5::uuid), ($6::uuid)) as recipient(user_id)`,
    [
      // Organization-scoped event legitimately reaches members of both colleges.
      SEED_IDS.organization, SEED_IDS.collegeAdminUser, fixtureType,
      quantity, learner.user.id, other.user.id,
    ],
  );
}

beforeAll(async () => {
  learner = (await newRecipient(SEED_IDS.collegeA, "LEARNER")).context;
  other = (await newRecipient(SEED_IDS.collegeB, "FACULTY")).context;
});
beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  for (const recipient of recipients) {
    await pool.query("delete from membership_roles where membership_id = $1", [recipient.membershipId]);
    await pool.query("delete from college_memberships where id = $1", [recipient.membershipId]);
    await pool.query("delete from users where id = $1", [recipient.userId]);
  }
  await pool.end();
  await closeDatabaseConnection();
});

describe("W06 mark-all notification isolation", () => {
  it("acknowledges the entire inbox, including rows past the 100-item page", async () => {
    await seedNotifications(105);
    expect(await listOwnNotifications(learner, { limit: 100 })).toHaveLength(100);
    const learnerUnread=await countOwnUnreadNotifications(learner);
    const otherUnread=await countOwnUnreadNotifications(other);
    const {rows:fixtureRows}=await pool.query<{total:number}>(
      "select count(*)::int as total from in_app_notifications n "+
      "join activity_events e on e.id=n.event_id "+
      "where n.user_id=$1 and e.subject_type=$2",
      [learner.user.id,fixtureType],
    );
    expect(fixtureRows[0]?.total).toBe(105);
    // The activity pipeline can deliver unrelated receipts concurrently.
    // Mark-all must acknowledge the actual inbox, not only fixture events.
    expect(learnerUnread).toBeGreaterThanOrEqual(105);
    expect(await markAllOwnNotificationsRead(learner)).toBe(learnerUnread);
    expect(await countOwnUnreadNotifications(learner)).toBe(0);
    expect(await markAllOwnNotificationsRead(learner)).toBe(0);

    // Same event reaches another user; their inbox must not be touched.
    expect(await countOwnUnreadNotifications(other)).toBe(otherUnread);
    expect(await listOwnNotifications(other, { unreadOnly: true, limit: 100 }))
      .toHaveLength(100);
  });

  it("multiple simultaneous mark-all calls cannot mutate other users", async () => {
    await seedNotifications(6);
    const learnerUnread=await countOwnUnreadNotifications(learner);
    const otherUnread=await countOwnUnreadNotifications(other);
    expect(learnerUnread).toBeGreaterThanOrEqual(6);
    const [a, b] = await Promise.all([
      markAllOwnNotificationsRead(learner),
      markAllOwnNotificationsRead(learner),
    ]);
    expect(a + b).toBe(learnerUnread);
    expect(await countOwnUnreadNotifications(learner)).toBe(0);
    expect(await countOwnUnreadNotifications(other)).toBe(otherUnread);
  });
});
