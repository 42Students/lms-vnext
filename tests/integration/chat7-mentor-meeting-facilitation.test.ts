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
import {listProjectMeetings,scheduleProjectMeeting} from "@/modules/projects/meeting-service";
import {decideMentorProjectMeeting} from "@/modules/projects/mentor-meeting-decision-service";
import {emptyMentorMeetingFacilitation} from "@/modules/projects/mentor-meeting-facilitation-model";

if(!process.env.TEST_DATABASE_URL)throw new Error("Requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const root:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"root",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
const scopedRoot:RequestContext={...root,adminScope:{organizationId:SEED_IDS.organization,
  collegeId:SEED_IDS.collegeA}};
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"admin",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.collegeAdminMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const mentor:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"mentor",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.facultyCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["FACULTY","MENTOR"]}};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"learner",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.learnerCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["LEARNER"]}};
const tracked:{projects:string[];templates:string[]}={projects:[],templates:[]};

async function migrationReady(){
 const {rows}=await pool.query<{present:boolean}>(`
  select exists(select 1 from information_schema.columns
   where table_schema=current_schema() and table_name='project_meetings'
   and column_name='facilitation') as present`);
 return rows[0]?.present??false;
}
async function cleanup(){
 if(tracked.projects.length){
  for(const table of ["project_task_submissions","project_submission_reviews","project_submissions",
   "project_meeting_history","project_meetings","project_members","project_resources","project_resource_audit","project_tasks",
   "project_sprints","project_releases"]){
   await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[tracked.projects]);
  }
  await pool.query("delete from project_instances where id=any($1::uuid[])",[tracked.projects]);
 }
 if(tracked.templates.length){
  for(const table of ["project_template_college_assignments"]){
   await pool.query("delete from "+table+" where template_id=any($1::uuid[])",[tracked.templates]);
  }
  // DB070 history is append-only; DB071 header pointers reference it. Never
    // disable triggers or delete permanent revision rows from a test teardown.
    const retention = await pool.query<{ retainHistory: boolean }>(
      "select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
    );
    if (!retention.rows[0]?.retainHistory) {
      await pool.query("delete from project_template_versions where template_id=any($1::uuid[])",[tracked.templates]);
      await pool.query("delete from project_templates where id=any($1::uuid[])",[tracked.templates]);
    }
 }
 tracked.projects=[];tracked.templates=[];
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});

