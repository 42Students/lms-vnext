import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  assignProjectTemplateToCollege,
  createProjectTemplate,
  publishProjectTemplate,
  reviseProjectTemplate,
} from "@/modules/projects/template-service";
import {
  createProjectInstance,
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";
import {
  listProjectActivity,
} from "@/modules/projects/activity-service";
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
        title: label + " Release",
        sequence: 0,
      },
    ],
    sprints: [
      {
        key: "sprint-1",
        releaseKey: "release-1",
        title: label + " Sprint",
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
    resources: [
      {
        key: "resource-1",
        title: label + " Guide",
        url: "https://example.com/" +
          label.toLowerCase(),
        required: true,
        sequence: 0,
      },
    ],
  };
}

async function cleanup() {
  // Resource audit history can outlive the resource row; delete only this
  // disposable fixture's audit records before removing its owning projects.
  await pool.query(`delete from project_resource_audit
    where project_id in (select id from project_instances where slug like 'p3-%')`);
  await pool.query(
    `delete from project_members
     where project_id in (
       select id from project_instances
       where slug like 'p3-%'
     )`,
  );
  await pool.query(
    `delete from project_resources
     where project_id in (
       select id from project_instances
       where slug like 'p3-%'
     )`,
  );
  await pool.query(
    `delete from project_tasks
     where project_id in (
       select id from project_instances
       where slug like 'p3-%'
     )`,
  );
  await pool.query(
    `delete from project_sprints
     where project_id in (
       select id from project_instances
       where slug like 'p3-%'
     )`,
  );
  await pool.query(
    `delete from project_releases
     where project_id in (
       select id from project_instances
       where slug like 'p3-%'
     )`,
  );
  // Trigger-written resource audit rows for these disposable projects.
  await pool.query(
    `delete from project_resource_audit
     where project_id in (
       select id from project_instances
       where slug like 'p3-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'p3-%'",
  );
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'p3-%'
     )`,
  );
  // DB070 append-only project history and DB071 deferred version pointers
  // are genuine invariants. Keep unique test template revisions rather than
  // deleting them or disabling SQL triggers.
  const retention=await pool.query<{retainHistory:boolean}>(
    "select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
  );
  if(!retention.rows[0]?.retainHistory){
    await pool.query(
      `delete from project_template_versions
       where template_id in (select id from project_templates where slug like 'p3-%')`,
    );
    await pool.query("delete from project_templates where slug like 'p3-%'");
  }
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

const fixtureRunSuffix=randomUUID().slice(0,12);

describe("Projects P3 deterministic materialization", () => {
  it("freezes normalized instance state at the assigned template version", async () => {
    const createdTemplate =
      await createProjectTemplate(
        superAdmin,
        {
          slug: "p3-materialization-" + fixtureRunSuffix,
          title: "P3 Materialization",
          blueprint: blueprint("V1"),
        },
      );
    await publishProjectTemplate(
      superAdmin,
      createdTemplate.template.id,
    );
    await assignProjectTemplateToCollege(
      scopedSuperAdmin,
      createdTemplate.template.id,
      SEED_IDS.collegeA,
    );

    const firstProject =
      await createProjectInstance(
        collegeAdmin,
        {
          collegeId: SEED_IDS.collegeA,
          templateId:
            createdTemplate.template.id,
          slug: "p3-instance-v1",
          title: "P3 Instance V1",
          primaryMentorMembershipId:
            SEED_IDS.facultyCollegeAMembership,
        },
      );

    const mentorAssignment =
      await pool.query<{
        membership_id: string;
        role: string;
        is_primary: boolean;
      }>(
        `select membership_id, role, is_primary
           from project_members
          where project_id = $1`,
        [firstProject.id],
      );
    expect(mentorAssignment.rows).toEqual([
      {
        membership_id:
          SEED_IDS.facultyCollegeAMembership,
        role: "MENTOR",
        is_primary: true,
      },
    ]);

    const createdEvent =
      await pool.query<{
        event_type: string;
      }>(
        `select event_type
           from activity_events
          where dedupe_key = $1`,
        [
          `project:${firstProject.id}:created`,
        ],
      );
    expect(createdEvent.rows).toEqual([
      {
        event_type:
          "projects.project.created",
      },
    ]);

    const projectActivity =
      await listProjectActivity(
        collegeAdmin,
        firstProject.id,
      );
    expect(projectActivity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType:
            "projects.project.created",
          subjectId: firstProject.id,
        }),
      ]),
    );

    const firstWorkspace =
      await getProjectInstanceWorkspace(
        collegeAdmin,
        firstProject.id,
      );
    expect(firstWorkspace).toMatchObject({
      project: {
        templateId:
          createdTemplate.template.id,
      },
      releases: [
        {
          templateKey: "release-1",
          title: "V1 Release",
        },
      ],
      sprints: [
        {
          templateKey: "sprint-1",
          title: "V1 Sprint",
        },
      ],
      tasks: [
        {
          templateKey: "task-1",
          title: "V1 Task",
        },
      ],
      resources: [
        {
          templateKey: "resource-1",
          title: "V1 Guide",
        },
      ],
    });

    const revised = await reviseProjectTemplate(
      superAdmin,
      createdTemplate.template.id,
      {
        expectedVersion: createdTemplate.version.version,
        title: "P3 Materialization V2",
        blueprint: blueprint("V2"),
        changeNote: "New future version",
      },
    );
    await publishProjectTemplate(
      superAdmin,
      createdTemplate.template.id,
    );
    await assignProjectTemplateToCollege(
      scopedSuperAdmin,
      createdTemplate.template.id,
      SEED_IDS.collegeA,
    );

    const rereadFirst =
      await getProjectInstanceWorkspace(
        collegeAdmin,
        firstProject.id,
      );
    expect(rereadFirst.project.templateVersionId).not.toBe(
      revised.version.id,
    );
    expect(rereadFirst.tasks[0]?.title).toBe(
      "V1 Task",
    );

    const secondProject =
      await createProjectInstance(
        collegeAdmin,
        {
          collegeId: SEED_IDS.collegeA,
          templateId:
            createdTemplate.template.id,
          slug: "p3-instance-v2",
          title: "P3 Instance V2",
        },
      );
    const secondWorkspace =
      await getProjectInstanceWorkspace(
        collegeAdmin,
        secondProject.id,
      );
    expect(
      secondWorkspace.project.templateVersionId,
    ).toBe(revised.version.id);
    expect(secondWorkspace.tasks[0]?.title).toBe(
      "V2 Task",
    );
  });

  it("requires exact college authority and an active assigned template", async () => {
    const template = await createProjectTemplate(
      superAdmin,
      {
        slug: "p3-unassigned-" + fixtureRunSuffix,
        title: "P3 Unassigned",
        blueprint: blueprint("Unassigned"),
      },
    );
    await publishProjectTemplate(
      superAdmin,
      template.template.id,
    );

    await expect(
      createProjectInstance(collegeAdmin, {
        collegeId: SEED_IDS.collegeA,
        templateId: template.template.id,
        slug: "p3-no-assignment-" + fixtureRunSuffix,
        title: "P3 No Assignment",
      }),
    ).rejects.toMatchObject({
      code: "PROJECT_TEMPLATE_NOT_ASSIGNED",
    });

    await expect(
      createProjectInstance(collegeAdmin, {
        collegeId: SEED_IDS.collegeB,
        templateId: template.template.id,
        slug: "p3-foreign-college-" + fixtureRunSuffix,
        title: "P3 Foreign College",
      }),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("rejects an invalid primary mentor without leaving a workspace behind", async () => {
    const template = await createProjectTemplate(
      superAdmin,
      {
        slug: "p3-invalid-mentor-template-" + fixtureRunSuffix,
        title: "P3 Invalid Mentor",
        blueprint: blueprint("Invalid Mentor"),
      },
    );
    await publishProjectTemplate(
      superAdmin,
      template.template.id,
    );
    await assignProjectTemplateToCollege(
      scopedSuperAdmin,
      template.template.id,
      SEED_IDS.collegeA,
    );

    await expect(
      createProjectInstance(
        collegeAdmin,
        {
          collegeId: SEED_IDS.collegeA,
          templateId: template.template.id,
          slug: "p3-invalid-mentor",
          title: "P3 Invalid Mentor",
          primaryMentorMembershipId:
            SEED_IDS.learnerCollegeAMembership,
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_MEMBER_ROLE_REQUIRED",
    });

    const orphan = await pool.query(
      "select id from project_instances where slug='p3-invalid-mentor'",
    );
    expect(orphan.rows).toHaveLength(0);
  });

  it("enforces stable project slugs per college", async () => {
    const template = await createProjectTemplate(
      superAdmin,
      {
        slug: "p3-slug-template-" + fixtureRunSuffix,
        title: "P3 Slug Template",
        blueprint: blueprint("Slug"),
      },
    );
    await publishProjectTemplate(
      superAdmin,
      template.template.id,
    );
    await assignProjectTemplateToCollege(
      scopedSuperAdmin,
      template.template.id,
      SEED_IDS.collegeA,
    );

    await createProjectInstance(
      collegeAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        templateId: template.template.id,
        slug: "p3-stable-slug",
        title: "P3 Stable Slug",
      },
    );

    await expect(
      createProjectInstance(
        collegeAdmin,
        {
          collegeId: SEED_IDS.collegeA,
          templateId: template.template.id,
          slug: "p3-stable-slug",
          title: "P3 Duplicate Slug",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_SLUG_CONFLICT",
    });
  });
});
