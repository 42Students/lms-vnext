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
  createProjectEvaluation,
} from "@/modules/projects/evaluation-service";
import {
  createProjectInstance,
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";
import {
  startProjectSprint,
  updateProjectTaskStatus,
} from "@/modules/projects/lifecycle-service";
import {
  listProjectMeetings,
  scheduleProjectMeeting,
} from "@/modules/projects/meeting-service";
import {
  addProjectMember,
} from "@/modules/projects/member-service";
import {
  getProjectReadiness,
} from "@/modules/projects/readiness-service";
import {
  createProjectResource,
  updateProjectResource,
} from "@/modules/projects/resource-service";
import {
  createProjectSubmissionDraft,
  reviewProjectSubmission,
  submitProjectSubmission,
} from "@/modules/projects/submission-service";
import {
  submitProjectTask,
} from "@/modules/projects/task-submission-service";
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

const outsiderIds = {
  user: "76000000-0000-4000-8000-000000000001",
  membership:
    "76000000-0000-4000-8000-000000000002",
  role: "76000000-0000-4000-8000-000000000003",
};

const outsider: RequestContext = {
  user: {
    id: outsiderIds.user,
    identityUid: "projects-adversarial-outsider",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: outsiderIds.membership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

function blueprint() {
  return {
    overview: {
      goal: "Projects adversarial coverage",
      deliverables: ["Safe project"],
    },
    releases: [
      {
        key: "release-1",
        title: "Release",
        sequence: 0,
      },
    ],
    sprints: [
      {
        key: "sprint-1",
        releaseKey: "release-1",
        title: "Sprint",
        sequence: 0,
      },
    ],
    tasks: [
      {
        key: "task-1",
        sprintKey: "sprint-1",
        title: "Task",
        priority: "HIGH" as const,
        sequence: 0,
      },
    ],
    resources: [],
  };
}

async function cleanup() {
  await pool.query(
    `delete from project_evaluation_items
     where evaluation_id in (
       select id from project_evaluations
       where project_id in (
         select id from project_instances
         where slug like 'adv-%'
       )
     )`,
  );
  await pool.query(
    `delete from project_evaluations
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    `delete from project_submission_reviews
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    `delete from project_submissions
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    `delete from project_task_submissions
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    `delete from project_meetings
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    `delete from project_members
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    `delete from project_resources
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    `delete from project_tasks
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    `delete from project_sprints
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    `delete from project_releases
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'adv-%'",
  );
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    `delete from project_template_versions
     where template_id in (
       select id from project_templates
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    "delete from project_templates where slug like 'adv-%'",
  );
  await pool.query(
    "delete from membership_roles where membership_id = $1",
    [outsiderIds.membership],
  );
  await pool.query(
    "delete from college_memberships where id = $1",
    [outsiderIds.membership],
  );
  await pool.query(
    "delete from users where id = $1",
    [outsiderIds.user],
  );
}

async function seedOutsider() {
  await pool.query(
    `insert into users
      (id, identity_uid, display_name)
     values ($1, 'projects-adversarial-outsider', 'Adversarial Outsider')`,
    [outsiderIds.user],
  );
  await pool.query(
    `insert into college_memberships
      (id, user_id, college_id, status)
     values ($1, $2, $3, 'ACTIVE')`,
    [
      outsiderIds.membership,
      outsiderIds.user,
      SEED_IDS.collegeA,
    ],
  );
  await pool.query(
    `insert into membership_roles
      (id, membership_id, role)
     values ($1, $2, 'LEARNER')`,
    [outsiderIds.role, outsiderIds.membership],
  );
}

async function createTemplate() {
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "adv-template",
      title: "Adversarial Template",
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
  return template.template.id;
}

async function createProject(
  templateId: string,
  suffix: string,
) {
  const project = await createProjectInstance(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      templateId,
      slug: `adv-project-${suffix}`,
      title: `Adversarial Project ${suffix}`,
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

beforeEach(async () => {
  await cleanup();
  await seedOutsider();
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Projects adversarial isolation", () => {
  it("does not equate same-college membership with project access", async () => {
    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "same-college",
    );

    await expect(
      getProjectInstanceWorkspace(
        outsider,
        project.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_ACCESS_DENIED",
    });
    await expect(
      getProjectReadiness(
        outsider,
        project.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_ACCESS_DENIED",
    });
    await expect(
      listProjectMeetings(
        outsider,
        project.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_ACCESS_DENIED",
    });
  });

  it("rejects valid IDs borrowed from a different project", async () => {
    const templateId = await createTemplate();
    const projectA = await createProject(
      templateId,
      "a",
    );
    const projectB = await createProject(
      templateId,
      "b",
    );

    const workspaceA =
      await getProjectInstanceWorkspace(
        mentor,
        projectA.id,
      );
    const workspaceB =
      await getProjectInstanceWorkspace(
        mentor,
        projectB.id,
      );

    const foreignResource =
      await createProjectResource(
        mentor,
        projectB.id,
        {
          title: "Project B resource",
          url: "https://example.com/project-b",
        },
      );

    await expect(
      updateProjectResource(
        mentor,
        projectA.id,
        foreignResource.id,
        {
          title: "Cross-project overwrite",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_RESOURCE_NOT_FOUND",
    });

    await expect(
      scheduleProjectMeeting(
        mentor,
        projectA.id,
        null,
        {
          title: "Cross-project task injection",
          startsAt:
            "2026-10-20T10:00:00+05:30",
          endsAt:
            "2026-10-20T10:30:00+05:30",
          timeZone: "Asia/Kolkata",
          meetingUrl:
            "https://meet.example.com/adversarial",
          linkedTaskId:
            workspaceB.tasks[0]!.id,
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_MEETING_LINK_INVALID",
    });

    await startProjectSprint(
      mentor,
      projectA.id,
      workspaceA.sprints[0]!.id,
    );

    await expect(
      submitProjectTask(
        learner,
        projectA.id,
        workspaceB.tasks[0]!.id,
        {
          submissionUrl:
            "https://example.com/cross-project-task",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_TASK_NOT_FOUND",
    });
  });

  it("prevents learners from escalating into lifecycle, resource, review or evaluation actions", async () => {
    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "privilege",
    );
    const workspace =
      await getProjectInstanceWorkspace(
        learner,
        project.id,
      );

    await expect(
      startProjectSprint(
        learner,
        project.id,
        workspace.sprints[0]!.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_LIFECYCLE_ACCESS_DENIED",
    });

    await expect(
      createProjectResource(
        learner,
        project.id,
        {
          title: "Escalated resource",
          url: "https://example.com/no",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_LIFECYCLE_ACCESS_DENIED",
    });

    const draft =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Team final delivery",
          sourceUrl:
            "https://example.com/final-source",
        },
      );

    await expect(
      reviewProjectSubmission(
        learner,
        project.id,
        draft.id,
        {
          decision: "APPROVED",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_LIFECYCLE_ACCESS_DENIED",
    });

    await expect(
      createProjectEvaluation(
        learner,
        project.id,
        draft.id,
        {
          items: [
            {
              criterion: "Self score",
              score: 10,
              maxScore: 10,
            },
          ],
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_LIFECYCLE_ACCESS_DENIED",
    });
  });

  it("keeps final review bound to the exact project submission", async () => {
    const templateId = await createTemplate();
    const projectA = await createProject(
      templateId,
      "review-a",
    );
    const projectB = await createProject(
      templateId,
      "review-b",
    );

    const draftB =
      await createProjectSubmissionDraft(
        learner,
        projectB.id,
        {
          summary: "Project B delivery",
          sourceUrl:
            "https://example.com/project-b-final",
        },
      );

    await expect(
      reviewProjectSubmission(
        mentor,
        projectA.id,
        draftB.id,
        {
          decision: "APPROVED",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_SUBMISSION_NOT_FOUND",
    });
  });

  it("does not let unsafe URL schemes cross submission or resource validation boundaries", async () => {
    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "unsafe-url",
    );
    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    await startProjectSprint(
      mentor,
      project.id,
      workspace.sprints[0]!.id,
    );

    await expect(
      submitProjectTask(
        learner,
        project.id,
        workspace.tasks[0]!.id,
        {
          submissionUrl:
            "javascript:alert(1)",
        },
      ),
    ).rejects.toMatchObject({
      name: "ZodError",
    });

    await expect(
      createProjectResource(
        mentor,
        project.id,
        {
          title: "Unsafe resource",
          url: "javascript:alert(1)",
        },
      ),
    ).rejects.toMatchObject({
      name: "ZodError",
    });

    await expect(
      createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Unsafe final",
          sourceUrl:
            "data:text/html,<script>alert(1)</script>",
        },
      ),
    ).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("keeps stale task state from bypassing submission review gates", async () => {
    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "stale-state",
    );
    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    const sprint = workspace.sprints[0]!;
    const task = workspace.tasks[0]!;

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

    await expect(
      submitProjectTask(
        learner,
        project.id,
        task.id,
        {
          submissionUrl:
            "https://example.com/late-submit",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PROJECT_TASK_SUBMISSION_INVALID_STATE",
    });
  });
});
