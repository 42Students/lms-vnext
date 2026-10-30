import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {addProjectMember} from "@/modules/projects/member-service";
import {createProjectInstance,getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege} from "@/modules/projects/template-service";
import {completeMentorProject,getMentorProjectCloseout} from "@/modules/projects/mentor-closeout-service";
if(!process.env.TEST_DATABASE_URL) throw new Error("Requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const root:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
const scopedRoot:RequestContext={...root,adminScope:{
  organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
}};
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.collegeAdminMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const mentor:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.facultyCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["MENTOR","FACULTY"]}};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.learnerCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["LEARNER"]}};
const tracked={projects:[] as string[],templates:[] as string[]};
async function cleanup(){
  if(tracked.projects.length){
    const ids=[...tracked.projects];
    // Never DELETE append-only activity_events, even in fixtures.
    for(const table of ["project_task_submissions","project_submission_reviews",
      "project_submissions","project_meetings","project_members","project_resources",
      "project_tasks","project_sprints","project_releases"]){
      await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[ids]);
    }
    await pool.query("delete from project_instances where id=any($1::uuid[])",[ids]);
    tracked.projects=[];
  }
  if(tracked.templates.length){
    const ids=[...tracked.templates];
    await pool.query("delete from project_template_college_assignments where template_id=any($1::uuid[])",[ids]);
    // DB070 immutable revisions and DB071 header pointers must remain intact.
    const retention=await pool.query<{retainHistory:boolean}>("select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"");
    if(!retention.rows[0]?.retainHistory){
      await pool.query("delete from project_template_versions where template_id=any(    ::uuid[])",[ids]);
      await pool.query("delete from project_templates where id=any(    ::uuid[])",[ids]);
    }
    tracked.templates=[];
  }
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});
async function fixture(){
  const suffix=randomUUID().replaceAll("-","").slice(0,14);
  const templ=await createProjectTemplate(root,{
    slug:"chat4-close-t-"+suffix,title:"Closeout "+suffix,
    blueprint:{overview:{goal:"Verify closeout",deliverables:["Approved delivery"]},
      releases:[{key:"r1",title:"Release 1",sequence:0}],
      sprints:[{key:"s1",releaseKey:"r1",title:"Sprint 1",sequence:0}],
      tasks:[{key:"t1",sprintKey:"s1",title:"Task 1",priority:"MEDIUM" as const,sequence:0}],
      resources:[]},
  });
  tracked.templates.push(templ.template.id);
  await publishProjectTemplate(root,templ.template.id);
  await assignProjectTemplateToCollege(scopedRoot,templ.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{
    collegeId:SEED_IDS.collegeA,templateId:templ.template.id,
    slug:"chat4-close-p-"+suffix,title:"Closeout project "+suffix,
  });
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.facultyCollegeAMembership,
    role:"MENTOR",isPrimary:true});
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,
    role:"LEARNER"});
  const ws=await getProjectInstanceWorkspace(mentor,project.id);
  expect(ws.releases).toHaveLength(1);
  expect(ws.sprints).toHaveLength(1);
  expect(ws.tasks).toHaveLength(1);
  await pool.query("update project_instances set status='ACTIVE' where id=$1",[project.id]);
  const initial=await getMentorProjectCloseout(mentor,{projectId:project.id});
  expect(initial.checklist.canComplete).toBe(false);
  return {project,ws};
}
describe("Mentor closeout fresh PG conditional transition",()=>{
  it("audits exactly one valid completion and denies forged, foreign and stale tokens",async()=>{
    const {project,ws}=await fixture();
    await pool.query("update project_tasks set status='DONE' where project_id=$1",[project.id]);
    await pool.query("update project_sprints set status='COMPLETED' where project_id=$1",[project.id]);
    await pool.query("update project_releases set status='SHIPPED' where project_id=$1",[project.id]);
    const submissionId=randomUUID();
    await pool.query(`insert into project_submissions
      (id,project_id,version,status,summary,created_by_membership_id,
       submitted_by_membership_id,submitted_at)
      values ($1,$2,1,'APPROVED','Approved final submission',$3,$3,now())`,[
      submissionId,project.id,SEED_IDS.learnerCollegeAMembership,
    ]);
    const before=await getMentorProjectCloseout(mentor,{projectId:project.id});
    expect(before.checklist.canComplete).toBe(true);
    const body={expectedUpdatedAt:before.expectedUpdatedAt,
      confirmDeliveryReviewed:true,confirmTeamNotified:true,confirmCloseout:true};
    const forged:RequestContext={...learner,
      membership:{...learner.membership!,roles:["MENTOR"]}};
    await expect(completeMentorProject(forged,{projectId:project.id},body))
      .rejects.toBeDefined();
    const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
      id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,roles:["MENTOR"]}};
    await expect(completeMentorProject(foreign,{projectId:project.id},body))
      .rejects.toBeDefined();
    await expect(completeMentorProject(mentor,{projectId:project.id},{
      ...body,expectedUpdatedAt:"2020-01-01T00:00:00Z",
    })).rejects.toMatchObject({code:"PROJECT_INVALID_STATE"});
    const completed=await completeMentorProject(mentor,{projectId:project.id},body);
    expect(completed.status).toBe("COMPLETED");
    await expect(completeMentorProject(mentor,{projectId:project.id},body))
      .rejects.toMatchObject({code:"PROJECT_INVALID_STATE"});
    const persisted=await getMentorProjectCloseout(mentor,{projectId:project.id});
    expect(persisted.status).toBe("COMPLETED");
    const aud=await pool.query<{event_type:string;actor_user_id:string}>(
      `select event_type,actor_user_id from activity_events
       where event_type='projects.project.completed' and subject_id=$1`,[project.id]);
    expect(aud.rows).toEqual([{event_type:"projects.project.completed",actor_user_id:mentor.user.id}]);
    expect(ws.tasks[0]?.status).not.toBe("DONE");
  });
});
