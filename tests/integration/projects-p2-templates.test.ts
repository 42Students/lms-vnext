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
  archiveProjectTemplate,
  assignProjectTemplateToCollege,
  createProjectTemplate,
  duplicateProjectTemplate,
  listAssignedProjectTemplates,
  publishProjectTemplate,
  reviseProjectTemplate,
  unpublishProjectTemplate,
  revokeProjectTemplateFromCollege,
} from "@/modules/projects/template-service";
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

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: null,
};

const scopedSuperAdmin: RequestContext = {
  ...superAdmin,
  adminScope: {
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA,
  },
};

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

function blueprint(label: string) {
  return {
    overview: {
      goal: label + " goal",
      deliverables: [label + " demo"],
    },
    releases: [
      {
        key: "release-1",
        title: label + " MVP",
        sequence: 0,
      },
    ],
    sprints: [
      {
        key: "sprint-1",
        releaseKey: "release-1",
        title: label + " Foundation",
        sequence: 0,
      },
    ],
    tasks: [
      {
        key: "task-1",
        sprintKey: "sprint-1",
        title: label + " Task",
        priority: "HIGH" as const,
        sequence: 0,
      },
    ],
    resources: [],
  };
}

async function cleanup() {
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'p2-%'
     )`,
  );
  await pool.query(
    `delete from project_template_versions
     where template_id in (
       select id from project_templates
       where slug like 'p2-%'
     )`,
  );
  await pool.query(
    "delete from project_templates where slug like 'p2-%'",
  );
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Projects P2 template persistence", () => {
  it("advances active college assignments when a revised template is republished", async () => {
    const created = await createProjectTemplate(
      superAdmin,
      {
        slug: "p2-version-pinning",
        title: "P2 Version Pinning",
        blueprint: blueprint("V1"),
      },
    );

    expect(created.template.currentVersion).toBe(1);
    expect(created.template.status).toBe("DRAFT");

    const firstPublished =
      await publishProjectTemplate(
        superAdmin,
        created.template.id,
      );
    expect(firstPublished.publishedVersion).toBe(1);

    await assignProjectTemplateToCollege(
      scopedSuperAdmin,
      created.template.id,
      SEED_IDS.collegeA,
    );

    let assigned =
      await listAssignedProjectTemplates(
        collegeAdmin,
        SEED_IDS.collegeA,
      );
    expect(assigned).toEqual([
      expect.objectContaining({
        templateId: created.template.id,
        version: 1,
        title: "P2 Version Pinning",
      }),
    ]);

    const revised = await reviseProjectTemplate(
      superAdmin,
      created.template.id,
      {
        title: "P2 Version Pinning V2",
        blueprint: blueprint("V2"),
        changeNote: "Second immutable version",
      },
    );
    expect(revised.template.currentVersion).toBe(2);
    expect(revised.template.publishedVersion).toBe(1);

    await publishProjectTemplate(
      superAdmin,
      created.template.id,
    );

    assigned = await listAssignedProjectTemplates(
      collegeAdmin,
      SEED_IDS.collegeA,
    );
    expect(assigned[0]).toMatchObject({
      version: 2,
      title: "P2 Version Pinning V2",
    });

    await unpublishProjectTemplate(
      superAdmin,
      created.template.id,
    );
    expect(
      await listAssignedProjectTemplates(
        collegeAdmin,
        SEED_IDS.collegeA,
      ),
    ).toEqual([]);

    await publishProjectTemplate(
      superAdmin,
      created.template.id,
    );
    assigned = await listAssignedProjectTemplates(
      collegeAdmin,
      SEED_IDS.collegeA,
    );
    expect(assigned[0]).toMatchObject({
      version: 2,
      title: "P2 Version Pinning V2",
    });
  });

  it("duplicates the current template version as a new draft without copying assignments", async () => {
    const source = await createProjectTemplate(
      superAdmin,
      {
        slug: "p2-duplicate-source",
        title: "P2 Duplicate Source",
        blueprint: blueprint("Duplicate"),
      },
    );
    await publishProjectTemplate(
      superAdmin,
      source.template.id,
    );
    await assignProjectTemplateToCollege(
      scopedSuperAdmin,
      source.template.id,
      SEED_IDS.collegeA,
    );

    const duplicated =
      await duplicateProjectTemplate(
        superAdmin,
        source.template.id,
        {
          slug: "p2-duplicate-copy",
          title: "P2 Duplicate Copy",
        },
      );

    expect(duplicated.template).toMatchObject({
      slug: "p2-duplicate-copy",
      title: "P2 Duplicate Copy",
      status: "DRAFT",
      currentVersion: 1,
      publishedVersion: null,
    });
    expect(duplicated.version.blueprint).toEqual(
      source.version.blueprint,
    );

    const copyAssignments = await pool.query(
      `select id
         from project_template_college_assignments
        where template_id = $1
          and revoked_at is null`,
      [duplicated.template.id],
    );
    expect(copyAssignments.rows).toHaveLength(0);
  });

  it("keeps global template mutation superadmin-only and assignment safety-scoped", async () => {
    await expect(
      createProjectTemplate(collegeAdmin, {
        slug: "p2-admin-denied",
        title: "P2 Admin Denied",
        blueprint: blueprint("Denied"),
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      createProjectTemplate(scopedSuperAdmin, {
        slug: "p2-scoped-denied",
        title: "P2 Scoped Denied",
        blueprint: blueprint("Scoped"),
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    const created = await createProjectTemplate(
      superAdmin,
      {
        slug: "p2-assignment-scope",
        title: "P2 Assignment Scope",
        blueprint: blueprint("Scope"),
      },
    );
    await publishProjectTemplate(
      superAdmin,
      created.template.id,
    );

    await expect(
      assignProjectTemplateToCollege(
        scopedSuperAdmin,
        created.template.id,
        SEED_IDS.collegeB,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      listAssignedProjectTemplates(
        collegeAdmin,
        SEED_IDS.collegeB,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("guards archive dependencies and database invariants", async () => {
    const created = await createProjectTemplate(
      superAdmin,
      {
        slug: "p2-archive-guard",
        title: "P2 Archive Guard",
        blueprint: blueprint("Archive"),
      },
    );
    await publishProjectTemplate(
      superAdmin,
      created.template.id,
    );
    await assignProjectTemplateToCollege(
      scopedSuperAdmin,
      created.template.id,
      SEED_IDS.collegeA,
    );

    await expect(
      archiveProjectTemplate(
        superAdmin,
        created.template.id,
      ),
    ).rejects.toMatchObject({
      code:
        "PROJECT_TEMPLATE_HAS_ACTIVE_ASSIGNMENTS",
    });

    await revokeProjectTemplateFromCollege(
      scopedSuperAdmin,
      created.template.id,
      SEED_IDS.collegeA,
    );
    await expect(
      archiveProjectTemplate(
        superAdmin,
        created.template.id,
      ),
    ).resolves.toMatchObject({
      status: "ARCHIVED",
    });

    await expect(
      pool.query(
        `insert into project_templates
          (slug, title, status, current_version, created_by_user_id)
         values ('p2-invalid-status', 'Invalid', 'BROKEN', 1, $1)`,
        [SEED_IDS.superAdminUser],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });

    await expect(
      pool.query(
        `insert into project_template_versions
          (template_id, version, title, blueprint, created_by_user_id)
         values ($1, 0, 'Invalid version', '{}'::jsonb, $2)`,
        [
          created.template.id,
          SEED_IDS.superAdminUser,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  });
});
