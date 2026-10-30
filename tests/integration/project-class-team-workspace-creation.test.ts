import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createProjectTemplate, publishProjectTemplate, assignProjectTemplateToCollege } from "@/modules/projects/template-service";
import { createClassTeamWorkspaces } from "@/modules/projects/class-team-workspace-service";
import { loadClassTeamRoster } from "@/modules/projects/class-team-roster-service";
import { previewClassTeams } from "@/modules/projects/class-team-split-model";
import { previewVersion } from "@/modules/projects/class-team-preview-token";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const suffix=randomUUID().slice(0,8);
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),section:randomUUID(),
  studentA:randomUUID(),studentB:randomUUID(),memberA:randomUUID(),memberB:randomUUID(),
  enrolA:randomUUID(),enrolB:randomUUID(),sectionA:randomUUID(),sectionB:randomUUID()};
const prefix="class-team-"+suffix;
let templateId="";
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const root:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
const scopedRoot:RequestContext={...root,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
const wrongRole:RequestContext={...admin,membership:{...admin.membership!,roles:["MENTOR"]}};
const foreign:RequestContext={...admin,membership:{...admin.membership!,collegeId:SEED_IDS.collegeB}};

async function cleanup() {
 if(!pool)return;
 const projects=await pool.query<{id:string;team_group_id:string}>("select id,team_group_id from project_instances where slug like $1",[prefix+"%"]);
 const pids=projects.rows.map(x=>x.id),gids=projects.rows.map(x=>x.team_group_id).filter(Boolean);
 if(pids.length){
  await pool.query("delete from in_app_notifications where event_id in (select id from activity_events where subject_id=any($1::text[]))",[pids]);
  await pool.query("delete from activity_events where subject_id=any($1::text[]) or metadata->>'projectId'=any($1::text[])",[pids]);
  for(const table of ["project_task_submissions","project_members","project_resources","project_tasks","project_sprints","project_releases"]){
   await pool.query("delete from "+table+" where project_id=any($1::uuid[])",[pids]);
  }
  await pool.query("delete from project_instances where id=any($1::uuid[])",[pids]);
 }
 if(gids.length){
  await pool.query("delete from lms_group_members where group_id=any($1::uuid[])",[gids]);
  await pool.query("delete from lms_groups where id=any($1::uuid[])",[gids]);
 }
 if(templateId){
  await pool.query("delete from project_template_college_assignments where template_id=$1",[templateId]);
  // Never erase a DB070 immutable revision or its DB071 parent header.
  const retention=await pool.query<{retainHistory:boolean}>("select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"");
  if(!retention.rows[0]?.retainHistory){
    await pool.query("delete from project_template_versions where template_id=$1",[templateId]);
    await pool.query("delete from project_templates where id=$1",[templateId]);
  }
 }
 await pool.query("delete from section_enrollments where section_id=$1",[ids.section]);
 await pool.query("delete from learner_program_enrollments where cohort_id=$1",[ids.cohort]);
 await pool.query("delete from sections where id=$1",[ids.section]);
 await pool.query("delete from cohorts where id=$1",[ids.cohort]);
 await pool.query("delete from programs where id=$1",[ids.program]);
 await pool.query("delete from academic_periods where id=$1",[ids.period]);
 for(const member of [ids.memberA,ids.memberB]){
  await pool.query("delete from learner_profiles where membership_id=$1",[member]);
  await pool.query("delete from membership_roles where membership_id=$1",[member]);
  await pool.query("delete from college_memberships where id=$1",[member]);
 }
 for(const user of [ids.studentA,ids.studentB])await pool.query("delete from users where id=$1",[user]);
}
describe.skipIf(!enabled)("Class-to-team workspace creation (isolated PostgreSQL)",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("Disposable TEST_DATABASE_URL required");
  await pool.query("insert into academic_periods(id,college_id,name,code,start_date,end_date,status) values($1,$2,$3,$4,'2026-07-01','2027-06-30','ACTIVE')",[ids.period,SEED_IDS.collegeA,prefix,prefix]);
  await pool.query("insert into programs(id,department_id,name,code,duration_terms,status) values($1,$2,$3,$4,8,'ACTIVE')",[ids.program,SEED_IDS.departmentA,prefix,prefix]);
  await pool.query("insert into cohorts(id,program_id,name,code,start_period_id,status) values($1,$2,$3,$4,$5,'ACTIVE')",[ids.cohort,ids.program,prefix,prefix,ids.period]);
  await pool.query("insert into sections(id,cohort_id,academic_period_id,name,code,status) values($1,$2,$3,$4,$5,'ACTIVE')",[ids.section,ids.cohort,ids.period,prefix,prefix]);
  for(const [index,user,member,enrol,sectionEnrol] of [[1,ids.studentA,ids.memberA,ids.enrolA,ids.sectionA],[2,ids.studentB,ids.memberB,ids.enrolB,ids.sectionB]] as const){
   await pool.query("insert into users(id,identity_uid,display_name) values($1,$2,$3)",[user,prefix+"-learner-"+index,"Test learner "+index]);
   await pool.query("insert into college_memberships(id,user_id,college_id) values($1,$2,$3)",[member,user,SEED_IDS.collegeA]);
   await pool.query("insert into membership_roles(membership_id,role) values($1,'LEARNER')",[member]);
   await pool.query("insert into learner_profiles(membership_id,roll_number) values($1,$2)",[member,String(index)]);
   await pool.query("insert into learner_program_enrollments(id,membership_id,program_id,cohort_id,status) values($1,$2,$3,$4,'ACTIVE')",[enrol,member,ids.program,ids.cohort]);
   await pool.query("insert into section_enrollments(id,learner_enrollment_id,section_id,academic_period_id,status) values($1,$2,$3,$4,'ACTIVE')",[sectionEnrol,enrol,ids.section,ids.period]);
  }
  const template=await createProjectTemplate(root,{slug:prefix,title:prefix,blueprint:{overview:{deliverables:[]},
   releases:[{key:"r1",title:"Release",sequence:0}],sprints:[{key:"s1",title:"Sprint",releaseKey:"r1",sequence:0}],
   tasks:[{key:"t1",title:"Task",sprintKey:"s1",sequence:0,priority:"HIGH"}],resources:[],
  }});
  templateId=template.template.id;
  await publishProjectTemplate(root,templateId);
  await assignProjectTemplateToCollege(scopedRoot,templateId,SEED_IDS.collegeA);
 });
 afterAll(async()=>{try{await cleanup();}finally{await pool?.end();await closeDatabaseConnection();}});
 async function request(mode:"TEAMS"|"WHOLE_CLASS",tail:string) {
  const roster=await loadClassTeamRoster(admin,SEED_IDS.collegeA,ids.section);
  const teams=previewClassTeams({mode,students:roster.members.map(({membershipId,rollNumber})=>({membershipId,rollNumber})),teamSize:1,order:"ROLL"});
  return {collegeId:SEED_IDS.collegeA,classId:ids.section,templateId,
   rosterRevision:roster.revision,baseTitle:prefix,baseSlug:prefix+"-"+tail,teams,expectedPreviewVersion:previewVersion(teams)};
 }
 it("creates two balanced teams, materializes template, keeps membership and audit",async()=>{
  const result=await createClassTeamWorkspaces(admin,await request("TEAMS","split"));
  expect(result.teamCount).toBe(2);
  expect(result.learnerCount).toBe(2);
  const project=await pool!.query("select team_group_id from project_instances where id=$1",[result.created[0].projectId]);
  expect(project.rows[0].team_group_id).toBe(result.created[0].teamGroupId);
  const members=await pool!.query("select role from project_members where project_id=$1",[result.created[0].projectId]);
  expect(members.rows.map(r=>r.role)).toEqual(["LEARNER"]);
  const tasks=await pool!.query("select id from project_tasks where project_id=$1",[result.created[0].projectId]);
  expect(tasks.rows).toHaveLength(1);
  const audits=await pool!.query("select actor_user_id,metadata from activity_events where dedupe_key=$1",["project:"+result.created[0].projectId+":created"]);
  expect(audits.rows).toHaveLength(1);
  expect(audits.rows[0].actor_user_id).toBe(admin.user.id);
  expect(audits.rows[0].metadata.memberCount).toBe(1);
 });
 it("creates one whole-class workspace, including both learners",async()=>{
  const result=await createClassTeamWorkspaces(scopedRoot,await request("WHOLE_CLASS","whole"));
  expect(result.teamCount).toBe(1);
  expect(result.created[0].memberCount).toBe(2);
 });
 it("denies foreign college, mentor edits, stale roster and stale preview without writes",async()=>{
  const valid=await request("TEAMS","denied");
  await expect(createClassTeamWorkspaces(foreign,valid)).rejects.toBeDefined();
  await expect(createClassTeamWorkspaces(wrongRole,valid)).rejects.toBeDefined();
  await expect(createClassTeamWorkspaces(admin,{...valid,rosterRevision:"00000000"})).rejects.toMatchObject({code:"PROJECT_CLASS_ROSTER_STALE"});
  await expect(createClassTeamWorkspaces(admin,{...valid,expectedPreviewVersion:"00000000"})).rejects.toMatchObject({code:"PROJECT_TEAM_PREVIEW_STALE"});
  const rows=await pool!.query("select id from project_instances where slug like $1",[prefix+"-denied%"]);
  expect(rows.rows).toHaveLength(0);
 });
 it("blocks an invalid mentor and rolls back all group/project inserts",async()=>{
  const payload={...await request("WHOLE_CLASS","bad-mentor"),primaryMentorMembershipId:ids.memberA};
  await expect(createClassTeamWorkspaces(admin,payload)).rejects.toMatchObject({code:"PROJECT_MEMBER_ROLE_REQUIRED"});
  const rows=await pool!.query("select id from project_instances where slug like $1",[prefix+"-bad-mentor%"]);
  expect(rows.rows).toHaveLength(0);
 });
});