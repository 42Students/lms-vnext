import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  countOwnUnreadNotifications,
  deliverInAppNotification,
  listOwnNotifications,
  markOwnNotificationRead,
  markAllOwnNotificationsRead,
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

// Each run gets fresh recipients so leftover inbox rows written for the shared
// seeded users by earlier integration files cannot skew exact counts.
type Recipient = { userId: string; membershipId: string; context: RequestContext };
let learner: RequestContext;
let otherUser: RequestContext;
const recipients: Recipient[] = [];

async function newRecipient(
  collegeId: string,
  role: "LEARNER" | "FACULTY",
): Promise<Recipient> {
  const userId = crypto.randomUUID();
  const membershipId = crypto.randomUUID();
  const identityUid = `db10-guard-${userId}`;
  await pool.query(
    "insert into users (id, identity_uid, display_name) values ($1, $2, $3)",
    [userId, identityUid, "DB10 guard recipient"],
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

beforeAll(async()=>{
  const own=await newRecipient(SEED_IDS.collegeA,"LEARNER");
  const foreign=await newRecipient(SEED_IDS.collegeB,"FACULTY");
  learner=own.context;
  otherUser=foreign.context;
});
beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  // Isolated recipients must not leak unread rows or memberships into later suites.
  for(const recipient of recipients){
    await pool.query("DELETE FROM in_app_notifications WHERE user_id=$1",[recipient.userId]);
    await pool.query("DELETE FROM membership_roles WHERE membership_id=$1",[recipient.membershipId]);
    await pool.query("DELETE FROM college_memberships WHERE id=$1",[recipient.membershipId]);
    await pool.query("DELETE FROM users WHERE id=$1",[recipient.userId]);
  }
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
      e.id, [learner.user.id, learner.user.id], message,
    );
    expect(first).toEqual({
      delivered: 1,
      skippedInactive: 0,
      skippedDuplicate: 0,
    });

    const duplicate = await deliverInAppNotification(
      e.id, [learner.user.id], message,
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
      [learner.user.id, tag],
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
        deliverInAppNotification(e.id, [learner.user.id], {
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
    await deliverInAppNotification(e.id, [learner.user.id], {
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

    // The single-notification mark-read endpoint must apply the same
    // fail-closed policy, including when the record was already read.
    const acknowledged = await markOwnNotificationRead(
      learner, first!.notification.id,
    );
    expect(acknowledged.actionHref).toBeNull();
    const acknowledgedAgain = await markOwnNotificationRead(
      learner, first!.notification.id,
    );
    expect(acknowledgedAgain.actionHref).toBeNull();

    const directRow = await pool.query<{ action_href: string }>(
      "select action_href from in_app_notifications where id = $1",
      [first!.notification.id],
    );
    expect(directRow.rows[0]!.action_href).toBe("//attacker.example/redirect");
  });


  it("returns committed read state when multiple requests acknowledge concurrently", async () => {
    const e = await event();
    await deliverInAppNotification(e.id, [learner.user.id], {
      title: "Concurrency notice",
      body: "Mark this once",
      actionHref: "/learn/placements",
    });
    const [notice] = await listOwnNotifications(learner, { limit: 1 });
    expect(notice).toBeDefined();

    const reads = await Promise.all(
      Array.from({ length: 12 }, () =>
        markOwnNotificationRead(learner, notice!.notification.id),
      ),
    );
    expect(reads).toHaveLength(12);
    expect(reads.every((row) => row.readAt instanceof Date)).toBe(true);
    expect(await countOwnUnreadNotifications(learner)).toBe(0);
  });

  it("denies foreign-college notifications for one human with two memberships", async () => {
    const memberB = crypto.randomUUID();
    await pool.query(
      "insert into college_memberships (id,user_id,college_id,status) values ($1,$2,$3,'ACTIVE')",
      [memberB, learner.user.id, SEED_IDS.collegeB],
    );
    await pool.query(
      "insert into membership_roles (membership_id,role) values ($1,'LEARNER')",
      [memberB],
    );
    try {
      const switched: RequestContext = {
        ...learner,
        membership: {
          ...learner.membership!,
          id: memberB,
          collegeId: SEED_IDS.collegeB,
        },
      };
      const addReceipt = async (organizationId: string | null, collegeId: string | null) => {
        const { rows: events } = await pool.query<{ id: string }>(
          `insert into activity_events (
            organization_id,college_id,module,event_type,importance,
            subject_type,subject_id,summary
          ) values ($1,$2,'PLATFORM','platform.college.created','LOW',$3,$4,'Cross-workspace fixture')
          returning id`,
          [organizationId, collegeId, tag, crypto.randomUUID()],
        );
        const { rows: receipts } = await pool.query<{ id: string }>(
          "insert into in_app_notifications (user_id,event_id,title,body) values ($1,$2,'Tenant test','Private notice') returning id",
          [learner.user.id, events[0]!.id],
        );
        return receipts[0]!.id;
      };
      const ownA = await addReceipt(SEED_IDS.organization, SEED_IDS.collegeA);
      const foreignB = await addReceipt(SEED_IDS.organization, SEED_IDS.collegeB);
      const orgNotice = await addReceipt(SEED_IDS.organization, null);
      const platformNotice = await addReceipt(null, null);

      const visibleA = (await listOwnNotifications(learner, { limit: 10 }))
        .map(row => row.notification.id);
      const visibleB = (await listOwnNotifications(switched, { limit: 10 }))
        .map(row => row.notification.id);
      expect(new Set(visibleA)).toEqual(new Set([ownA, orgNotice]));
      expect(new Set(visibleB)).toEqual(new Set([foreignB, orgNotice]));
      expect(await countOwnUnreadNotifications(learner)).toBe(2);
      expect(await countOwnUnreadNotifications(switched)).toBe(2);
      expect(await listOwnNotifications(learner, {
        collegeId: SEED_IDS.collegeB, limit: 10,
      })).toHaveLength(0);

      await expect(markOwnNotificationRead(learner, foreignB))
        .rejects.toThrow("NOTIFICATION_NOT_FOUND");
      await expect(markOwnNotificationRead(switched, ownA))
        .rejects.toThrow("NOTIFICATION_NOT_FOUND");

      expect(await markAllOwnNotificationsRead(learner)).toBe(2);
      const { rows: afterA } = await pool.query<{ id: string; read_at: Date | null }>(
        "select id,read_at from in_app_notifications where user_id=$1 and id=any($2::uuid[])",
        [learner.user.id, [ownA, foreignB, orgNotice, platformNotice]],
      );
      const readById = new Map(afterA.map(row => [row.id, row.read_at]));
      expect(readById.get(ownA)).toBeInstanceOf(Date);
      expect(readById.get(orgNotice)).toBeInstanceOf(Date);
      expect(readById.get(foreignB)).toBeNull();
      expect(readById.get(platformNotice)).toBeNull();
      expect(await markAllOwnNotificationsRead(switched)).toBe(1);
      expect(await countOwnUnreadNotifications(switched)).toBe(0);
    } finally {
      await pool.query("delete from membership_roles where membership_id=$1", [memberB]);
      await pool.query("delete from college_memberships where id=$1", [memberB]);
    }
  });

});
