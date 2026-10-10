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
  reopenProjectSprint,
  shipProjectRelease,
  startProjectSprint,
  unshipProjectRelease,
  updateProjectTaskStatus,
} from "@/modules/projects/lifecycle-service";
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
      goal: "P5 goal",
      deliverables: ["P5 demo"],
    },
    releases: [
      {
        key: "release-1",
        title: "P5 Release",
        sequence: 0,
      },
    ],
    sprints: [
      {
        key: "sprint-1",
        releaseKey: "release-1",
        title: "P5 Sprint One",
        sequence: 0,
      },
      {
        key: "sprint-2",
        releaseKey: "release-1",
        title: "P5 Sprint Two",
        sequence: 1,
      },
    ],
    tasks: [
      {
        key: "task-1",
        sprintKey: "sprint-1",
        title: "P5 Task One",
        priority: "HIGH" as const,
        sequence: 0,
      },
      {
        key: "task-2",
        sprintKey: "sprint-2",
        title: "P5 Task Two",
        priority: "MEDIUM" as const,
        sequence: 0,
      },
    ],
    resources: [],
  };
}

async function cleanup() {
  await pool.query(
    `delete from project_members
     where project_id in (
       select id from project_instances
       where slug like 'p5-%'
     )`,
  );
  await pool.query(
    `delete from project_resources
     where project_id in (
       select id from project_instances
       where slug like 'p5-%'
     )`,
  );
  await pool.query(
    `delete from project_tasks
     where project_id in (
       select id from project_instances
       where slug like 'p5-%'
     )`,
  );
  await pool.query(
    `delete from project_sprints
     where project_id in (
       select id from project_instances
       where slug like 'p5-%'
     )`,
  );
  await pool.query(
    `delete from project_releases
     where project_id in (
       select id from project_instances
       where slug like 'p5-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'p5-%'",
  );
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'p5-%'
     )`,
  );
  await pool.query(
    `delete from project_template_versions
     where template_id in (
       select id from project_templates
       where slug like 'p5-%'
     )`,
  );
  await pool.query(
    "delete from project_templates where slug like 'p5-%'",
  );
}

