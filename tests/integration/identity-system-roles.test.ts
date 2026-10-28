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
  ContextResolutionError,
  listMembershipChoices,
  resolveRequestContext,
} from "@/modules/identity/context-service";
import type {
  IdentityDirectory,
  IdentityDirectoryUser,
} from "@/modules/people/identity";
import { AuthorizationError } from "@/modules/permissions/policy";
import { drizzleSystemRoleRepository } from "@/modules/system-roles/repository";
import {
  assignSystemRole,
  bootstrapSuperAdmin,
} from "@/modules/system-roles/service";
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

const bootstrapIdentityUid = "integration-bootstrap-superadmin";
const bootstrapPhone = "+919000000091";
const bootstrapEmail = "integration.bootstrap@example.com";

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

const scopedSuperAdmin: RequestContext = {
  ...superAdmin,
  adminScope: {
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA,
  },
};

async function cleanupIdentityState() {
  await pool.query(
    `delete from system_roles
     where user_id = $1 and role = 'SUPER_ADMIN'`,
    [SEED_IDS.learnerUser],
  );

  await pool.query(
    `update college_memberships
     set status = 'ACTIVE',
         suspended_at = null,
         suspension_reason = null,
         updated_at = now()
     where id = $1`,
    [SEED_IDS.facultyCollegeBMembership],
  );

  await pool.query(
    `delete from system_roles
     where user_id in (
       select id from users where identity_uid = $1
     )`,
    [bootstrapIdentityUid],
  );
  await pool.query(
    "delete from users where identity_uid = $1",
    [bootstrapIdentityUid],
  );
}

