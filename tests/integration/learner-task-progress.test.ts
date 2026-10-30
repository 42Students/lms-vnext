import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { addProjectMember } from "@/modules/projects/member-service";
import { createProjectInstance, getProjectInstanceWorkspace } from "@/modules/projects/instance-service";
import { startProjectSprint } from "@/modules/projects/lifecycle-service";
import { updateLearnerProjectTaskProgress } from "@/modules/projects/learner-task-progress-service";
import { moveMentorBacklogTask, createMentorBacklogTask } from "@/modules/projects/mentor-backlog-service";
import {
  assignProjectTemplateToCollege, createProjectTemplate, publishProjectTemplate,
} from "@/modules/projects/template-service";
import { assignProjectTaskToLearner } from "./support/projects-review-fixture";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;

const root: RequestContext = {
  user: { id: SEED_IDS.superAdminUser, identityUid: "task-progress-root",
    platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null, adminScope: null,
};
const collegeAdmin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "task-progress-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const mentor: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "task-progress-mentor",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["FACULTY", "MENTOR"] },
};
const learner: RequestContext = {
  user: { id: SEED_IDS.learnerUser, identityUid: "task-progress-learner",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.learnerCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["LEARNER"] },
};

async function fixture() {
  const key = randomUUID().slice(0, 12);
  const made = await createProjectTemplate(root, {
    slug: "learner-progress-" + key,
    title: "Learner progress",
    blueprint: {
      overview: { goal: "Ship demo", deliverables: ["Demo"] },
      releases: [{ key: "release-1", title: "Release", sequence: 0 }],
      sprints: [{ key: "sprint-1", releaseKey: "release-1", title: "Sprint", sequence: 0 }],
      tasks: [
        { key: "task-1", sprintKey: "sprint-1", title: "First task", priority: "HIGH" as const, sequence: 0 },
        { key: "task-2", sprintKey: "sprint-1", title: "Second task", priority: "MEDIUM" as const, sequence: 1 },
        { key: "task-3", sprintKey: "sprint-1", title: "Reserved task", priority: "LOW" as const, sequence: 2 },
      ],
      resources: [],
    },
  });
  await publishProjectTemplate(root, made.template.id);
  await assignProjectTemplateToCollege({
    ...root, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA },
  }, made.template.id, SEED_IDS.collegeA);
  const project = await createProjectInstance(collegeAdmin, {
    collegeId: SEED_IDS.collegeA, templateId: made.template.id,
    title: "Learner progress " + key, slug: "learner-progress-" + key,
  });
  await addProjectMember(collegeAdmin, project.id, {
    membershipId: SEED_IDS.learnerCollegeAMembership, role: "LEARNER",
  });
  await addProjectMember(collegeAdmin, project.id, {
    membershipId: SEED_IDS.facultyCollegeAMembership, role: "MENTOR", isPrimary: true,
  });
  const workspace = await getProjectInstanceWorkspace(mentor, project.id);
  for (const task of workspace.tasks) {
    await assignProjectTaskToLearner({
      learner, mentor, projectId: project.id, taskId: task.id,
    });
  }
  await startProjectSprint(mentor, project.id, workspace.sprints[0]!.id);
  return { project, tasks: (await getProjectInstanceWorkspace(mentor, project.id)).tasks };
}