async function fixture(){
 const suffix=randomUUID().replaceAll("-","").slice(0,12);
 const template=await createProjectTemplate(root,{
  slug:"chat7-facilitated-t-"+suffix,title:"Facilitated meetings "+suffix,
  blueprint:{overview:{goal:"Meeting safety",deliverables:["Recorded follow-up"]},
   releases:[{key:"r",title:"Release",sequence:0}],
   sprints:[{key:"s",releaseKey:"r",title:"Sprint",sequence:0}],
   tasks:[{key:"t",sprintKey:"s",title:"Task",priority:"MEDIUM" as const,sequence:0}],
   resources:[]},
 });
 tracked.templates.push(template.template.id);
 await publishProjectTemplate(root,template.template.id);
 await assignProjectTemplateToCollege(scopedRoot,template.template.id,SEED_IDS.collegeA);
 const project=await createProjectInstance(admin,{
  collegeId:SEED_IDS.collegeA,templateId:template.template.id,
  slug:"chat7-facilitated-p-"+suffix,title:"Meeting lifecycle "+suffix,
 });
 tracked.projects.push(project.id);
 await addProjectMember(admin,project.id,{
  membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
 });
 await addProjectMember(admin,project.id,{
  membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
 });
 return project;
}
async function projectToken(id:string){
 const {rows}=await pool.query<{updated_at:Date}>(
  "select updated_at from project_instances where id=$1",[id]);
 return rows[0]!.updated_at.toISOString();
}
const window={
 title:"Sprint review",agenda:"Discuss finished work",startsAt:"2099-02-01T10:00:00+05:30",
 endsAt:"2099-02-01T10:30:00+05:30",timeZone:"Asia/Kolkata" as const,
};
describe("MEN-projects-meetings-27 persisted facilitator lifecycle",()=>{
 it("MEN-projects-meetings-27 keeps saved and cancelled private drafts hidden from learners",async({skip})=>{
  if(!(await migrationReady()))skip();
  const project=await fixture();
  const draft=await scheduleProjectMeeting(mentor,project.id,null,{
   ...window,status:"DRAFT",expectedProjectUpdatedAt:await projectToken(project.id),
   facilitation:{...emptyMentorMeetingFacilitation,notes:"Unsent private draft"},
  });
  expect(draft.status).toBe("DRAFT");
  expect((await listProjectMeetings(learner,project.id)).some(row=>row.id===draft.id)).toBe(false);
  expect((await listProjectMeetings(mentor,project.id)).some(row=>row.id===draft.id)).toBe(true);
  const cancelled=await decideMentorProjectMeeting(mentor,project.id,draft.id,{
   action:"CANCEL",expectedUpdatedAt:draft.updatedAt.toISOString(),confirmed:true,
  });
  expect(cancelled.status).toBe("CANCELLED");
  expect((await listProjectMeetings(learner,project.id)).some(row=>row.id===draft.id)).toBe(false);
  expect((await listProjectMeetings(mentor,project.id)).find(row=>row.id===draft.id)?.status)
   .toBe("CANCELLED");
  // The private draft's cancellation is still recorded as one audited revision,
  // but no outward notification is sent for an unpublished draft.
  const {rows}=await pool.query<{count:string}>(`
   select count(*)::text from activity_events where subject_id=$1
   and event_type='projects.meeting.decided'`,[draft.id]);
  expect(Number(rows[0]?.count??0)).toBe(1);
  const notices=await pool.query<{count:string}>(`
   select count(*)::text from in_app_notifications n
   join activity_events e on e.id=n.event_id
   where e.subject_id=$1 and e.event_type='projects.meeting.decided'`,[draft.id]);
  expect(Number(notices.rows[0]?.count??0)).toBe(0);
 });
 it("MEN-projects-meetings-27 persists facilitator notes without leaking them into learner workspace",async({skip})=>{
  if(!(await migrationReady()))skip();
  const project=await fixture();
  const workspace=await getProjectInstanceWorkspace(mentor,project.id);
  const meeting=await scheduleProjectMeeting(mentor,project.id,null,{
   ...window,status:"SCHEDULED",outcome:"Work reviewed",meetingUrl:"https://meet.example.edu/room",
   expectedProjectUpdatedAt:await projectToken(project.id),
   linkedSprintId:workspace.sprints[0]!.id,linkedTaskId:workspace.tasks[0]!.id,
   facilitation:{...emptyMentorMeetingFacilitation,notes:"Private reviewer preparation",
    actionItems:"Follow up after review",followUpStatus:"OPEN"},
  });
  expect(meeting.facilitation.notes).toBe("Private reviewer preparation");
  const mentorRows=await listProjectMeetings(mentor,project.id);
  const learnerRows=await listProjectMeetings(learner,project.id);
  expect(mentorRows.find(row=>row.id===meeting.id)?.facilitation.notes)
   .toBe("Private reviewer preparation");
  expect(learnerRows.find(row=>row.id===meeting.id)?.facilitation)
   .toEqual(emptyMentorMeetingFacilitation);
  const activityCount=async()=>Number((await pool.query<{count:string}>(`
   select count(*)::text as count from activity_events where subject_id=$1
    and event_type='projects.meeting.decided'`,[meeting.id])).rows[0]?.count??0);
  const before=await activityCount();
  const updated=await scheduleProjectMeeting(admin,project.id,meeting.id,{
   ...window,status:"SCHEDULED",meetingUrl:"https://meet.example.edu/room",
   expectedUpdatedAt:meeting.updatedAt.toISOString(),
   // API note edits deliberately omit ceremony, linked sprint and linked task.
   facilitation:{...emptyMentorMeetingFacilitation,notes:"Revised mentor-only notes"},
  });
  expect(updated.scheduledByUserId).toBe(mentor.user.id);
  expect(updated.linkedSprintId).toBe(workspace.sprints[0]!.id);
  expect(updated.linkedTaskId).toBe(workspace.tasks[0]!.id);
  expect(updated.facilitation.notes).toBe("Revised mentor-only notes");
  expect(await activityCount()).toBe(before);
  expect((await listProjectMeetings(learner,project.id)).find(row=>row.id===meeting.id)?.facilitation)
   .toEqual(emptyMentorMeetingFacilitation);
  await expect(decideMentorProjectMeeting(learner,project.id,meeting.id,{
   action:"CANCEL",confirmed:true,expectedUpdatedAt:updated.updatedAt.toISOString(),
  })).rejects.toBeDefined();
  const completed=await decideMentorProjectMeeting(mentor,project.id,meeting.id,{
   action:"COMPLETE",confirmed:true,expectedUpdatedAt:updated.updatedAt.toISOString(),
  });
  expect(completed.status).toBe("COMPLETED");
  expect((await listProjectMeetings(learner,project.id)).find(row=>row.id===meeting.id))
   .toMatchObject({status:"COMPLETED",outcome:"Work reviewed"});
  await expect(decideMentorProjectMeeting(mentor,project.id,meeting.id,{
   action:"CANCEL",confirmed:true,expectedUpdatedAt:meeting.updatedAt.toISOString(),
  })).rejects.toBeDefined();
 });
});
