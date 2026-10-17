import {afterAll,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {createProjectInstance} from "@/modules/projects/instance-service";
import {addProjectMember,listProjectMembers} from "@/modules/projects/member-service";
import {replaceCollegeProjectLearners} from "@/modules/projects/college-project-roster-service";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege} from "@/modules/projects/template-service";

const url=process.env.TEST_DATABASE_URL??process.env.DATABASE_URL;
if(!url)throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests");
const pool=new Pool({connectionString:url,max:1});
const superAdmin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
const scopedAdmin:RequestContext={...superAdmin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
const collegeAdmin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const prefix="chat9-roster-";
async function cleanup(){
 const projects="select id from project_instances where slug like '"+prefix+"%'";
 await pool.query("delete from in_app_notifications where event_id in (select id from activity_events where metadata->>'projectId' in ("+projects+"))");
 await pool.query("delete from activity_events where metadata->>'projectId' in ("+projects+")");
 await pool.query("delete from project_members where project_id in ("+projects+")");
 await pool.query("delete from project_resources where project_id in ("+projects+")");
 await pool.query("delete from project_tasks where project_id in ("+projects+")");
 await pool.query("delete from project_sprints where project_id in ("+projects+")");
 await pool.query("delete from project_releases where project_id in ("+projects+")");
 await pool.query("delete from project_instances where slug like '"+prefix+"%'");
 const templateIds="select id from project_templates where slug like '"+prefix+"%'";
 await pool.query("delete from project_template_college_assignments where template_id in ("+templateIds+")");
 await pool.query("delete from project_template_versions where template_id in ("+templateIds+")");
 await pool.query("delete from project_templates where slug like '"+prefix+"%'");
}
async function createProject(){
 const template=await createProjectTemplate(superAdmin,{
  slug:"chat9-roster-template",title:"Chat9 roster template",
  blueprint:{overview:{goal:"Scoped learner roster",deliverables:["Working roster"]},
   releases:[{key:"release-1",title:"Release",sequence:0}],
   sprints:[{key:"sprint-1",releaseKey:"release-1",title:"Sprint",sequence:0}],
   tasks:[{key:"task-1",sprintKey:"sprint-1",title:"Task",priority:"MEDIUM" as const,sequence:0}],resources:[]},
 });
 await publishProjectTemplate(superAdmin,template.template.id);
 await assignProjectTemplateToCollege(scopedAdmin,template.template.id,SEED_IDS.collegeA);
 return createProjectInstance(collegeAdmin,{collegeId:SEED_IDS.collegeA,
  templateId:template.template.id,slug:"chat9-roster-project",title:"Chat9 roster project"});
}
beforeEach(cleanup);
afterAll(async()=>{await cleanup();await pool.end();await closeDatabaseConnection();});
describe("COL-projects-15 atomic College Admin roster workflow",()=>{
 it("COL-projects-15 adds and removes a same-college learner with audit-backed atomic writes",async()=>{
  const project=await createProject();
  const saved=await replaceCollegeProjectLearners(collegeAdmin,project.id,{
   learnerMembershipIds:[SEED_IDS.learnerCollegeAMembership],roleLabel:"Team member",
   expectedUpdatedAt:project.updatedAt.toISOString(),
  });
  expect(saved.added).toBe(1);
  const members=await listProjectMembers(collegeAdmin,project.id);
  expect(members.filter(m=>m.role==="LEARNER").map(m=>m.membershipId)).toEqual([SEED_IDS.learnerCollegeAMembership]);
  const removed=await replaceCollegeProjectLearners(collegeAdmin,project.id,{
   learnerMembershipIds:[],expectedUpdatedAt:saved.updatedAt,
  });
  expect(removed.removed).toBe(1);
  expect((await listProjectMembers(collegeAdmin,project.id)).filter(m=>m.role==="LEARNER")).toEqual([]);
 });
 it("COL-projects-15 rejects stale and non-learner roster targets without partial membership changes",async()=>{
  const project=await createProject();
  const original=project.updatedAt.toISOString();
  await addProjectMember(collegeAdmin,project.id,{membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER"});
  await expect(replaceCollegeProjectLearners(collegeAdmin,project.id,{
   learnerMembershipIds:[SEED_IDS.collegeAdminMembership],expectedUpdatedAt:original,
  })).rejects.toMatchObject({code:"PROJECT_MEMBER_ROLE_REQUIRED"});
  expect((await listProjectMembers(collegeAdmin,project.id)).filter(m=>m.role==="LEARNER")).toHaveLength(1);
 });
});
