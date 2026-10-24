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
import {submitProjectTask} from "@/modules/projects/task-submission-service";
import {updateProjectTaskStatusInputSchema} from "@/modules/projects/validation";
import {listMentorSprintSignOffSnapshots,listMentorSprintCommitmentSnapshots} from "@/modules/projects/mentor-sprint-signoff-snapshot-service";
import {updateMentorTaskDetails} from "@/modules/projects/mentor-task-details-service";
import {moveMentorBacklogTask} from "@/modules/projects/mentor-backlog-service";
import {createLearnerOwnTask,deleteLearnerOwnTask} from "@/modules/projects/learner-own-task-service";
import {createProjectResource} from "@/modules/projects/resource-service";
import {postProjectTaskComment,listProjectTaskComments} from "@/modules/projects/task-comment-service";
import {autoAssignMentorNextSprint} from "@/modules/projects/mentor-auto-assign-service";
import {transitionMentorProjectSprint} from "@/modules/projects/mentor-sprint-write-service";

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

async function createProject(plan=blueprint()) {
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "p5-lifecycle-template",
      title: "P5 Lifecycle Template",
      blueprint: plan,
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
  it("denies starting a Sprint within a shipped release even while the project is PLANNED",async()=>{
    const project=await createProject();
    const ws=await getProjectInstanceWorkspace(mentor,project.id);
    const sprint=ws.sprints[0]!,release=ws.releases[0]!;
    await pool.query("update project_releases set status='SHIPPED' where id=$1",
      [release.id]);
    await expect(startProjectSprint(mentor,project.id,sprint.id))
      .rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    const state=await pool.query<{status:string}>(
      "select status from project_sprints where id=$1",[sprint.id]);
    expect(state.rows[0]?.status).toBe("PLANNED");
  });

  it("rejects Sprint start and task-state updates after a soft-deleted project",async()=>{
    const project=await createProject();
    const ws=await getProjectInstanceWorkspace(mentor,project.id);
    const first=ws.sprints[0]!,task=ws.tasks.find(row=>row.sprintId===first.id)!;
    await pool.query("update project_instances set deleted_at=now() where id=$1",
      [project.id]);
    await expect(startProjectSprint(mentor,project.id,first.id)).rejects.toBeDefined();
    const saved=await pool.query<{status:string}>(
      "select status from project_sprints where id=$1",[first.id]);
    expect(saved.rows[0]?.status).toBe("PLANNED");
    await pool.query("update project_instances set deleted_at=null where id=$1",[project.id]);
    await startProjectSprint(mentor,project.id,first.id);
    await pool.query("update project_instances set deleted_at=now() where id=$1",
      [project.id]);
    await expect(updateProjectTaskStatus(mentor,project.id,task.id,{
      status:"IN_PROGRESS",expectedUpdatedAt:task.updatedAt.toISOString(),
    })).rejects.toBeDefined();
    const state=await pool.query<{status:string}>(
      "select status from project_tasks where id=$1",[task.id]);
    expect(state.rows[0]?.status).toBe(task.status);
  });

  it("rejects reopening a completed Sprint after soft deletion with no task rewrite",async()=>{
    const project=await createProject();
    const ws=await getProjectInstanceWorkspace(mentor,project.id);
    const sprint=ws.sprints[0]!;
    const task=ws.tasks.find(row=>row.sprintId===sprint.id)!;
    await startProjectSprint(mentor,project.id,sprint.id);
    await completeProjectSprint(mentor,project.id,sprint.id,undefined,[{
      taskId:task.id,destination:"BACKLOG",
      expectedUpdatedAt:task.updatedAt.toISOString(),
    }]);
    await pool.query("update project_instances set deleted_at=now() where id=$1",
      [project.id]);
    await expect(reopenProjectSprint(mentor,project.id,sprint.id)).rejects.toBeDefined();
    const current=await pool.query<{status:string}>(
      "select status from project_sprints where id=$1",[sprint.id]);
    expect(current.rows[0]?.status).toBe("COMPLETED");
  });

  it("stores immutable release shipment revisions and rejects stale ship replay",async()=>{
    const project=await createProject();
    const ws=await getProjectInstanceWorkspace(mentor,project.id);
    const [first,second]=ws.sprints;
    const release=ws.releases[0]!;
    await startProjectSprint(mentor,project.id,first!.id);
    await completeProjectSprint(mentor,project.id,first!.id);
    await startProjectSprint(mentor,project.id,second!.id);
    await completeProjectSprint(mentor,project.id,second!.id);
    const original=await pool.query<{updated_at:Date;version:number}>(
      "select updated_at,version from project_releases where id=$1",[release.id]);
    const firstVersion=original.rows[0]!;
    const shipped=await shipProjectRelease(mentor,project.id,release.id,{
      expectedUpdatedAt:firstVersion.updated_at.toISOString(),
    });
    expect(shipped.status).toBe("SHIPPED");
    expect(shipped.version).toBe(firstVersion.version+1);
    await expect(shipProjectRelease(mentor,project.id,release.id,{
      expectedUpdatedAt:firstVersion.updated_at.toISOString(),
    })).rejects.toBeDefined();
    const unshipped=await unshipProjectRelease(mentor,project.id,release.id,{
      expectedUpdatedAt:shipped.updatedAt.toISOString(),
    });
    expect(unshipped.status).toBe("IN_PROGRESS");
    expect(unshipped.version).toBe(shipped.version+1);
    const events=await pool.query<{change:string;from_status:string;
      to_status:string;version:number}>(`
      select metadata->>'change' as change,metadata->>'from' as from_status,
        metadata->>'to' as to_status,(metadata->>'version')::int as version
      from activity_events where subject_id=$1
        and event_type='projects.release.updated'
      order by occurred_at,id
    `,[release.id]);
    expect(events.rows).toEqual([
      {change:"SHIPPED",from_status:"IN_PROGRESS",to_status:"SHIPPED",version:shipped.version},
      {change:"UNSHIPPED",from_status:"SHIPPED",to_status:"IN_PROGRESS",version:unshipped.version},
    ]);
  });

  it.each(["NEXT","BACKLOG","DROP"] as const)(
    "reopens a signed-off sprint and atomically undoes untouched %s dispositions",
    async(destination)=>{
      const project=await createProject();
      const initial=await getProjectInstanceWorkspace(mentor,project.id);
      const source=initial.sprints[0]!;
      const next=initial.sprints[1]!;
      await startProjectSprint(mentor,project.id,source.id);
      const opened=await getProjectInstanceWorkspace(mentor,project.id);
      const task=opened.tasks.find(item=>item.sprintId===source.id)!;
      const beforeSequence=task.sequence;
      await completeProjectSprint(mentor,project.id,source.id,
        "Team can review carry",[{taskId:task.id,destination,
          expectedUpdatedAt:task.updatedAt.toISOString()}],
        destination==="NEXT"?next.id:undefined);
      const after=await getProjectInstanceWorkspace(mentor,project.id);
      const completed=after.sprints.find(row=>row.id===source.id)!;
      expect(completed.status).toBe("COMPLETED");
      const outcome=await transitionMentorProjectSprint(mentor,{
        projectId:project.id,sprintId:source.id,
      },{
        action:"REOPEN",expectedUpdatedAt:completed.updatedAt.toISOString(),
        restoreCarry:true,
      });
      expect(outcome.status).toBe("ACTIVE");
      const restored=await pool.query<{
        sprint_id:string|null;sequence:number;deleted_at:Date|null;
        carried_from_sprint_id:string|null;
      }>("select sprint_id,sequence,deleted_at,carried_from_sprint_id from project_tasks where id=$1",
        [task.id]);
      expect(restored.rows[0]).toMatchObject({
        sprint_id:source.id,sequence:beforeSequence,
        deleted_at:null,
      });
      const audit=await pool.query<{carry_undo:boolean;restored_task_count:number}>(`
        select (metadata->>'carryUndo')::boolean as carry_undo,
          (metadata->>'restoredTaskCount')::integer as restored_task_count
        from activity_events where subject_id=$1
          and metadata->>'action'='REOPEN' order by occurred_at desc limit 1
      `,[source.id]);
      expect(audit.rows[0]).toEqual({carry_undo:true,restored_task_count:1});
    },
  );

  it("refuses undo when a carried task changed after the original sign-off",async()=>{
    const project=await createProject();
    const initial=await getProjectInstanceWorkspace(mentor,project.id);
    const source=initial.sprints[0]!,next=initial.sprints[1]!;
    await startProjectSprint(mentor,project.id,source.id);
    const opened=await getProjectInstanceWorkspace(mentor,project.id);
    const task=opened.tasks.find(item=>item.sprintId===source.id)!;
    await completeProjectSprint(mentor,project.id,source.id,undefined,[{
      taskId:task.id,destination:"NEXT",
      expectedUpdatedAt:task.updatedAt.toISOString(),
    }],next.id);
    const committed=await getProjectInstanceWorkspace(mentor,project.id);
    const completed=committed.sprints.find(item=>item.id===source.id)!;
    await pool.query(`update project_tasks
      set updated_at=updated_at+interval '1 minute' where id=$1`,[task.id]);
    await expect(transitionMentorProjectSprint(mentor,{
      projectId:project.id,sprintId:source.id,
    },{
      action:"REOPEN",expectedUpdatedAt:completed.updatedAt.toISOString(),
      restoreCarry:true,
    })).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    const persisted=await pool.query<{status:string}>(
      "select status from project_sprints where id=$1",[source.id]);
    expect(persisted.rows[0]?.status).toBe("COMPLETED");
    const carried=await pool.query<{sprint_id:string|null}>(
      "select sprint_id from project_tasks where id=$1",[task.id]);
    expect(carried.rows[0]?.sprint_id).toBe(next.id);
  });

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

  it("allocates only the immediate planned sprint and records current learner assignments",async()=>{
    const project=await createProject();
    const initial=await getProjectInstanceWorkspace(mentor,project.id);
    const current=initial.sprints[0]!;
    const next=initial.sprints[1]!;
    await startProjectSprint(mentor,project.id,current.id);
    const refreshed=await getProjectInstanceWorkspace(mentor,project.id);
    const target=refreshed.sprints.find(item=>item.id===next.id)!;
    const expectedSprintUpdatedAt=target.updatedAt.toISOString();
    const payload={sprintId:next.id,expectedSprintUpdatedAt};
    await expect(autoAssignMentorNextSprint(learner,project.id,payload))
      .rejects.toBeDefined();
    const assigned=await autoAssignMentorNextSprint(mentor,project.id,payload);
    expect(assigned).toMatchObject({
      sprintId:next.id,assigned:1,unassignedRemaining:0,
    });
    expect(assigned.assignments[0]?.membershipId).toBe(learner.membership!.id);
    expect(assigned.loadPreview).toHaveLength(1);
    const after=await getProjectInstanceWorkspace(mentor,project.id);
    expect(after.tasks.find(item=>item.sprintId===next.id)?.assigneeMembershipId)
      .toBe(learner.membership!.id);
    expect(after.tasks.find(item=>item.sprintId===current.id)?.assigneeMembershipId)
      .toBeNull();
    const receipt=await pool.query<{recipient_id:string}>(`
      select user_id as recipient_id from in_app_notifications n
      join activity_events e on e.id=n.event_id
      where e.group_key=$1 and e.summary='Next-sprint task auto-assigned'`,
      ["project:"+project.id]);
    expect(receipt.rows.map(row=>row.recipient_id)).toContain(learner.user.id);
    const repeat=await autoAssignMentorNextSprint(mentor,project.id,payload);
    expect(repeat.assigned).toBe(0);
    const foreign:RequestContext={...mentor,membership:{
      ...mentor.membership!,collegeId:SEED_IDS.collegeB,
    }};
    await expect(autoAssignMentorNextSprint(foreign,project.id,payload))
      .rejects.toBeDefined();
    await expect(autoAssignMentorNextSprint(mentor,project.id,{
      sprintId:next.id,expectedSprintUpdatedAt:"2020-01-01T00:00:00Z",
    })).rejects.toBeDefined();
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

  it("moves an open Board task between sprints and backlog with version checks",async()=>{
    const project=await createProject();
    const workspace=await getProjectInstanceWorkspace(mentor,project.id);
    const from=workspace.sprints[0]!;
    const to=workspace.sprints[1]!;
    const task=workspace.tasks.find(item=>item.sprintId===from.id)!;
    await startProjectSprint(mentor,project.id,from.id);
    const commitmentBefore=await listMentorSprintCommitmentSnapshots(
      mentor,project.id,[from.id]);
    expect(commitmentBefore).toHaveLength(1);
    expect(commitmentBefore[0]).toMatchObject({
      sprintId:from.id,version:1,taskCount:1,
    });
    await expect(moveMentorBacklogTask(learner,project.id,{
      taskId:task.id,targetSprintId:to.id,
      expectedUpdatedAt:task.updatedAt.toISOString(),
    })).rejects.toBeDefined();
    const moved=await moveMentorBacklogTask(mentor,project.id,{
      taskId:task.id,targetSprintId:to.id,
      expectedUpdatedAt:task.updatedAt.toISOString(),
    });
    expect(moved.task.sprintId).toBe(to.id);
    // Direct Sprint A -> Sprint B must record the origin before any
    // intermediate backlog move, or historical carry signals become false.
    expect(moved.task.carriedFromSprintId).toBe(from.id);
    expect(moved.task.carriedOverAt).toBeInstanceOf(Date);
    const provenance=await pool.query<{carried_from_sprint_id:string|null;
      carried_over_at:Date|null}>(`
        select carried_from_sprint_id,carried_over_at
        from project_tasks where id=$1`,[task.id]);
    expect(provenance.rows[0]?.carried_from_sprint_id).toBe(from.id);
    expect(provenance.rows[0]?.carried_over_at).not.toBeNull();
    await expect(moveMentorBacklogTask(mentor,project.id,{
      taskId:task.id,targetSprintId:null,
      expectedUpdatedAt:task.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
    const back=await moveMentorBacklogTask(mentor,project.id,{
      taskId:task.id,targetSprintId:null,
      expectedUpdatedAt:moved.task.updatedAt.toISOString(),
    });
    expect(back.task.sprintId).toBeNull();
    expect(back.task.carriedFromSprintId).toBe(to.id);
    expect(await listMentorSprintCommitmentSnapshots(mentor,project.id,[from.id]))
      .toEqual(commitmentBefore);
    const stored=await pool.query<{sprint_id:string|null;carried_from_sprint_id:string|null}>(
      "select sprint_id,carried_from_sprint_id from project_tasks where id=$1",[task.id]);
    expect(stored.rows[0]).toEqual({sprint_id:null,carried_from_sprint_id:to.id});
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

  it("rejects pending learner review on both explicit and legacy sprint sign-off",async()=>{
    const project=await createProject();
    const original=await getProjectInstanceWorkspace(mentor,project.id);
    const sprint=original.sprints[0]!;
    const task=original.tasks.find(row=>row.sprintId===sprint.id)!;
    await startProjectSprint(mentor,project.id,sprint.id);
    await assignProjectTaskToLearner({
      learner,mentor,projectId:project.id,taskId:task.id,
    });
    await submitProjectTask(learner,project.id,task.id,{
      submissionUrl:"https://example.com/pending-review",
    });
    const fresh=await getProjectInstanceWorkspace(mentor,project.id);
    const pending=fresh.tasks.find(row=>row.id===task.id)!;
    expect(pending.status).toBe("IN_REVIEW");
    await expect(completeProjectSprint(
      mentor,project.id,sprint.id,undefined,[{
        taskId:pending.id,destination:"BACKLOG",
        expectedUpdatedAt:pending.updatedAt.toISOString(),
      }],
    )).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    // An older client omitting decisions must not bypass the review gate.
    await expect(completeProjectSprint(
      mentor,project.id,sprint.id,
    )).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    const taskRow=await pool.query<{sprint_id:string|null;status:string}>(
      "select sprint_id,status from project_tasks where id=$1",[task.id]);
    expect(taskRow.rows[0]).toEqual({sprint_id:sprint.id,status:"IN_REVIEW"});
    const sprintRow=await pool.query<{status:string}>(
      "select status from project_sprints where id=$1",[sprint.id]);
    expect(sprintRow.rows[0]?.status).toBe("ACTIVE");
    expect(await listMentorSprintSignOffSnapshots(mentor,project.id,[sprint.id]))
      .toEqual([]);
  });

  it("rejects unauthorized learners and foreign-college mentors at sign-off",async()=>{
    const project=await createProject();
    const initial=await getProjectInstanceWorkspace(mentor,project.id);
    const current=initial.sprints[0]!;
    await startProjectSprint(mentor,project.id,current.id);
    await expect(completeProjectSprint(
      learner,project.id,current.id,
    )).rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
    const foreign:RequestContext={...mentor,membership:{
      ...mentor.membership!,collegeId:SEED_IDS.collegeB,
    }};
    await expect(completeProjectSprint(
      foreign,project.id,current.id,
    )).rejects.toBeDefined();
    expect(await listMentorSprintSignOffSnapshots(mentor,project.id,[current.id]))
      .toEqual([]);
    const after=await getProjectInstanceWorkspace(mentor,project.id);
    expect(after.sprints.find(row=>row.id===current.id)?.status).toBe("ACTIVE");
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

  it("can carry to the first sprint of the next release when sequence resets", async () => {
    const plan=blueprint();
    plan.releases.push({key:"release-2",title:"P5 Release Two",sequence:1});
    plan.sprints[1]={
      key:"sprint-2",releaseKey:"release-2",
      title:"P5 Sprint Two",sequence:0,
    };
    const project=await createProject(plan);
    const workspace=await getProjectInstanceWorkspace(mentor,project.id);
    const current=workspace.sprints.find(row=>
      row.releaseId===workspace.releases.find(r=>r.sequence===0)?.id)!;
    const next=workspace.sprints.find(row=>
      row.releaseId===workspace.releases.find(r=>r.sequence===1)?.id)!;
    expect(current.sequence).toBe(0);
    expect(next.sequence).toBe(0);
    await startProjectSprint(mentor,project.id,current.id);
    const fresh=await getProjectInstanceWorkspace(mentor,project.id);
    const open=fresh.tasks.find(row=>row.sprintId===current.id)!;
    await expect(completeProjectSprint(
      mentor,project.id,current.id,undefined,[{
        taskId:open.id,destination:"NEXT",
        expectedUpdatedAt:open.updatedAt.toISOString(),
      }],next.id,
    )).resolves.toMatchObject({status:"COMPLETED"});
    const after=await pool.query<{
      sprint_id:string|null;carried_from_sprint_id:string|null;
    }>("select sprint_id,carried_from_sprint_id from project_tasks where id=$1",[open.id]);
    expect(after.rows[0]).toEqual({
      sprint_id:next.id,carried_from_sprint_id:current.id,
    });
    expect(await listMentorSprintSignOffSnapshots(mentor,project.id,[current.id]))
      .toHaveLength(1);
  });

  it("retains valid sign-off history beneath corrupt newer events and after Sprint deletion",async()=>{
    const project=await createProject();
    const initial=await getProjectInstanceWorkspace(mentor,project.id);
    const current=initial.sprints[0]!,next=initial.sprints[1]!;
    await startProjectSprint(mentor,project.id,current.id);
    const opened=await getProjectInstanceWorkspace(mentor,project.id);
    const task=opened.tasks.find(row=>row.sprintId===current.id)!;
    await completeProjectSprint(mentor,project.id,current.id,undefined,[{
      taskId:task.id,destination:"NEXT",
      expectedUpdatedAt:task.updatedAt.toISOString(),
    }],next.id);
    const snapshots=await listMentorSprintSignOffSnapshots(
      mentor,project.id,[current.id]);
    expect(snapshots).toHaveLength(1);
    // A malformed newer version-tagged event cannot shadow valid history.
    const corrupt={...snapshots[0],donePoints:999999};
    await pool.query(`insert into activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,
       subject_type,subject_id,summary,metadata,occurred_at)
      values(gen_random_uuid(),$1,$2,$3,'PROJECTS','projects.sprint.updated',
       'project_sprint',$4,'Corrupt newer sign-off',
       $5::jsonb,now()+interval '1 minute')`,[
      SEED_IDS.organization,SEED_IDS.collegeA,SEED_IDS.facultyUser,current.id,
      JSON.stringify({projectId:project.id,
        mentorSignOffSnapshotVersion:1,sprintSnapshot:corrupt}),
    ]);
    expect(await listMentorSprintSignOffSnapshots(
      mentor,project.id,[current.id])).toEqual(snapshots);
    // A soft-delete is not permission to erase already-signed evidence.
    await pool.query("update project_sprints set deleted_at=now() where id=$1",
      [current.id]);
    expect(await listMentorSprintSignOffSnapshots(
      mentor,project.id,[current.id])).toEqual(snapshots);
    expect(await listMentorSprintSignOffSnapshots(
      learner,project.id,[current.id])).toEqual([]);
  });

  it("persists an explicit NEXT sign-off disposition with its pre-carry snapshot", async () => {
    const project = await createProject();
    const initial = await getProjectInstanceWorkspace(mentor, project.id);
    const current = initial.sprints[0]!;
    const next = initial.sprints[1]!;
    const moving = initial.tasks.find(task => task.sprintId === current.id)!;
    const alreadyNext = initial.tasks.find(task => task.sprintId === next.id)!;

    await startProjectSprint(mentor, project.id, current.id);
    const fresh = await getProjectInstanceWorkspace(mentor, project.id);
    const task = fresh.tasks.find(row => row.id === moving.id)!;
    const completed = await completeProjectSprint(
      mentor, project.id, current.id, "Carry this item to the next sprint", [{
        taskId: task.id, destination: "NEXT",
        expectedUpdatedAt: task.updatedAt.toISOString(),
      }], next.id,
    );
    expect(completed.status).toBe("COMPLETED");

    const rows = await pool.query<{
      sprint_id:string|null;carried_from_sprint_id:string|null;
      was_carried:boolean;was_dropped:boolean;sequence:number;
    }>(`
      select sprint_id, carried_from_sprint_id,
        carried_over_at is not null as was_carried,
        deleted_at is not null as was_dropped, sequence
      from project_tasks where id=$1 and project_id=$2
    `, [task.id, project.id]);
    expect(rows.rows[0]).toMatchObject({
      sprint_id: next.id, carried_from_sprint_id: current.id,
      was_carried: true, was_dropped: false,
    });
    expect(rows.rows[0]!.sequence).toBeGreaterThan(alreadyNext.sequence);

    const facts = await listMentorSprintSignOffSnapshots(
      mentor, project.id, [current.id],
    );
    expect(facts).toHaveLength(1);
    expect(facts[0]).toMatchObject({
      sprintId: current.id, version: 1, taskCount: 1,
      memberRows: [{taskCount: 1, doneCount: 0, openCount: 1}],
    });
    // A future reassignment or move must not rewrite the original sign-off.
    const after = await getProjectInstanceWorkspace(mentor, project.id);
    expect(after.tasks.find(row => row.id === task.id)?.sprintId).toBe(next.id);
    expect(await listMentorSprintSignOffSnapshots(mentor, project.id, [current.id]))
      .toEqual(facts);
  });

  it.each(["BACKLOG", "DROP"] as const)(
    "persists explicit %s sign-off and retains an immutable workload snapshot",
    async (destination) => {
      const project = await createProject();
      const initial = await getProjectInstanceWorkspace(mentor, project.id);
      const current = initial.sprints[0]!;
      const open = initial.tasks.find(task => task.sprintId === current.id)!;
      await startProjectSprint(mentor, project.id, current.id);
      const fresh = await getProjectInstanceWorkspace(mentor, project.id);
      const task = fresh.tasks.find(row => row.id === open.id)!;
      const completed = await completeProjectSprint(
        mentor, project.id, current.id, undefined, [{
          taskId: task.id, destination,
          expectedUpdatedAt: task.updatedAt.toISOString(),
        }],
      );
      expect(completed.status).toBe("COMPLETED");

      const rows = await pool.query<{
        sprint_id:string|null;carried_from_sprint_id:string|null;
        was_carried:boolean;was_dropped:boolean;
      }>(`
        select sprint_id, carried_from_sprint_id,
          carried_over_at is not null as was_carried,
          deleted_at is not null as was_dropped
        from project_tasks where id=$1 and project_id=$2
      `, [task.id, project.id]);
      expect(rows.rows[0]).toEqual({
        sprint_id: null, carried_from_sprint_id: current.id,
        was_carried: true, was_dropped: destination === "DROP",
      });
      const facts = await listMentorSprintSignOffSnapshots(
        mentor, project.id, [current.id],
      );
      expect(facts).toHaveLength(1);
      expect(facts[0]).toMatchObject({
        sprintId: current.id, version: 1, taskCount: 1,
        memberRows: [{taskCount: 1, doneCount: 0, openCount: 1}],
      });
    },
  );

  it("rolls back invalid NEXT, missing, and duplicate sign-off dispositions", async () => {
    const project = await createProject();
    const initial = await getProjectInstanceWorkspace(mentor, project.id);
    const current = initial.sprints[0]!;
    const next = initial.sprints[1]!;
    const open = initial.tasks.find(task => task.sprintId === current.id)!;
    await startProjectSprint(mentor, project.id, current.id);
    const fresh = await getProjectInstanceWorkspace(mentor, project.id);
    const task = fresh.tasks.find(row => row.id === open.id)!;
    const decision = {
      taskId: task.id, destination: "NEXT" as const,
      expectedUpdatedAt: task.updatedAt.toISOString(),
    };
    await expect(completeProjectSprint(
      mentor, project.id, current.id, undefined, [decision],
    )).rejects.toMatchObject({code: "PROJECT_SPRINT_INVALID_STATE"});
    await expect(completeProjectSprint(
      mentor, project.id, current.id, undefined, [decision, decision], next.id,
    )).rejects.toMatchObject({code: "PROJECT_SPRINT_INVALID_STATE"});
    await expect(completeProjectSprint(
      mentor, project.id, current.id, undefined, [], next.id,
    )).rejects.toMatchObject({code: "PROJECT_SPRINT_INVALID_STATE"});

    const sprintState = await pool.query<{status:string}>(
      "select status from project_sprints where id=$1", [current.id],
    );
    expect(sprintState.rows[0]?.status).toBe("ACTIVE");
    const taskState = await pool.query<{
      sprint_id:string|null;deleted_at:Date|null;carried_over_at:Date|null;
    }>(
      "select sprint_id,deleted_at,carried_over_at from project_tasks where id=$1",
      [task.id],
    );
    expect(taskState.rows[0]).toMatchObject({
      sprint_id: current.id, deleted_at: null, carried_over_at: null,
    });
    expect(await listMentorSprintSignOffSnapshots(mentor, project.id, [current.id]))
      .toEqual([]);
    // Rejecting bad decisions must leave a valid retry possible.
    await expect(completeProjectSprint(
      mentor, project.id, current.id, undefined, [{
        taskId: task.id, destination: "BACKLOG",
        expectedUpdatedAt: task.updatedAt.toISOString(),
      }],
    )).resolves.toMatchObject({status: "COMPLETED"});
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

  it("rejects starting a sprint on a soft-deleted project even for College Admin", async () => {
    const project = await createProject();
    const workspace = await getProjectInstanceWorkspace(mentor, project.id);
    const planned = workspace.sprints[0]!;
    await pool.query(
      "update project_instances set deleted_at=now() where id=$1",
      [project.id],
    );
    await expect(startProjectSprint(collegeAdmin, project.id, planned.id))
      .rejects.toMatchObject({code: "PROJECT_SPRINT_INVALID_STATE"});
    const persisted = await pool.query<{status:string;started_at:Date|null}>(
      "select status,started_at from project_sprints where id=$1",
      [planned.id],
    );
    expect(persisted.rows[0]).toMatchObject({status: "PLANNED", started_at: null});
  });

  it("blocks sign-off and task writes after soft deletion without partial updates", async () => {
    const project = await createProject();
    const workspace = await getProjectInstanceWorkspace(mentor, project.id);
    const current = workspace.sprints[0]!;
    const task = workspace.tasks.find(row=>row.sprintId===current.id)!;
    await startProjectSprint(mentor, project.id, current.id);
    const before = await pool.query<{status:string;updated_at:Date}>(
      "select status,updated_at from project_tasks where id=$1", [task.id],
    );
    await pool.query(
      "update project_instances set deleted_at=now() where id=$1",
      [project.id],
    );
    await expect(completeProjectSprint(collegeAdmin, project.id, current.id))
      .rejects.toMatchObject({code: "PROJECT_SPRINT_INVALID_STATE"});
    await expect(updateProjectTaskStatus(collegeAdmin, project.id, task.id, {
      status:"IN_PROGRESS",expectedUpdatedAt:task.updatedAt.toISOString(),
    })).rejects.toMatchObject({code: "PROJECT_TASK_INVALID_STATE"});
    const after = await pool.query<{status:string;updated_at:Date}>(
      "select status,updated_at from project_tasks where id=$1", [task.id],
    );
    expect(after.rows).toEqual(before.rows);
    const sprint = await pool.query<{status:string}>(
      "select status from project_sprints where id=$1", [current.id],
    );
    expect(sprint.rows[0]?.status).toBe("ACTIVE");
  });

  it("rejects reopening a signed-off sprint after project soft deletion", async () => {
    const project = await createProject();
    const initial = await getProjectInstanceWorkspace(mentor, project.id);
    const current = initial.sprints[0]!;
    await startProjectSprint(mentor, project.id, current.id);
    await approveProjectTaskThroughReview({
      learner,mentor,projectId:project.id,
      taskId:initial.tasks.find(row=>row.sprintId===current.id)!.id,
    });
    await completeProjectSprint(mentor, project.id, current.id);
    await pool.query(
      "update project_instances set deleted_at=now() where id=$1",
      [project.id],
    );
    await expect(reopenProjectSprint(collegeAdmin, project.id, current.id))
      .rejects.toMatchObject({code: "PROJECT_SPRINT_INVALID_STATE"});
    const persisted = await pool.query<{status:string}>(
      "select status from project_sprints where id=$1", [current.id],
    );
    expect(persisted.rows[0]?.status).toBe("COMPLETED");
  });

  it("denies starting a Sprint in a shipped or deleted parent release", async () => {
    const project = await createProject();
    const workspace = await getProjectInstanceWorkspace(mentor, project.id);
    const planned = workspace.sprints[0]!;
    const release = workspace.releases[0]!;
    await pool.query(
      "update project_releases set status='SHIPPED' where id=$1",
      [release.id],
    );
    await expect(startProjectSprint(collegeAdmin, project.id, planned.id))
      .rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    await pool.query(
      "update project_releases set status='PLANNED',deleted_at=now() where id=$1",
      [release.id],
    );
    await expect(startProjectSprint(collegeAdmin, project.id, planned.id))
      .rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    const after = await pool.query<{status:string}>(
      "select status from project_sprints where id=$1", [planned.id],
    );
    expect(after.rows[0]?.status).toBe("PLANNED");
  });

  it("denies reopening a signed-off Sprint in a deleted release", async () => {
    const project = await createProject();
    const workspace = await getProjectInstanceWorkspace(mentor, project.id);
    const current = workspace.sprints[0]!;
    await startProjectSprint(mentor, project.id, current.id);
    await approveProjectTaskThroughReview({
      learner,mentor,projectId:project.id,
      taskId:workspace.tasks.find(row=>row.sprintId===current.id)!.id,
    });
    await completeProjectSprint(mentor, project.id, current.id);
    await pool.query(
      "update project_releases set deleted_at=now() where id=$1",
      [workspace.releases[0]!.id],
    );
    await expect(reopenProjectSprint(collegeAdmin, project.id, current.id))
      .rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
    const persisted = await pool.query<{status:string}>(
      "select status from project_sprints where id=$1", [current.id],
    );
    expect(persisted.rows[0]?.status).toBe("COMPLETED");
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
