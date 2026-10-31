import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCollegeNoticeInbox } from "@/modules/announcements/college-notice-inbox-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const own: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "notice-read-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "notice-read-foreign", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const wrongRole: RequestContext = { ...own, membership: { ...own.membership!, roles: ["LEARNER"] } };
const ids = { eventA: randomUUID(), eventB: randomUUID(), notificationA: randomUUID(), notificationB: randomUUID() };

describe.skipIf(!enabled)("College notices: registered own-recipient PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw Error("Disposable PostgreSQL required");
    for (const [eventId, collegeId] of [[ids.eventA, SEED_IDS.collegeA], [ids.eventB, SEED_IDS.collegeB]]) {
      await pool.query("INSERT INTO activity_events(id,organization_id,college_id,actor_user_id,module,event_type,importance,subject_type,subject_id,summary) " +
        "VALUES($1::uuid,$2,$3,$4,'ACADEMICS','academics.program.updated','NORMAL','college_notice_witness',$1::text,'Isolated notification')",
        [eventId, SEED_IDS.organization, collegeId, SEED_IDS.collegeAdminUser]);
    }
    // The registered recipient guard forbids manufacturing a College B
    // notification for a College A-only principal. Preserve a real foreign
    // negative read by delivering that notification to its College B member.
    for (const [noteId,eventId,recipient] of [
      [ids.notificationA,ids.eventA,SEED_IDS.collegeAdminUser],
      [ids.notificationB,ids.eventB,SEED_IDS.facultyUser],
    ]) {
      await pool.query("INSERT INTO in_app_notifications(id,user_id,event_id,title,body) VALUES($1,$2,$3,$4,$5)",
        [noteId,recipient,eventId,"College notice fixture","Non-broadcast personal message"]);
    }
  });
  afterAll(async () => {
    try {
      if (pool) await pool.query("DELETE FROM in_app_notifications WHERE id IN ($1,$2)", [
        ids.notificationA, ids.notificationB,
      ]);
      // activity_events is append-only: never delete the fixture event rows.
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("lists only own-recipient events belonging to the active college", async () => {
    const view = await getCollegeNoticeInbox(own);
    expect(view.items.map(item => item.id)).toContain(ids.notificationA);
    expect(view.unreadCount).toBeGreaterThanOrEqual(1);
    expect(view.items.map(item => item.id)).not.toContain(ids.notificationB);
    const unread = await getCollegeNoticeInbox(own, { unreadOnly:"1" });
    expect(unread.items.map(item => item.id)).toContain(ids.notificationA);
    expect(unread.items.every(item => item.readAt === null)).toBe(true);
    expect(unread.items.map(item => item.id)).not.toContain(ids.notificationB);
  });
  it("a foreign admin does not see the other recipient's event and a learner role is denied", async () => {
    const other = await getCollegeNoticeInbox(foreign);
    expect(other.items.map(item => item.id)).not.toContain(ids.notificationA);
    await expect(getCollegeNoticeInbox(wrongRole)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getCollegeNoticeInbox(own,{collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
    await expect(getCollegeNoticeInbox(wrongRole,{unreadOnly:"1"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
});
