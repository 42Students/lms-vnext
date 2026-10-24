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
import {approveProjectTaskThroughReview,assignProjectTaskToLearner} from "./support/projects-review-fixture";
import {updateProjectTaskStatusInputSchema} from "@/modules/projects/validation";
import {listMentorSprintSignOffSnapshots} from "@/modules/projects/mentor-sprint-signoff-snapshot-service";
import {updateMentorTaskDetails} from "@/modules/projects/mentor-task-details-service";
import {createLearnerOwnTask,deleteLearnerOwnTask} from "@/modules/projects/learner-own-task-service";
import {createProjectResource} from "@/modules/projects/resource-service";
import {postProjectTaskComment,listProjectTaskComments} from "@/modules/projects/task-comment-service";

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
  // LEARNER-projects-26/33: notifications reference activity events; remove
  // these before deleting project tasks, members and template fixtures.
  const scopedEvents=`select id from activity_events where
    metadata->>'projectId' in (select id::text from project_instances where slug like 'p5-%')
    or group_key in (select 'project:'||id::text from project_instances where slug like 'p5-%')`;
  await pool.query(`delete from in_app_notifications where event_id in (${scopedEvents})`);
  await pool.query(`delete from activity_events where id in (${scopedEvents})`);
  for (const table of ["project_task_comments", "project_submission_reviews", "project_task_submissions", "project_submissions", "project_evaluations", "project_delivery_events", "project_meeting_history", "project_meetings", "project_resource_files"]) {
    await pool.query(`delete from ${table} where project_id in (select id from project_instances where slug like 'p5-%')`);
  }
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
  // Trigger-written resource audit rows for these disposable projects.
  await pool.query(
    `delete from project_resource_audit
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

  it("matches PostgreSQL microseconds for assignment and task-status CAS, but rejects stale tokens", async () => {
    const project=await createProject();
    const workspace=await getProjectInstanceWorkspace(mentor,project.id);
    const task=workspace.tasks[0]!;
    const sprint=workspace.sprints.find(row=>row.id===task.sprintId)!;
    await startProjectSprint(mentor,project.id,sprint.id);
    // Date truncation must accept the millisecond client token even when
    // PostgreSQL stores 427 additional microseconds.
    await pool.query(`update project_tasks
        set updated_at = date_trunc('milliseconds', now()) + interval '427 microseconds'
        where id = $1 and project_id = $2`,[task.id,project.id]);
    const fresh=await getProjectInstanceWorkspace(mentor,project.id);
    const unassigned=fresh.tasks.find(row=>row.id===task.id)!;
    const assigned=await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
    expect(assigned.assigneeMembershipId).toBe(learner.membership!.id);
    const changed=await updateProjectTaskStatus(mentor,project.id,task.id,{
      status:"IN_PROGRESS",expectedUpdatedAt:assigned.updatedAt.toISOString(),
    });
    expect(changed.status).toBe("IN_PROGRESS");
    await expect(updateProjectTaskStatus(mentor,project.id,task.id,{
      status:"BLOCKED",expectedUpdatedAt:unassigned.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
  });

  it("persists registered 0090 task metadata and tenant-scoped append-only comments",async()=>{
    const project=await createProject();
    const workspace=await getProjectInstanceWorkspace(mentor,project.id);
    const task=workspace.tasks[0]!;
    const changed=await updateMentorTaskDetails(mentor,{projectId:project.id,taskId:task.id},{
      title:task.title,description:task.description,acceptanceCriteria:task.acceptanceCriteria,
      priority:task.priority,expectedUpdatedAt:task.updatedAt.toISOString(),
      taskType:"BUG",estimatePoints:5,dueDate:"2026-11-15",blockerReason:"Waiting for review",
    });
    expect(changed).toMatchObject({taskType:"BUG",estimatePoints:5,blockerReason:"Waiting for review"});
    const comment=await postProjectTaskComment(learner,project.id,task.id,{
      body:"Investigating the repro steps",expectedTaskUpdatedAt:changed.updatedAt.toISOString(),
    });
    const history=await listProjectTaskComments(learner,project.id,task.id);
    expect(history.map(row=>row.id)).toContain(comment.id);
    const dbRows=await pool.query<{task_type:string;estimate_points:number;due_date:string}>(
      "select task_type,estimate_points,due_date::text as due_date from project_tasks where id=$1",
      [task.id],
    );
    expect(dbRows.rows[0]).toEqual({task_type:"BUG",estimate_points:5,due_date:"2026-11-15"});
    await expect(postProjectTaskComment(learner,project.id,task.id,{
      body:"Stale comment version",expectedTaskUpdatedAt:task.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
  });

  it("reserves IN_REVIEW and DONE for submissions and completes the sprint once its task is approved", async () => {
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

    // Direct IN_REVIEW and DONE writes are not part of the task-status API.
    for (const status of ["IN_REVIEW","DONE"]) {
      expect(updateProjectTaskStatusInputSchema.safeParse({
        status,expectedUpdatedAt:firstTask.updatedAt.toISOString(),
      }).success).toBe(false);
    }

    const reviewed=await approveProjectTaskThroughReview({
      learner,mentor,projectId:project.id,taskId:firstTask.id,
    });
    expect(reviewed.review.submission.status).toBe("APPROVED");

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

  it("carries unfinished tasks to the product backlog when a sprint is completed", async () => {
    const project = await createProject();
    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    const sprint = workspace.sprints[0]!;
    const openTask = workspace.tasks.find(
      (task) => task.sprintId === sprint.id,
    )!;

    await startProjectSprint(mentor, project.id, sprint.id);
    await expect(
      completeProjectSprint(mentor, project.id, sprint.id),
    ).resolves.toMatchObject({ status: "COMPLETED" });

    const carried = await pool.query<{
      sprint_id: string | null;
      carried_from_sprint_id: string | null;
    }>(
      "select sprint_id, carried_from_sprint_id from project_tasks where id=$1",
      [openTask.id],
    );
    expect(carried.rows[0]).toEqual({
      sprint_id: null,
      carried_from_sprint_id: sprint.id,
    });
    const saved=await listMentorSprintSignOffSnapshots(mentor,project.id,[sprint.id]);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({version:1,sprintId:sprint.id,taskCount:1,
      memberRows:[{taskCount:1,doneCount:0,openCount:1}]});
  });

  it("keeps active sprint and history untouched on stale carry decision",async()=>{
    const project=await createProject();
    const workspace=await getProjectInstanceWorkspace(mentor,project.id);
    const first=workspace.sprints[0]!;
    const next=workspace.sprints[1]!;
    const open=workspace.tasks.find(task=>task.sprintId===first.id)!;
    await startProjectSprint(mentor,project.id,first.id);
    await expect(completeProjectSprint(mentor,project.id,first.id,undefined,[{
      taskId:open.id,destination:"NEXT",expectedUpdatedAt:"2000-01-01T00:00:00.000Z",
    }],next.id)).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    const stored=await pool.query<{status:string}>(
      "select status from project_sprints where id=$1",[first.id]);
    expect(stored.rows[0]?.status).toBe("ACTIVE");
    const taskRow=await pool.query<{sprint_id:string|null}>(
      "select sprint_id from project_tasks where id=$1",[open.id]);
    expect(taskRow.rows[0]?.sprint_id).toBe(first.id);
    expect(await listMentorSprintSignOffSnapshots(mentor,project.id,[first.id]))
      .toEqual([]);
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
        {expectedUpdatedAt:release.updatedAt.toISOString()},
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
        await approveProjectTaskThroughReview({learner,mentor,projectId:project.id,taskId:task.id});
      }

      await completeProjectSprint(
        mentor,
        project.id,
        sprint.id,
      );
    }

    const afterSprints=await getProjectInstanceWorkspace(mentor,project.id);
    const currentRelease=afterSprints.releases.find(row=>row.id===release.id)!;
    await expect(
      shipProjectRelease(
        mentor,
        project.id,
        release.id,
        {expectedUpdatedAt:currentRelease.updatedAt.toISOString()},
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
    expect(row?.status).toBe("ACTIVE");
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
        await approveProjectTaskThroughReview({learner,mentor,projectId:project.id,taskId:task.id});
      }
      await completeProjectSprint(
        mentor,
        project.id,
        sprint.id,
      );
    }

    const ready=await getProjectInstanceWorkspace(mentor,project.id);
    const currentRelease=ready.releases.find(row=>row.id===release.id)!;
    const shipped=await shipProjectRelease(
      mentor,
      project.id,
      release.id,
      {expectedUpdatedAt:currentRelease.updatedAt.toISOString()},
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

    const unshipped=await unshipProjectRelease(
      mentor,
      project.id,
      release.id,
      {expectedUpdatedAt:shipped.updatedAt.toISOString()},
    );
    expect(unshipped).toMatchObject({
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

    // Reopening the sprint advances the release version. Read the new token
    // so this assertion checks the open-sprint guard, not stale-write CAS.
    const reopenedWorkspace = await getProjectInstanceWorkspace(mentor, project.id);
    const reopenedRelease = reopenedWorkspace.releases.find(row => row.id === release.id)!;
    await expect(
      shipProjectRelease(
        mentor,
        project.id,
        release.id,
        {expectedUpdatedAt:reopenedRelease.updatedAt.toISOString()},
      ),
    ).rejects.toMatchObject({
      // Un-shipping permits sprint reopening, but shipping still requires
      // every sprint to be completed. Report the precise open-sprint guard.
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
  it("LEARNER-projects-26 allows own backlog task and denies deleting another member's task",async()=>{
    const project=await createProject();
    const workspace=await getProjectInstanceWorkspace(mentor,project.id);
    await startProjectSprint(mentor,project.id,workspace.sprints[0]!.id);
    const task=await createLearnerOwnTask(learner,{projectId:project.id},{
      sprintId:null,title:"Learner backlog task",description:null,approach:"Outline the demo",
      acceptanceCriteria:"Mentor can review",priority:"MEDIUM",status:"TODO",
      blockerReason:null,dueDate:null,estimatePoints:2,taskType:"CHORE",
      expectedSprintUpdatedAt:null,
    });
    expect(task.sprintId).toBeNull();
    expect(task.assigneeMembershipId).toBe(learner.membership!.id);
    expect(task.approach).toBe("Outline the demo");
    await expect(deleteLearnerOwnTask(mentor,{projectId:project.id},task.id))
      .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    await expect(deleteLearnerOwnTask(learner,{projectId:project.id},task.id))
      .resolves.toMatchObject({deleted:true});
  },45000);

  it("LEARNER-projects-33 shares team-visible resources but denies learner mentor-only visibility",async()=>{
    const project=await createProject();
    const workspace=await getProjectInstanceWorkspace(mentor,project.id);
    await startProjectSprint(mentor,project.id,workspace.sprints[0]!.id);
    const resource=await createProjectResource(learner,project.id,{
      title:"Team reference",description:"Shared resource",
      url:"https://example.com/learner-resource",required:false,visibility:"TEAM",
    });
    expect(resource.projectId).toBe(project.id);
    expect(resource.visibility).toBe("TEAM");
    await expect(createProjectResource(learner,project.id,{
      title:"Hidden resource",description:"Should fail",
      url:"https://example.com/private",required:false,visibility:"MENTOR_ONLY",
    })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  },45000);

});
