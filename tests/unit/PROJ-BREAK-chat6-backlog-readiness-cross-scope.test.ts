import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { readFileSync } from "node:fs";
import { learnerBacklogPullInputSchema } from "@/modules/projects/learner-backlog-pull-service";

const taskId = "11111111-1111-4111-8111-111111111111";
const sprintId = "22222222-2222-4222-8222-222222222222";
const revision = "2026-10-19T01:12:30.123+05:30";

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("IIT Dharwad Projects breaker: backlog, readiness and tenant boundaries", () => {
  it("PROJ-BREAK-backlog-12 refuses forged task/sprint identifiers, timestamps and privilege fields", () => {
    expect(learnerBacklogPullInputSchema.safeParse({
      taskId, sprintId, expectedUpdatedAt: revision,
    }).success).toBe(true);
    for (const bad of [
      { taskId: "not-a-uuid" }, { sprintId: "another-college" },
      { expectedUpdatedAt: "2026-10-19" },
      { expectedUpdatedAt: "not-a-date" }, { expectedUpdatedAt: null },
      { expectedUpdatedAt: 0 }, { expectedUpdatedAt: undefined },
      { projectId: sprintId }, { collegeId: taskId }, { role: "MENTOR" },
      { canMutate: true }, { expectedUpdatedAt: [revision, revision] },
    ]) {
      expect(learnerBacklogPullInputSchema.safeParse({
        taskId, sprintId, expectedUpdatedAt: revision, ...bad,
      }).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it("PROJ-BREAK-backlog-13 checks live tenant, actor, membership, release and revision inside one locked write", () => {
    const code = source("src/modules/projects/learner-backlog-pull-service.ts");
    const body = code.slice(code.indexOf("export async function pullOwnBacklogTask("));
    expect(body).toContain("requireProjectReadAccess(context,projectIdInput)");
    expect(body).toContain('scope.access!=="LEARNER"');
    expect(body).toContain("getDb().transaction(async tx=>");
    expect(body).toContain('eq(projectInstances.collegeId,scope.collegeId)');
    expect(body).toContain('.for("update")');
    expect(body).toContain('project?.status!=="ACTIVE"');
    expect(body).toContain("await assertPersistedLearnerProjectMutation(");
    expect(body).toContain("eq(projectTasks.projectId,scope.project.id)");
    expect(body).toContain("task.assigneeMembershipId!==membership.id");
    expect(body).toContain('task.status!=="TODO"');
    expect(body).toContain("task.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt)");
    expect(body).toContain('sprint?.status!=="ACTIVE"');
    expect(body).toContain("eq(projectReleases.projectId,scope.project.id)");
    expect(body).toContain("date_trunc('milliseconds'");
    expect(body).toContain("if(!updated)throw new ProjectsServiceError");
    expect(body).toContain("recordActivityEventInTransaction(tx,context");
    expect(body).toContain("notifyActiveProjectMembers(tx,event.id");
  });

  it("PROJ-BREAK-readiness-12 forbids global or cross-college readiness history leaks", () => {
    const code = source("src/modules/projects/admin-readiness-overrides-service.ts");
    const body = code.slice(code.indexOf("export async function listCollegeActiveReadinessOverrides("));
    expect(body).toContain("getProjectAdminCollegeId(context)!==requestedCollegeId");
    expect(body).toContain("loadProjectCollegeScope(requestedCollegeId)");
    expect(body).toContain('requirePermission(context,"projects.manage"');
    expect(body).toContain("getDb().transaction(async tx=>");
    expect(body).toContain('assertPersistedPlatformPermission(tx,context,"projects.manage"');
    expect(body).toContain("eq(activityEvents.collegeId,college.id)");
    expect(body).toContain('eq(activityEvents.subjectType,"project_instance")');
    expect(body).toContain('eq(projectInstances.collegeId,college.id)');
    expect(body).toContain('archived:titles.get(row.projectId)?.status==="ARCHIVED"');
    expect(body).toContain('.for("share")');
    expect(body).toContain("titles.has(row.projectId)");
  });

  it("PROJ-BREAK-readiness-13 does not confuse an old override with the latest reset event", () => {
    const code = source("src/modules/projects/admin-readiness-overrides-service.ts");
    expect(code).toContain("selectDistinctOn([activityEvents.subjectId]");
    expect(code).toContain("desc(activityEvents.occurredAt)");
    expect(code).toContain("desc(activityEvents.id)");
    expect(code).toContain('row.metadata["state"]==="FORCE_UNLOCK"||row.metadata["state"]==="FORCE_BLOCK"');
    expect(code).toContain("const titles=new Map(projects.map");
    expect(code).toContain('direction:row.metadata["state"]==="FORCE_UNLOCK"?"Ready":"Not ready"');
  });
});
