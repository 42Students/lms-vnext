import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege} from "@/modules/projects/template-service";
import {createProjectInstance} from "@/modules/projects/instance-service";
import {replaceCollegeProjectLearners} from "@/modules/projects/college-project-roster-service";
import {updateCollegeProjectSummary} from "@/modules/projects/college-project-summary-service";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const prefix="chat4-actor-"+randomUUID().slice(0,10);
const root:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"seed-root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
const actingRoot:RequestContext={...root,adminScope:{collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization}};
const seedAdmin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
let actorUser:string|null=null;
let actorMembership:string|null=null;

async function cleanup(){
 if(!pool)return;
 const projects=await pool.query<{id:string}>("select id::text from project_instances where slug like $1",[prefix+"%"]);
 const ids=projects.rows.map(r=>r.id);
 if(ids.length){
  await pool.query("delete from in_app_notifications where event_id in (select id from activity_events where metadata->>'projectId'=any($1::text[]) or subject_id=any($1::text[]))",[ids]);
  await pool.query("delete from activity_events where metadata->>'projectId'=any($1::text[]) or subject_id=any($1::text[])",[ids]);
  for(const table of ["project_task_submissions","project_members","project_resources","project_tasks","project_sprints","project_releases"])
   await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[ids]);
  await pool.query("delete from project_instances where id=any($1::uuid[])",[ids]);
 }
 const templates=await pool.query<{id:string}>("select id::text from project_templates where slug like $1",[prefix+"%"]);
 const templateIds=templates.rows.map(x=>x.id);
 if(templateIds.length){
  await pool.query("delete from project_template_college_assignments where template_id=any($1::uuid[])",[templateIds]);
  // Preserve DB070 append-only history and DB071 deferred version pointers.
  // The disposable fixture slugs/UUIDs are unique; no guard bypass is used.
  const retention = await pool.query<{retainHistory:boolean}>(
    "select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
    "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
    "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
    "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
  );
  if (!retention.rows[0]?.retainHistory) {
   await pool.query("delete from project_template_versions where template_id=any($1::uuid[])",[templateIds]);
   await pool.query("delete from project_templates where id=any($1::uuid[])",[templateIds]);
  }
 }
 if(actorMembership){
  await pool.query("delete from membership_roles where membership_id=$1",[actorMembership]);
  await pool.query("delete from college_memberships where id=$1",[actorMembership]);
  actorMembership=null;
 }
 if(actorUser){await pool.query("delete from users where id=$1",[actorUser]);actorUser=null;}
}

async function fixture(){
 if(!pool)throw new Error("Isolated PostgreSQL required");
 const tag=randomUUID().slice(0,8);
 const template=await createProjectTemplate(root,{
  slug:prefix+"-template-"+tag,title:"College actor revocation fixture",
  blueprint:{overview:{goal:"Test role revocation",deliverables:["A release"]},
   releases:[{key:"r1",title:"Release 1",sequence:0}],
   sprints:[{key:"s1",releaseKey:"r1",title:"Sprint 1",sequence:0}],
   tasks:[{key:"t1",sprintKey:"s1",title:"Task",priority:"MEDIUM" as const,sequence:0}],resources:[]},
 });
 await publishProjectTemplate(root,template.template.id);
 await assignProjectTemplateToCollege(actingRoot,template.template.id,SEED_IDS.collegeA);
 const project=await createProjectInstance(seedAdmin,{
  collegeId:SEED_IDS.collegeA,templateId:template.template.id,
  slug:prefix+"-project-"+tag,title:"Actor-locked college project",
 });
 actorUser=randomUUID();actorMembership=randomUUID();
 await pool.query("insert into users(id,identity_uid,display_name) values($1,$2,$3)",
  [actorUser,prefix+"-admin-"+tag,"Test College Admin"]);
 await pool.query("insert into college_memberships(id,user_id,college_id) values($1,$2,$3)",
  [actorMembership,actorUser,SEED_IDS.collegeA]);
 await pool.query("insert into membership_roles(membership_id,role) values($1,'COLLEGE_ADMIN')",[actorMembership]);
 const context:RequestContext={
  user:{id:actorUser,identityUid:prefix+"-admin-"+tag,platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:actorMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
   status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
 };
 return {project,context};
}

afterEach(cleanup);
afterAll(async()=>{await cleanup();await pool?.end();await closeDatabaseConnection();});

describe.skipIf(!enabled)("PROJ-BREAK-COL-ACTOR real PostgreSQL revocation races",()=>{
 it("PROJ-BREAK-COL-ACTOR-PG-01 disabled actor cannot patch the workspace after request context was captured",async()=>{
  const {project,context}=await fixture();
  const expected=project.updatedAt.toISOString();
  await pool!.query("update users set platform_status='DISABLED' where id=$1",[context.user.id]);
  await expect(updateCollegeProjectSummary(context,project.id,{
   title:"Unauthorized overwrite",summary:project.summary,status:"PLANNED",progressPercent:0,
   phase:null,dueLabel:null,courseLabel:null,sectionId:null,blocker:null,nextAction:null,
   startDate:null,endDate:null,sprintLengthWeeks:null,estimationUnit:null,
   expectedTitle:project.title,expectedSummary:project.summary,
   expectedStatus:"PLANNED",expectedUpdatedAt:expected,
  })).rejects.toMatchObject({name:"AuthorizationError"});
  const row=await pool!.query<{title:string}>("select title from project_instances where id=$1",[project.id]);
  expect(row.rows[0]?.title).toBe(project.title);
 });

 it("PROJ-BREAK-COL-ACTOR-PG-02 revoked College Admin role blocks both roster writes and no-op retries",async()=>{
  const {project,context}=await fixture();
  await pool!.query("delete from membership_roles where membership_id=$1 and role='COLLEGE_ADMIN'",
   [context.membership!.id]);
  for(const members of [[],[SEED_IDS.learnerCollegeAMembership]]){
   await expect(replaceCollegeProjectLearners(context,project.id,{
    learnerMembershipIds:members,expectedUpdatedAt:project.updatedAt.toISOString(),
   })).rejects.toMatchObject({name:"AuthorizationError"});
  }
  const members=await pool!.query<{id:string}>("select id from project_members where project_id=$1",[project.id]);
  expect(members.rows).toHaveLength(0);
 });
});