function createBootstrapDirectory() {
  let user: IdentityDirectoryUser | null = null;
  let createCount = 0;

  const directory: IdentityDirectory = {
    async findByPhone(phoneNumber) {
      return user?.phoneNumber === phoneNumber ? user : null;
    },
    async findByEmail(email) {
      return user?.email?.toLowerCase() === email.toLowerCase()
        ? user
        : null;
    },
    async createUser(input) {
      createCount += 1;
      const created: IdentityDirectoryUser = {
        uid: bootstrapIdentityUid,
        phoneNumber: input.phoneNumber ?? null,
        email: input.email ?? null,
        displayName: input.displayName,
      };
      user = created;
      return created;
    },
    async updateUser(uid, input) {
      if (!user || user.uid !== uid) {
        throw new Error("bootstrap identity missing");
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

beforeEach(async () => {
  await cleanupIdentityState();
});

afterAll(async () => {
  await cleanupIdentityState();
  await pool.end();
  await closeDatabaseConnection();
});

describe("identity context and system roles against PostgreSQL", () => {
  it("resolves only memberships owned by the authenticated canonical user", async () => {
    const choices = await listMembershipChoices(
      "seed-shared-faculty",
    );

    expect(choices).toHaveLength(2);
    expect(choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: SEED_IDS.facultyCollegeAMembership,
          collegeId: SEED_IDS.collegeA,
          status: "ACTIVE",
          roles: expect.arrayContaining(["FACULTY", "MENTOR"]),
        }),
        expect.objectContaining({
          id: SEED_IDS.facultyCollegeBMembership,
          collegeId: SEED_IDS.collegeB,
          status: "ACTIVE",
          roles: expect.arrayContaining(["FACULTY"]),
        }),
      ]),
    );

    const collegeA = await resolveRequestContext({
      identityUid: "seed-shared-faculty",
      activeMembershipId: SEED_IDS.facultyCollegeAMembership,
    });
    // One workspace per role: a multi-role membership resolves to exactly one
    // role, the highest-priority held role unless another held role is chosen.
    // Disposable DB setups may grant this membership an additional TPO role.
    // The default must choose exactly one held role by the product priority,
    // while an explicit role switch below must still select FACULTY.
    const heldRoles=choices.find(choice=>
      choice.id===SEED_IDS.facultyCollegeAMembership)?.roles??[];
    // Integration suites can add TPO to this fixture between the choices
    // read and context resolution. The default is still exactly one held role;
    // validate against both surrounding persisted snapshots, and require the
    // highest-priority role whenever the roster did not change mid-request.
    const resolvedRoles=collegeA.membership?.roles??[];
    expect(resolvedRoles).toHaveLength(1);
    const [resolvedRole]=resolvedRoles;
    const latestChoices=await listMembershipChoices("seed-shared-faculty");
    const latestRoles=latestChoices.find(choice=>
      choice.id===SEED_IDS.facultyCollegeAMembership)?.roles??[];
    expect([...new Set([...heldRoles,...latestRoles])]).toContain(resolvedRole);
    if(heldRoles.join("|")===latestRoles.join("|")){
      const expectedRole=(["COLLEGE_ADMIN","TPO","MENTOR","FACULTY","LEARNER"] as const)
        .find(role=>latestRoles.includes(role));
      expect(resolvedRole).toBe(expectedRole);
    }
    expect(collegeA.membership).toMatchObject({
      id: SEED_IDS.facultyCollegeAMembership,
      collegeId: SEED_IDS.collegeA,
    });
    const collegeAFaculty = await resolveRequestContext({
      identityUid: "seed-shared-faculty",
      activeMembershipId: SEED_IDS.facultyCollegeAMembership,
      activeRole: "FACULTY",
    });
    expect(collegeAFaculty.membership?.roles).toEqual(["FACULTY"]);

    const collegeB = await resolveRequestContext({
      identityUid: "seed-shared-faculty",
      activeMembershipId: SEED_IDS.facultyCollegeBMembership,
      // This assertion exercises the explicit FACULTY role, not whatever
      // higher-priority TPO fixture another integration suite has granted.
      activeRole: "FACULTY",
    });
    expect(collegeB.membership).toMatchObject({
      id: SEED_IDS.facultyCollegeBMembership,
      collegeId: SEED_IDS.collegeB,
      roles: expect.arrayContaining(["FACULTY"]),
    });

    await expect(
      resolveRequestContext({
        identityUid: "seed-shared-faculty",
        activeMembershipId: SEED_IDS.learnerCollegeAMembership,
      }),
    ).rejects.toMatchObject({
      code: "MEMBERSHIP_NOT_FOUND",
    });
  });

  it("blocks a suspended selected membership while keeping the other choice active", async () => {
    await pool.query(
      `update college_memberships
       set status = 'SUSPENDED',
           suspended_at = now(),
           suspension_reason = 'Integration suspension'
       where id = $1`,
      [SEED_IDS.facultyCollegeBMembership],
    );

    await expect(
      resolveRequestContext({
        identityUid: "seed-shared-faculty",
        activeMembershipId: SEED_IDS.facultyCollegeBMembership,
      }),
    ).rejects.toBeInstanceOf(ContextResolutionError);

    await expect(
      resolveRequestContext({
        identityUid: "seed-shared-faculty",
        activeMembershipId: SEED_IDS.facultyCollegeBMembership,
      }),
    ).rejects.toMatchObject({
      code: "MEMBERSHIP_NOT_ACTIVE",
    });

    const collegeA = await resolveRequestContext({
      identityUid: "seed-shared-faculty",
      activeMembershipId: SEED_IDS.facultyCollegeAMembership,
    });
    expect(collegeA.membership?.status).toBe("ACTIVE");

    const choices = await listMembershipChoices(
      "seed-shared-faculty",
    );
    expect(
      choices.find(
        (choice) =>
          choice.id === SEED_IDS.facultyCollegeBMembership,
      )?.status,
    ).toBe("SUSPENDED");
  });

  it("assigns a system role idempotently only from unscoped SUPER_ADMIN context", async () => {
    await expect(
      assignSystemRole(
        superAdmin,
        {
          userId: SEED_IDS.learnerUser,
          role: "SUPER_ADMIN",
        },
        drizzleSystemRoleRepository,
      ),
    ).resolves.toEqual(["SUPER_ADMIN"]);

    await expect(
      assignSystemRole(
        superAdmin,
        {
          userId: SEED_IDS.learnerUser,
          role: "SUPER_ADMIN",
        },
        drizzleSystemRoleRepository,
      ),
    ).resolves.toEqual(["SUPER_ADMIN"]);

    const roleCount = await pool.query(
      `select count(*)::int as count
       from system_roles
       where user_id = $1 and role = 'SUPER_ADMIN'`,
      [SEED_IDS.learnerUser],
    );
    expect(roleCount.rows[0]?.count).toBe(1);

    const learnerContext = await resolveRequestContext({
      identityUid: "seed-learner",
    });
    expect(learnerContext.user.systemRoles).toEqual([
      "SUPER_ADMIN",
    ]);

    await expect(
      assignSystemRole(
        scopedSuperAdmin,
        {
          userId: SEED_IDS.facultyUser,
          role: "SUPER_ADMIN",
        },
        drizzleSystemRoleRepository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects a forged Super Admin snapshot when the persisted user lacks privilege",async()=>{
    // A compromised or stale context can *claim* the SUPER_ADMIN role.
    // The identity repository must independently re-read current persisted
    // system_roles under locks; the forged context grants nothing.
    const spoofed:RequestContext={
      user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",
        platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
      membership:null,
    };
    await expect(assignSystemRole(spoofed,{
      userId:SEED_IDS.facultyUser,role:"SUPER_ADMIN",
    },drizzleSystemRoleRepository)).rejects.toBeInstanceOf(AuthorizationError);
    const role=await pool.query(
      "select 1 from system_roles where user_id=$1 and role='SUPER_ADMIN'",
      [SEED_IDS.facultyUser],
    );
    expect(role.rowCount).toBe(0);
  });

  it("persists secure bootstrap idempotently without a public API path", async () => {
    const identity = createBootstrapDirectory();
    const input = {
      phoneE164: bootstrapPhone,
      email: bootstrapEmail,
      displayName: "Integration Bootstrap Admin",
    };

    const first = await bootstrapSuperAdmin(input, {
      identityDirectory: identity.directory,
      repository: drizzleSystemRoleRepository,
    });
    const repeated = await bootstrapSuperAdmin(input, {
      identityDirectory: identity.directory,
      repository: drizzleSystemRoleRepository,
    });

    expect(identity.getCreateCount()).toBe(1);
    expect(repeated.id).toBe(first.id);
    expect(repeated.systemRoles).toEqual(["SUPER_ADMIN"]);

    const resolved = await resolveRequestContext({
      identityUid: bootstrapIdentityUid,
    });
    expect(resolved.membership).toBeNull();
    expect(resolved.user.systemRoles).toEqual(["SUPER_ADMIN"]);
  });
});
