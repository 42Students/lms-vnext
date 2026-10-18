import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const service=(name:string)=>readFileSync("src/modules/projects/"+name+"-service.ts","utf8");

describe("chat-14 mentor project service boundaries (source compliance)",()=>{
  it("sprint creation locks parent row, enforces scoped release and writes activity atomically",()=>{
    const s=service("mentor-sprint-write");
    expect(s).toContain("requireProjectLifecycleMutationAccess");
    expect(s).toContain("getDb().transaction(async tx=>");
    expect(s).toContain('.for("update")');
    expect(s).toContain('eq(projectReleases.projectId,scope.project.id)');
    expect(s).toContain("recordActivityEventInTransaction(tx,context");
    expect(s).toContain("project_sprints_release_sequence_uq");
  });
  it("sprint lifecycle rejects invalid state, concurrent active sprint, and open tasks",()=>{
    const s=service("mentor-sprint-write");
    expect(s).toContain("isValidMentorSprintTransition(sprint.status,input.action)");
    expect(s).toContain("PROJECT_SPRINT_ALREADY_ACTIVE");
    expect(s).toContain("PROJECT_SPRINT_HAS_OPEN_TASKS");
    expect(s).toContain("sprint.updatedAt.getTime()!==new Date(input.expectedUpdatedAt).getTime()");
    expect(s).toContain("mayCloseProjectSprint");
  });
  it("sprint detail edits require active membership, module access, locked optimistic state and audit",()=>{
    const s=service("mentor-sprint-details");
    expect(s).toContain("requireProjectLifecycleAccess");
    expect(s).toContain('can(context,"projects.read"');
    expect(s).toContain("resolveOptionalModuleAccess");
    expect(s).toContain('.for("update")');
    expect(s).toContain("sprint.updatedAt.getTime()!==expected.getTime()");
    expect(s).toContain("recordActivityEventInTransaction(tx,context");
  });
  it("mentor task creation refuses other-tenant assignees and notifies only active assigned learner",()=>{
    const s=service("mentor-task-create");
    expect(s).toContain('hasMembershipRole(context,"MENTOR")');
    expect(s).toContain('scope.access!=="MENTOR"');
    expect(s).toContain("eq(collegeMemberships.collegeId,scope.collegeId)");
    expect(s).toContain('eq(projectMembers.role,"LEARNER")');
    expect(s).toContain("eq(users.platformStatus,\"ACTIVE\")");
    expect(s).toContain("notifyProjectMemberships(tx,event.id");
    expect(s).toContain("membershipIds:[created.assigneeMembershipId]");
    expect(s).toContain("recordActivityEventInTransaction(tx,context");
  });
  it("task detail edits enforce version check under row lock and record changed fields",()=>{
    const s=service("mentor-task-details");
    expect(s).toContain("requireProjectLifecycleMutationAccess");
    expect(s).toContain("getDb().transaction");
    expect(s).toContain("date_trunc('milliseconds'");
    expect(s).toContain("recordActivityEventInTransaction(tx,context");
    expect(s).toContain("taskDetailsChangedFields");
  });
  it("mentor task transition does not bypass DONE/IN_REVIEW learner submission workflow",()=>{
    const s=service("mentor-task-transition");
    expect(s).toContain("allowedMentorTaskTransition(task.status,input.status)");
    expect(s).toContain("if(!task.sprintId)");
    expect(s).toContain("date_trunc('milliseconds'");
    expect(s).toContain("recordActivityEventInTransaction(tx,context");
    expect(s).toContain("requireProjectLifecycleMutationAccess");
  });
  it("meeting decisions only allow project-scoped mentors and suppress notifications for drafts",()=>{
    const s=service("mentor-meeting-decision");
    expect(s).toContain('scope.access!=="MENTOR"');
    expect(s).toContain('hasMembershipRole(context,"MENTOR")');
    expect(s).toContain("mentorMeetingDecisionStatus(input.action,current.status)");
    expect(s).toContain("PROJECT_MEETING_STALE_VERSION");
    expect(s).toContain('if(current.status==="DRAFT")return updated;');
    expect(s).toContain("notifyActiveProjectMembers(tx,event.id");
  });
  it("meeting reschedules serialize and notify active participants, not unrelated colleges",()=>{
    const s=service("mentor-meeting-reschedule");
    expect(s).toContain("requireProjectReadAccess");
    expect(s).toContain("eq(projectInstances.collegeId,scope.collegeId)");
    expect(s).toContain("date_trunc('milliseconds'");
    expect(s).toContain("notifyActiveProjectMembers(tx,event.id");
  });
  it("release writes are scoped and block shipped release editing/deleting",()=>{
    const s=service("mentor-release-write");
    expect(s).toContain("requireProjectLifecycleMutationAccess");
    expect(s).toContain('operation==="DELETE"');
    expect(s).toContain('existing.status==="SHIPPED"');
    expect(s).toContain("mentorReleaseVersionMatches(existing.updatedAt,input.expectedUpdatedAt)");
    expect(s).toContain("mentorReleaseDeleteSchema.parse(raw)");
    expect(s).toContain("!mentorReleaseVersionMatches(existing.updatedAt,input.expectedUpdatedAt!)");
    expect(s).toContain("recordActivityEventInTransaction(tx,context");
  });
  it("final delivery mentor decision preserves version, project scope, and assigned member notification",()=>{
    const s=service("mentor-final-delivery-decision");
    // A Mentor final-delivery review is a mutation, not a read-only route;
    // the lifecycle mutation gate is deliberately stronger than read access.
    expect(s).toContain("requireProjectLifecycleMutationAccess");
    expect(s).toContain('scope.access!=="MENTOR"');
    expect(s).toContain('hasMembershipRole(context,"MENTOR")');
    expect(s).toContain("date_trunc('milliseconds'");
    expect(s).toContain("notifyActiveProjectMembers(tx,reviewedEvent.id");
    expect(s).toContain("recordActivityEventInTransaction(tx,context");
  });
});
