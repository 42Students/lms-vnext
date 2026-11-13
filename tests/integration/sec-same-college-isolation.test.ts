import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  listActiveSessions,
  revokeOtherSessions,
  revokeOwnSession,
} from "@/modules/auth/session-service";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncementsForAdmin,
  listVisibleAnnouncementsForMembership,
  restoreAnnouncement,
  updateAnnouncement,
} from "@/modules/announcements/service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

/**
 * Object-level access between people of the SAME college (row-level security only separates colleges).
 * Learner A and learner B share a college; a faculty member and the other college's admin are also present.
 * Nobody may read or change another person's device sessions, nor manage or see a notice addressed to someone else.
 */
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;

const label = "SEC-ISO-" + randomUUID().slice(0, 8);

const ctx = (user: string, membership: string, college: string, roles: RequestContext["membership"] extends infer M ? string[] : never): RequestContext => ({
  user: { id: user, identityUid: "sec-iso-" + user, platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: membership, collegeId: college, organizationId: SEED_IDS.organization, status: "ACTIVE",
    roles: roles as never,
  },
});

const learnerA = ctx(SEED_IDS.learnerUser, SEED_IDS.learnerCollegeAMembership, SEED_IDS.collegeA, ["LEARNER"]);
const faculty = ctx(SEED_IDS.facultyUser, SEED_IDS.facultyCollegeAMembership, SEED_IDS.collegeA, ["FACULTY"]);
const admin = ctx(SEED_IDS.collegeAdminUser, SEED_IDS.collegeAdminMembership, SEED_IDS.collegeA, ["COLLEGE_ADMIN"]);
// A College B administrator: same platform, different college.
const otherCollegeAdmin = ctx(SEED_IDS.facultyUser, SEED_IDS.facultyCollegeBMembership, SEED_IDS.collegeB, ["COLLEGE_ADMIN"]);

const b = { user: randomUUID(), membership: randomUUID(), role: randomUUID() };
const learnerB = ctx(b.user, b.membership, SEED_IDS.collegeA, ["LEARNER"]);

const digest = (seed: string) => createHash("sha256").update(seed).digest("hex");
const sessionA = { id: randomUUID(), digest: digest(label + "-a") };
const sessionA2 = { id: randomUUID(), digest: digest(label + "-a2") };
const sessionB = { id: randomUUID(), digest: digest(label + "-b") };
const createdAnnouncements: string[] = [];

async function insertSession(s: { id: string; digest: string }, userId: string) {
  await pool!.query(
    `INSERT INTO identity_device_sessions(id,user_id,credential_digest,device_name,created_at,last_seen_at,expires_at)
     VALUES($1,$2,$3,$4,now()-interval '1 hour',now()-interval '1 minute',now()+interval '1 day')`,
    [s.id, userId, s.digest, label],
  );
}
const revokedAt = async (id: string) =>
  (await pool!.query("SELECT revoked_at FROM identity_device_sessions WHERE id=$1", [id])).rows[0]?.revoked_at ?? null;

