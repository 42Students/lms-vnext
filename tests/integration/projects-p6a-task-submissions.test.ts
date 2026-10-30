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
import {
  addProjectMember,
} from "@/modules/projects/member-service";
import {
  createProjectInstance,
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";
import {
  startProjectSprint,
} from "@/modules/projects/lifecycle-service";
import {
  listProjectTaskSubmissions,
  reviewProjectTaskSubmission,
  submitProjectTask,
} from "@/modules/projects/task-submission-service";
import {
  assignProjectTemplateToCollege,
  createProjectTemplate,
  publishProjectTemplate,
} from "@/modules/projects/template-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assignProjectTaskToLearner } from "./support/projects-review-fixture";

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
      goal: "P6 task review",
      deliverables: ["Reviewed task"],
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
    `delete from project_task_submissions
     where project_id in (
       select id from project_instances
       where slug like 'p6a-%'
     )`,
  );
  await pool.query(
    `delete from project_members
     where project_id in (
       select id from project_instances
       where slug like 'p6a-%'
     )`,
  );
  await pool.query(
    `delete from project_resources
     where project_id in (
       select id from project_instances
       where slug like 'p6a-%'
     )`,
  );
  await pool.query(
    `delete from project_tasks
     where project_id in (
       select id from project_instances
       where slug like 'p6a-%'
     )`,
  );
  await pool.query(
    `delete from project_sprints
     where project_id in (
       select id from project_instances
       where slug like 'p6a-%'
     )`,
  );
  await pool.query(
    `delete from project_releases
     where project_id in (
       select id from project_instances
       where slug like 'p6a-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'p6a-%'",
  );
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'p6a-%'
     )`,
  );
  // Registered DB070 makes every revision permanent and DB071 anchors the
  // header to that snapshot. Retain only this disposable fixture history.
  // Per-invocation UUID slugs keep repeated tests isolated without bypassing
  // PostgreSQL triggers or relaxing assertions.
  const retention = await pool.query<{ retainHistory: boolean }>(
    "select (exists (select 1 from pg_trigger " +
      "where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint " +
      "where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
  );
  if (!retention.rows[0]?.retainHistory) {
    await pool.query(
      `delete from project_template_versions
       where template_id in (
         select id from project_templates
         where slug like 'p6a-%'
       )`,
    );
    await pool.query("delete from project_templates where slug like 'p6a-%'");
  }
}

