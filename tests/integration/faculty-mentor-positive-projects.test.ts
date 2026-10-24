import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { addProjectMember } from "@/modules/projects/member-service";
import { createProjectInstance, getProjectInstanceWorkspace } from "@/modules/projects/instance-service";
import { startProjectSprint } from "@/modules/projects/lifecycle-service";
import {
  createProjectTemplate, publishProjectTemplate, assignProjectTemplateToCollege,
} from "@/modules/projects/template-service";
import { submitProjectTask, reviewProjectTaskSubmission } from "@/modules/projects/task-submission-service";
import {assignProjectTaskToLearner} from "./support/projects-review-fixture";
import { getMentorTeamHistory } from "@/modules/projects/mentor-team-history-service";
import { getMentorTeamCoverage } from "@/modules/projects/mentor-team-coverage-service";
import { getMentorProjectWorkCounts } from "@/modules/projects/mentor-project-work-service";
import { getMentorProjectTeamSizes,getMentorProjectLearnerSizes } from "@/modules/projects/mentor-project-team-size-service";
import { getMentorSprintProgress } from "@/modules/projects/mentor-sprint-progress-service";
import { getMentorTaskReviews } from "@/modules/projects/mentor-task-review-service";
import { getMentorTaskReviewHistory } from "@/modules/projects/mentor-task-history-service";
import { getMentorProjectReviewCompleteness } from "@/modules/projects/mentor-review-completeness-service";
import { getMentorProjectActivityHistory } from "@/modules/projects/mentor-project-activity-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { recordActivityEvent } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  deliverInAppNotification, markOwnNotificationRead,
} from "@/modules/activity/notification-service";
import { getMentorPersonalInbox } from "@/modules/activity/mentor-notifications-service";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Requires disposable PostgreSQL TEST_DATABASE_URL (never production DATABASE_URL)");
}
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const admin: RequestContext = {
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const root: RequestContext = {
  user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:null,
};
const scopedRoot: RequestContext = {...root,adminScope:{
  organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
}};
const mentor: RequestContext = {
  user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
const learner: RequestContext = {
  user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};

function blueprint() {
  return {
    overview:{goal:"Chat4 positive review",deliverables:["Task test"]},
    releases:[{key:"release-1",title:"Chat4 Release",sequence:0}],
    sprints:[{key:"sprint-1",releaseKey:"release-1",title:"Chat4 Sprint",sequence:0}],
    tasks:[{key:"task-1",sprintKey:"sprint-1",title:"Chat4 Task",priority:"HIGH" as const,sequence:0}],
    resources:[],
  };
}
async function cleanup() {
  const projects = await pool.query<{id:string}>(
    "select id from project_instances where slug like 'chat4-positive-%'",
  );
  const ids=projects.rows.map(row=>row.id);
  if (ids.length) {
    await pool.query(`delete from in_app_notifications where event_id in
      (select id from activity_events where subject_id = any($1::text[])
        or metadata ->> 'projectId' = any($1::text[]))`,[ids]);
    await pool.query(`delete from activity_events where subject_id = any($1::text[])
        or metadata ->> 'projectId' = any($1::text[])`,[ids]);
    for(const table of [
      "project_task_submissions","project_members","project_resources",
      "project_tasks","project_sprints","project_releases",
    ]) {
      await pool.query("delete from "+table+" where project_id = any($1::uuid[])",[ids]);
    }
    await pool.query("delete from project_instances where id = any($1::uuid[])",[ids]);
  }
  await pool.query(`delete from project_template_college_assignments where template_id in
    (select id from project_templates where slug like 'chat4-positive-%')`);
  await pool.query(`delete from project_template_versions where template_id in
    (select id from project_templates where slug like 'chat4-positive-%')`);
  await pool.query("delete from project_templates where slug like 'chat4-positive-%'");
}

async function fixture() {
  const created=await createProjectTemplate(root,{
    slug:"chat4-positive-template",title:"Chat4 Positive Template",blueprint:blueprint(),
  });
  await publishProjectTemplate(root,created.template.id);
  await assignProjectTemplateToCollege(scopedRoot,created.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{
    collegeId:SEED_IDS.collegeA,templateId:created.template.id,
    slug:"chat4-positive-project",title:"Chat4 Positive Project",
  });
  await addProjectMember(admin,project.id,{
    membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
  });
  await addProjectMember(admin,project.id,{
    membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
  });
  const workspace=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,task:workspace.tasks[0]!,sprint:workspace.sprints[0]!};
}
beforeEach(cleanup);
afterAll(async()=>{
  try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}
});