describe.skipIf(!enabled)("LEARNER-projects-25 authorized persisted task progress and ordering (PG)", () => {
  afterAll(async () => {
    await pool?.end();
    await closeDatabaseConnection();
  });
  it("starts work, reports blocker note, reorders safely, and audits changes", async () => {
    const { project, tasks } = await fixture();
    const first = tasks.find(task => task.templateKey === "task-1")!;
    const started = await updateLearnerProjectTaskProgress(learner, {
      projectId: project.id, taskId: first.id,
    }, {
      action: "STATUS", status: "IN_PROGRESS",
      expectedUpdatedAt: first.updatedAt.toISOString(),
    });
    expect(started.status).toBe("IN_PROGRESS");
    await expect(updateLearnerProjectTaskProgress(learner, {
      projectId: project.id, taskId: first.id,
    }, {
      action: "STATUS", status: "BLOCKED", blockerNote: "Dependency unavailable",
      expectedUpdatedAt: first.updatedAt.toISOString(),
    })).rejects.toMatchObject({ code: "PROJECT_TASK_INVALID_STATE" });

    const blocked = await updateLearnerProjectTaskProgress(learner, {
      projectId: project.id, taskId: first.id,
    }, {
      action: "STATUS", status: "BLOCKED", blockerNote: "Dependency unavailable",
      expectedUpdatedAt: started.updatedAt.toISOString(),
    });
    expect(blocked.blockerReason).toBe("Dependency unavailable");
    const resolved = await updateLearnerProjectTaskProgress(learner, {
      projectId: project.id, taskId: first.id,
    }, {
      action: "STATUS", status: "IN_PROGRESS", expectedUpdatedAt: blocked.updatedAt.toISOString(),
    });
    expect(resolved.blockerReason).toBeNull();
    const moved = await updateLearnerProjectTaskProgress(learner, {
      projectId: project.id, taskId: first.id,
    }, {
      action: "MOVE_DOWN", expectedUpdatedAt: resolved.updatedAt.toISOString(),
    });
    expect(moved.sequence).toBe(1);
    const after = await getProjectInstanceWorkspace(mentor, project.id);
    expect(after.tasks.find(task => task.id === first.id)?.sequence).toBe(1);
    expect(after.tasks.find(task => task.id !== first.id)?.sequence).toBe(0);
    const history = await pool!.query<{summary: string}>(
      "select summary from activity_events where subject_id=$1 and " +
        "event_type in ('projects.task.status_changed', 'projects.task.details_updated')",
      [first.id],
    );
    expect(history.rows.length).toBeGreaterThanOrEqual(2);
  });

  it("denies staff, cross-project tasks, unassigned tasks and invalid reorder boundaries", async () => {
    const { project, tasks } = await fixture();
    const first = tasks.find(task => task.templateKey === "task-1")!;
    const params = { projectId: project.id, taskId: first.id };
    const input = { action: "MOVE_UP", expectedUpdatedAt: first.updatedAt.toISOString() };
    await expect(updateLearnerProjectTaskProgress(collegeAdmin, params, input))
      .rejects.toMatchObject({ code: "PROJECT_ACCESS_DENIED" });
    await expect(updateLearnerProjectTaskProgress(learner, params, input))
      .rejects.toMatchObject({ code: "PROJECT_TASK_INVALID_STATE" });
    await expect(updateLearnerProjectTaskProgress(learner, {
      projectId: project.id, taskId: randomUUID(),
    }, input)).rejects.toMatchObject({ code: "PROJECT_TASK_NOT_FOUND" });
  });

  it("preserves a soft-deleted task's unique sequence reservation during learner reorder", async () => {
    const { project, tasks } = await fixture();
    const first = tasks.find(task => task.templateKey === "task-1")!;
    const second = tasks.find(task => task.templateKey === "task-2")!;
    const retired = tasks.find(task => task.templateKey === "task-3")!;
    // The registered unconditional (sprint_id, sequence) unique index
    // continues to reserve sequence=2 even after this task is soft-deleted.
    await pool!.query("update project_tasks set deleted_at=clock_timestamp() where id=$1", [retired.id]);
    const moved = await updateLearnerProjectTaskProgress(learner, {
      projectId: project.id, taskId: first.id,
    }, { action: "MOVE_DOWN", expectedUpdatedAt: first.updatedAt.toISOString() });
    expect(moved.sequence).toBe(1);
    const result = await pool!.query<{id:string;sequence:number;deleted_at:Date|null}>(
      "select id,sequence,deleted_at from project_tasks where id=any($1::uuid[])",
      [[first.id,second.id,retired.id]],
    );
    const rows = new Map(result.rows.map(row => [row.id, row]));
    expect(rows.get(first.id)?.sequence).toBe(1);
    expect(rows.get(second.id)?.sequence).toBe(0);
    expect(rows.get(retired.id)?.sequence).toBe(2);
    expect(rows.get(retired.id)?.deleted_at).not.toBeNull();
    await expect(updateLearnerProjectTaskProgress(learner, {
      projectId:project.id,taskId:retired.id,
    }, { action:"STATUS",status:"IN_PROGRESS",
      expectedUpdatedAt:retired.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_TASK_NOT_FOUND"});
  });

  it("rejects learner task mutations on a deleted sprint", async () => {
    const {project,tasks} = await fixture();
    const first=tasks.find(task=>task.templateKey==="task-1")!;
    await pool!.query("update project_sprints set deleted_at=clock_timestamp() where id=$1",[first.sprintId]);
    await expect(updateLearnerProjectTaskProgress(learner,{
      projectId:project.id,taskId:first.id,
    },{action:"STATUS",status:"IN_PROGRESS",
      expectedUpdatedAt:first.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
    const checked=await pool!.query<{status:string}>("select status from project_tasks where id=$1",[first.id]);
    expect(checked.rows[0]?.status).toBe("TODO");
  });

  it("denies mentor backlog movement of deleted tasks and into deleted sprints", async () => {
    const {project,tasks} = await fixture();
    const first=tasks.find(task=>task.templateKey==="task-1")!;
    await pool!.query("update project_tasks set deleted_at=clock_timestamp() where id=$1",[first.id]);
    const retired=await pool!.query<{updated_at:Date}>(
      "select updated_at from project_tasks where id=$1",[first.id]);
    await expect(moveMentorBacklogTask(mentor,project.id,{
      taskId:first.id,targetSprintId:null,
      expectedUpdatedAt:retired.rows[0]!.updated_at.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
    const backlog=await createMentorBacklogTask(mentor,project.id,{title:"Active backlog task"});
    await pool!.query("update project_sprints set deleted_at=clock_timestamp() where id=$1",[first.sprintId]);
    await expect(moveMentorBacklogTask(mentor,project.id,{
      taskId:backlog.id,targetSprintId:first.sprintId,
      expectedUpdatedAt:backlog.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
    const checked=await pool!.query<{sprint_id:string|null}>(
      "select sprint_id from project_tasks where id=$1",[backlog.id]);
    expect(checked.rows[0]?.sprint_id).toBeNull();
  });

});