async function createProject() {
  const fixtureSuffix = randomUUID().slice(0, 12);
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "p6a-task-template-" + fixtureSuffix,
      title: "P6A Task Template",
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
      slug: "p6a-task-project-" + fixtureSuffix,
      title: "P6A Task Project",
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

  const workspace =
    await getProjectInstanceWorkspace(
      mentor,
      project.id,
    );

  return {
    project,
    sprint: workspace.sprints[0]!,
    task: workspace.tasks[0]!,
  };
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Projects P6A task submissions", () => {
  it("requires an active sprint and a learner project member to submit", async () => {
    const { project, sprint, task } =
      await createProject();
    await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});

    await expect(
      submitProjectTask(
        learner,
        project.id,
        task.id,
        {
          submissionUrl:
            "https://example.com/before-start",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PROJECT_TASK_SUBMISSION_INVALID_STATE",
    });

    await startProjectSprint(
      mentor,
      project.id,
      sprint.id,
    );

    await expect(
      submitProjectTask(
        mentor,
        project.id,
        task.id,
        {
          submissionUrl:
            "https://example.com/mentor-cannot-submit",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PROJECT_TASK_SUBMISSION_ACCESS_DENIED",
    });

    const submission = await submitProjectTask(
      learner,
      project.id,
      task.id,
      {
        submissionUrl:
          "https://example.com/attempt-1",
        note: "First review attempt",
      },
    );

    expect(submission).toMatchObject({
      version: 1,
      status: "SUBMITTED",
      submittedByMembershipId:
        SEED_IDS.learnerCollegeAMembership,
    });

    const activity =
      await pool.query<{
        event_type: string;
      }>(
        `select event_type
           from activity_events
          where dedupe_key = $1`,
        [
          `project-task-submission:${submission.id}:submitted`,
        ],
      );
    expect(activity.rows).toEqual([
      {
        event_type:
          "projects.task.submitted",
      },
    ]);

    const workspace =
      await getProjectInstanceWorkspace(
        learner,
        project.id,
      );
    expect(workspace.tasks[0]?.status).toBe(
      "IN_REVIEW",
    );
  });

  it("keeps attempt history and moves the task according to mentor review", async () => {
    const { project, sprint, task } =
      await createProject();
    await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
    await startProjectSprint(
      mentor,
      project.id,
      sprint.id,
    );

    const first = await submitProjectTask(
      learner,
      project.id,
      task.id,
      {
        submissionUrl:
          "https://example.com/attempt-1",
      },
    );

    await expect(
      submitProjectTask(
        learner,
        project.id,
        task.id,
        {
          submissionUrl:
            "https://example.com/duplicate-active",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PROJECT_TASK_SUBMISSION_INVALID_STATE",
    });

    await expect(
      reviewProjectTaskSubmission(
        learner,
        project.id,
        task.id,
        first.id,
        {
          decision: "APPROVED",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_LIFECYCLE_ACCESS_DENIED",
    });

    const changes =
      await reviewProjectTaskSubmission(
        mentor,
        project.id,
        task.id,
        first.id,
        {
          decision: "CHANGES_REQUESTED",
          feedback: "Please tighten the tests.",
          confirmed: true,
          expectedUpdatedAt: first.updatedAt.toISOString(),
        },
      );
    expect(changes).toMatchObject({
      submission: {
        status: "CHANGES_REQUESTED",
      },
      task: {
        status: "IN_PROGRESS",
      },
    });

    const second = await submitProjectTask(
      learner,
      project.id,
      task.id,
      {
        submissionUrl:
          "https://example.com/attempt-2",
        note: "Addressed review feedback",
      },
    );
    expect(second.version).toBe(2);

    const approved =
      await reviewProjectTaskSubmission(
        collegeAdmin,
        project.id,
        task.id,
        second.id,
        {
          decision: "APPROVED",
          feedback: "Accepted",
        },
      );
    expect(approved).toMatchObject({
      submission: { status: "APPROVED" },
      task: { status: "DONE" },
    });

    const history =
      await listProjectTaskSubmissions(
        learner,
        project.id,
        task.id,
      );
    expect(history.map((row) => row.status)).toEqual([
      "CHANGES_REQUESTED",
      "APPROVED",
    ]);
    expect(history.map((row) => row.version)).toEqual([
      1, 2,
    ]);
  });

  it("rejects submission from a removed learner and leaves task/version untouched",async()=>{
    const {project,sprint,task}=await createProject();
    await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
    await startProjectSprint(mentor,project.id,sprint.id);
    await pool.query(`update project_members set ended_at=now()
      where project_id=$1 and membership_id=$2 and role='LEARNER'`,[
      project.id,SEED_IDS.learnerCollegeAMembership,
    ]);
    await expect(submitProjectTask(learner,project.id,task.id,{
      submissionUrl:"https://example.com/removed-user",
    })).rejects.toBeDefined();
    const [state]= (await pool.query<{status:string}>(`select status from
      project_tasks where id=$1 and project_id=$2`,[task.id,project.id])).rows;
    expect(state?.status).not.toBe("IN_REVIEW");
    const [count]= (await pool.query<{count:string}>(`select count(*)::text as count
      from project_task_submissions where task_id=$1`,[task.id])).rows;
    expect(count?.count).toBe("0");
  });

  it("rejects review after Mentor revocation or terminal project state",async()=>{
    const {project,sprint,task}=await createProject();
    await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
    await startProjectSprint(mentor,project.id,sprint.id);
    const submission=await submitProjectTask(learner,project.id,task.id,{
      submissionUrl:"https://example.com/revoked-review",
    });
    const decision={decision:"APPROVED" as const,confirmed:true as const,
      expectedUpdatedAt:submission.updatedAt.toISOString()};
    await pool.query(`update project_members set ended_at=now()
      where project_id=$1 and membership_id=$2 and role='MENTOR'`,[
      project.id,SEED_IDS.facultyCollegeAMembership,
    ]);
    await expect(reviewProjectTaskSubmission(
      mentor,project.id,task.id,submission.id,decision,
    )).rejects.toBeDefined();
    await pool.query(`update project_members set ended_at=null
      where project_id=$1 and membership_id=$2 and role='MENTOR'`,[
      project.id,SEED_IDS.facultyCollegeAMembership,
    ]);
    await pool.query(`update project_instances set status='COMPLETED'
      where id=$1`,[project.id]);
    await expect(reviewProjectTaskSubmission(
      mentor,project.id,task.id,submission.id,decision,
    )).rejects.toBeDefined();
    const [unreviewed]=(await pool.query<{status:string}>(`select status
      from project_task_submissions where id=$1`,[submission.id])).rows;
    expect(unreviewed?.status).toBe("SUBMITTED");
    const [taskState]=(await pool.query<{status:string}>(`select status
      from project_tasks where id=$1`,[task.id])).rows;
    expect(taskState?.status).toBe("IN_REVIEW");
  });

  it("preserves review audit but never notifies a learner removed from the project",async()=>{
    const {project,sprint,task}=await createProject();
    await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
    await startProjectSprint(mentor,project.id,sprint.id);
    const submission=await submitProjectTask(learner,project.id,task.id,{
      submissionUrl:"https://example.com/review-after-removal",
    });
    await pool.query(`update project_members set ended_at=now()
      where project_id=$1 and membership_id=$2 and role='LEARNER'`,[
      project.id,SEED_IDS.learnerCollegeAMembership,
    ]);
    const reviewed=await reviewProjectTaskSubmission(
      mentor,project.id,task.id,submission.id,{
        decision:"APPROVED",confirmed:true,
        expectedUpdatedAt:submission.updatedAt.toISOString(),
      },
    );
    expect(reviewed.submission.status).toBe("APPROVED");
    expect(reviewed.task.status).toBe("DONE");
    const notice=await pool.query<{total:string}>(`select count(*)::text as total
      from in_app_notifications n
      join activity_events e on e.id=n.event_id
      where e.dedupe_key=$1 and n.user_id=$2`,[
      "project-task-submission:"+submission.id+":reviewed",SEED_IDS.learnerUser,
    ]);
    expect(notice.rows[0]?.total).toBe("0");
    const audit=await pool.query<{id:string}>(`select id from activity_events
      where dedupe_key=$1`,[
      "project-task-submission:"+submission.id+":reviewed",
    ]);
    expect(audit.rows).toHaveLength(1);
  });

  it("requires feedback for changes and enforces review shape in PostgreSQL", async () => {
    const { project, sprint, task } =
      await createProject();
    await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
    await startProjectSprint(
      mentor,
      project.id,
      sprint.id,
    );

    const submission = await submitProjectTask(
      learner,
      project.id,
      task.id,
      {
        submissionUrl:
          "https://example.com/review-shape",
      },
    );

    await expect(
      reviewProjectTaskSubmission(
        mentor,
        project.id,
        task.id,
        submission.id,
        {
          decision: "CHANGES_REQUESTED",
        },
      ),
    ).rejects.toMatchObject({
      name: "ZodError",
    });

    await expect(
      pool.query(
        `update project_task_submissions
         set status = 'APPROVED'
         where id = $1`,
        [submission.id],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint:
        "project_task_submissions_review_ck",
    });
  });
});
