import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {addProjectMember} from "@/modules/projects/member-service";
import {createProjectInstance,getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege}
  from "@/modules/projects/template-service";
import {transitionMentorProjectTask} from "@/modules/projects/mentor-task-transition-service";
import {transitionMentorProjectSprint} from "@/modules/projects/mentor-sprint-write-service";
if(!process.env.TEST_DATABASE_URL)throw new Error("Requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const root:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"seed-root",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
const scopedRoot:RequestContext={...root,adminScope:{
  organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-admin",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.collegeAdminMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const mentor:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"seed-mentor",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.facultyCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["MENTOR","FACULTY"]}};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.learnerCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["LEARNER"]}};
const tracked:{projects:string[];templates:string[]}={projects:[],templates:[]};
async function cleanup(){
  // Do not delete append-only activity_events, or memberships/users referenced by them.
  if(tracked.projects.length){
    for(const table of ["project_task_submissions","project_submission_reviews",
      "project_submissions","project_meetings","project_members","project_resources",
      "project_tasks","project_sprints","project_releases"]){
      await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[tracked.projects]);
    }
    await pool.query("delete from project_instances where id=any($1::uuid[])",[tracked.projects]);
  }
  if(tracked.templates.length){
    for(const table of ["project_template_college_assignments"])
      await pool.query("delete from "+table+" where template_id=any($1::uuid[])",[tracked.templates]);
    // DB070 historical revisions are append-only and DB071 preserves header pointers.
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
  const unique=randomUUID().replaceAll("-","").slice(0,12);
  const template=await createProjectTemplate(root,{
    slug:"chat11-status-t-"+unique,title:"Transition template "+unique,
    blueprint:{overview:{goal:"State review",deliverables:["Task"]},
      releases:[{key:"release-a",title:"Release",sequence:0}],
      sprints:[{key:"sprint-a",releaseKey:"release-a",title:"Sprint",sequence:0}],
      tasks:[{key:"task-a",sprintKey:"sprint-a",title:"Task",priority:"HIGH" as const,sequence:0}],
      resources:[],
    },
  });
  tracked.templates.push(template.template.id);
  await publishProjectTemplate(root,template.template.id);
  await assignProjectTemplateToCollege(scopedRoot,template.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{
    collegeId:SEED_IDS.collegeA,templateId:template.template.id,
    slug:"chat11-status-p-"+unique,title:"Transition project "+unique,
  });
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.facultyCollegeAMembership,
    role:"MENTOR",isPrimary:true});
  await addProjectMember(admin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,
    role:"LEARNER"});
  const start=await getProjectInstanceWorkspace(mentor,project.id);
  const sprint=start.sprints[0]!;
  await transitionMentorProjectSprint(mentor,{projectId:project.id,sprintId:sprint.id},{
    action:"START",expectedUpdatedAt:sprint.updatedAt.toISOString(),
  });
  const active=await getProjectInstanceWorkspace(mentor,project.id);
  return {project,task:active.tasks[0]!};
}
describe("Mentor Board task transition PostgreSQL",()=>{
  it("records one scoped status/audit and rejects stale, wrong-role and foreign actors",async()=>{
    const {project,task}=await fixture();
    await pool.query(`update project_tasks set updated_at =
      date_trunc('milliseconds', updated_at)+interval '312 microseconds'
      where id=$1`,[task.id]);
    const params={projectId:project.id,taskId:task.id};
    const input={status:"BLOCKED" as const,expectedUpdatedAt:task.updatedAt.toISOString(),
      confirmed:true as const,blockerReason:"Waiting on a dependency"};
    const updated=await transitionMentorProjectTask(mentor,params,input);
    expect(updated.status).toBe("BLOCKED");
    const history=await pool.query<{actor_user_id:string;college_id:string;
      metadata:Record<string,unknown>}>(`select actor_user_id,college_id,metadata from activity_events
      where event_type='projects.task.status_changed' and subject_id=$1`,[task.id]);
    expect(history.rows).toHaveLength(1);
    expect(history.rows[0]).toMatchObject({actor_user_id:mentor.user.id,
      college_id:SEED_IDS.collegeA,metadata:{previousStatus:"TODO",nextStatus:"BLOCKED"}});
    await expect(transitionMentorProjectTask(mentor,params,input))
      .rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
    const fresh={...input,status:"IN_PROGRESS" as const,
      expectedUpdatedAt:updated.updatedAt.toISOString()};
    await expect(transitionMentorProjectTask(learner,params,fresh)).rejects.toBeDefined();
    const foreign:RequestContext={...mentor,membership:{...mentor.membership!,
      id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
    await expect(transitionMentorProjectTask(foreign,params,fresh)).rejects.toBeDefined();
    await expect(transitionMentorProjectTask(mentor,params,{...fresh,status:"DONE"}))
      .rejects.toBeDefined();
    expect((await pool.query(`select count(*)::int as n from activity_events
      where event_type='projects.task.status_changed' and subject_id=$1`,[task.id])).rows[0].n).toBe(1);
  });
});
