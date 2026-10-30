import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {SEED_IDS} from "../../scripts/db-seed-data";
import type {RequestContext} from "@/modules/identity/context";
import {addProjectMember} from "@/modules/projects/member-service";
import {createProjectInstance,getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {
  createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege,
} from "@/modules/projects/template-service";
import {
  startProjectSprint,completeProjectSprint,
} from "@/modules/projects/lifecycle-service";
import {listMentorSprintSignOffSnapshots} from
  "@/modules/projects/mentor-sprint-signoff-snapshot-service";

if(!process.env.TEST_DATABASE_URL)
  throw new Error("Requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const root:RequestContext={user:{id:SEED_IDS.superAdminUser,
  identityUid:"signoff-root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:null};
const scopedRoot:RequestContext={...root,adminScope:{
  organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
}};
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,
  identityUid:"signoff-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,
    collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const mentor:RequestContext={user:{id:SEED_IDS.facultyUser,
  identityUid:"signoff-mentor",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,
    collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["MENTOR","FACULTY"]}};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,
  identityUid:"signoff-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,
    collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["LEARNER"]}};
const tracked:{projects:string[];templates:string[]}={projects:[],templates:[]};
async function cleanup(){
  if(tracked.projects.length){
    for(const table of ["project_task_submissions","project_submission_reviews",
      "project_submissions","project_meetings","project_members","project_resources",
      "project_tasks","project_sprints","project_releases"])
      await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[tracked.projects]);
    await pool.query("delete from project_instances where id=any($1::uuid[])",[tracked.projects]);
    tracked.projects=[];
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
    tracked.templates=[];
  }
  // Do not delete append-only activity_events.
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});
async function fixture(){
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const template=await createProjectTemplate(root,{
    slug:"mentor-signoff-t-"+suffix,title:"Mentor signoff "+suffix,
    blueprint:{
      overview:{goal:"Concurrent and rollback testing",deliverables:["Review"]},
      releases:[
        {key:"r1",title:"Release one",sequence:0},
        {key:"r2",title:"Release two",sequence:1},
      ],
      sprints:[
        {key:"s1",releaseKey:"r1",title:"Sprint one",sequence:0},
        {key:"s2",releaseKey:"r2",title:"Sprint two",sequence:0},
      ],
      tasks:[
        {key:"t1",sprintKey:"s1",title:"Carry item",priority:"HIGH" as const,sequence:0},
        {key:"t2",sprintKey:"s1",title:"Backlog item",priority:"MEDIUM" as const,sequence:1},
        {key:"t3",sprintKey:"s1",title:"Archive item",priority:"LOW" as const,sequence:2},
        {key:"t4",sprintKey:"s2",title:"Already next",priority:"LOW" as const,sequence:0},
      ],
      resources:[],
    },
  });
  tracked.templates.push(template.template.id);
  await publishProjectTemplate(root,template.template.id);
  await assignProjectTemplateToCollege(scopedRoot,template.template.id,SEED_IDS.collegeA);
  const project=await createProjectInstance(admin,{
    collegeId:SEED_IDS.collegeA,templateId:template.template.id,
    slug:"mentor-signoff-p-"+suffix,title:"Mentor signoff project "+suffix,
  });
  tracked.projects.push(project.id);
  await addProjectMember(admin,project.id,{
    membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
  });
  await addProjectMember(admin,project.id,{
    membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
  });
  const initial=await getProjectInstanceWorkspace(mentor,project.id);
  const current=initial.sprints.find(s=>s.title==="Sprint one")!;
  const next=initial.sprints.find(s=>s.title==="Sprint two")!;
  await startProjectSprint(mentor,project.id,current.id);
  const fresh=await getProjectInstanceWorkspace(mentor,project.id);
  const tasks=fresh.tasks.filter(t=>t.sprintId===current.id)
    .sort((a,b)=>a.sequence-b.sequence);
  expect(tasks).toHaveLength(3);
  return {projectId:project.id,current:current.id,next:next.id,tasks};
}
type Decision={taskId:string;destination:"NEXT"|"BACKLOG"|"DROP";expectedUpdatedAt:string};
const decisionsFor=(tasks:Awaited<ReturnType<typeof fixture>>["tasks"]):Decision[]=>tasks.map((t,i)=>({
  taskId:t.id,destination:(["NEXT","BACKLOG","DROP"] as const)[i]!,
  expectedUpdatedAt:t.updatedAt.toISOString(),
}));
const taskRows=async(projectId:string)=>pool.query<{id:string;sprint_id:string|null;
  deleted_at:Date|null;carried_from_sprint_id:string|null}>(
  "select id,sprint_id,deleted_at,carried_from_sprint_id from project_tasks where project_id=$1 order by id",
  [projectId]);
