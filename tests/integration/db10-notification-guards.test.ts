import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  countOwnUnreadNotifications,
  deliverInAppNotification,
  listOwnNotifications,
  markOwnNotificationRead,
} from "@/modules/activity/notification-service";
import { recordActivityEvent } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DB10 tests require TEST_DATABASE_URL or DATABASE_URL");
}

const pool = new Pool({ connectionString: databaseUrl, max: 2 });
const tag = "db10_notification_fixture";

const admin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

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
const otherUser: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
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
    [tag],
  );
  await pool.query("delete from activity_events where subject_type = $1", [tag]);
}

async function event() {
  return recordActivityEvent(admin, {
    eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_ISSUED,
    collegeId: SEED_IDS.collegeA,
    subjectType: tag,
    subjectId: crypto.randomUUID(),
    summary: "DB10 delivery fixture",
  });
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB10 notification correctness and privacy", () => {
  it("reports actual inserted deliveries, not eligible attempts on duplicate", async () => {
    const e = await event();
    const message = {
      title: "Offer notice",
      body: "See your offer",
      actionHref: "/learn/placements",
    };
    const first = await deliverInAppNotification(
      e.id, [SEED_IDS.learnerUser, SEED_IDS.learnerUser], message,
    );
    expect(first).toEqual({
      delivered: 1,
      skippedInactive: 0,
      skippedDuplicate: 0,
    });

    const duplicate = await deliverInAppNotification(
      e.id, [SEED_IDS.learnerUser], message,
    );
    expect(duplicate).toEqual({
      delivered: 0,
      skippedInactive: 0,
      skippedDuplicate: 1,
    });
    expect(await countOwnUnreadNotifications(learner)).toBe(1);
  });

  it("counts all 105 unread rows, respects owner and updates after read", async () => {
    const generated = await pool.query<{ id: string }>(
      [
        "insert into activity_events (",
        "organization_id, college_id, actor_user_id,",
        "module, event_type, importance,",
        "subject_type, subject_id, summary)",
        "select $1, $2, $3, 'PLACEMENTS',",
        "'placements.job.published', 'LOW',",
        "$4, 'db10-' || n::text, 'DB10 unread-count fixture'",
        "from generate_series(1, 105) as n returning id",
      ].join(" "),
      [SEED_IDS.organization, SEED_IDS.collegeA, SEED_IDS.collegeAdminUser, tag],
    );
    expect(generated.rows).toHaveLength(105);
    await pool.query(
      [
        "insert into in_app_notifications (user_id, event_id, title, body)",
        "select $1, id, 'DB10 count', 'Unread fixture'",
        "from activity_events where subject_type = $2",
      ].join(" "),
      [SEED_IDS.learnerUser, tag],
    );

    expect(await countOwnUnreadNotifications(learner)).toBe(105);
    expect(await countOwnUnreadNotifications(otherUser)).toBe(0);

    const [first] = await listOwnNotifications(learner, { limit: 1 });
    expect(first).toBeDefined();
    await markOwnNotificationRead(learner, first!.notification.id);
    expect(await countOwnUnreadNotifications(learner)).toBe(104);
  });

  it("rejects protocol-relative, backslash and control-character links", async () => {
    const e = await event();
    for (const actionHref of [
      "//attacker.example/steal",
      "/\\attacker.example",
      "/safe\nunsafe",
    ]) {
      await expect(
        deliverInAppNotification(e.id, [SEED_IDS.learnerUser], {
          title: "Unsafe link",
          body: "Do not navigate here",
          actionHref,
        }),
      ).rejects.toThrow();
    }
    expect(await countOwnUnreadNotifications(learner)).toBe(0);
  });

  it("redacts unsafe legacy-stored action URLs at read time", async () => {
    const e = await event();
    await deliverInAppNotification(e.id, [SEED_IDS.learnerUser], {
      title: "Existing notice",
      body: "Old row",
      actionHref: "/learn/placements",
    });
    const [first] = await listOwnNotifications(learner, { limit: 1 });
    expect(first).toBeDefined();
    await pool.query(
      "update in_app_notifications set action_href = $1 where id = $2",
      ["//attacker.example/redirect", first!.notification.id],
    );

    const [sanitized] = await listOwnNotifications(learner, { limit: 1 });
    expect(sanitized!.notification.actionHref).toBeNull();

    const directRow = await pool.query<{ action_href: string }>(
      "select action_href from in_app_notifications where id = $1",
      [first!.notification.id],
    );
    expect(directRow.rows[0]!.action_href).toBe("//attacker.example/redirect");
  });

});