describe("Chat4 Mentor SUCCESS paths in disposable PostgreSQL",()=>{
  it("reads persisted assigned-project team, sprint, coverage and activity",async()=>{
    const {project,sprint}=await fixture();
    const groupSizes=await getMentorProjectTeamSizes(mentor);
    expect(groupSizes.get(project.id)).toBe(2);
    const learnerSizes=await getMentorProjectLearnerSizes(mentor);
    expect(learnerSizes.get(project.id)).toBe(1);
    await expect(getMentorProjectTeamSizes(learner)).rejects.toBeDefined();
    await expect(getMentorProjectLearnerSizes(learner)).rejects.toBeDefined();
    const recordedWork=await getMentorProjectWorkCounts(mentor);
    expect(recordedWork.get(project.id)).toMatchObject({total:1,open:1});
    await expect(getMentorProjectWorkCounts(learner)).rejects.toBeDefined();
    const review=await getMentorProjectReviewCompleteness(mentor,{projectId:project.id,page:1});
    expect(review).toMatchObject({
      enabled:true,total:0,items:[],projectTitle:project.title,
    });
    await expect(getMentorProjectReviewCompleteness(learner,{
      projectId:project.id,
    })).rejects.toBeDefined();
    await expect(getMentorProjectReviewCompleteness(mentor,{
      projectId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    const members=await getMentorTeamHistory(mentor,{
      projectId:project.id,view:"OPEN",page:1,
    });
    expect(members.enabled).toBe(true);
    expect(members.items).toEqual(expect.arrayContaining([
      expect.objectContaining({role:"MENTOR",state:"CURRENT",isPrimary:true}),
      expect.objectContaining({role:"LEARNER",state:"CURRENT"}),
    ]));
    const coverage=await getMentorTeamCoverage(mentor,{});
    expect(coverage.items).toEqual(expect.arrayContaining([
      expect.objectContaining({projectId:project.id,learners:1,mentors:1,hasPrimaryMentor:true}),
    ]));
    expect(coverage.projectCount).toBeGreaterThanOrEqual(1);
    expect(coverage.summary).toMatchObject({
      zeroLearnerProjects:expect.any(Number),
      withoutPrimaryMentor:expect.any(Number),
    });
    const filtered=await getMentorTeamCoverage(mentor,{
      filter:"NO_LEARNERS",search:project.title,page:1,
    });
    expect(filtered.projectCount).toBeGreaterThanOrEqual(1);
    expect(filtered.items).toEqual([]);
    await expect(getMentorTeamCoverage(learner,{})).rejects.toBeDefined();
    await expect(getMentorTeamCoverage(mentor,{
      collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    const disabled:RequestContext={...mentor,
      user:{...mentor.user,platformStatus:"DISABLED"}};
    await expect(getMentorTeamCoverage(disabled,{})).rejects.toBeDefined();
    const sprints=await getMentorSprintProgress(mentor,{});
    expect(sprints.items).toEqual(expect.arrayContaining([
      expect.objectContaining({id:sprint.id,projectId:project.id,
        tasks:expect.objectContaining({total:1,completed:0})}),
    ]));
    const activity=await getMentorProjectActivityHistory(mentor,{projectId:project.id});
    expect(activity.enabled).toBe(true);
    expect(activity.items.length).toBeGreaterThan(0);
    await expect(getMentorTeamHistory(learner,{
      projectId:project.id,view:"ALL",page:1,
    })).rejects.toBeDefined();
  });

  it("delivers and pages an owned Mentor notification from a test-created event",async()=>{
    const {project}=await fixture();
    const event=await recordActivityEvent(mentor,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_SUBMITTED,
      collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
      subjectType:"project",subjectId:project.id,
      summary:"Chat4 Mentor inbox positive fixture",
      metadata:{projectId:project.id},
      groupKey:"project:"+project.id+":inbox",
      dedupeKey:"chat4-positive-mentor-inbox:"+project.id,
    });
    await deliverInAppNotification(event.id,[SEED_IDS.facultyUser],{
      title:"Chat4 Mentor Inbox Proof",body:"A persisted own-recipient test event.",
      actionHref:"/mentor/projects/"+project.id,
    });
    const inbox=await getMentorPersonalInbox(mentor,{view:"unread"});
    expect(inbox.cursor.invalid).toBe(false);
    const message=inbox.page.items.find(row=>
      row.notification.title==="Chat4 Mentor Inbox Proof");
    expect(message?.notification).toMatchObject({title:"Chat4 Mentor Inbox Proof"});
    expect(inbox.unreadCount).toBeGreaterThanOrEqual(1);
    if (!message) throw new Error("Missing seeded Mentor message");
    await markOwnNotificationRead(mentor,message.notification.id);
    const unread=await getMentorPersonalInbox(mentor,{view:"unread"});
    expect(unread.page.items.some(row=>row.notification.id===message.notification.id)).toBe(false);
    await expect(getMentorPersonalInbox(learner,{})).rejects.toBeDefined();
  });

  it("approves an actual submission and audits the decision once",async()=>{
    const {project,sprint,task}=await fixture();
    await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
    await startProjectSprint(mentor,project.id,sprint.id);
    const submission=await submitProjectTask(learner,project.id,task.id,{
      submissionUrl:"https://example.com/chat4-approval",
    });
    const outcome=await reviewProjectTaskSubmission(
      mentor,project.id,task.id,submission.id,{decision:"APPROVED",expectedUpdatedAt:submission.updatedAt.toISOString(),confirmed:true},
    );
    expect(outcome).toMatchObject({
      task:{status:"DONE"},
      submission:{status:"APPROVED",reviewedByUserId:SEED_IDS.facultyUser},
    });
    const event=await pool.query<{decision:string}>(`select metadata->>'decision' as decision
      from activity_events where dedupe_key=$1`,[
      "project-task-submission:"+submission.id+":reviewed",
    ]);
    expect(event.rows).toEqual([{decision:"APPROVED"}]);
    const history=await getMentorTaskReviewHistory(mentor,{decision:"APPROVED"});
    expect(history.items).toEqual(expect.arrayContaining([
      expect.objectContaining({id:submission.id,status:"APPROVED"}),
    ]));
  });

  it("reviews a real task, persists one audit event, and exposes reviewed history",async()=>{
    const {project,sprint,task}=await fixture();
    await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
    await startProjectSprint(mentor,project.id,sprint.id);
    const submission=await submitProjectTask(learner,project.id,task.id,{
      submissionUrl:"https://example.com/chat4-positive-work",
    });
    const queue=await getMentorTaskReviews(mentor,{});
    expect(queue.items).toEqual(expect.arrayContaining([
      expect.objectContaining({id:submission.id,projectId:project.id}),
    ]));
    const reviewed=await reviewProjectTaskSubmission(
      mentor,project.id,task.id,submission.id,{
        decision:"CHANGES_REQUESTED",feedback:"Please add a real test.",
        expectedUpdatedAt:submission.updatedAt.toISOString(),confirmed:true,
      },
    );
    expect(reviewed.submission.status).toBe("CHANGES_REQUESTED");
    expect(reviewed.task.status).toBe("IN_PROGRESS");

    const history=await getMentorTaskReviewHistory(mentor,{decision:"CHANGES_REQUESTED"});
    expect(history.enabled).toBe(true);
    expect(history.items).toEqual(expect.arrayContaining([
      expect.objectContaining({id:submission.id,projectId:project.id,
        status:"CHANGES_REQUESTED",version:1}),
    ]));
    const audited=await pool.query<{
      event_type:string;actor_user_id:string;college_id:string;metadata:Record<string,unknown>;
    }>(`select event_type,actor_user_id,college_id,metadata from activity_events
      where dedupe_key = $1`,["project-task-submission:"+submission.id+":reviewed"]);
    expect(audited.rows).toHaveLength(1);
    expect(audited.rows[0]).toMatchObject({
      event_type:"projects.task.reviewed",
      actor_user_id:SEED_IDS.facultyUser,college_id:SEED_IDS.collegeA,
      metadata:{projectId:project.id,taskId:task.id,decision:"CHANGES_REQUESTED",version:1},
    });
    expect(audited.rows[0]?.metadata).not.toHaveProperty("feedback");

    await expect(reviewProjectTaskSubmission(mentor,project.id,task.id,submission.id,{
      decision:"APPROVED",expectedUpdatedAt:submission.updatedAt.toISOString(),confirmed:true,
    })).rejects.toMatchObject({code:"PROJECT_TASK_SUBMISSION_INVALID_STATE"});
    const events=await pool.query<{total:string}>(`select count(*)::text as total
      from activity_events where dedupe_key = $1`,[
      "project-task-submission:"+submission.id+":reviewed",
    ]);
    expect(events.rows[0]?.total).toBe("1");

    const timeline=await getMentorProjectActivityHistory(mentor,{projectId:project.id});
    expect(timeline.items).toEqual(expect.arrayContaining([
      expect.objectContaining({label:"Task review decision recorded"}),
    ]));
  });
});