const snapEvents=async(sprintId:string)=>pool.query<{id:string}>(`
  select id from activity_events where subject_type='project_sprint' and subject_id=$1
  and metadata->>'mentorSignOffSnapshotVersion'='1'`,[sprintId]);

describe("Mentor sprint sign-off adversarial transactions (PostgreSQL)",()=>{
  it("persists three dispositions atomically and freezes pre-move historical facts",async()=>{
    const {projectId,current,next,tasks}=await fixture();
    const before=await taskRows(projectId);
    await expect(completeProjectSprint(learner,projectId,current,undefined,
      decisionsFor(tasks),next)).rejects.toBeDefined();
    expect((await taskRows(projectId)).rows).toEqual(before.rows);
    const result=await completeProjectSprint(mentor,projectId,current,
      "Reviewed all three incomplete tasks",decisionsFor(tasks),next);
    expect(result.status).toBe("COMPLETED");
    const after=(await taskRows(projectId)).rows;
    expect(after.find(t=>t.id===tasks[0]!.id)).toMatchObject({
      sprint_id:next,deleted_at:null,carried_from_sprint_id:current,
    });
    expect(after.find(t=>t.id===tasks[1]!.id)).toMatchObject({
      sprint_id:null,deleted_at:null,carried_from_sprint_id:current,
    });
    expect(after.find(t=>t.id===tasks[2]!.id)).toMatchObject({
      sprint_id:null,carried_from_sprint_id:current,
    });
    expect(after.find(t=>t.id===tasks[2]!.id)?.deleted_at).not.toBeNull();
    const historical=await listMentorSprintSignOffSnapshots(mentor,projectId,[current]);
    expect(historical).toHaveLength(1);
    expect(historical[0]).toMatchObject({sprintId:current,taskCount:3,donePoints:0});
    expect(await snapEvents(current)).toMatchObject({rowCount:1});
    await expect(completeProjectSprint(mentor,projectId,current,undefined,
      decisionsFor(tasks),next)).rejects.toBeDefined();
    expect(await listMentorSprintSignOffSnapshots(mentor,projectId,[current]))
      .toEqual(historical);
  });

  it("rejects stale, missing, duplicate and nonproject task decisions without partial writes",async()=>{
    const {projectId,current,next,tasks}=await fixture();
    const before=(await taskRows(projectId)).rows;
    const valid=decisionsFor(tasks);
    const invalidSets:Decision[][]=[
      valid.slice(0,2),
      [valid[0]!,valid[0]!,valid[2]!],
      [{...valid[0]!,taskId:randomUUID()},valid[1]!,valid[2]!],
      [valid[0]!,{...valid[1]!,expectedUpdatedAt:"2000-01-01T00:00:00.000Z"},valid[2]!],
    ];
    for(const invalid of invalidSets){
      await expect(completeProjectSprint(mentor,projectId,current,undefined,
        invalid,next)).rejects.toBeDefined();
      expect((await taskRows(projectId)).rows).toEqual(before);
      expect((await snapEvents(current)).rows).toHaveLength(0);
    }
    // A rejected attempt must not poison a legitimate retry.
    await expect(completeProjectSprint(mentor,projectId,current,undefined,
      valid,next)).resolves.toMatchObject({status:"COMPLETED"});
  });

  it("rejects an already-shipped destination release and rolls back the sign-off",async()=>{
    const {projectId,current,next,tasks}=await fixture();
    const before=(await taskRows(projectId)).rows;
    await pool.query(`update project_releases set status='SHIPPED'
      where id=(select release_id from project_sprints where id=$1)`,[next]);
    await expect(completeProjectSprint(mentor,projectId,current,undefined,
      decisionsFor(tasks),next)).rejects.toBeDefined();
    expect((await taskRows(projectId)).rows).toEqual(before);
    const rows=await pool.query<{status:string}>(
      "select status from project_sprints where id=$1",[current]);
    expect(rows.rows[0]?.status).toBe("ACTIVE");
    expect((await snapEvents(current)).rows).toHaveLength(0);
  });

  it("serializes competing sign-off requests so exactly one snapshot and move survives",async()=>{
    const {projectId,current,next,tasks}=await fixture();
    const input=decisionsFor(tasks);
    const both=await Promise.allSettled([
      completeProjectSprint(mentor,projectId,current,undefined,input,next),
      completeProjectSprint(mentor,projectId,current,undefined,input,next),
    ]);
    expect(both.filter(outcome=>outcome.status==="fulfilled")).toHaveLength(1);
    expect(both.filter(outcome=>outcome.status==="rejected")).toHaveLength(1);
    expect((await snapEvents(current)).rows).toHaveLength(1);
    expect((await taskRows(projectId)).rows
      .filter(t=>t.carried_from_sprint_id===current)).toHaveLength(3);
  });
});
