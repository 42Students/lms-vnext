import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { recordActivityEvent } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  countOwnUnreadNotifications,
  deliverInAppNotification,
  listOwnNotificationPage,
} from "@/modules/activity/notification-service";
import {
  markAllOwnFacultyNotificationsRead,
  markOwnFacultyNotificationRead,
} from "@/modules/activity/faculty-notification-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Faculty notification scope integration requires disposable TEST_DATABASE_URL");
}

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const eventIds: string[] = [];
const runId = randomUUID();
const testUserId = randomUUID();
const testMembershipA = randomUUID();
const testMembershipB = randomUUID();
const roleA = randomUUID();
const roleB = randomUUID();

const faculty: RequestContext = {
  user: {
    id: testUserId, identityUid: "faculty-notifications-" + runId,
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: testMembershipA,
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA,
    status: "ACTIVE", roles: ["FACULTY", "MENTOR"],
  },
};
const facultyB: RequestContext = {
  ...faculty,
  membership: {
    ...faculty.membership!,
    id: testMembershipB,
    collegeId: SEED_IDS.collegeB,
  },
};

beforeAll(async () => {
  // Dedicated two-college user, so bulk acknowledgments cannot alter seeded
  // account notifications or another test's real inbox.
  await pool.query(
    "insert into users (id, identity_uid, email, display_name, platform_status) values ($1,$2,$3,$4,'ACTIVE')",
    [testUserId, "faculty-notifications-" + runId, "faculty-notifications-" + runId + "@example.invalid", "Isolated faculty"],
  );
  for (const [membershipId, collegeId, roleId] of [
    [testMembershipA, SEED_IDS.collegeA, roleA],
    [testMembershipB, SEED_IDS.collegeB, roleB],
  ]) {
    await pool.query(
      "insert into college_memberships (id, user_id, college_id, status) values ($1,$2,$3,'ACTIVE')",
      [membershipId, testUserId, collegeId],
    );
    await pool.query(
      "insert into membership_roles (id, membership_id, role) values ($1,$2,'FACULTY')",
      [roleId, membershipId],
    );
  }
});

async function createNotification(actor: RequestContext, suffix: string) {
  const event = await recordActivityEvent(actor, {
    eventType: ACTIVITY_EVENT_TYPES.COURSES_DISCUSSION_POSTED,
    collegeId: actor.membership!.collegeId,
    organizationId: actor.membership!.organizationId,
    subjectType: "faculty_notification_scope_test",
    subjectId: randomUUID(),
    summary: "Disposable Faculty notification scope witness",
    dedupeKey: "faculty-notifications:" + runId + ":" + suffix,
  });
  eventIds.push(event.id);
  const delivered = await deliverInAppNotification(event.id, [faculty.user.id], {
    title: "Faculty test " + suffix,
    body: "Disposable notification, not live course content",
    actionHref: null,
  });
  expect(delivered.delivered).toBe(1);
  const row = await pool.query<{id: string}>(
    "select id from in_app_notifications where event_id = $1 and user_id = $2",
    [event.id, faculty.user.id],
  );
  expect(row.rows).toHaveLength(1);
  return row.rows[0]!.id;
}

afterAll(async () => {
  try {
    if (eventIds.length) {
      await pool.query("delete from in_app_notifications where event_id = any($1::uuid[])", [eventIds]);
      await pool.query("delete from activity_events where id = any($1::uuid[])", [eventIds]);
    }
    await pool.query("delete from membership_roles where membership_id in ($1,$2)", [testMembershipA, testMembershipB]);
    await pool.query("delete from college_memberships where id in ($1,$2)", [testMembershipA, testMembershipB]);
    await pool.query("delete from users where id = $1", [testUserId]);
  } finally {
    await pool.end();
    await closeDatabaseConnection();
  }
});

describe("Faculty Notification reads are isolated to the active college membership", () => {
  it("lists, counts, acknowledges and bulk-marks only this college's notifications", async () => {
    const firstA = await createNotification(faculty, "a1");
    const secondA = await createNotification(faculty, "a2");
    const otherCollege = await createNotification(facultyB, "b1");

    const pageA = await listOwnNotificationPage(faculty, {
      collegeId: SEED_IDS.collegeA, limit: 50,
    });
    expect(pageA.items.map(row => row.notification.id)).toContain(firstA);
    expect(pageA.items.map(row => row.notification.id)).toContain(secondA);
    expect(pageA.items.map(row => row.notification.id)).not.toContain(otherCollege);

    const pageB = await listOwnNotificationPage(facultyB, {
      collegeId: SEED_IDS.collegeB, limit: 50,
    });
    expect(pageB.items.map(row => row.notification.id)).toContain(otherCollege);
    expect(pageB.items.map(row => row.notification.id)).not.toContain(firstA);

    const beforeA = await countOwnUnreadNotifications(faculty, { collegeId: SEED_IDS.collegeA });
    const beforeB = await countOwnUnreadNotifications(faculty, { collegeId: SEED_IDS.collegeB });
    expect(beforeA).toBeGreaterThanOrEqual(2);
    expect(beforeB).toBeGreaterThanOrEqual(1);

    await expect(markOwnFacultyNotificationRead(faculty, otherCollege))
      .rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
    expect((await markOwnFacultyNotificationRead(faculty, firstA)).readAt).not.toBeNull();
    expect((await markOwnFacultyNotificationRead(faculty, firstA)).readAt).not.toBeNull();

    const bulk = await markAllOwnFacultyNotificationsRead(faculty);
    expect(bulk).toBeGreaterThanOrEqual(1);
    const finalRows = await pool.query<{id: string; read_at: Date|null}>(
      "select id, read_at from in_app_notifications where id = any($1::uuid[])",
      [[firstA, secondA, otherCollege]],
    );
    const readById = new Map(finalRows.rows.map(row => [row.id, row.read_at]));
    expect(readById.get(firstA)).toBeTruthy();
    expect(readById.get(secondA)).toBeTruthy();
    expect(readById.get(otherCollege)).toBeNull();

    const afterA = await countOwnUnreadNotifications(faculty, { collegeId: SEED_IDS.collegeA });
    const afterB = await countOwnUnreadNotifications(faculty, { collegeId: SEED_IDS.collegeB });
    expect(afterA).toBe(0);
    expect(afterB).toBe(beforeB);

    const forgedRole: RequestContext = {
      ...faculty,
      membership: { ...faculty.membership!, roles: ["LEARNER"] },
    };
    const suspended: RequestContext = {
      ...faculty,
      membership: { ...faculty.membership!, status: "SUSPENDED" },
    };
    await expect(markOwnFacultyNotificationRead(forgedRole, firstA)).rejects.toBeDefined();
    await expect(markAllOwnFacultyNotificationsRead(suspended)).rejects.toBeDefined();
    await expect(markOwnFacultyNotificationRead(facultyB, firstA))
      .rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
  });
});
