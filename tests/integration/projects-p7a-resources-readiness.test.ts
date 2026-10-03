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
  addProjectMember,
} from "@/modules/projects/member-service";
import {
  createProjectInstance,
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";
import {
  completeProjectSprint,
  shipProjectRelease,
  startProjectSprint,
  updateProjectTaskStatus,
} from "@/modules/projects/lifecycle-service";
import {
  getProjectReadiness,
} from "@/modules/projects/readiness-service";
import {
  archiveProjectResource,
  createProjectResource,
  listProjectResources,
  updateProjectResource,
} from "@/modules/projects/resource-service";
import {
  createProjectSubmissionDraft,
} from "@/modules/projects/submission-service";
import {
  assignProjectTemplateToCollege,
  createProjectTemplate,
  publishProjectTemplate,
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

const mentor: RequestContext = {
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
    roles: ["FACULTY", "MENTOR"],
  },
};

function blueprint() {
  return {
    overview: {
      goal: "P7 readiness",
      deliverables: ["P7 demo"],
    },
    releases: [
      {
        key: "release-1",
        title: "P7 Release",
        sequence: 0,
      },
    ],
    sprints: [
      {
        key: "sprint-1",
        releaseKey: "release-1",
        title: "P7 Sprint",
        sequence: 0,
      },
    ],
    tasks: [
      {
        key: "task-1",
        sprintKey: "sprint-1",
        title: "P7 Task",
        priority: "MEDIUM" as const,
        sequence: 0,
      },
    ],
    resources: [
      {
        key: "template-guide",
        title: "Template guide",
        url: "https://example.com/template-guide",
        required: true,
        sequence: 0,
      },
    ],
  };
}

async function cleanup() {
  await pool.query(
    `delete from project_evaluation_items
     where evaluation_id in (
       select id from project_evaluations
       where project_id in (
         select id from project_instances
         where slug like 'p7a-%'
       )
     )`,
  );
  await pool.query(
    `delete from project_evaluations
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_submission_reviews
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_submissions
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_task_submissions
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_members
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_resources
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_tasks
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_sprints
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_releases
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'p7a-%'",
  );
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_template_versions
     where template_id in (
       select id from project_templates
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    "delete from project_templates where slug like 'p7a-%'",
  );
}

async function createProject() {
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "p7a-resource-template",
      title: "P7A Resource Template",
      blueprint: blueprint(),
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
  const project = await createProjectInstance(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      templateId: template.template.id,
      slug: "p7a-resource-project",
      title: "P7A Resource Project",
    },
  );

  await addProjectMember(
    collegeAdmin,
    project.id,
    {
      membershipId:
        SEED_IDS.learnerCollegeAMembership,
      role: "LEARNER",
    },
  );
  await addProjectMember(
    collegeAdmin,
    project.id,
    {
      membershipId:
        SEED_IDS.facultyCollegeAMembership,
      role: "MENTOR",
      isPrimary: true,
    },
  );

  return project;
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Projects P7A resources and readiness", () => {
  it("keeps template provenance separate from mentor-added resources", async () => {
    const project = await createProject();

    await expect(
      createProjectResource(
        learner,
        project.id,
        {
          title: "Learner mutation",
          url: "https://example.com/no",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_LIFECYCLE_ACCESS_DENIED",
    });

    const created = await createProjectResource(
      mentor,
      project.id,
      {
        title: "Mentor guide",
        description: "Use this during the sprint.",
        url: "https://example.com/mentor-guide",
        required: false,
      },
    );

    expect(created).toMatchObject({
      templateKey: null,
      sequence: 1,
      status: "ACTIVE",
    });

    const updated = await updateProjectResource(
      collegeAdmin,
      project.id,
      created.id,
      {
        title: "Updated mentor guide",
        required: true,
      },
    );
    expect(updated).toMatchObject({
      title: "Updated mentor guide",
      required: true,
    });

    let visible = await listProjectResources(
      learner,
      project.id,
    );
    expect(visible).toHaveLength(2);
    expect(visible[0]?.templateKey).toBe(
      "template-guide",
    );
    expect(visible[1]?.templateKey).toBeNull();

    await archiveProjectResource(
      mentor,
      project.id,
      created.id,
    );
    visible = await listProjectResources(
      learner,
      project.id,
    );
    expect(visible).toHaveLength(1);
    expect(visible[0]?.templateKey).toBe(
      "template-guide",
    );
  });

  it("derives readiness from normalized lifecycle and final-delivery state", async () => {
    const project = await createProject();

    let readiness = await getProjectReadiness(
      learner,
      project.id,
    );
    expect(readiness).toMatchObject({
      projectStatus: "PLANNED",
      execution: {
        complete: false,
        releases: { total: 1, shipped: 0 },
        sprints: { total: 1, completed: 0 },
        tasks: { total: 1, done: 0 },
      },
      finalSubmission: {
        latest: null,
        canCreateDraft: true,
        canSubmitDraft: false,
        approved: false,
      },
      evaluation: {
        exists: false,
        canEvaluate: false,
      },
    });

    const draft =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Prepared early",
          sourceUrl:
            "https://example.com/final",
        },
      );

    readiness = await getProjectReadiness(
      mentor,
      project.id,
    );
    expect(readiness.finalSubmission).toMatchObject({
      latest: {
        id: draft.id,
        status: "DRAFT",
        version: 1,
      },
      canCreateDraft: false,
      canSubmitDraft: false,
    });

    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    const sprint = workspace.sprints[0]!;
    const task = workspace.tasks[0]!;
    const release = workspace.releases[0]!;

    await startProjectSprint(
      mentor,
      project.id,
      sprint.id,
    );
    await updateProjectTaskStatus(
      mentor,
      project.id,
      task.id,
      { status: "DONE" },
    );
    await completeProjectSprint(
      mentor,
      project.id,
      sprint.id,
    );
    await shipProjectRelease(
      mentor,
      project.id,
      release.id,
    );

    readiness = await getProjectReadiness(
      learner,
      project.id,
    );
    expect(readiness).toMatchObject({
      projectStatus: "COMPLETED",
      execution: {
        complete: true,
        releases: { total: 1, shipped: 1 },
        sprints: { total: 1, completed: 1 },
        tasks: { total: 1, done: 1 },
      },
      finalSubmission: {
        canCreateDraft: false,
        canSubmitDraft: true,
      },
    });
  });

  it("enforces the no-empty-resource rule on create and update", async () => {
    const project = await createProject();

    await expect(
      createProjectResource(
        mentor,
        project.id,
        { title: "Empty resource" },
      ),
    ).rejects.toMatchObject({
      name: "ZodError",
    });

    const resource = await createProjectResource(
      mentor,
      project.id,
      {
        title: "Described resource",
        description: "Useful notes",
      },
    );

    await expect(
      updateProjectResource(
        mentor,
        project.id,
        resource.id,
        {
          description: null,
          url: null,
        },
      ),
    ).rejects.toMatchObject({
      name: "ZodError",
    });
  });
});
