import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege}
  from "@/modules/projects/template-service";
import {createProjectInstance} from "@/modules/projects/instance-service";
import {addProjectMember} from "@/modules/projects/member-service";
import {rescheduleMentorMeeting} from "@/modules/projects/mentor-meeting-reschedule-service";
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
    for(const table of ["project_template_college_assignments","project_template_versions"])
      await pool.query("delete from "+table+" where template_id=any($1::uuid[])",[tracked.templates]);
    await pool.query("delete from project_templates where id=any($1::uuid[])",[tracked.templates]);
  }
  tracked.projects=[];tracked.templates=[];
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});
async function fixture(){
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const template=await createProjectTemplate(root,{slug:"chat11-reschedule-t-"+suffix,
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
    templateId:template.template.id,slug:"chat11-reschedule-p-"+suffix,title:"Notes project "+suffix});
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.facultyCollegeAMembership,
    role:"MENTOR",isPrimary:true});
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,
    role:"LEARNER"});
  const meetingId=randomUUID();
  await pool.query(`insert into project_meetings
    (id,project_id,status,meeting_type,title,starts_at,ends_at,time_zone,
     requested_by_membership_id,created_by_user_id,scheduled_by_user_id,
     scheduled_by_membership_id,meeting_url)
     values ($1,$2,'SCHEDULED','GENERAL',$3,
       '2026-11-01T09:00:00Z','2026-11-01T10:00:00Z','Asia/Kolkata',
       $4,$5,$6,$7,'https://meet.example.org/room')`,[
      meetingId,project.id,"Scheduled fixture "+suffix,
      SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser,
      SEED_IDS.facultyUser,SEED_IDS.facultyCollegeAMembership,
    ]);
  return {project,meetingId};
}
describe("Mentor meeting reschedule deletion boundaries",()=>{
  it("rejects soft-deleted projects and archived meeting records without updates",async()=>{
    const {project,meetingId}=await fixture();
    const row=(await pool.query<{updated_at:Date;starts_at:Date}>(
      "SELECT updated_at,starts_at FROM project_meetings WHERE id=$1",[meetingId])).rows[0]!;
    const params={projectId:project.id,meetingId};
    const input={startsAt:"2099-11-02T12:00:00+05:30",
      endsAt:"2099-11-02T13:00:00+05:30",
      expectedUpdatedAt:row.updated_at.toISOString(),confirmed:true as const};
    await pool.query("UPDATE project_instances SET deleted_at=now() WHERE id=$1",[project.id]);
    try{
      await expect(rescheduleMentorMeeting(mentor,params,input)).rejects.toBeDefined();
    }finally{
      await pool.query("UPDATE project_instances SET deleted_at=null WHERE id=$1",[project.id]);
    }
    await pool.query("UPDATE project_meetings SET deleted_at=now() WHERE id=$1",[meetingId]);
    await expect(rescheduleMentorMeeting(mentor,params,input)).rejects.toBeDefined();
    const after=(await pool.query<{updated_at:Date;starts_at:Date}>(
      "SELECT updated_at,starts_at FROM project_meetings WHERE id=$1",[meetingId])).rows[0]!;
    expect(after.updated_at.getTime()).toBe(row.updated_at.getTime());
    expect(after.starts_at.getTime()).toBe(row.starts_at.getTime());
    const count=await pool.query<{count:string}>(
      "SELECT count(*)::text AS count FROM activity_events WHERE event_type='projects.meeting.rescheduled' AND subject_id=$1",
      [meetingId]);
    expect(count.rows[0]?.count).toBe("0");
  });
});

describe("Mentor meeting reschedule PostgreSQL audit and CAS",()=>{
  it("reschedules once, logs audit and denies stale/conflicting/wrong-scope writes",async()=>{
    const {project,meetingId}=await fixture();
    await pool.query(`update project_meetings set updated_at =
      date_trunc('milliseconds',updated_at)+interval '285 microseconds' where id=$1`,[meetingId]);
    const [original]=(await pool.query<{updated_at:Date}>(
      "select updated_at from project_meetings where id=$1",[meetingId])).rows;
    expect(original).toBeDefined();
    const params={projectId:project.id,meetingId};
    const input={startsAt:"2026-11-02T12:00:00+05:30",
      endsAt:"2026-11-02T13:00:00+05:30",
      expectedUpdatedAt:original!.updated_at.toISOString(),confirmed:true as const};
    const updated=await rescheduleMentorMeeting(mentor,params,input);
    expect(updated.startsAt.toISOString()).toBe("2026-11-02T06:30:00.000Z");
    expect(updated.timeZone).toBe("Asia/Kolkata");
    const event=await pool.query<{actor_user_id:string;college_id:string;
      metadata:Record<string,unknown>}>(`select actor_user_id,college_id,metadata
      from activity_events where event_type='projects.meeting.rescheduled'
      and subject_id=$1`,[meetingId]);
    expect(event.rows).toHaveLength(1);
    expect(event.rows[0]).toMatchObject({actor_user_id:mentor.user.id,
      college_id:SEED_IDS.collegeA,metadata:{meetingId,projectId:project.id}});
    await expect(rescheduleMentorMeeting(mentor,params,input))
      .rejects.toMatchObject({code:"PROJECT_MEETING_STALE_VERSION"});
    const otherId=randomUUID();
    await pool.query(`insert into project_meetings
      (id,project_id,status,meeting_type,title,starts_at,ends_at,time_zone,
       requested_by_membership_id,created_by_user_id,scheduled_by_user_id,
       scheduled_by_membership_id,meeting_url)
      values ($1,$2,'SCHEDULED','GENERAL','Conflict fixture',
        '2026-11-03T08:00:00Z','2026-11-03T09:00:00Z','Asia/Kolkata',
        $3,$4,$5,$6,'https://meet.example.org/conflict')`,[
        otherId,project.id,SEED_IDS.learnerCollegeAMembership,
        SEED_IDS.learnerUser,SEED_IDS.facultyUser,SEED_IDS.facultyCollegeAMembership,
      ]);
    const newInput={...input,startsAt:"2026-11-03T13:45:00+05:30",
      endsAt:"2026-11-03T14:15:00+05:30",
      expectedUpdatedAt:updated.updatedAt.toISOString()};
    await expect(rescheduleMentorMeeting(mentor,params,newInput))
      .rejects.toMatchObject({code:"PROJECT_MEETING_SCHEDULE_CONFLICT"});
    await expect(rescheduleMentorMeeting(learner,params,newInput)).rejects.toBeDefined();
    const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
      id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
    await expect(rescheduleMentorMeeting(foreign,params,newInput)).rejects.toBeDefined();
    const disabled:RequestContext={...mentor,user:{...mentor.user,platformStatus:"DISABLED"}};
    await expect(rescheduleMentorMeeting(disabled,params,newInput)).rejects.toBeDefined();
    expect((await pool.query(`select count(*)::int as n from activity_events
      where event_type='projects.meeting.rescheduled' and subject_id=$1`,[meetingId])).rows[0].n).toBe(1);
  });
});
