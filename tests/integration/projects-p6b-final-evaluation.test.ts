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
  createProjectEvaluation,
  getProjectEvaluation,
} from "@/modules/projects/evaluation-service";
import {
  createProjectSubmissionDraft,
  listProjectSubmissions,
  reviewProjectSubmission,
  submitProjectSubmission,
  updateProjectSubmissionDraft,
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
      goal: "P6 final delivery",
      deliverables: ["Final demo"],
    },
    releases: [
      {
        key: "release-1",
        title: "P6 Release",
        sequence: 0,
      },
    ],
    sprints: [
      {
        key: "sprint-1",
        releaseKey: "release-1",
        title: "P6 Sprint",
        sequence: 0,
      },
    ],
    tasks: [
      {
        key: "task-1",
        sprintKey: "sprint-1",
        title: "P6 Task",
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
         where slug like 'p6b-%'
       )
     )`,
  );
  await pool.query(
    `delete from project_evaluations
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_submission_reviews
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_submissions
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_task_submissions
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_members
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_resources
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_tasks
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_sprints
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_releases
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'p6b-%'",
  );
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_template_versions
     where template_id in (
       select id from project_templates
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    "delete from project_templates where slug like 'p6b-%'",
  );
}

async function createProject() {
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "p6b-final-template",
      title: "P6B Final Template",
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
      slug: "p6b-final-project",
      title: "P6B Final Project",
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

async function finishExecution(
  projectId: string,
) {
  const workspace =
    await getProjectInstanceWorkspace(
      mentor,
      projectId,
    );
  const sprint = workspace.sprints[0]!;
  const task = workspace.tasks[0]!;
  const release = workspace.releases[0]!;

  await startProjectSprint(
    mentor,
    projectId,
    sprint.id,
  );
  await updateProjectTaskStatus(
    mentor,
    projectId,
    task.id,
    { status: "DONE" },
  );
  await completeProjectSprint(
    mentor,
    projectId,
    sprint.id,
  );
  await shipProjectRelease(
    mentor,
    projectId,
    release.id,
  );
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Projects P6B final delivery and evaluation", () => {
  it("supports draft editing but gates final submit on completed execution", async () => {
    const project = await createProject();

    const draft =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Initial final delivery",
        },
      );
    expect(draft).toMatchObject({
      version: 1,
      status: "DRAFT",
    });

    const updated =
      await updateProjectSubmissionDraft(
        learner,
        project.id,
        draft.id,
        {
          summary: "Ready final delivery",
          sourceUrl:
            "https://example.com/source",
          demoUrl:
            "https://example.com/demo",
        },
      );
    expect(updated.sourceUrl).toBe(
      "https://example.com/source",
    );

    await expect(
      submitProjectSubmission(
        learner,
        project.id,
        draft.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_SUBMISSION_INVALID_STATE",
    });

    await finishExecution(project.id);

    await expect(
      submitProjectSubmission(
        learner,
        project.id,
        draft.id,
      ),
    ).resolves.toMatchObject({
      status: "SUBMITTED",
      submittedByMembershipId:
        SEED_IDS.learnerCollegeAMembership,
    });
  });

  it("keeps immutable review history across final submission versions", async () => {
    const project = await createProject();
    await finishExecution(project.id);

    const first =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Version one",
          sourceUrl:
            "https://example.com/v1",
        },
      );
    await submitProjectSubmission(
      learner,
      project.id,
      first.id,
    );

    const changes =
      await reviewProjectSubmission(
        mentor,
        project.id,
        first.id,
        {
          decision: "CHANGES_REQUESTED",
          feedback: "Improve the demo evidence.",
        },
      );
    expect(changes.submission.status).toBe(
      "CHANGES_REQUESTED",
    );

    const second =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Version two",
          sourceUrl:
            "https://example.com/v2",
          demoUrl:
            "https://example.com/v2-demo",
        },
      );
    expect(second.version).toBe(2);
    await submitProjectSubmission(
      learner,
      project.id,
      second.id,
    );

    const approved =
      await reviewProjectSubmission(
        collegeAdmin,
        project.id,
        second.id,
        {
          decision: "APPROVED",
          feedback: "Approved for evaluation.",
        },
      );
    expect(approved.submission.status).toBe(
      "APPROVED",
    );

    const history =
      await listProjectSubmissions(
        learner,
        project.id,
      );
    expect(
      history.submissions.map(
        (item) => item.status,
      ),
    ).toEqual([
      "CHANGES_REQUESTED",
      "APPROVED",
    ]);
    expect(history.reviews).toHaveLength(2);
    expect(
      history.reviews.map(
        (item) => item.decision,
      ),
    ).toEqual([
      "CHANGES_REQUESTED",
      "APPROVED",
    ]);
  });

  it("creates one rubric evaluation only for an approved submission and exposes it to participants", async () => {
    const project = await createProject();
    await finishExecution(project.id);

    const draft =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Evaluation candidate",
          sourceUrl:
            "https://example.com/eval",
        },
      );
    await submitProjectSubmission(
      learner,
      project.id,
      draft.id,
    );

    await expect(
      createProjectEvaluation(
        mentor,
        project.id,
        draft.id,
        {
          items: [
            {
              criterion: "Engineering quality",
              score: 8,
              maxScore: 10,
            },
          ],
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_EVALUATION_INVALID_STATE",
    });

    await reviewProjectSubmission(
      mentor,
      project.id,
      draft.id,
      {
        decision: "APPROVED",
      },
    );

    const created =
      await createProjectEvaluation(
        mentor,
        project.id,
        draft.id,
        {
          summary: "Strong final project",
          items: [
            {
              criterion: "Engineering quality",
              score: 8,
              maxScore: 10,
              feedback: "Well structured.",
            },
            {
              criterion: "Delivery",
              score: 18,
              maxScore: 20,
            },
          ],
        },
      );
    expect(created.evaluation).toMatchObject({
      totalScore: 26,
      maxScore: 30,
    });
    expect(created.items).toHaveLength(2);

    await expect(
      createProjectEvaluation(
        collegeAdmin,
        project.id,
        draft.id,
        {
          items: [
            {
              criterion: "Duplicate",
              score: 1,
              maxScore: 1,
            },
          ],
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_EVALUATION_CONFLICT",
    });

    const visible =
      await getProjectEvaluation(
        learner,
        project.id,
        draft.id,
      );
    expect(visible).toMatchObject({
      evaluation: {
        totalScore: 26,
        maxScore: 30,
      },
    });
  });

  it("blocks non-learners from final submission authoring and enforces DB review/score invariants", async () => {
    const project = await createProject();

    await expect(
      createProjectSubmissionDraft(
        mentor,
        project.id,
        {
          summary: "Mentor cannot author",
          sourceUrl:
            "https://example.com/nope",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_SUBMISSION_ACCESS_DENIED",
    });

    await expect(
      pool.query(
        `insert into project_evaluations
          (project_id, submission_id, evaluator_user_id, total_score, max_score)
         values ($1, $2, $3, 11, 10)`,
        [
          project.id,
          "00000000-0000-4000-8000-000000000001",
          SEED_IDS.facultyUser,
        ],
      ),
    ).rejects.toMatchObject({
      code: expect.stringMatching(/23503|23514/),
    });
  });
});
