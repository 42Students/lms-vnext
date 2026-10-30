import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege}
  from "@/modules/projects/template-service";
import {createProjectInstance,getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {addProjectMember} from "@/modules/projects/member-service";
import {getMentorBoardReview} from "@/modules/projects/mentor-board-review-service";
import {getMentorTaskReviews} from "@/modules/projects/mentor-task-review-service";
import {startProjectSprint} from "@/modules/projects/lifecycle-service";
import {scheduleProjectMeeting} from "@/modules/projects/meeting-service";
import {decideMentorProjectMeeting} from "@/modules/projects/mentor-meeting-decision-service";
import {decideMentorFinalDelivery} from "@/modules/projects/mentor-final-delivery-decision-service";
import {submitProjectTask,reviewProjectTaskSubmission} from "@/modules/projects/task-submission-service";
import {assignProjectTaskToLearner} from "./support/projects-review-fixture";

if(!process.env.TEST_DATABASE_URL)throw new Error("Requires isolated disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const root:RequestContext={
  user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",
    platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null,
};
const scopedRoot:RequestContext={...root,adminScope:{
  organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
}};
const admin:RequestContext={
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const created:{projectIds:string[];templateIds:string[];members:string[];users:string[]}={
  projectIds:[],templateIds:[],members:[],users:[],
};
async function cleanup(){
  if(created.projectIds.length){
    for(const table of ["project_delivery_events","project_task_submissions","project_submission_reviews",
      "project_submissions","project_meeting_history","project_meetings","project_members","project_resources","project_resource_audit",
      "project_tasks","project_sprints","project_releases"]){
      await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[created.projectIds]);
    }
    await pool.query("delete from project_instances where id=any($1::uuid[])",[created.projectIds]);
    created.projectIds=[];
  }
  if(created.templateIds.length){
    await pool.query("delete from project_template_college_assignments where template_id=any($1::uuid[])",[created.templateIds]);
    // Preserve DB070 append-only history and DB071 deferred version pointers.
    // The disposable fixture slugs/UUIDs are unique; no guard bypass is used.
    const retention = await pool.query<{retainHistory:boolean}>(
      "select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
    );
    if (!retention.rows[0]?.retainHistory) {
      await pool.query("delete from project_template_versions where template_id=any($1::uuid[])",[created.templateIds]);
      await pool.query("delete from project_templates where id=any($1::uuid[])",[created.templateIds]);
    }
    created.templateIds=[];
  }
  // Immutable audit events retain FK references to an actor membership/user.
  // Remove disposable identities only when no audit or recipient history uses them.
  const auditMembers=created.members.length?await pool.query<{id:string}>(`
    select distinct actor_membership_id as id from activity_events
    where actor_membership_id=any($1::uuid[])`,[created.members]):{rows:[]};
  const protectedMembers=new Set(auditMembers.rows.map(row=>row.id));
  const deletableMembers=created.members.filter(id=>!protectedMembers.has(id));
  if(deletableMembers.length){
    await pool.query("delete from membership_roles where membership_id=any($1::uuid[])",[deletableMembers]);
    await pool.query("delete from college_memberships where id=any($1::uuid[])",[deletableMembers]);
  }
  created.members=[];
  const actorUsers=created.users.length?await pool.query<{id:string}>(`
    select distinct actor_user_id as id from activity_events
    where actor_user_id=any($1::uuid[])`,[created.users]):{rows:[]};
  const recipients=created.users.length?await pool.query<{id:string}>(`
    select distinct user_id as id from in_app_notifications
    where user_id=any($1::uuid[])`,[created.users]):{rows:[]};
  const retainedUsers=new Set([...actorUsers.rows,...recipients.rows].map(row=>row.id));
  const deletableUsers=created.users.filter(id=>!retainedUsers.has(id));
  if(deletableUsers.length)await pool.query(
    "delete from users where id=any($1::uuid[])",[deletableUsers]);
  created.users=[];
  // Do not delete or rewrite append-only audit/notification history.
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});

