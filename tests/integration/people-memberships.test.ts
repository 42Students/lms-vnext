import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import type {
  IdentityDirectory,
  IdentityDirectoryUser,
} from "@/modules/people/identity";
import {
  addMembershipRole,
  updateMembershipLifecycle,
} from "@/modules/people/membership-service";
import { drizzlePeopleRepository } from "@/modules/people/repository";
import {
  getPersonMembershipDetail,
  listCollegePeople,
  onboardPerson,
} from "@/modules/people/service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const identityUid = "integration-people-db-identity";
const phoneE164 = "+919000000090";
const email = "integration.people@example.com";

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "integration-superadmin-identity",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

const seededCollegeAdmin: RequestContext = {
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

function createIdentityDirectory() {
  let user: IdentityDirectoryUser | null = null;
  let createCount = 0;

  const directory: IdentityDirectory = {
    async findByPhone(phone) {
      return user?.phoneNumber === phone ? user : null;
    },
    async findByEmail(candidateEmail) {
      return user?.email?.toLowerCase() === candidateEmail.toLowerCase()
        ? user
        : null;
    },
    async createUser(input) {
      createCount += 1;
      user = {
        uid: identityUid,
        phoneNumber: input.phoneNumber ?? null,
        email: input.email ?? null,
        displayName: input.displayName,
      };
      return user;
    },
    async updateUser(uid, input) {
      if (!user || user.uid !== uid) {
        throw new Error("integration identity missing");
      }

      user = {
        ...user,
        phoneNumber: input.phoneNumber ?? user.phoneNumber,
        email: input.email ?? user.email,
        displayName: input.displayName ?? user.displayName,
      };
      return user;
    },
  };

  return {
    directory,
    getCreateCount: () => createCount,
  };
}

async function cleanupPerson() {
  await pool.query(
    "delete from in_app_notifications",
  );
  await pool.query(
    "delete from activity_events where subject_type = 'college_membership'",
  );
  await pool.query(
    `delete from membership_roles
     where membership_id in (
       select cm.id
       from college_memberships cm
       join users u on u.id = cm.user_id
       where u.identity_uid = $1
     )`,
    [identityUid],
  );
  await pool.query(
    `delete from learner_profiles
     where membership_id in (
       select cm.id
       from college_memberships cm
       join users u on u.id = cm.user_id
       where u.identity_uid = $1
     )`,
    [identityUid],
  );
  await pool.query(
    `delete from faculty_profiles
     where membership_id in (
       select cm.id
       from college_memberships cm
       join users u on u.id = cm.user_id
       where u.identity_uid = $1
     )`,
    [identityUid],
  );
  await pool.query(
    `delete from college_memberships
     where user_id in (
       select id from users where identity_uid = $1
     )`,
    [identityUid],
  );
  await pool.query(
    "delete from users where identity_uid = $1",
    [identityUid],
  );
}

beforeEach(async () => {
  await cleanupPerson();
});

afterAll(async () => {
  await cleanupPerson();
  await pool.end();
  await closeDatabaseConnection();
});

describe("people and memberships against PostgreSQL", () => {
  it("keeps repeated onboarding idempotent and reuses one canonical user", async () => {
    const identity = createIdentityDirectory();
    const input = {
      collegeId: SEED_IDS.collegeA,
      phoneE164,
      email,
      displayName: "Integration Person",
      roles: ["FACULTY"] as const,
    };

    const first = await onboardPerson(superAdmin, input, {
      identityDirectory: identity.directory,
      repository: drizzlePeopleRepository,
    });
    const repeated = await onboardPerson(superAdmin, input, {
      identityDirectory: identity.directory,
      repository: drizzlePeopleRepository,
    });

    expect(identity.getCreateCount()).toBe(1);
    expect(repeated.user.id).toBe(first.user.id);
    expect(repeated.membership.id).toBe(first.membership.id);
    expect(repeated.membership.roles).toEqual(["FACULTY"]);

    const counts = await pool.query(
      `select
         (select count(*)::int from users where identity_uid = $1) as users,
         (
           select count(*)::int
           from college_memberships cm
           join users u on u.id = cm.user_id
           where u.identity_uid = $1
             and cm.college_id = $2
         ) as memberships`,
      [identityUid, SEED_IDS.collegeA],
    );

    expect(counts.rows[0]).toMatchObject({
      users: 1,
      memberships: 1,
    });

    const onboardingEvents =
      await pool.query<{
        event_type: string;
      }>(
        `select event_type
           from activity_events
          where dedupe_key = $1`,
        [
          `person-onboarded:${first.membership.id}`,
        ],
      );
    expect(onboardingEvents.rows).toEqual([
      {
        event_type:
          "identity.person.onboarded",
      },
    ]);
  });

  it("lets the same canonical user join a second college and isolates lifecycle state", async () => {
    const identity = createIdentityDirectory();

    const collegeA = await onboardPerson(
      superAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        phoneE164,
        email,
        displayName: "Integration Person",
        roles: ["FACULTY"],
      },
      {
        identityDirectory: identity.directory,
        repository: drizzlePeopleRepository,
      },
    );

    const collegeB = await onboardPerson(
      superAdmin,
      {
        collegeId: SEED_IDS.collegeB,
        phoneE164,
        email,
        displayName: "Integration Person",
        roles: ["FACULTY", "MENTOR"],
      },
      {
        identityDirectory: identity.directory,
        repository: drizzlePeopleRepository,
      },
    );

    expect(collegeB.user.id).toBe(collegeA.user.id);
    expect(collegeB.membership.id).not.toBe(collegeA.membership.id);
    expect(collegeB.membership.collegeId).toBe(SEED_IDS.collegeB);

    const roles = await addMembershipRole(
      superAdmin,
      collegeB.membership.id,
      { role: "TPO" },
      drizzlePeopleRepository,
    );
    expect(roles).toEqual(["FACULTY", "MENTOR", "TPO"]);

    const repeatedRoles =
      await addMembershipRole(
        superAdmin,
        collegeB.membership.id,
        { role: "TPO" },
        drizzlePeopleRepository,
      );
    expect(repeatedRoles).toEqual([
      "FACULTY",
      "MENTOR",
      "TPO",
    ]);

    const suspended = await updateMembershipLifecycle(
      superAdmin,
      collegeA.membership.id,
      {
        action: "SUSPEND",
        reason: "Integration lifecycle verification",
      },
      drizzlePeopleRepository,
    );
    expect(suspended.membership.status).toBe("SUSPENDED");

    const otherCollege = await getPersonMembershipDetail(
      superAdmin,
      collegeB.membership.id,
      drizzlePeopleRepository,
    );
    expect(otherCollege.membership.status).toBe("ACTIVE");
    expect(otherCollege.membership.roles).toEqual([
      "FACULTY",
      "MENTOR",
      "TPO",
    ]);

    const reactivated = await updateMembershipLifecycle(
      superAdmin,
      collegeA.membership.id,
      { action: "REACTIVATE" },
      drizzlePeopleRepository,
    );
    expect(reactivated.membership.status).toBe("ACTIVE");

    const activity = await pool.query<{
      event_type: string;
      subject_id: string;
    }>(
      `select event_type, subject_id
         from activity_events
        where subject_id in ($1, $2)
        order by occurred_at asc`,
      [
        collegeA.membership.id,
        collegeB.membership.id,
      ],
    );
    expect(
      activity.rows.map(
        (row) => row.event_type,
      ),
    ).toEqual(
      expect.arrayContaining([
        "identity.membership.roles_changed",
        "identity.membership.suspended",
        "identity.membership.reactivated",
      ]),
    );
    expect(
      activity.rows.filter(
        (row) =>
          row.event_type ===
          "identity.membership.roles_changed",
      ),
    ).toHaveLength(1);

    const collegeAPeople = await listCollegePeople(
      superAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        limit: 100,
        offset: 0,
      },
      drizzlePeopleRepository,
    );
    const collegeBPeople = await listCollegePeople(
      superAdmin,
      {
        collegeId: SEED_IDS.collegeB,
        limit: 100,
        offset: 0,
      },
      drizzlePeopleRepository,
    );

    expect(
      collegeAPeople.items.filter(
        (person) => person.user.identityUid === identityUid,
      ),
    ).toHaveLength(1);
    expect(
      collegeBPeople.items.filter(
        (person) => person.user.identityUid === identityUid,
      ),
    ).toHaveLength(1);
  });

  it("denies a college admin before cross-college identity mutation", async () => {
    const identity = createIdentityDirectory();

    await expect(
      onboardPerson(
        seededCollegeAdmin,
        {
          collegeId: SEED_IDS.collegeB,
          phoneE164,
          email,
          displayName: "Should Not Be Created",
          roles: ["LEARNER"],
        },
        {
          identityDirectory: identity.directory,
          repository: drizzlePeopleRepository,
        },
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);

    expect(identity.getCreateCount()).toBe(0);

    const persisted = await pool.query(
      "select id from users where identity_uid = $1",
      [identityUid],
    );
    expect(persisted.rowCount).toBe(0);
  });
});
