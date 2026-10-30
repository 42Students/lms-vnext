import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {addProjectMember} from "@/modules/projects/member-service";
import {createProjectInstance,getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {
 createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege,
} from "@/modules/projects/template-service";
import {getMentorTaskFeedback} from "@/modules/projects/mentor-task-feedback-service";

if(!process.env.TEST_DATABASE_URL)
 throw new Error("Disposable TEST_DATABASE_URL is required, never use production DATABASE_URL.");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const ids:{projectIds:string[];templateIds:string[]}={projectIds:[],templateIds:[]};
const root:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
const scopedRoot:RequestContext={...root,adminScope:{
 organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
}};
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const mentor:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
const learner:RequestContext={
 user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
async function cleanup(){
 const projectIds=[...ids.projectIds],templateIds=[...ids.templateIds];
 // Preserve all append-only activity_events and notifications. Never delete them.
 if(projectIds.length){
  for(const table of ["project_task_submissions","project_members","project_resources",
   "project_tasks","project_sprints","project_releases"]){
   await pool.query("delete from "+table+" where project_id = any($1::uuid[])",[projectIds]);
  }
  await pool.query("delete from project_instances where id = any($1::uuid[])",[projectIds]);
 }
 if(templateIds.length){
  await pool.query("delete from project_template_college_assignments where template_id = any($1::uuid[])",[templateIds]);
  // DB070 immutable revisions and DB071 header pointers must remain intact.
  const retention=await pool.query<{retainHistory:boolean}>("select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"");
  if(!retention.rows[0]?.retainHistory){
    await pool.query("delete from project_template_versions where template_id=any(  ::uuid[])",[templateIds]);
    await pool.query("delete from project_templates where id=any(  ::uuid[])",[templateIds]);
  }
 }
 ids.projectIds=[];ids.templateIds=[];
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});
async function fixture(){
 const suffix=randomUUID().replaceAll("-","").slice(0,12);
 const result=await createProjectTemplate(root,{
  slug:"chat4-feedback-template-"+suffix,title:"Task Feedback "+suffix,
  blueprint:{
   overview:{goal:"Review task feedback",deliverables:["Task"]},
   releases:[{key:"release-1",title:"Release",sequence:0}],
   sprints:[{key:"sprint-1",releaseKey:"release-1",title:"Sprint",sequence:0}],
   tasks:[{key:"task-1",sprintKey:"sprint-1",title:"Question",priority:"MEDIUM" as const,sequence:0}],
   resources:[],
  },
 });
 ids.templateIds.push(result.template.id);
 await publishProjectTemplate(root,result.template.id);
 await assignProjectTemplateToCollege(scopedRoot,result.template.id,SEED_IDS.collegeA);
 const project=await createProjectInstance(admin,{
  collegeId:SEED_IDS.collegeA,templateId:result.template.id,
  slug:"chat4-feedback-project-"+suffix,title:"Task Feedback Project "+suffix,
 });
 ids.projectIds.push(project.id);
 await addProjectMember(admin,project.id,{
  membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
 });
 await addProjectMember(admin,project.id,{
  membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
 });
 const workspace=await getProjectInstanceWorkspace(mentor,project.id);
 return {project,task:workspace.tasks[0]!};
}
describe("Mentor exact-project read of registered review feedback",()=>{
 it("reads actual feedback but never invents a comment thread or reveals submission URLs",async()=>{
  const {project,task}=await fixture();
  const params={projectId:project.id,taskId:task.id};
  const empty=await getMentorTaskFeedback(mentor,params);
  expect(empty.feedback).toEqual([]);
  expect(empty.hasCommentThread).toBe(false);
  const comment="Needs reproducible benchmark and clear answer";
  await pool.query(`insert into project_task_submissions
   (id,project_id,task_id,version,submitted_by_membership_id,submission_url,status,
    reviewed_by_user_id,reviewed_by_membership_id,reviewed_at,feedback)
   values($1,$2,$3,1,$4,'https://example.invalid/private','CHANGES_REQUESTED',$5,$6,now(),$7)`,[
   randomUUID(),project.id,task.id,SEED_IDS.learnerCollegeAMembership,
   SEED_IDS.facultyUser,SEED_IDS.facultyCollegeAMembership,comment,
  ]);
  const result=await getMentorTaskFeedback(mentor,params);
  expect(result).toMatchObject({
   hasCommentThread:false,task:{id:task.id},
   feedback:[{version:1,status:"CHANGES_REQUESTED",feedback:comment}],
  });
  const raw=JSON.stringify(result);
  expect(raw).not.toContain("example.invalid/private");
  expect(raw).not.toContain(SEED_IDS.learnerCollegeAMembership);
  await expect(getMentorTaskFeedback(learner,params)).rejects.toBeDefined();
  await expect(getMentorTaskFeedback(mentor,{projectId:SEED_IDS.collegeB,taskId:task.id})).rejects.toBeDefined();
  await expect(getMentorTaskFeedback(mentor,{...params,collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  await expect(getMentorTaskFeedback({
   ...mentor,membership:{...mentor.membership!,status:"SUSPENDED"},
  },params)).rejects.toBeDefined();
 });
});
