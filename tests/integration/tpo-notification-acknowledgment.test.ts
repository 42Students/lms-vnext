import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getTpoPersonalInbox, markAllOwnTpoNotificationsRead, markOwnTpoNotificationRead } from "@/modules/activity/tpo-notifications-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO notification acknowledgment requires disposable TEST_DATABASE_URL");
}
assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const suffix = randomUUID().replaceAll("-", "");
const userId = randomUUID();
const otherUserId = randomUUID();
const foreignUserId = randomUUID();
const membershipId = randomUUID();
const otherMembershipId = randomUUID();
const foreignMembershipId = randomUUID();
const roleId = randomUUID();
const otherRoleId = randomUUID();
const foreignRoleId = randomUUID();
const eventIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
const notificationIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
const actor: RequestContext = {
  user: { id: userId, identityUid: "tpo-inbox-" + suffix, platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: membershipId,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

async function cleanup() {
  await pool.query("delete from in_app_notifications where id = any($1::uuid[])", [notificationIds]);
  await pool.query("delete from activity_events where actor_user_id=$1 and event_type='identity.tpo_notification.acknowledged'", [userId]);
  await pool.query("delete from activity_events where id=any($1::uuid[])", [eventIds]);
  await pool.query("delete from membership_roles where id=any($1::uuid[])", [[roleId, otherRoleId, foreignRoleId]]);
  await pool.query("delete from college_memberships where id=any($1::uuid[])", [[membershipId, otherMembershipId, foreignMembershipId]]);
  await pool.query("delete from users where id=any($1::uuid[])", [[userId, otherUserId, foreignUserId]]);
}
afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await pool.end();
    await closeDatabaseConnection();
  }
});