async function newMentor(collegeId:string,slug:string):Promise<RequestContext>{
  const userId=randomUUID(),membershipId=randomUUID(),roleId=randomUUID();
  await pool.query(`insert into users(id,identity_uid,email,display_name,platform_status)
    values($1,$2,$3,$4,'ACTIVE')`,[
    userId,"c4board-"+slug,"c4board-"+slug+"@example.invalid","Mentor "+slug]);
  created.users.push(userId);
  await pool.query("insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [membershipId,userId,collegeId]);
  created.members.push(membershipId);
  await pool.query("insert into membership_roles(id,membership_id,role) values($1,$2,'MENTOR')",
    [roleId,membershipId]);
  return {user:{id:userId,identityUid:"c4board-"+slug,platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:membershipId,collegeId,organizationId:SEED_IDS.organization,
      status:"ACTIVE",roles:["MENTOR"]}};
}
async function newLearner(collegeId:string,slug:string):Promise<RequestContext>{
 const scoped=await newMentor(collegeId,slug);
 await pool.query("update membership_roles set role='LEARNER' where membership_id=$1",
  [scoped.membership!.id]);
 return {...scoped,membership:{...scoped.membership!,roles:["LEARNER"]}};
}
async function fixture(){
  const suffix=randomUUID().replaceAll("-","").slice(0,14);
  const mentor=await newMentor(SEED_IDS.collegeA,suffix+"a");
  const foreign=await newMentor(SEED_IDS.collegeB,suffix+"b");
  const learner=await newLearner(SEED_IDS.collegeA,suffix+"c");
  const templ=await createProjectTemplate(root,{
    slug:"chat4-board-t-"+suffix,title:"Board template "+suffix,
    blueprint:{overview:{goal:"Review actual board",deliverables:["Board"]},
      releases:[{key:"release-a",title:"Release",sequence:0}],
      sprints:[{key:"sprint-a",releaseKey:"release-a",title:"Sprint",sequence:0}],
      tasks:[{key:"task-a",sprintKey:"sprint-a",title:"Draft board task",
        priority:"HIGH" as const,sequence:0}],resources:[]},
  });
  created.templateIds.push(templ.template.id);
  await publishProjectTemplate(root,templ.template.id);
  await assignProjectTemplateToCollege(scopedRoot,templ.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{
    collegeId:SEED_IDS.collegeA,templateId:templ.template.id,
    slug:"chat4-board-p-"+suffix,title:"Board project "+suffix,
  });
  created.projectIds.push(project.id);
  await addProjectMember(admin,project.id,{
    membershipId:mentor.membership!.id,role:"MENTOR",isPrimary:true,
  });
  await addProjectMember(admin,project.id,{
    membershipId:learner.membership!.id,role:"LEARNER",
  });
  const workspace=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,mentor,foreign,learner,
    task:workspace.tasks[0]!,sprint:workspace.sprints[0]!};
}

describe("Mentor final delivery reviewed with immutable audit",()=>{
 it("accepts default now() token once and denies stale/foreign/wrong-role",async()=>{
  const {project,mentor,foreign,learner,sprint}=await fixture();
  // Final delivery is reviewable only on an ACTIVE project (never before activation).
  await startProjectSprint(mentor,project.id,sprint.id);
  const id=randomUUID();
  const inserted=await pool.query<{updated_at:Date}>(`insert into project_submissions
   (id,project_id,version,status,summary,source_url,created_by_membership_id,
    submitted_by_membership_id,submitted_at)
   values($1,$2,1,'SUBMITTED','Final test','https://example.invalid/project',
    $3,$3,now()) returning updated_at`,
   [id,project.id,learner.membership!.id]);
  const token={decision:"APPROVED" as const,
   expectedUpdatedAt:inserted.rows[0]!.updated_at.toISOString(),confirmed:true as const};
  await expect(decideMentorFinalDelivery(learner,project.id,id,token)).rejects.toBeDefined();
  await expect(decideMentorFinalDelivery(foreign,project.id,id,token)).rejects.toBeDefined();
  await expect(decideMentorFinalDelivery(mentor,SEED_IDS.collegeB,id,token)).rejects.toBeDefined();
  const result=await decideMentorFinalDelivery(mentor,project.id,id,token);
  expect(result.submission.status).toBe("APPROVED");
  await expect(decideMentorFinalDelivery(mentor,project.id,id,token)).rejects.toBeDefined();
  const audit=await pool.query<{count:string}>(`select count(*)::text as count
   from activity_events where subject_id=$1::text and event_type='projects.delivery.reviewed'`,[id]);
  expect(audit.rows[0]?.count).toBe("1");
 });
});