describe.skipIf(!enabled)("same-college object-level isolation — PostgreSQL", () => {
  beforeAll(async () => {
    const q = pool!.query.bind(pool);
    await q("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)", [b.user, "sec-iso-" + b.user, label + " Learner B"]);
    await q("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)", [b.membership, b.user, SEED_IDS.collegeA]);
    await q("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')", [b.role, b.membership]);
    await insertSession(sessionA, SEED_IDS.learnerUser);
    await insertSession(sessionA2, SEED_IDS.learnerUser);
    await insertSession(sessionB, b.user);
  });

  afterAll(async () => {
    try {
      if (pool) {
        await pool.query("DELETE FROM identity_device_sessions WHERE device_name=$1", [label]);
        if (createdAnnouncements.length) {
          await pool.query("DELETE FROM activity_events WHERE subject_id = ANY($1::text[])", [createdAnnouncements]);
          await pool.query("DELETE FROM announcements WHERE id = ANY($1::uuid[])", [createdAnnouncements]).catch(() => undefined);
        }
        await pool.query("DELETE FROM membership_roles WHERE membership_id=$1", [b.membership]);
        await pool.query("DELETE FROM college_memberships WHERE id=$1", [b.membership]);
        await pool.query("DELETE FROM users WHERE id=$1", [b.user]);
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  describe("device sessions belong to their owner only", () => {
    it("listing returns only the caller's own sessions", async () => {
      const seenByB = (await listActiveSessions(b.user)).map((r) => r["id"]);
      expect(seenByB).toContain(sessionB.id);
      expect(seenByB).not.toContain(sessionA.id);
      expect(seenByB).not.toContain(sessionA2.id);
      const seenByA = (await listActiveSessions(SEED_IDS.learnerUser)).map((r) => r["id"]);
      expect(seenByA).toEqual(expect.arrayContaining([sessionA.id, sessionA2.id]));
      expect(seenByA).not.toContain(sessionB.id);
    });

    it("another person in the same college cannot revoke it, even with its exact id", async () => {
      expect(await revokeOwnSession(sessionA.id, b.user)).toBe(false);
      expect(await revokedAt(sessionA.id)).toBeNull();
    });

    it("'sign out other devices' only touches the caller's own sessions", async () => {
      await revokeOtherSessions(b.user, sessionB.id);
      expect(await revokedAt(sessionA.id)).toBeNull();
      expect(await revokedAt(sessionA2.id)).toBeNull();
      expect(await revokedAt(sessionB.id)).toBeNull();
    });

    it("the owner can still revoke their own session", async () => {
      expect(await revokeOwnSession(sessionA2.id, SEED_IDS.learnerUser)).toBe(true);
      expect(await revokedAt(sessionA2.id)).not.toBeNull();
    });
  });

  describe("a notice addressed to one learner", () => {
    let noticeId = "";
    let version = 0;

    it("an admin of that college can create it", async () => {
      const created = await createAnnouncement(admin, {
        receiverType: "LEARNER", receiverId: SEED_IDS.learnerCollegeAMembership,
        title: label + " private notice", message: "For learner A only",
      });
      noticeId = created.id;
      version = created.version;
      createdAnnouncements.push(created.id);
      expect(noticeId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("is visible to its addressee and to nobody else in the college", async () => {
      const mine = await listVisibleAnnouncementsForMembership(learnerA);
      expect(mine.map((n) => n.id)).toContain(noticeId);
      const theirs = await listVisibleAnnouncementsForMembership(learnerB);
      expect(theirs.map((n) => n.id)).not.toContain(noticeId);
      const facultyView = await listVisibleAnnouncementsForMembership(faculty);
      expect(facultyView.map((n) => n.id)).not.toContain(noticeId);
    });

    it("cannot be changed, withdrawn or restored by a learner, a faculty member or another college's admin", async () => {
      for (const [who, actor] of [["learner A", learnerA], ["learner B", learnerB], ["faculty", faculty], ["other college admin", otherCollegeAdmin]] as const) {
        await expect(updateAnnouncement(actor, noticeId, { expectedVersion: version, title: label + " hijacked" }), who).rejects.toThrow();
        await expect(deleteAnnouncement(actor, noticeId, { expectedVersion: version }), who).rejects.toThrow();
        await expect(restoreAnnouncement(actor, noticeId, { expectedVersion: version }), who).rejects.toThrow();
      }
      const row = (await pool!.query("SELECT title, deleted_at, version FROM announcements WHERE id=$1", [noticeId])).rows[0];
      expect(row.title).toBe(label + " private notice");
      expect(row.deleted_at).toBeNull();
      expect(Number(row.version)).toBe(version);
    });

    it("the administration lists are closed to learners and to faculty", async () => {
      await expect(listAnnouncementsForAdmin(learnerB)).rejects.toThrow();
      await expect(listAnnouncementsForAdmin(faculty)).rejects.toThrow();
    });

    it("a learner cannot create a notice, and an admin cannot address another college's membership", async () => {
      await expect(createAnnouncement(learnerB, {
        receiverType: "COLLEGE", receiverId: SEED_IDS.collegeA, title: label + " x", message: "x",
      })).rejects.toThrow();
      await expect(createAnnouncement(otherCollegeAdmin, {
        receiverType: "COLLEGE", receiverId: SEED_IDS.collegeA, title: label + " y", message: "y",
      })).rejects.toThrow();
    });
  });
});
