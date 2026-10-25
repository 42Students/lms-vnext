import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import {
  closeDatabaseConnection,
} from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  archiveOrganization,
  createOrganization,
  listOrganizations,
  renameOrganization,
} from "@/modules/organizations/service";
import {
  archiveCollege,
  createCollege,
  listColleges,
  updateCollege,
} from "@/modules/colleges/service";
import {
  archiveDepartment,
  createDepartment,
  listDepartments,
  renameDepartment,
} from "@/modules/departments/service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const cleanupPool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const integrationOrgName = "Integration Core Organization";
const integrationCollegeCode = "itest-core";

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

async function cleanupIntegrationRows() {
  // Audit rows reference the fixture organization/college; remove them first.
  await cleanupPool.query(
    `delete from activity_events
     where college_id in (select id from colleges where lower(code) = lower($1))
        or organization_id in (select id from organizations where name = any($2))`,
    [integrationCollegeCode, [integrationOrgName, `${integrationOrgName} Renamed`]],
  );
  await cleanupPool.query(
    `delete from departments
     where college_id in (
       select id from colleges where lower(code) = lower($1)
     )`,
    [integrationCollegeCode],
  );
  await cleanupPool.query(
    "delete from colleges where lower(code) = lower($1)",
    [integrationCollegeCode],
  );
  await cleanupPool.query(
    "delete from organizations where name = $1",
    [integrationOrgName],
  );
  await cleanupPool.query(
    "delete from organizations where name = $1",
    [`${integrationOrgName} Renamed`],
  );
}

beforeAll(async () => {
  await cleanupIntegrationRows();
});

afterAll(async () => {
  await cleanupIntegrationRows();
  await cleanupPool.end();
  await closeDatabaseConnection();
});

describe("core admin domains against PostgreSQL", () => {
  it("persists the superadmin organization -> college -> department flow", async () => {
    const organization = await createOrganization(superAdmin, {
      name: integrationOrgName,
    });

    const college = await createCollege(superAdmin, {
      organizationId: organization.id,
      name: "Integration Engineering College",
      code: integrationCollegeCode,
      city: "Integration City",
    });

    const department = await createDepartment(superAdmin, {
      collegeId: college.id,
      name: "Computer Science",
    });

    await expect(
      listOrganizations(superAdmin),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: organization.id,
          name: integrationOrgName,
        }),
      ]),
    );

    const listedColleges=await listColleges(superAdmin,organization.id);
    expect(listedColleges).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: college.id,
        organizationId: organization.id,
        code: integrationCollegeCode,
      }),
    ]));
    expect(listedColleges.every(item=>item.organizationId===organization.id)).toBe(true);

    await expect(
      listDepartments(superAdmin, college.id),
    ).resolves.toEqual([
      expect.objectContaining({
        id: department.id,
        collegeId: college.id,
        name: "Computer Science",
      }),
    ]);

    const renamedOrganization = await renameOrganization(
      superAdmin,
      organization.id,
      { name: `${integrationOrgName} Renamed` },
    );
    expect(renamedOrganization.name).toBe(
      `${integrationOrgName} Renamed`,
    );

    const updatedCollege = await updateCollege(
      superAdmin,
      college.id,
      { city: "Updated Integration City" },
    );
    expect(updatedCollege.city).toBe("Updated Integration City");
    expect(updatedCollege.organizationId).toBe(organization.id);
    expect(updatedCollege.code).toBe(integrationCollegeCode);

    const renamedDepartment = await renameDepartment(
      superAdmin,
      department.id,
      { name: "Computer Science and Engineering" },
    );
    expect(renamedDepartment.name).toBe(
      "Computer Science and Engineering",
    );

    await expect(
      archiveOrganization(
        superAdmin,
        organization.id,
      ),
    ).rejects.toMatchObject({
      code: "ORGANIZATION_HAS_COLLEGES",
    });

    await expect(
      archiveCollege(
        superAdmin,
        college.id,
      ),
    ).rejects.toMatchObject({
      code: "COLLEGE_HAS_DEPENDENCIES",
      usage: expect.objectContaining({
        departments: 1,
      }),
    });

    await archiveDepartment(
      superAdmin,
      department.id,
    );

    await expect(
      archiveCollege(
        superAdmin,
        college.id,
      ),
    ).resolves.toMatchObject({
      id: college.id,
      status: "ARCHIVED",
    });

    // Legacy soft-delete semantics only block ACTIVE colleges. The archived
    // college and its foreign key remain intact for future restore/audit.
    await expect(
      archiveOrganization(
        superAdmin,
        organization.id,
      ),
    ).resolves.toMatchObject({
      id: organization.id,
      status: "ARCHIVED",
    });
  });

  it("keeps a college admin inside the seeded tenant", async () => {
    await expect(
      listOrganizations(seededCollegeAdmin),
    ).resolves.toEqual([
      expect.objectContaining({
        id: SEED_IDS.organization,
        name: "Seed Organization",
      }),
    ]);

    await expect(
      listColleges(seededCollegeAdmin),
    ).resolves.toEqual([
      expect.objectContaining({
        id: SEED_IDS.collegeA,
        organizationId: SEED_IDS.organization,
      }),
    ]);

    await expect(
      listDepartments(
        seededCollegeAdmin,
        SEED_IDS.collegeA,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: SEED_IDS.departmentA,
          collegeId: SEED_IDS.collegeA,
        }),
      ]),
    );

    await expect(
      createDepartment(seededCollegeAdmin, {
        collegeId: SEED_IDS.collegeB,
        name: "Cross Tenant Department",
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      archiveCollege(
        seededCollegeAdmin,
        SEED_IDS.collegeA,
        async () => ({
          memberships: 0,
          departments: 0,
          academicPeriods: 0,
          projectTemplateAssignments: 0,
          projects: 0,
          placementRelationships: 0,
          placementSeasons: 0,
          placementJobs: 0,
          tenantDomains: 0,
        }),
      ),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("returns domain conflicts for case-insensitive duplicates", async () => {
    await expect(
      createOrganization(superAdmin, {
        name: "seed organization",
      }),
    ).rejects.toMatchObject({
      code: "ORGANIZATION_NAME_CONFLICT",
    });

    await expect(
      createCollege(superAdmin, {
        organizationId: SEED_IDS.organization,
        name: "Duplicate Seed College Code",
        code: "seed-a",
      }),
    ).rejects.toMatchObject({
      code: "COLLEGE_CODE_CONFLICT",
    });

    await expect(
      createDepartment(superAdmin, {
        collegeId: SEED_IDS.collegeA,
        name: "computer science",
      }),
    ).rejects.toMatchObject({
      code: "DEPARTMENT_NAME_CONFLICT",
    });
  });
});
