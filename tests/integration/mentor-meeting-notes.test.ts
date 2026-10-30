import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege}
  from "@/modules/projects/template-service";
import {createProjectInstance,getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {startProjectSprint} from "@/modules/projects/lifecycle-service";
import {addProjectMember} from "@/modules/projects/member-service";
import {getMentorMeetingNotes,updateMentorMeetingNotes}
  from "@/modules/projects/mentor-meeting-notes-service";
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
  status:"ACTIVE",roles:["MENTOR","FACULTY"]}};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"learner",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.learnerCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["LEARNER"]}};
const tracked:{projects:string[];templates:string[]}={projects:[],templates:[]};
async function cleanup(){
  // No deletions from append-only activity_events, or referenced users/memberships.
  if(tracked.projects.length){
    for(const table of ["project_task_submissions","project_submission_reviews","project_submissions",
      "project_meeting_history","project_meetings","project_members","project_resources","project_resource_audit","project_tasks",
      "project_sprints","project_releases"]){
      await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[tracked.projects]);
    }
    await pool.query("delete from project_instances where id=any($1::uuid[])",[tracked.projects]);
  }
  if(tracked.templates.length){
    for(const table of ["project_template_college_assignments"])
      await pool.query("delete from "+table+" where template_id=any($1::uuid[])",[tracked.templates]);
    // DB070/071: historical revisions and parent pointers are permanent;
    // preserving unique disposable fixtures is safer than disabling triggers.
    const retention=await pool.query<{retainHistory:boolean}>(
      "select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
    );
    if(!retention.rows[0]?.retainHistory){
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
  const template=await createProjectTemplate(root,{slug:"chat11-notes-t-"+suffix,
    title:"Meeting notes "+suffix,blueprint:{
      overview:{goal:"Document completed meetings",deliverables:["Outcome"]},
      releases:[{key:"r",title:"Release",sequence:0}],
      sprints:[{key:"s",releaseKey:"r",title:"Sprint",sequence:0}],
      tasks:[{key:"t",sprintKey:"s",title:"Task",priority:"MEDIUM" as const,sequence:0}],
      resources:[],
    }});
  tracked.templates.push(template.template.id);
  await publishProjectTemplate(root,template.template.id);
  await assignProjectTemplateToCollege(scopedRoot,template.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{collegeId:SEED_IDS.collegeA,
    templateId:template.template.id,slug:"chat11-notes-p-"+suffix,title:"Notes project "+suffix});
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.facultyCollegeAMembership,
    role:"MENTOR",isPrimary:true});
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,
    role:"LEARNER"});
  // Meeting notes are editable only while the project is ACTIVE.
  const workspace=await getProjectInstanceWorkspace(mentor,project.id);
  await startProjectSprint(mentor,project.id,workspace.sprints[0]!.id);
  const meetingId=randomUUID();
  await pool.query(`insert into project_meetings
    (id,project_id,status,meeting_type,title,starts_at,ends_at,time_zone,
     requested_by_membership_id,created_by_user_id,scheduled_by_user_id,
     scheduled_by_membership_id,meeting_url)
     values ($1,$2,'COMPLETED','GENERAL',$3,
       '2026-10-13T09:00:00Z','2026-10-13T10:00:00Z','Asia/Kolkata',$4,$5,$6,$7,
       'https://meet.example.org/room')`,[
      meetingId,project.id,"Completed fixture "+suffix,
      SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser,
      SEED_IDS.facultyUser,SEED_IDS.facultyCollegeAMembership,
    ]);
  return {project,meetingId};
}
describe("Mentor completed-meeting notes on migrated PostgreSQL",()=>{
  it("writes the authorized outcome once with audit and rejects stale/role/foreign writes",async()=>{
    const {project,meetingId}=await fixture();
    const params={projectId:project.id,meetingId};
    await pool.query(`update project_meetings set updated_at =
      date_trunc('milliseconds',updated_at)+interval '254 microseconds'
      where id=$1`,[meetingId]);
    const before=await getMentorMeetingNotes(mentor,params);
    expect(before.meeting.outcome).toBeNull();
    const input={outcome:"Decision: scope approved",confirmed:true as const,
      expectedUpdatedAt:before.meeting.updatedAt.toISOString()};
    const updated=await updateMentorMeetingNotes(mentor,params,input);
    expect(updated.outcome).toBe(input.outcome);
    expect((await getMentorMeetingNotes(mentor,params)).meeting.outcome).toBe(input.outcome);
    const events=await pool.query<{actor_user_id:string;college_id:string;
      metadata:Record<string,unknown>}>(`select actor_user_id,college_id,metadata from
      activity_events where event_type='projects.meeting.notes_updated' and subject_id=$1`,[meetingId]);
    expect(events.rows).toHaveLength(1);
    expect(events.rows[0]).toMatchObject({actor_user_id:mentor.user.id,
      college_id:SEED_IDS.collegeA,metadata:{hadNotesBefore:false,hasNotesAfter:true}});
    expect(JSON.stringify(events.rows[0])).not.toContain("Decision: scope approved");
    await expect(updateMentorMeetingNotes(mentor,params,{...input,outcome:"Stale"}))
      .rejects.toMatchObject({code:"PROJECT_MEETING_STALE_VERSION"});
    await expect(updateMentorMeetingNotes(learner,params,{
      ...input,expectedUpdatedAt:updated.updatedAt.toISOString(),outcome:"Forged",
    })).rejects.toBeDefined();
    const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
      id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
    await expect(updateMentorMeetingNotes(foreign,params,{
      ...input,expectedUpdatedAt:updated.updatedAt.toISOString(),outcome:"Foreign",
    })).rejects.toBeDefined();
    await expect(updateMentorMeetingNotes(mentor,params,{
      ...input,expectedUpdatedAt:updated.updatedAt.toISOString(),outcome:"  ",
    })).rejects.toBeDefined();
    expect((await pool.query(`select count(*)::int as n from activity_events where
      event_type='projects.meeting.notes_updated' and subject_id=$1`,[meetingId])).rows[0].n).toBe(1);
  });
});
