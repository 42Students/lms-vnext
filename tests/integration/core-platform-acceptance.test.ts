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
import {
  listMembershipChoices,
  resolveRequestContext,
} from "@/modules/identity/context-service";
import {
  createOrganization,
  listOrganizations,
} from "@/modules/organizations/service";
import {
  createCollege,
  listColleges,
} from "@/modules/colleges/service";
import {
  createDepartment,
  listDepartments,
} from "@/modules/departments/service";
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

const organizationName = "Acceptance Flow Organization";
const collegeCode = "ACCEPT-CORE";
const identityPrefix = "acceptance-core-";

const superAdmin: RequestContext = {
  user: {
    id: "acceptance-superadmin",
    identityUid: "acceptance-superadmin-identity",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

function createIdentityDirectory(
  identityUid: string,
): IdentityDirectory {
  let user: IdentityDirectoryUser | null = null;

  return {
    async findByPhone(phoneNumber) {
      return user?.phoneNumber === phoneNumber
        ? user
        : null;
    },
    async findByEmail(email) {
      return user?.email?.toLowerCase() === email.toLowerCase()
        ? user
        : null;
    },
    async createUser(input) {
      user = {
        uid: identityUid,
        phoneNumber: input.phoneNumber,
        email: input.email ?? null,
        displayName: input.displayName,
      };
      return user;
    },
    async updateUser(uid, input) {
      if (!user || user.uid !== uid) {
        throw new Error("acceptance identity missing");
      }

      user = {
        ...user,
        phoneNumber:
          input.phoneNumber ?? user.phoneNumber,
        email: input.email ?? user.email,
        displayName:
          input.displayName ?? user.displayName,
      };

      return user;
    },
  };
}

async function cleanupAcceptanceRows() {
  await pool.query(
    `delete from in_app_notifications
     where event_id in (
       select ae.id
       from activity_events ae
       where ae.actor_user_id in (
         select id
         from users
         where identity_uid like $1
       )
       or ae.actor_membership_id in (
         select cm.id
         from college_memberships cm
         join users u on u.id = cm.user_id
         where u.identity_uid like $1
       )
       or ae.subject_id in (
         select cm.id::text
         from college_memberships cm
         join users u on u.id = cm.user_id
         where u.identity_uid like $1
       )
     )`,
    [`${identityPrefix}%`],
  );

  await pool.query(
    `delete from activity_events
     where actor_user_id in (
       select id
       from users
       where identity_uid like $1
     )
     or actor_membership_id in (
       select cm.id
       from college_memberships cm
       join users u on u.id = cm.user_id
       where u.identity_uid like $1
     )
     or subject_id in (
       select cm.id::text
       from college_memberships cm
       join users u on u.id = cm.user_id
       where u.identity_uid like $1
     )`,
    [`${identityPrefix}%`],
  );

  await pool.query(
    `delete from learner_profiles
     where membership_id in (
       select cm.id
       from college_memberships cm
       join users u on u.id = cm.user_id
       where u.identity_uid like $1
     )`,
    [`${identityPrefix}%`],
  );

  await pool.query(
    `delete from faculty_profiles
     where membership_id in (
       select cm.id
       from college_memberships cm
       join users u on u.id = cm.user_id
       where u.identity_uid like $1
     )`,
    [`${identityPrefix}%`],
  );

  await pool.query(
    `delete from membership_roles
     where membership_id in (
       select cm.id
       from college_memberships cm
       join users u on u.id = cm.user_id
       where u.identity_uid like $1
     )`,
    [`${identityPrefix}%`],
  );

  await pool.query(
    `delete from college_memberships
     where user_id in (
       select id
       from users
       where identity_uid like $1
     )`,
    [`${identityPrefix}%`],
  );

  await pool.query(
    `delete from system_roles
     where user_id in (
       select id
       from users
       where identity_uid like $1
     )`,
    [`${identityPrefix}%`],
  );

  await pool.query(
    "delete from users where identity_uid like $1",
    [`${identityPrefix}%`],
  );

  await pool.query(
    `delete from departments
     where college_id in (
       select id from colleges where code = $1
     )`,
    [collegeCode],
  );

  await pool.query(
    "delete from colleges where code = $1",
    [collegeCode],
  );

  await pool.query(
    "delete from organizations where name = $1",
    [organizationName],
  );
}

beforeEach(async () => {
  await cleanupAcceptanceRows();
});

afterAll(async () => {
  await cleanupAcceptanceRows();
  await pool.end();
  await closeDatabaseConnection();
});

describe("core platform pre-browser acceptance flow", () => {
  it("runs the tenant, people, role, membership and isolation story against PostgreSQL", async () => {
    const organization = await createOrganization(
      superAdmin,
      {
        name: organizationName,
      },
    );

    const college = await createCollege(superAdmin, {
      organizationId: organization.id,
      name: "Acceptance Engineering College",
      code: collegeCode,
      city: "Vijayawada",
      state: "Andhra Pradesh",
      country: "India",
    });

    await createDepartment(superAdmin, {
      collegeId: college.id,
      name: "Computer Science",
    });

    const adminIdentityUid =
      `${identityPrefix}college-admin`;
    const admin = await onboardPerson(
      superAdmin,
      {
        collegeId: college.id,
        phoneE164: "+919100000001",
        email: "acceptance.admin@example.com",
        displayName: "Acceptance College Admin",
        roles: ["COLLEGE_ADMIN"],
      },
      {
        identityDirectory:
          createIdentityDirectory(adminIdentityUid),
        repository: drizzlePeopleRepository,
      },
    );

    const collegeAdmin: RequestContext = {
      user: {
        id: admin.user.id,
        identityUid: adminIdentityUid,
        platformStatus: "ACTIVE",
        systemRoles: [],
      },
      membership: {
        id: admin.membership.id,
        collegeId: college.id,
        organizationId: organization.id,
        status: "ACTIVE",
        roles: ["COLLEGE_ADMIN"],
      },
    };

    await expect(
      listOrganizations(collegeAdmin),
    ).resolves.toEqual([
      expect.objectContaining({
        id: organization.id,
      }),
    ]);

    await expect(
      listColleges(collegeAdmin),
    ).resolves.toEqual([
      expect.objectContaining({
        id: college.id,
        code: collegeCode,
      }),
    ]);

    const adminDepartment = await createDepartment(
      collegeAdmin,
      {
        collegeId: college.id,
        name: "Electronics",
      },
    );

    await expect(
      listDepartments(collegeAdmin, college.id),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: adminDepartment.id,
          collegeId: college.id,
        }),
      ]),
    );

    await expect(
      createDepartment(collegeAdmin, {
        collegeId: SEED_IDS.collegeA,
        name: "Cross Tenant Rejected",
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    const facultyIdentityUid =
      `${identityPrefix}faculty`;
    const facultyDirectory = createIdentityDirectory(
      facultyIdentityUid,
    );

    const faculty = await onboardPerson(
      collegeAdmin,
      {
        collegeId: college.id,
        phoneE164: "+919100000002",
        email: "acceptance.faculty@example.com",
        displayName: "Acceptance Faculty",
        roles: ["FACULTY"],
      },
      {
        identityDirectory: facultyDirectory,
        repository: drizzlePeopleRepository,
      },
    );

    const learnerIdentityUid =
      `${identityPrefix}learner`;
    const learner = await onboardPerson(
      collegeAdmin,
      {
        collegeId: college.id,
        phoneE164: "+919100000003",
        email: "acceptance.learner@example.com",
        displayName: "Acceptance Learner",
        roles: ["LEARNER"],
      },
      {
        identityDirectory: createIdentityDirectory(
          learnerIdentityUid,
        ),
        repository: drizzlePeopleRepository,
      },
    );

    await expect(
      addMembershipRole(
        collegeAdmin,
        faculty.membership.id,
        { role: "MENTOR" },
        drizzlePeopleRepository,
      ),
    ).resolves.toEqual(["FACULTY", "MENTOR"]);

    await expect(
      addMembershipRole(
        collegeAdmin,
        faculty.membership.id,
        { role: "TPO" },
        drizzlePeopleRepository,
      ),
    ).resolves.toEqual([
      "FACULTY",
      "MENTOR",
      "TPO",
    ]);

    const facultySecondCollege = await onboardPerson(
      superAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        phoneE164: "+919100000002",
        email: "acceptance.faculty@example.com",
        displayName: "Acceptance Faculty",
        roles: ["FACULTY"],
      },
      {
        identityDirectory: facultyDirectory,
        repository: drizzlePeopleRepository,
      },
    );

    expect(facultySecondCollege.user.id).toBe(
      faculty.user.id,
    );
    expect(facultySecondCollege.membership.id).not.toBe(
      faculty.membership.id,
    );

    const choices = await listMembershipChoices(
      facultyIdentityUid,
    );

    expect(choices).toHaveLength(2);
    expect(
      choices.map((choice) => choice.collegeId),
    ).toEqual(
      expect.arrayContaining([
        college.id,
        SEED_IDS.collegeA,
      ]),
    );

    const people = await listCollegePeople(
      collegeAdmin,
      {
        collegeId: college.id,
        limit: 100,
        offset: 0,
      },
      drizzlePeopleRepository,
    );

    expect(
      people.items.map(
        (person) => person.user.identityUid,
      ),
    ).toEqual(
      expect.arrayContaining([
        adminIdentityUid,
        facultyIdentityUid,
        learnerIdentityUid,
      ]),
    );

    const suspended = await updateMembershipLifecycle(
      collegeAdmin,
      faculty.membership.id,
      {
        action: "SUSPEND",
        reason: "Acceptance suspension",
      },
      drizzlePeopleRepository,
    );

    expect(suspended.membership.status).toBe(
      "SUSPENDED",
    );

    await expect(
      resolveRequestContext({
        identityUid: facultyIdentityUid,
        activeMembershipId: faculty.membership.id,
      }),
    ).rejects.toMatchObject({
      code: "MEMBERSHIP_NOT_ACTIVE",
    });

    await expect(
      resolveRequestContext({
        identityUid: facultyIdentityUid,
        activeMembershipId:
          facultySecondCollege.membership.id,
      }),
    ).resolves.toMatchObject({
      membership: {
        id: facultySecondCollege.membership.id,
        collegeId: SEED_IDS.collegeA,
        status: "ACTIVE",
      },
    });

    expect(learner.membership.roles).toEqual([
      "LEARNER",
    ]);
  });
});
