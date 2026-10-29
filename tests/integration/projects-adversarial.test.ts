import {randomUUID} from "node:crypto";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  createProjectEvaluation,
} from "@/modules/projects/evaluation-service";
import {
  archiveProjectInstance,
  createProjectInstance,
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";
import {
  completeProjectSprint,
  shipProjectRelease,
  startProjectSprint,
} from "@/modules/projects/lifecycle-service";
import {
  listMyMentorProjectAttention,
} from "@/modules/projects/mentor-attention-service";
import {
  listProjectMeetings,
  scheduleProjectMeeting,
} from "@/modules/projects/meeting-service";
import {
  addProjectMember,
  reassignProjectPrimaryMentor,
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
import {approveProjectTaskThroughReview,assignProjectTaskToLearner} from "./support/projects-review-fixture";
import {restoreProjectInstance} from "@/modules/projects/instance-restore-service";

// This suite deletes fixture rows. Never fall back to the application DB.
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Disposable TEST_DATABASE_URL is required for Projects integration tests");
}
assertDb018DisposableTarget(process.env,{serviceBound:true});

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

/** Meetings must start in the future relative to the server clock. */
function futureMeetingWindow() {
  const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  startsAt.setUTCSeconds(0, 0);
  const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

/** Mentor scheduling is optimistic against the project version the UI holds. */
async function projectVersion(projectId: string) {
  const { rows } = await pool.query<{ updated_at: Date }>(
    "select updated_at from project_instances where id = $1",
    [projectId],
  );
  return rows[0]!.updated_at.toISOString();
}

/** Mentor ship/unship is optimistic: send the release version the UI would hold. */
async function releaseVersion(releaseId: string) {
  const { rows } = await pool.query<{ updated_at: Date }>(
    "select updated_at from project_releases where id = $1",
    [releaseId],
  );
  return { expectedUpdatedAt: rows[0]!.updated_at.toISOString() };
}

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
    `delete from project_delivery_events
     where submission_id in (
       select id from project_submissions
       where project_id in (
         select id from project_instances
         where slug like 'adv-%'
       )
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
  // Meeting history rows reference these disposable meetings; remove them first.
  await pool.query(
    `delete from project_meeting_history
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
  // Trigger-written resource audit rows for these disposable projects.
  await pool.query(
    `delete from project_resource_audit
     where project_id in (
       select id from project_instances
       where slug like 'adv-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'adv-%'",
  );
  // DB070 immutable template fixture retention -- L06. A permanent
  // template version is never removed by a disposable test teardown.
  // DB071 version-pointer FKs also require retaining template headers.
  const retention=await pool.query<{retainHistory:boolean}>(
    "select (exists (select 1 from pg_trigger " +
      "where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' " +
      "and tgenabled='O' and not tgisinternal) " +
      "or exists (select 1 from pg_constraint " +
      "where conrelid='project_templates'::regclass " +
      "and conname in ('project_templates_current_version_snapshot_fk', " +
      "'project_templates_published_version_snapshot_fk'))) as \"retainHistory\"",
  );
  if(!retention.rows[0]?.retainHistory){
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
  }
  await pool.query(
    "delete from membership_roles where membership_id = $1",
    [outsiderIds.membership],
  );
  await pool.query(
    "delete from college_memberships where id = $1",
    [outsiderIds.membership],
  );
  await pool.query(
    "delete from in_app_notifications where user_id = $1",
    [outsiderIds.user],
  );
  await pool.query(
    "delete from activity_events where actor_user_id = $1",
    [outsiderIds.user],
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
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "adv-template-"+suffix,
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

  it("archives projects idempotently for admins and blocks learner/lifecycle mutation", async () => {
    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "archive",
    );

    await expect(
      archiveProjectInstance(
        learner,
        project.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_ACCESS_DENIED",
    });

    const first = await archiveProjectInstance(
      collegeAdmin,
      project.id,
    );
    expect(first.status).toBe("ARCHIVED");
    expect(first.archivedAt).not.toBeNull();

    const second = await archiveProjectInstance(
      collegeAdmin,
      project.id,
    );
    expect(second.status).toBe("ARCHIVED");
    expect(second.archivedAt?.getTime()).toBe(
      first.archivedAt?.getTime(),
    );

    const archiveEvents = await pool.query<{
      event_type: string;
    }>(
      `select event_type
         from activity_events
        where subject_id = $1
          and event_type = 'projects.project.archived'`,
      [project.id],
    );
    expect(archiveEvents.rows).toEqual([
      { event_type: "projects.project.archived" },
    ]);

    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    await expect(
      startProjectSprint(
        mentor,
        project.id,
        workspace.sprints[0]!.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_SPRINT_INVALID_STATE",
    });
  });

  it("restores a row archived with PostgreSQL microseconds using the client millisecond token",async()=>{
    const templateId=await createTemplate();
    const project=await createProject(templateId,"microsecond-restore");
    await archiveProjectInstance(collegeAdmin,project.id);
    await pool.query(`update project_instances
      set updated_at=date_trunc('milliseconds',now())+interval '427 microseconds'
      where id=$1`,[project.id]);
    const row=await pool.query<{updated_at:Date}>(
      "select updated_at from project_instances where id=$1",[project.id]);
    const token=row.rows[0]!.updated_at.toISOString();
    const restored=await restoreProjectInstance(collegeAdmin,project.id,{
      expectedUpdatedAt:token,
    });
    expect(restored.status).toBe("PLANNED");
    await expect(restoreProjectInstance(collegeAdmin,project.id,{
      expectedUpdatedAt:token,
    })).rejects.toMatchObject({code:"PROJECT_INVALID_STATE"});
  });

  it("reassigns the primary mentor atomically and rechecks the target role", async () => {
    const targetMentorRole =
      "76000000-0000-4000-8000-000000000004";
    await pool.query(
      `insert into membership_roles
        (id, membership_id, role)
       values ($1, $2, 'MENTOR')`,
      [
        targetMentorRole,
        outsiderIds.membership,
      ],
    );

    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "mentor-reassign",
    );

    const meeting =
      await scheduleProjectMeeting(
        mentor,
        project.id,
        null,
        {
          expectedProjectUpdatedAt:
            await projectVersion(project.id),
          title: "Outgoing mentor meeting",
          startsAt:
            "2099-10-20T10:00:00+05:30",
          endsAt:
            "2099-10-20T10:30:00+05:30",
          timeZone: "Asia/Kolkata",
          meetingUrl:
            "https://meet.example.com/reassign",
        },
      );

    const changed =
      await reassignProjectPrimaryMentor(
        collegeAdmin,
        project.id,
        outsiderIds.membership,
      );
    expect(changed.reassigned).toBe(true);
    expect(changed.outgoingMembershipId).toBe(
      SEED_IDS.facultyCollegeAMembership,
    );

    const members = await pool.query(
      `select membership_id, is_primary, ended_at
       from project_members
       where project_id = $1
       order by started_at asc`,
      [project.id],
    );
    const outgoing = members.rows.find(
      (row) =>
        row.membership_id ===
        SEED_IDS.facultyCollegeAMembership,
    );
    const incoming = members.rows.find(
      (row) =>
        row.membership_id ===
        outsiderIds.membership,
    );
    expect(outgoing?.ended_at).not.toBeNull();
    expect(outgoing?.is_primary).toBe(false);
    expect(incoming?.ended_at).toBeNull();
    expect(incoming?.is_primary).toBe(true);

    const meetingRow = await pool.query(
      `select status, cancellation_note
       from project_meetings where id = $1`,
      [meeting.id],
    );
    expect(meetingRow.rows[0]?.status).toBe(
      "CANCELLED",
    );
    expect(
      meetingRow.rows[0]?.cancellation_note,
    ).toBe("Primary mentor reassigned");

    const noOp =
      await reassignProjectPrimaryMentor(
        collegeAdmin,
        project.id,
        outsiderIds.membership,
      );
    expect(noOp.skipped).toBe(true);

    const reassignEvents = await pool.query<{
      event_type: string;
    }>(
      `select event_type
         from activity_events
        where subject_id = $1
          and event_type = 'projects.mentor.reassigned'`,
      [project.id],
    );
    expect(reassignEvents.rows).toEqual([
      { event_type: "projects.mentor.reassigned" },
    ]);

    await pool.query(
      `delete from membership_roles
       where id = $1`,
      [targetMentorRole],
    );

    await expect(
      reassignProjectPrimaryMentor(
        collegeAdmin,
        project.id,
        outsiderIds.membership,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_MEMBER_ROLE_REQUIRED",
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
          expectedProjectUpdatedAt:
            await projectVersion(projectA.id),
          title: "Cross-project task injection",
          startsAt:
            "2099-10-20T10:00:00+05:30",
          endsAt:
            "2099-10-20T10:30:00+05:30",
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

    // Learners may add plain team resources, but only to an ACTIVE project.
    await expect(
      createProjectResource(
        learner,
        project.id,
        {
          title: "Premature resource",
          url: "https://example.com/no",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_RESOURCE_INVALID_STATE",
    });

    // Required or mentor-only resources stay mentor/admin privileges.
    await expect(
      createProjectResource(
        learner,
        project.id,
        {
          title: "Escalated resource",
          url: "https://example.com/no",
          required: true,
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_ACCESS_DENIED",
    });
    await expect(
      createProjectResource(
        learner,
        project.id,
        {
          title: "Hidden resource",
          url: "https://example.com/no",
          visibility: "MENTOR_ONLY",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_ACCESS_DENIED",
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
    await approveProjectTaskThroughReview({learner,mentor,projectId:project.id,taskId:task.id});

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

  it("serializes concurrent resource sequence allocation", async () => {
    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "resource-race",
    );

    const results = await Promise.all([
      createProjectResource(
        mentor,
        project.id,
        {
          title: "Concurrent resource A",
          url: "https://example.com/resource-a",
        },
      ),
      createProjectResource(
        mentor,
        project.id,
        {
          title: "Concurrent resource B",
          url: "https://example.com/resource-b",
        },
      ),
    ]);

    expect(
      results.map((row) => row.sequence).sort((a, b) => a - b),
    ).toEqual([0, 1]);
  });

  it("allows only one concurrent task submission to win", async () => {
    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "task-submit-race",
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

    // A member of the team is not automatically assigned a task.
    await expect(submitProjectTask(learner,project.id,task.id,{
      submissionUrl:"https://example.com/unassigned-task",
    })).rejects.toMatchObject({code:"PROJECT_TASK_SUBMISSION_ACCESS_DENIED"});
    await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});

    const outcomes = await Promise.allSettled([
      submitProjectTask(
        learner,
        project.id,
        task.id,
        {
          submissionUrl:
            "https://example.com/task-submit-a",
        },
      ),
      submitProjectTask(
        learner,
        project.id,
        task.id,
        {
          submissionUrl:
            "https://example.com/task-submit-b",
        },
      ),
    ]);

    expect(
      outcomes.filter(
        (result) => result.status === "fulfilled",
      ),
    ).toHaveLength(1);
    expect(
      outcomes.filter(
        (result) => result.status === "rejected",
      ),
    ).toHaveLength(1);

    const rows = await pool.query(
      `select version, status
         from project_task_submissions
        where project_id = $1
          and task_id = $2`,
      [project.id, task.id],
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toMatchObject({
      version: 1,
      status: "SUBMITTED",
    });
  });

  it("serializes final delivery draft and evaluation creation", async () => {
    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "delivery-race",
    );
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
    await approveProjectTaskThroughReview({learner,mentor,projectId:project.id,taskId:task.id});
    await completeProjectSprint(
      mentor,
      project.id,
      sprint.id,
    );
    await shipProjectRelease(
      mentor,
      project.id,
      release.id,
      await releaseVersion(release.id),
    );

    const draftOutcomes =
      await Promise.allSettled([
        createProjectSubmissionDraft(
          learner,
          project.id,
          {
            summary: "Concurrent final A",
            sourceUrl:
              "https://example.com/final-a",
          },
        ),
        createProjectSubmissionDraft(
          learner,
          project.id,
          {
            summary: "Concurrent final B",
            sourceUrl:
              "https://example.com/final-b",
          },
        ),
      ]);

    const created = draftOutcomes.find(
      (result) => result.status === "fulfilled",
    );
    expect(created?.status).toBe("fulfilled");
    expect(
      draftOutcomes.filter(
        (result) => result.status === "fulfilled",
      ),
    ).toHaveLength(1);

    if (!created || created.status !== "fulfilled") {
      throw new Error("Expected one final draft");
    }

    const submitted =
      await submitProjectSubmission(
        learner,
        project.id,
        created.value.id,
        {expectedUpdatedAt:created.value.updatedAt.toISOString()},
      );
    await reviewProjectSubmission(
      mentor,
      project.id,
      submitted.id,
      { decision: "APPROVED" },
    );

    const evaluationInput = {
      summary: "Concurrent evaluation",
      items: [
        {
          criterion: "Delivery",
          score: 9,
          maxScore: 10,
        },
      ],
    };
    const evaluationOutcomes =
      await Promise.allSettled([
        createProjectEvaluation(
          mentor,
          project.id,
          submitted.id,
          evaluationInput,
        ),
        createProjectEvaluation(
          mentor,
          project.id,
          submitted.id,
          evaluationInput,
        ),
      ]);

    expect(
      evaluationOutcomes.filter(
        (result) => result.status === "fulfilled",
      ),
    ).toHaveLength(1);
    expect(
      evaluationOutcomes.filter(
        (result) => result.status === "rejected",
      ),
    ).toHaveLength(1);

    const evaluations = await pool.query(
      `select id from project_evaluations
        where project_id = $1
          and submission_id = $2`,
      [project.id, submitted.id],
    );
    expect(evaluations.rows).toHaveLength(1);
  });


  it("does not flag a project stalled when nested project activity is recent", async () => {
    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "nested-activity",
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

    await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:workspace.tasks[0]!.id});

    await pool.query(
      `update project_instances
          set updated_at = now() - interval '8 days'
        where id = $1`,
      [project.id],
    );

    await submitProjectTask(
      learner,
      project.id,
      workspace.tasks[0]!.id,
      {
        submissionUrl:
          "https://example.com/recent-task-activity",
      },
    );

    const alerts =
      await listMyMentorProjectAttention(
        mentor,
        new Date(),
      );
    expect(
      alerts.some(
        (alert) =>
          alert.projectId === project.id &&
          alert.kind === "STALLED",
      ),
    ).toBe(false);
  });


  it("uses recent meeting persistence as project activity even without a shared activity event", async () => {
    const templateId = await createTemplate();
    const project = await createProject(
      templateId,
      "meeting-activity",
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
    await pool.query(
      `update project_instances
          set updated_at = now() - interval '8 days'
        where id = $1`,
      [project.id],
    );

    await scheduleProjectMeeting(
      mentor,
      project.id,
      null,
      {
        expectedProjectUpdatedAt:
          await projectVersion(project.id),
        title: "Recent planning touchpoint",
        startsAt:
          "2099-11-01T10:00:00+05:30",
        endsAt:
          "2099-11-01T10:30:00+05:30",
        timeZone: "Asia/Kolkata",
        meetingUrl:
          "https://meet.example.com/recent-activity",
      },
    );

    const alerts =
      await listMyMentorProjectAttention(
        mentor,
        new Date(),
      );
    expect(
      alerts.some(
        (alert) =>
          alert.projectId === project.id &&
          alert.kind === "STALLED",
      ),
    ).toBe(false);
  });

});
