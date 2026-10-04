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
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  archivePlacementCompanyRelationship,
  createPlacementCompany,
  listPlacementCompanies,
  listPlacementRelationshipOwners,
  updatePlacementCompanyRelationship,
} from "@/modules/placements/company-service";
import {
  archivePlacementJob,
  createPlacementJob,
} from "@/modules/placements/job-service";
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

const tpoRoleId =
  "76000000-0000-4000-8000-000000000001";

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "MENTOR", "TPO"],
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

const scopedSuperAdminB: RequestContext = {
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
  await pool.query(
    "delete from placement_jobs",
  );
  await pool.query(
    "delete from placement_company_relationships",
  );
  await pool.query("delete from placement_companies");
}

beforeEach(async () => {
  await cleanup();
  await pool.query(
    `insert into membership_roles (id, membership_id, role)
     values ($1, $2, 'TPO')
     on conflict (membership_id, role) do nothing`,
    [tpoRoleId, SEED_IDS.facultyCollegeAMembership],
  );
});

afterAll(async () => {
  await cleanup();
  await pool.query(
    "delete from membership_roles where id = $1",
    [tpoRoleId],
  );
  await pool.end();
  await closeDatabaseConnection();
});

describe("Placements P1 companies and employer relationships", () => {
  it("shares canonical employer identity while isolating each college relationship", async () => {
    const collegeA = await createPlacementCompany(
      tpo,
      {
        collegeId: SEED_IDS.collegeA,
        name: "Acme Systems",
        websiteUrl: "https://acme.example",
        primaryDomain: "acme.example",
        isTrusted: true,
      },
    );

    const collegeB = await createPlacementCompany(
      scopedSuperAdminB,
      {
        collegeId: SEED_IDS.collegeB,
        name: "Acme Systems",
        primaryDomain: "www.acme.example",
      },
    );

    expect(collegeB.company.id).toBe(
      collegeA.company.id,
    );
    expect(collegeB.relationship.id).not.toBe(
      collegeA.relationship.id,
    );

    await expect(
      listPlacementCompanies(tpo, SEED_IDS.collegeA),
    ).resolves.toEqual([
      expect.objectContaining({
        companyId: collegeA.company.id,
        name: "Acme Systems",
        isTrusted: true,
      }),
    ]);

    await archivePlacementCompanyRelationship(
      tpo,
      collegeA.relationship.id,
    );

    await expect(
      listPlacementCompanies(tpo, SEED_IDS.collegeA),
    ).resolves.toEqual([]);

    await expect(
      listPlacementCompanies(
        scopedSuperAdminB,
        SEED_IDS.collegeB,
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        companyId: collegeA.company.id,
        isTrusted: false,
      }),
    ]);
  });

  it("keeps placement management role-aware and cross-college closed", async () => {
    await expect(
      createPlacementCompany(learner, {
        collegeId: SEED_IDS.collegeA,
        name: "Learner Cannot Create",
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      createPlacementCompany(tpo, {
        collegeId: SEED_IDS.collegeB,
        name: "Cross College",
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("lists valid relationship owners and blocks employer archive while jobs still depend on it", async () => {
    await expect(
      listPlacementRelationshipOwners(
        tpo,
        SEED_IDS.collegeA,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          membershipId:
            SEED_IDS.facultyCollegeAMembership,
          roles: expect.arrayContaining([
            "TPO",
          ]),
        }),
        expect.objectContaining({
          membershipId:
            SEED_IDS.collegeAdminMembership,
          roles: expect.arrayContaining([
            "COLLEGE_ADMIN",
          ]),
        }),
      ]),
    );

    const created = await createPlacementCompany(
      tpo,
      {
        collegeId: SEED_IDS.collegeA,
        name: "Archive Guard Employer",
        primaryDomain:
          "archive-guard.example",
      },
    );
    const job = await createPlacementJob(
      tpo,
      {
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId:
          created.relationship.id,
        title: "Archive Guard Role",
        description:
          "Relationship must remain active while this job exists.",
        employmentType: "FULL_TIME",
        workMode: "ONSITE",
        applicationMode: "INTERNAL",
      },
    );

    await expect(
      archivePlacementCompanyRelationship(
        tpo,
        created.relationship.id,
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_COMPANY_RELATIONSHIP_HAS_JOBS",
    });

    await archivePlacementJob(
      tpo,
      job.id,
    );

    await expect(
      archivePlacementCompanyRelationship(
        tpo,
        created.relationship.id,
      ),
    ).resolves.toMatchObject({
      relationship: {
        status: "ARCHIVED",
      },
    });
  });

  it("supports tenant-private trust and owner state without mutating canonical identity", async () => {
    const created = await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Owner Test",
      primaryDomain: "owner.example",
    });

    const updated =
      await updatePlacementCompanyRelationship(
        tpo,
        created.relationship.id,
        {
          isTrusted: true,
          ownerMembershipId:
            SEED_IDS.collegeAdminMembership,
        },
      );

    expect(updated.relationship).toMatchObject({
      isTrusted: true,
      ownerMembershipId:
        SEED_IDS.collegeAdminMembership,
    });

    await expect(
      updatePlacementCompanyRelationship(
        tpo,
        created.relationship.id,
        {
          ownerMembershipId:
            SEED_IDS.facultyCollegeBMembership,
        },
      ),
    ).rejects.toMatchObject({
      code: "PLACEMENT_OWNER_MEMBERSHIP_NOT_FOUND",
    });

    await expect(
      createPlacementCompany(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Owner Test",
        primaryDomain: "different.example",
      }),
    ).rejects.toMatchObject({
      code: "PLACEMENT_COMPANY_IDENTITY_CONFLICT",
    });
  });
});
