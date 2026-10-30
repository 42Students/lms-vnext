import {randomUUID} from "node:crypto";
import {setTimeout as sleep} from "node:timers/promises";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {SEED_IDS} from "../../scripts/db-seed-data";
import type {RequestContext} from "@/modules/identity/context";
import {addProjectMember} from "@/modules/projects/member-service";
import {createProjectInstance} from "@/modules/projects/instance-service";
import {
  createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege,
} from "@/modules/projects/template-service";
import {
  getMentorProjectActivitySeenState,markMentorProjectActivitySeen,
} from "@/modules/projects/mentor-activity-seen-service";
import {postMentorProjectUpdate} from "@/modules/projects/mentor-project-update-service";
import {listProjectActivity} from "@/modules/projects/activity-service";

// Requires the seeded, migrated disposable DB. Never point TEST_DATABASE_URL at
// a shared environment: this suite creates project/member and immutable audit data.
if(!process.env.TEST_DATABASE_URL)
  throw new Error("Requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const root:RequestContext={user:{id:SEED_IDS.superAdminUser,
  identityUid:"seen-root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:null};
const scopedRoot:RequestContext={...root,adminScope:{
  organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
}};
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,
  identityUid:"seen-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,
    collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const mentor:RequestContext={user:{id:SEED_IDS.facultyUser,
  identityUid:"seen-mentor",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,
    collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["MENTOR","FACULTY"]}};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,
  identityUid:"seen-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,
    collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["LEARNER"]}};

const tracked:{projects:string[];templates:string[]}={projects:[],templates:[]};
async function cleanup(){
  if(tracked.projects.length){
    // Append-only activity events are intentionally not removed.
    for(const table of ["project_task_submissions","project_submission_reviews",
      "project_submissions","project_meetings","project_members","project_resources",
      "project_tasks","project_sprints","project_releases"]){
      await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[tracked.projects]);
    }
    await pool.query("delete from project_instances where id=any($1::uuid[])",[tracked.projects]);
    tracked.projects=[];
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
    tracked.templates=[];
  }
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});

async function fixture(){
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const template=await createProjectTemplate(root,{
    slug:"mentor-seen-t-"+suffix,title:"Mentor seen "+suffix,
    blueprint:{
      overview:{goal:"Verify persisted activity read state",deliverables:["Report"]},
      releases:[{key:"r1",title:"Release",sequence:0}],
      sprints:[{key:"s1",releaseKey:"r1",title:"Sprint",sequence:0}],
      tasks:[{key:"t1",sprintKey:"s1",title:"Task",priority:"MEDIUM" as const,sequence:0}],
      resources:[],
    },
  });
  tracked.templates.push(template.template.id);
  await publishProjectTemplate(root,template.template.id);
  await assignProjectTemplateToCollege(scopedRoot,template.template.id,SEED_IDS.collegeA);
  const ids:string[]=[];
  for(const index of [1,2]){
    const project=await createProjectInstance(admin,{
      collegeId:SEED_IDS.collegeA,templateId:template.template.id,
      slug:"mentor-seen-p"+index+"-"+suffix,title:"Mentor seen project "+index+" "+suffix,
    });
    tracked.projects.push(project.id);
    await addProjectMember(admin,project.id,{
      membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
    });
    await addProjectMember(admin,project.id,{
      membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
    });
    await pool.query("update project_instances set status='ACTIVE' where id=$1",[project.id]);
    ids.push(project.id);
  }
  return {first:ids[0]!,second:ids[1]!};
}

describe("Mentor project Activity seen state (PostgreSQL)",()=>{
  it("starts with no claimed unread baseline and returns the actual persisted audit timestamp",async()=>{
    const {first}=await fixture();
    expect(await getMentorProjectActivitySeenState(mentor,first))
      .toEqual({lastSeenAt:null,newCount:null});
    const result=await markMentorProjectActivitySeen(mentor,first);
    const saved=await pool.query<{occurred_at:Date;college_id:string;
      organization_id:string;actor_user_id:string}>(`
      select occurred_at,college_id,organization_id,actor_user_id
      from activity_events
      where subject_type='mentor_project_activity_seen' and subject_id=$1
      order by occurred_at desc,id desc limit 1`,[first]);
    expect(saved.rows).toHaveLength(1);
    expect(result.lastSeenAt).toBe(saved.rows[0]!.occurred_at.toISOString());
    expect(saved.rows[0]).toMatchObject({
      college_id:SEED_IDS.collegeA,organization_id:SEED_IDS.organization,
      actor_user_id:mentor.user.id,
    });
    expect(await getMentorProjectActivitySeenState({...mentor},first))
      .toEqual({lastSeenAt:result.lastSeenAt,newCount:0});
  });

  it("counts only post-marker events from this project across sessions, then clears on a second mark",async()=>{
    const {first,second}=await fixture();
    await markMentorProjectActivitySeen(mentor,first);
    // The marker and new events have different trusted clock instants even on
    // installations where JavaScript timestamps have only millisecond precision.
    await sleep(15);
    await postMentorProjectUpdate(mentor,second,{message:"Not a notification for the first project"});
    expect((await getMentorProjectActivitySeenState(mentor,first)).newCount).toBe(0);
    await postMentorProjectUpdate(mentor,first,{message:"Update from this Mentor"});
    const learnerFeed=await listProjectActivity(learner,first);
    expect(learnerFeed.some(event=>event.summary==="Update from this Mentor")).toBe(true);
    expect(learnerFeed.some(event=>event.summary==="Not a notification for the first project")).toBe(false);
    const fromSecondSession:RequestContext={...mentor,
      user:{...mentor.user},membership:{...mentor.membership!}};
    expect((await getMentorProjectActivitySeenState(fromSecondSession,first)).newCount).toBe(1);
    const secondMarker=await markMentorProjectActivitySeen(fromSecondSession,first);
    const cleared=await getMentorProjectActivitySeenState(mentor,first);
    expect(cleared).toEqual({lastSeenAt:secondMarker.lastSeenAt,newCount:0});
    expect((await getMentorProjectActivitySeenState(mentor,second)).newCount).toBeNull();
  });

  it("rejects learners, forged Mentor claims, suspended accounts and foreign-college selectors without writes",async()=>{
    const {first}=await fixture();
    const forged:RequestContext={...learner,membership:{
      ...learner.membership!,roles:["MENTOR"],
    }};
    const foreign:RequestContext={...mentor,membership:{
      ...mentor.membership!,id:SEED_IDS.facultyCollegeBMembership,
      collegeId:SEED_IDS.collegeB,
    }};
    const suspended:RequestContext={...mentor,user:{
      ...mentor.user,platformStatus:"SUSPENDED",
    }};
    for(const actor of [learner,forged,foreign,suspended]){
      await expect(markMentorProjectActivitySeen(actor,first)).rejects.toBeDefined();
      await expect(getMentorProjectActivitySeenState(actor,first)).rejects.toBeDefined();
    }
    const count=await pool.query<{total:number}>(`
      select count(*)::int as total from activity_events
      where subject_type='mentor_project_activity_seen' and subject_id=$1`,[first]);
    expect(count.rows[0]?.total).toBe(0);
  });
});