async function fixture() {
  await cleanup();
  for (const [id, uid] of [
    [userId, actor.user.identityUid],
    [otherUserId, "tpo-inbox-other-" + suffix],
    [foreignUserId, "tpo-inbox-foreign-" + suffix],
  ]) {
    await pool.query("insert into users(id,identity_uid,email,display_name,platform_status) values ($1,$2,$3,$4,'ACTIVE')", [
      id, uid, "tpo-inbox-" + id + "@example.invalid", "TPO Inbox " + suffix,
    ]);
  }
  await pool.query("insert into college_memberships(id,user_id,college_id,status) values ($1,$2,$3,'ACTIVE')", [membershipId, userId, SEED_IDS.collegeA]);
  await pool.query("insert into membership_roles(id,membership_id,role) values ($1,$2,'TPO')", [roleId, membershipId]);
  // Separate authorized recipients preserve both cross-college and other-user
  // denial witnesses under DB014's strict database delivery guard.
  await pool.query("insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [otherMembershipId,otherUserId,SEED_IDS.collegeA]);
  await pool.query("insert into membership_roles(id,membership_id,role) values($1,$2,'FACULTY')",
    [otherRoleId,otherMembershipId]);
  await pool.query("insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [foreignMembershipId,foreignUserId,SEED_IDS.collegeB]);
  await pool.query("insert into membership_roles(id,membership_id,role) values($1,$2,'FACULTY')",
    [foreignRoleId,foreignMembershipId]);
  const collegeB = await pool.query<{ organization_id: string }>("select organization_id from colleges where id=$1", [SEED_IDS.collegeB]);
  const orgB = collegeB.rows[0]?.organization_id;
  if (!orgB) throw new Error("Seed College B missing");
  for (let i = 0; i < 4; i++) {
    const foreign = i === 2;
    await pool.query(
      `insert into activity_events (id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary,metadata)
       values ($1,$2,$3,$4,'PLACEMENTS','placements.job.published','test_notification',$5,$6,'{}'::jsonb)`,
      [eventIds[i], foreign ? orgB : SEED_IDS.organization, foreign ? SEED_IDS.collegeB : SEED_IDS.collegeA, SEED_IDS.collegeAdminUser, suffix + "-" + i, "TPO inbox fixture"],
    );
    await pool.query("insert into in_app_notifications (id,user_id,event_id,title,body) values ($1,$2,$3,$4,$5)", [
      notificationIds[i], i === 2 ? foreignUserId : i === 3 ? otherUserId : userId, eventIds[i], "TPO notification " + suffix + "-" + i, "Fixture message",
    ]);
  }
}

describe("TPO inbox persisted same-college acknowledgments", () => {
  it("lists only own current-college notifications and marks them exactly once", async () => {
    await fixture();
    const initial = await getTpoPersonalInbox(actor, { view: "unread" });
    const ids = initial.page.items.map((row) => row.notification.id);
    expect(ids).toEqual(expect.arrayContaining(notificationIds.slice(0, 2)));
    expect(ids).not.toContain(notificationIds[2]);
    expect(ids).not.toContain(notificationIds[3]);
    const first = await markOwnTpoNotificationRead(actor, notificationIds[0]);
    expect(first.readAt).toBeInstanceOf(Date);
    expect((await markOwnTpoNotificationRead(actor, notificationIds[0])).readAt).toBeInstanceOf(Date);
    await expect(markOwnTpoNotificationRead(actor, notificationIds[2])).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
    await expect(markOwnTpoNotificationRead(actor, notificationIds[3])).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
    const bulk = await markAllOwnTpoNotificationsRead(actor);
    expect(bulk).toEqual({ markedRead: 1 });
    expect(await markAllOwnTpoNotificationsRead(actor)).toEqual({ markedRead: 0 });
    const unread = await getTpoPersonalInbox(actor, { view: "unread" });
    expect(unread.unreadCount).toBe(0);
    expect(unread.page.items).toEqual([]);
    const rows = await pool.query<{ id: string; read_at: Date | null }>("select id,read_at from in_app_notifications where id=any($1::uuid[])", [notificationIds]);
    expect(rows.rows.find((row) => row.id === notificationIds[2])?.read_at).toBeNull();
    expect(rows.rows.find((row) => row.id === notificationIds[3])?.read_at).toBeNull();
    const audits = await pool.query<{ subject_type: string; college_id: string; actor_user_id: string }>(
      "select subject_type,college_id,actor_user_id from activity_events where actor_user_id=$1 and event_type='identity.tpo_notification.acknowledged' order by occurred_at",
      [userId],
    );
    expect(audits.rows).toHaveLength(2);
    expect(audits.rows.every((row) => row.college_id === SEED_IDS.collegeA && row.actor_user_id === userId)).toBe(true);
  });

  it("denies wrong-role, suspended, forged-college and invalid-cursor access without leaking", async () => {
    await fixture();
    const wrongRole: RequestContext = { ...actor, membership: { ...actor.membership!, roles: ["MENTOR"] } };
    await expect(getTpoPersonalInbox(wrongRole, {})).rejects.toBeDefined();
    await expect(markAllOwnTpoNotificationsRead(wrongRole)).rejects.toBeDefined();
    const suspended: RequestContext = { ...actor, membership: { ...actor.membership!, status: "SUSPENDED" } };
    await expect(markOwnTpoNotificationRead(suspended, notificationIds[0])).rejects.toBeDefined();
    const foreign: RequestContext = { ...actor, membership: { ...actor.membership!, collegeId: SEED_IDS.collegeB } };
    await expect(markAllOwnTpoNotificationsRead(foreign)).rejects.toBeDefined();
    await expect(getTpoPersonalInbox(foreign, {})).rejects.toBeDefined();
    const invalid = await getTpoPersonalInbox(actor, { beforeId: "not-a-cursor" });
    expect(invalid.cursor.invalid).toBe(true);
    expect(invalid.page.items).toEqual([]);
    const unread = await pool.query<{ n: number }>("select count(*)::int as n from in_app_notifications where id=any($1::uuid[]) and read_at is null", [notificationIds]);
    expect(unread.rows[0]?.n).toBe(4);
  });
});
