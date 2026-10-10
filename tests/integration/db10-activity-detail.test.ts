import {
  afterAll, beforeEach, describe, expect, it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  getActivityEventDetail,
  recordActivityEvent,
} from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { SEED_IDS } from "../../scripts/db-seed-data";

const dbUrl = process.env.TEST_DATABASE_URL;
const enabled =
  process.env.DB10_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(dbUrl);
const pool = enabled ? new Pool({ connectionString: dbUrl, max: 2 }) : null;
const fixture = "w06_activity_detail_fixture";

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

const facultyB: RequestContext = {
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

const superAdmin = (collegeId: string | null): RequestContext => ({
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: collegeId
    ? { organizationId: SEED_IDS.organization, collegeId }
    : null,
});

async function cleanup() {
  await pool?.query(
    "delete from activity_events where subject_type = $1",
    [fixture],
  );
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await pool?.end();
  await closeDatabaseConnection();
});

describe.skipIf(!enabled)("W06 activity event detail tenant isolation", () => {
  it("allows own-college College Admin and hides another-college event ID", async () => {
    const own = await recordActivityEvent(collegeAdmin, {
      eventType: ACTIVITY_EVENT_TYPES.IDENTITY_ROLES_CHANGED,
      collegeId: SEED_IDS.collegeA,
      subjectType: fixture,
      subjectId: "own",
      summary: "Own event",
    });
    const other = await recordActivityEvent(facultyB, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_LEARNER_ENROLLED,
      collegeId: SEED_IDS.collegeB,
      subjectType: fixture,
      subjectId: "other",
      summary: "Other event",
    });

    await expect(getActivityEventDetail(collegeAdmin, own.id))
      .resolves.toMatchObject({ event: { id: own.id } });
    await expect(getActivityEventDetail(collegeAdmin, other.id))
      .rejects.toMatchObject({ code: "ACTIVITY_EVENT_NOT_FOUND" });
  });

  it("honors selected Super Admin college scope and global Super Admin access", async () => {
    const a = await recordActivityEvent(collegeAdmin, {
      eventType: ACTIVITY_EVENT_TYPES.IDENTITY_ROLES_CHANGED,
      collegeId: SEED_IDS.collegeA,
      subjectType: fixture,
      subjectId: "a",
      summary: "A",
    });
    const b = await recordActivityEvent(facultyB, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_LEARNER_ENROLLED,
      collegeId: SEED_IDS.collegeB,
      subjectType: fixture,
      subjectId: "b",
      summary: "B",
    });

    await expect(getActivityEventDetail(superAdmin(SEED_IDS.collegeB), b.id))
      .resolves.toMatchObject({ event: { id: b.id } });
    await expect(getActivityEventDetail(superAdmin(SEED_IDS.collegeB), a.id))
      .rejects.toMatchObject({ code: "ACTIVITY_EVENT_NOT_FOUND" });
    await expect(getActivityEventDetail(superAdmin(null), a.id))
      .resolves.toMatchObject({ event: { id: a.id } });
  });

  it("redacts unsafe metadata before returning detail to an admin", async () => {
    const event = await recordActivityEvent(collegeAdmin, {
      eventType: ACTIVITY_EVENT_TYPES.IDENTITY_ROLES_CHANGED,
      collegeId: SEED_IDS.collegeA,
      subjectType: fixture,
      subjectId: "metadata",
      summary: "Metadata",
      metadata: {
        reason: "authorized",
        apiToken: "do-not-render",
        identity: { panNumber: "ABCDE1234F", safe: "yes" },
      },
    });

    const detail = await getActivityEventDetail(collegeAdmin, event.id);
    expect(detail.event.metadata).toEqual({
      reason: "authorized",
      apiToken: "[REDACTED]",
      identity: { panNumber: "[REDACTED]", safe: "yes" },
    });
  });
});
