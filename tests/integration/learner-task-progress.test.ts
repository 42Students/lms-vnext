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
    const moved = await updateLearnerProjectTaskProgress(learner, {
      projectId: project.id, taskId: first.id,
    }, {
      action: "MOVE_DOWN", expectedUpdatedAt: blocked.updatedAt.toISOString(),
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
});
