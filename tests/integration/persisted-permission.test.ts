import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import {
  closeDatabaseConnection,
  getDb,
} from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  AuthorizationError,
} from "@/modules/permissions/policy";
import {
  assertPersistedPlatformPermission,
} from "@/modules/permissions/persisted-actor";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

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

const faculty: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
};

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

async function restoreActors() {
  await pool.query(
    `update users
       set platform_status = 'ACTIVE'
     where id in ($1, $2)`,
    [
      SEED_IDS.collegeAdminUser,
      SEED_IDS.superAdminUser,
      SEED_IDS.facultyUser,
    ],
  );
  await pool.query(
    `update college_memberships
       set status = 'ACTIVE',
           suspended_at = null,
           suspension_reason = null
     where id = $1`,
    [SEED_IDS.collegeAdminMembership],
  );
  await pool.query(
    `insert into membership_roles
       (membership_id, role)
     values ($1, 'COLLEGE_ADMIN')
     on conflict (membership_id, role) do nothing`,
    [SEED_IDS.collegeAdminMembership],
  );
  await pool.query(
    `update college_memberships
       set status = 'ACTIVE',
           suspended_at = null,
           suspension_reason = null
     where id = $1`,
    [SEED_IDS.facultyCollegeAMembership],
  );
  await pool.query(
    `insert into membership_roles
       (membership_id, role)
     values ($1, 'FACULTY')
     on conflict (membership_id, role) do nothing`,
    [SEED_IDS.facultyCollegeAMembership],
  );
  await pool.query(
    `insert into system_roles
       (user_id, role)
     values ($1, 'SUPER_ADMIN')
     on conflict (user_id, role) do nothing`,
    [SEED_IDS.superAdminUser],
  );
}

async function assertManage(
  context: RequestContext,
  collegeId = SEED_IDS.collegeA,
) {
  return getDb().transaction((tx) =>
    assertPersistedPlatformPermission(
      tx,
      context,
      "placements.manage",
      {
        organizationId: SEED_IDS.organization,
        collegeId,
      },
    ),
  );
}

beforeEach(async () => {
  await restoreActors();
});

afterAll(async () => {
  await restoreActors();
  await pool.end();
  await closeDatabaseConnection();
});

describe(
  "persisted platform permission recheck",
  () => {
    it("accepts an active persisted college administrator", async () => {
      await expect(
        assertManage(collegeAdmin),
      ).resolves.toMatchObject({
        user: { platformStatus: "ACTIVE" },
        membership: {
          id: SEED_IDS.collegeAdminMembership,
          status: "ACTIVE",
          roles: expect.arrayContaining([
            "COLLEGE_ADMIN",
          ]),
        },
      });
    });

    it("denies a stale context after membership suspension", async () => {
      await pool.query(
        `update college_memberships
           set status = 'SUSPENDED',
               suspended_at = now(),
               suspension_reason = 'test'
         where id = $1`,
        [SEED_IDS.collegeAdminMembership],
      );

      await expect(
        assertManage(collegeAdmin),
      ).rejects.toBeInstanceOf(
        AuthorizationError,
      );
    });

    it("denies a stale context after role revocation", async () => {
      await pool.query(
        `delete from membership_roles
         where membership_id = $1
           and role = 'COLLEGE_ADMIN'`,
        [SEED_IDS.collegeAdminMembership],
      );

      await expect(
        assertManage(collegeAdmin),
      ).rejects.toBeInstanceOf(
        AuthorizationError,
      );
    });

    it("denies a stale context after platform disable", async () => {
      await pool.query(
        `update users
         set platform_status = 'DISABLED'
         where id = $1`,
        [SEED_IDS.collegeAdminUser],
      );

      await expect(
        assertManage(collegeAdmin),
      ).rejects.toBeInstanceOf(
        AuthorizationError,
      );
    });

    it("accepts persisted Faculty self-profile permission and denies stale role revocation", async () => {
      await expect(
        getDb().transaction((tx) =>
          assertPersistedPlatformPermission(
            tx,
            faculty,
            "profile.self.manage",
            {
              organizationId: SEED_IDS.organization,
              collegeId: SEED_IDS.collegeA,
            },
          ),
        ),
      ).resolves.toMatchObject({
        membership: {
          id: SEED_IDS.facultyCollegeAMembership,
          roles: expect.arrayContaining(["FACULTY"]),
        },
      });

      await pool.query(
        `delete from membership_roles
         where membership_id = $1
           and role = 'FACULTY'`,
        [SEED_IDS.facultyCollegeAMembership],
      );

      await expect(
        getDb().transaction((tx) =>
          assertPersistedPlatformPermission(
            tx,
            faculty,
            "profile.self.manage",
            {
              organizationId: SEED_IDS.organization,
              collegeId: SEED_IDS.collegeA,
            },
          ),
        ),
      ).rejects.toBeInstanceOf(AuthorizationError);
    });

    it("denies stale Faculty self-profile permission after suspension", async () => {
      await pool.query(
        `update college_memberships
           set status = 'SUSPENDED',
               suspended_at = now(),
               suspension_reason = 'test'
         where id = $1`,
        [SEED_IDS.facultyCollegeAMembership],
      );

      await expect(
        getDb().transaction((tx) =>
          assertPersistedPlatformPermission(
            tx,
            faculty,
            "profile.self.manage",
            {
              organizationId: SEED_IDS.organization,
              collegeId: SEED_IDS.collegeA,
            },
          ),
        ),
      ).rejects.toBeInstanceOf(AuthorizationError);
    });

    it("rechecks the persisted SUPER_ADMIN role", async () => {
      await expect(
        assertManage(superAdmin),
      ).resolves.toMatchObject({
        user: {
          systemRoles: expect.arrayContaining([
            "SUPER_ADMIN",
          ]),
        },
      });

      await pool.query(
        `delete from system_roles
         where user_id = $1
           and role = 'SUPER_ADMIN'`,
        [SEED_IDS.superAdminUser],
      );

      await expect(
        assertManage(superAdmin),
      ).rejects.toBeInstanceOf(
        AuthorizationError,
      );
    });

    it("still enforces the resource tenant scope", async () => {
      await expect(
        assertManage(
          collegeAdmin,
          SEED_IDS.collegeB,
        ),
      ).rejects.toBeInstanceOf(
        AuthorizationError,
      );
    });
  },
);