describe("Mentor final delivery changes-requested persistence",()=>{
 it("requires feedback, rejects stale decisions and keeps revision unlocked",async()=>{
  const {project,mentor,learner,sprint}=await fixture();
  await startProjectSprint(mentor,project.id,sprint.id);
  const submissionId=randomUUID();
  const created=await pool.query<{updated_at:Date}>(`insert into project_submissions
    (id,project_id,version,status,summary,created_by_membership_id,
      submitted_by_membership_id,submitted_at)
    values($1,$2,1,'SUBMITTED','Needs revision',$3,$3,now())
    returning updated_at`,[
    submissionId,project.id,learner.membership!.id,
  ]);
  const decision={
    decision:"CHANGES_REQUESTED" as const,feedback:"Please attach the test run.",
    expectedUpdatedAt:created.rows[0]!.updated_at.toISOString(),
    confirmed:true as const,
  };
  await expect(decideMentorFinalDelivery(mentor,project.id,submissionId,{
    ...decision,feedback:undefined,
  })).rejects.toMatchObject({name:"ZodError"});
  await expect(decideMentorFinalDelivery(mentor,project.id,submissionId,{
    ...decision,expectedUpdatedAt:"2001-01-01T00:00:00Z",
  })).rejects.toMatchObject({code:"PROJECT_SUBMISSION_STALE_VERSION"});
  const result=await decideMentorFinalDelivery(
    mentor,project.id,submissionId,decision,
  );
  expect(result.submission.status).toBe("CHANGES_REQUESTED");
  expect(result.submission.lockedAt).toBeNull();
  expect(result.review.feedback).toBe(decision.feedback);
  await expect(decideMentorFinalDelivery(
    mentor,project.id,submissionId,decision,
  )).rejects.toMatchObject({code:"PROJECT_SUBMISSION_INVALID_STATE"});
  const history=await pool.query<{decision:string;feedback:string|null}>(`
    select decision,feedback from project_submission_reviews
    where submission_id=$1`,[submissionId]);
  expect(history.rows).toEqual([{
    decision:"CHANGES_REQUESTED",feedback:decision.feedback,
  }]);
  const lockEvents=await pool.query<{n:string}>(`
    select count(*)::text as n from project_delivery_events
    where submission_id=$1 and event_type='LOCKED'`,[submissionId]);
  expect(lockEvents.rows[0]?.n).toBe("0");
  const notices=await pool.query<{n:string}>(`
    select count(*)::text as n from in_app_notifications n
    join activity_events e on e.id=n.event_id
    where n.user_id=$1 and e.subject_id=$2
      and e.event_type='projects.delivery.reviewed'`,[
    learner.user.id,submissionId,
  ]);
  expect(notices.rows[0]?.n).toBe("1");
 });
});

describe("Mentor meeting audited optimistic decisions on disposable PostgreSQL",()=>{
 it("completes a SQL-backed meeting and denies replay/foreign/wrong-role",async()=>{
  const {project,mentor,foreign,learner}=await fixture();
  // Meetings must be in the future and mentor scheduling is optimistic on the project version.
  const startsAt=new Date(Date.now()+7*24*60*60*1000);
  startsAt.setUTCSeconds(0,0);
  const projectVersion=await pool.query<{updated_at:Date}>(
   "select updated_at from project_instances where id=$1",[project.id]);
  const meeting=await scheduleProjectMeeting(mentor,project.id,null,{
   title:"Mentor session",startsAt:startsAt.toISOString(),
   endsAt:new Date(startsAt.getTime()+60*60*1000).toISOString(),timeZone:"Asia/Kolkata",
   expectedProjectUpdatedAt:projectVersion.rows[0]!.updated_at.toISOString(),
   meetingUrl:"https://example.invalid/mentor-session",
  });
  // Exercise database now() microseconds, not only JS-authored timestamps.
  const versionRow=await pool.query<{updated_at:Date}>(
   "update project_meetings set updated_at=now() where id=$1 returning updated_at",
   [meeting.id],
  );
  const token={action:"COMPLETE" as const,expectedUpdatedAt:versionRow.rows[0]!.updated_at.toISOString(),
   confirmed:true as const,outcome:"Finished"};
  await expect(decideMentorProjectMeeting(learner,project.id,meeting.id,token)).rejects.toBeDefined();
  await expect(decideMentorProjectMeeting(foreign,project.id,meeting.id,token)).rejects.toBeDefined();
  await expect(decideMentorProjectMeeting(mentor,SEED_IDS.collegeB,meeting.id,token)).rejects.toBeDefined();
  const done=await decideMentorProjectMeeting(mentor,project.id,meeting.id,token);
  expect(done.status).toBe("COMPLETED");
  await expect(decideMentorProjectMeeting(mentor,project.id,meeting.id,token)).rejects.toBeDefined();
  const audit=await pool.query<{count:string}>(`select count(*)::text as count from activity_events
    where subject_id=$1::text and event_type='projects.meeting.decided' and summary='Project meeting completed'`,[meeting.id]);
  expect(audit.rows[0]?.count).toBe("1");
 });
});

