import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { confirmTpoOwnNotificationRead, listTpoOwnNotifications,
  TpoOwnNotificationConflict } from "@/modules/placements/tpo-own-notification-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const createdNotifications: string[] = [];
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "db09-tpo-own-notifications", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
async function fixture(collegeId: string = SEED_IDS.collegeA) {
  if (!pool) throw new Error("Disposable PostgreSQL is required");
  const label = "PLACEMENTS_TEST_" + randomUUID().replaceAll("-", "").slice(0, 15).toUpperCase();
  const event = (await pool.query<{ id: string }>(
    "INSERT INTO activity_events (organization_id,college_id,actor_user_id,actor_membership_id,module,event_type,subject_type,subject_id,summary) " +
    "VALUES ($1,$2,$3,$4,'PLACEMENTS',$5,'tpo_notification_test',$6,'Test placement event') RETURNING id",
    [SEED_IDS.organization, collegeId, SEED_IDS.facultyUser,
      SEED_IDS.facultyCollegeAMembership, label, randomUUID()],
  )).rows[0];
  if (!event) throw new Error("Activity fixture failed");
  const notification = (await pool.query<{ id: string }>(
    "INSERT INTO in_app_notifications (user_id,event_id,title,body) " +
    "VALUES ($1,$2,$3,$4) RETURNING id",
    [SEED_IDS.facultyUser, event.id, "PRIVATE TEST TITLE", "PRIVATE TEST BODY"],
  )).rows[0];
  if (!notification) throw new Error("Notification fixture failed");
  createdNotifications.push(notification.id);
  return { id: notification.id, label };
}
async function cleanup() {
  if (!pool || !createdNotifications.length) return;
  await pool.query("DELETE FROM in_app_notifications WHERE id = ANY($1::uuid[])", [createdNotifications]);
  createdNotifications.length = 0;
  // Source and mark-read activity_events are append-only; never delete them in cleanup.
}
afterEach(cleanup);
afterAll(async () => { await cleanup(); await pool?.end(); await closeDatabaseConnection(); });
describe.skipIf(!enabled)("DB09 TPO own notification inbox PostgreSQL", () => {
  it("reads only own notifications, marks read once and writes an immutable actor audit", async () => {
    if (!pool) throw new Error("DB required");
    const item = await fixture();
    const before = await listTpoOwnNotifications(tpo, { q: item.label });
    expect(before.items.some((row) => row.id === item.id && !row.read)).toBe(true);
    expect(JSON.stringify(before.items)).not.toContain("PRIVATE TEST BODY");
    const payload = { confirmed: true, expectedUnread: true, notificationId: item.id };
    const changed = await confirmTpoOwnNotificationRead(tpo, payload);
    expect(changed.id).toBe(item.id);
    const after = await listTpoOwnNotifications(tpo, { q: item.label, status: "READ" });
    expect(after.items.some((row) => row.id === item.id && row.read)).toBe(true);
    await expect(confirmTpoOwnNotificationRead(tpo, payload))
      .rejects.toBeInstanceOf(TpoOwnNotificationConflict);
    const audit = (await pool.query<{ total: number }>(
      "SELECT count(*)::integer AS total FROM activity_events " +
      "WHERE subject_id=$1 AND event_type='PLACEMENTS_TPO_NOTIFICATION_READ'",
      [item.id],
    )).rows[0];
    expect(audit?.total).toBe(1);
  });
  it("denies wrong role and foreign-college notification even for matching recipient", async () => {
    const item = await fixture(SEED_IDS.collegeB);
    const wrong: RequestContext = { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] } };
    const payload = { confirmed: true, expectedUnread: true, notificationId: item.id };
    await expect(confirmTpoOwnNotificationRead(wrong, payload)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(confirmTpoOwnNotificationRead(tpo, payload)).rejects.toBeInstanceOf(TpoOwnNotificationConflict);
    const found = await listTpoOwnNotifications(tpo, {});
    expect(found.items.some((row) => row.id === item.id)).toBe(false);
    await expect(confirmTpoOwnNotificationRead(tpo, { ...payload, confirmed: false }))
      .rejects.toBeDefined();
  });
});
