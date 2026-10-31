import {
  afterAll, beforeAll, beforeEach, describe, expect, it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncementsForAdmin,
  listVisibleAnnouncementsForMembership,
  restoreAnnouncement,
  updateAnnouncement,
} from "@/modules/announcements/service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const dbUrl = process.env.TEST_DATABASE_URL;
const enabled =
  process.env.DB10_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(dbUrl);
const pool = enabled ? new Pool({ connectionString: dbUrl, max: 3 }) : null;

const collegeAdmin: RequestContext = {
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

const superAdminB: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: {
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeB,
  },
};

async function cleanup() {
  await pool?.query("delete from announcements where title like 'W06 announcement %'");
}

describe.skipIf(!enabled)("W06 DB10 announcements PostgreSQL integration", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB10 isolated DB must be explicitly enabled");
    const result = await pool.query(
      "select to_regclass('public.announcements') as announcements",
    );
    if (!result.rows[0]?.announcements) {
      throw new Error("DB10 announcement draft table was not applied to isolated DB");
    }
  });

  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("derives scope from the target and rejects College Admin cross-college writes", async () => {
    const created = await createAnnouncement(collegeAdmin, {
      receiverType: "COLLEGE",
      receiverId: SEED_IDS.collegeA,
      title: "W06 announcement own college",
      message: "Allowed",
    });
    expect(created.collegeId).toBe(SEED_IDS.collegeA);
    expect(created.organizationId).toBe(SEED_IDS.organization);
    expect(created.senderUserId).toBe(SEED_IDS.collegeAdminUser);

    await expect(createAnnouncement(collegeAdmin, {
      receiverType: "COLLEGE",
      receiverId: SEED_IDS.collegeB,
      title: "W06 announcement cross college",
      message: "Denied",
    })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("applies schedule/expiry and pin ordering only on recipient feed", async () => {
    const now = new Date("2026-10-10T10:00:00.000Z");
    await createAnnouncement(collegeAdmin, {
      receiverType: "COLLEGE",
      receiverId: SEED_IDS.collegeA,
      title: "W06 announcement live normal",
      message: "Normal",
      isPinned: false,
    });
    await createAnnouncement(collegeAdmin, {
      receiverType: "COLLEGE",
      receiverId: SEED_IDS.collegeA,
      title: "W06 announcement live pinned",
      message: "Pinned",
      isPinned: true,
    });
    await createAnnouncement(collegeAdmin, {
      receiverType: "COLLEGE",
      receiverId: SEED_IDS.collegeA,
      title: "W06 announcement future",
      message: "Future",
      scheduledAt: "2026-10-11T10:00:00.000Z",
    });
    await createAnnouncement(collegeAdmin, {
      receiverType: "COLLEGE",
      receiverId: SEED_IDS.collegeA,
      title: "W06 announcement expired",
      message: "Expired",
      expiresAt: "2026-10-09T10:00:00.000Z",
    });

    const recipient = await listVisibleAnnouncementsForMembership(learner, now);
    expect(recipient.map((row) => row.title)).toEqual([
      "W06 announcement live pinned",
      "W06 announcement live normal",
    ]);

    const admin = await listAnnouncementsForAdmin(collegeAdmin, { limit: 50 });
    expect(admin.items.map((row) => row.title)).toEqual(
      expect.arrayContaining([
        "W06 announcement future",
        "W06 announcement expired",
      ]),
    );
  });

  it("allows one optimistic writer and rejects a stale concurrent edit", async () => {
    const created = await createAnnouncement(collegeAdmin, {
      receiverType: "COLLEGE",
      receiverId: SEED_IDS.collegeA,
      title: "W06 announcement concurrency",
      message: "v0",
    });

    const results = await Promise.allSettled([
      updateAnnouncement(collegeAdmin, created.id, {
        expectedVersion: 0,
        message: "writer A",
      }),
      updateAnnouncement(collegeAdmin, created.id, {
        expectedVersion: 0,
        message: "writer B",
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });

  it("soft deletes, hides from recipient feed, and restores with version CAS", async () => {
    const created = await createAnnouncement(collegeAdmin, {
      receiverType: "COLLEGE",
      receiverId: SEED_IDS.collegeA,
      title: "W06 announcement lifecycle",
      message: "Lifecycle",
    });
    const deleted = await deleteAnnouncement(collegeAdmin, created.id, {
      expectedVersion: 0,
    });
    expect(deleted.deletedAt).toBeInstanceOf(Date);
    expect(await listVisibleAnnouncementsForMembership(learner))
      .not.toEqual(expect.arrayContaining([
        expect.objectContaining({ id: created.id }),
      ]));

    const restored = await restoreAnnouncement(collegeAdmin, created.id, {
      expectedVersion: 1,
    });
    expect(restored.deletedAt).toBeNull();
    expect(restored.version).toBe(2);
  });

  it("respects selected Super Admin college scope on existing announcements", async () => {
    const created = await createAnnouncement(collegeAdmin, {
      receiverType: "COLLEGE",
      receiverId: SEED_IDS.collegeA,
      title: "W06 announcement scope",
      message: "Private A",
    });
    // The explicit publication consent gate runs before target authorization.
    // Exercise both independent guards: consent cannot grant cross-tenant access.
    await expect(updateAnnouncement(superAdminB, created.id, {
      expectedVersion: 0,
      title: "Cross-scope edit",
    })).rejects.toMatchObject({ code: "CONSENT_REQUIRED" });
    await expect(updateAnnouncement(superAdminB, created.id, {
      expectedVersion: 0,
      title: "Cross-scope edit",
      publishConsent: true,
    })).rejects.toBeInstanceOf(AuthorizationError);
  });
});