describe("Mentor feedback CAS persisted by SQL default",()=>{
 it("allows only current own-task Mentor version and records one event",async()=>{
  const {project,mentor,foreign,learner,task,sprint}=await fixture();
  await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
  await startProjectSprint(mentor,project.id,sprint.id);
  const submitted=await submitProjectTask(learner,project.id,task.id,{
   submissionUrl:"https://example.invalid/review/"+project.id,
  });
  const v=await pool.query<{updated_at:Date}>(
   "update project_task_submissions set updated_at=now() where id=$1 returning updated_at",
   [submitted.id]);
  const input={decision:"CHANGES_REQUESTED" as const,feedback:"Add tests",
   expectedUpdatedAt:v.rows[0]!.updated_at.toISOString(),confirmed:true as const};
  await expect(reviewProjectTaskSubmission(learner,project.id,task.id,submitted.id,input)).rejects.toBeDefined();
  await expect(reviewProjectTaskSubmission(foreign,project.id,task.id,submitted.id,input)).rejects.toBeDefined();
  await expect(reviewProjectTaskSubmission(mentor,SEED_IDS.collegeB,task.id,submitted.id,input)).rejects.toBeDefined();
  await expect(reviewProjectTaskSubmission(mentor,project.id,task.id,submitted.id,{
   ...input,expectedUpdatedAt:"2026-01-01T00:00:00.000Z",
  })).rejects.toMatchObject({code:"PROJECT_TASK_SUBMISSION_STALE_VERSION"});
  const decided=await reviewProjectTaskSubmission(mentor,project.id,task.id,submitted.id,input);
  expect(decided.submission.status).toBe("CHANGES_REQUESTED");
  await expect(reviewProjectTaskSubmission(mentor,project.id,task.id,submitted.id,input)).rejects.toBeDefined();
  const audit=await pool.query<{n:string}>(`select count(*)::text as n from activity_events
   where subject_id=$1::text and event_type='projects.task.reviewed'`,[submitted.id]);
  expect(audit.rows[0]?.n).toBe("1");
 });
});

describe("Mentor task review queue after a persisted decision",()=>{
 it("shows a current submission and excludes its stale version after review",async()=>{
  const {project,mentor,foreign,learner,task,sprint}=await fixture();
  await assignProjectTaskToLearner({learner,mentor,projectId:project.id,taskId:task.id});
  await startProjectSprint(mentor,project.id,sprint.id);
  const submitted=await submitProjectTask(learner,project.id,task.id,{
   submissionUrl:"https://example.invalid/mentor-review/"+project.id,
  });
  const pending=await getMentorTaskReviews(mentor,{search:project.title});
  expect(pending.items).toEqual(expect.arrayContaining([
   expect.objectContaining({id:submitted.id,taskId:task.id,projectId:project.id,version:1}),
  ]));
  expect((await getMentorTaskReviews(foreign,{search:project.title})).items).toEqual([]);
  await expect(getMentorTaskReviews(learner,{search:project.title})).rejects.toBeDefined();
  await expect(getMentorTaskReviews(mentor,{collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  const result=await reviewProjectTaskSubmission(mentor,project.id,task.id,submitted.id,{
   decision:"CHANGES_REQUESTED",feedback:"Clarify acceptance criteria",
   expectedUpdatedAt:submitted.updatedAt.toISOString(),confirmed:true,
  });
  expect(result.submission.status).toBe("CHANGES_REQUESTED");
  const after=await getMentorTaskReviews(mentor,{search:project.title});
  expect(after.items.some(item=>item.id===submitted.id)).toBe(false);
  await expect(reviewProjectTaskSubmission(mentor,project.id,task.id,submitted.id,{
   decision:"APPROVED",
  })).rejects.toBeDefined();
  const audit=await pool.query<{n:string}>(`
   select count(*)::text as n from activity_events where dedupe_key=$1`,
   ["project-task-submission:"+submitted.id+":reviewed"]);
  expect(audit.rows[0]?.n).toBe("1");
 });
});

describe("Mentor task board positive/scope PostgreSQL",()=>{
  it("reads only registered own-project task statuses; denies wrong-role, foreign, forged",async()=>{
    const {project,mentor,foreign}=await fixture();
    const data=await getMentorBoardReview(mentor,{projectId:project.id});
    expect(data).toMatchObject({enabled:true,count:1,total:1,
      totals:{TODO:1,IN_REVIEW:0,DONE:0},completedPercent:0});
    expect(data.items).toEqual([expect.objectContaining({
      title:"Draft board task",priority:"HIGH",status:"TODO",sprintTitle:"Sprint",
    })]);
    const noMatch=await getMentorBoardReview(mentor,{
      projectId:project.id,status:"DONE",page:1,
    });
    expect(noMatch).toMatchObject({count:1,total:0,items:[]});
    await expect(getMentorBoardReview({
      ...mentor,membership:{...mentor.membership!,roles:["LEARNER"]},
    },{projectId:project.id})).rejects.toBeDefined();
    await expect(getMentorBoardReview(foreign,{projectId:project.id}))
      .rejects.toBeDefined();
    await expect(getMentorBoardReview(mentor,{projectId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    await expect(getMentorBoardReview(mentor,{
      projectId:project.id,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