async function createProject() {
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "p5-lifecycle-template",
      title: "P5 Lifecycle Template",
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
      slug: "p5-lifecycle-project",
      title: "P5 Lifecycle Project",
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

describe("Projects P5 lifecycle", () => {
  it("enforces one active sprint and keeps lifecycle mentor/admin-only", async () => {
    const project = await createProject();
    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    const [firstSprint, secondSprint] =
      workspace.sprints;

    expect(firstSprint).toBeDefined();
    expect(secondSprint).toBeDefined();

    await expect(
      startProjectSprint(
        learner,
        project.id,
        firstSprint!.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_LIFECYCLE_ACCESS_DENIED",
    });

    await expect(
      startProjectSprint(
        mentor,
        project.id,
        firstSprint!.id,
      ),
    ).resolves.toMatchObject({
      status: "ACTIVE",
    });

    await expect(
      startProjectSprint(
        collegeAdmin,
        project.id,
        secondSprint!.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_SPRINT_ALREADY_ACTIVE",
    });

    const status = await pool.query(
      `select p.status as project_status,
              r.status as release_status
       from project_instances p
       join project_releases r
         on r.project_id = p.id
       where p.id = $1`,
      [project.id],
    );
    expect(status.rows[0]).toMatchObject({
      project_status: "ACTIVE",
      release_status: "IN_PROGRESS",
    });
  });

  it("blocks sprint completion until every task is done and reserves IN_REVIEW for submissions", async () => {
    const project = await createProject();
    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    const firstSprint = workspace.sprints[0]!;
    const firstTask = workspace.tasks.find(
      (task) =>
        task.sprintId === firstSprint.id,
    )!;

    await startProjectSprint(
      mentor,
      project.id,
      firstSprint.id,
    );

    await expect(
      completeProjectSprint(
        mentor,
        project.id,
        firstSprint.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_SPRINT_HAS_OPEN_TASKS",
    });

    await expect(
      updateProjectTaskStatus(
        mentor,
        project.id,
        firstTask.id,
        { status: "IN_REVIEW" },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_TASK_INVALID_STATE",
    });

    await expect(
      updateProjectTaskStatus(
        mentor,
        project.id,
        firstTask.id,
        { status: "DONE" },
      ),
    ).resolves.toMatchObject({
      status: "DONE",
    });

    await expect(
      completeProjectSprint(
        collegeAdmin,
        project.id,
        firstSprint.id,
      ),
    ).resolves.toMatchObject({
      status: "COMPLETED",
    });
  });

  it("ships a release only after every sprint completes and completes the project on the last release", async () => {
    const project = await createProject();
    let workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    const release = workspace.releases[0]!;

    await expect(
      shipProjectRelease(
        mentor,
        project.id,
        release.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_RELEASE_HAS_OPEN_SPRINTS",
    });

    for (const sprint of workspace.sprints) {
      await startProjectSprint(
        mentor,
        project.id,
        sprint.id,
      );

      workspace =
        await getProjectInstanceWorkspace(
          mentor,
          project.id,
        );
      const sprintTasks = workspace.tasks.filter(
        (task) =>
          task.sprintId === sprint.id,
      );
      for (const task of sprintTasks) {
        await updateProjectTaskStatus(
          mentor,
          project.id,
          task.id,
          { status: "DONE" },
        );
      }

      await completeProjectSprint(
        mentor,
        project.id,
        sprint.id,
      );
    }

    await expect(
      shipProjectRelease(
        mentor,
        project.id,
        release.id,
      ),
    ).resolves.toMatchObject({
      status: "SHIPPED",
    });

    const [row] = (
      await pool.query(
        "select status from project_instances where id = $1",
        [project.id],
      )
    ).rows;
    expect(row?.status).toBe("COMPLETED");
  });

  it("requires un-shipping before reopening a completed sprint", async () => {
    const project = await createProject();
    let workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    const release = workspace.releases[0]!;

    for (const sprint of workspace.sprints) {
      await startProjectSprint(
        mentor,
        project.id,
        sprint.id,
      );
      workspace =
        await getProjectInstanceWorkspace(
          mentor,
          project.id,
        );
      for (const task of workspace.tasks.filter(
        (candidate) =>
          candidate.sprintId === sprint.id,
      )) {
        await updateProjectTaskStatus(
          mentor,
          project.id,
          task.id,
          { status: "DONE" },
        );
      }
      await completeProjectSprint(
        mentor,
        project.id,
        sprint.id,
      );
    }

    await shipProjectRelease(
      mentor,
      project.id,
      release.id,
    );

    await expect(
      reopenProjectSprint(
        mentor,
        project.id,
        workspace.sprints[0]!.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_SPRINT_INVALID_STATE",
    });

    await expect(
      unshipProjectRelease(
        mentor,
        project.id,
        release.id,
      ),
    ).resolves.toMatchObject({
      status: "IN_PROGRESS",
    });

    const projectStatus = await pool.query(
      "select status from project_instances where id = $1",
      [project.id],
    );
    expect(projectStatus.rows[0]?.status).toBe("ACTIVE");

    await expect(
      reopenProjectSprint(
        mentor,
        project.id,
        workspace.sprints[0]!.id,
      ),
    ).resolves.toMatchObject({
      status: "ACTIVE",
    });

    await expect(
      shipProjectRelease(
        mentor,
        project.id,
        release.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_RELEASE_HAS_OPEN_SPRINTS",
    });
  });

  it("enforces the active-sprint invariant in PostgreSQL too", async () => {
    const project = await createProject();
    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );

    await pool.query(
      "update project_sprints set status = 'ACTIVE' where id = $1",
      [workspace.sprints[0]!.id],
    );

    await expect(
      pool.query(
        "update project_sprints set status = 'ACTIVE' where id = $1",
        [workspace.sprints[1]!.id],
      ),
    ).rejects.toMatchObject({
      code: "23505",
      constraint:
        "project_sprints_active_project_uq",
    });
  });
});
