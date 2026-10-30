import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {createProjectTemplate,publishProjectTemplate,
 assignProjectTemplateToCollege} from "@/modules/projects/template-service";
import {createProjectInstance} from "@/modules/projects/instance-service";
import {addProjectMember} from "@/modules/projects/member-service";
import {getMentorDeliveryReviewOverview} from "@/modules/projects/mentor-review-overview-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const root:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
const scopedRoot:RequestContext={...root,adminScope:{
 organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
}};
const mentor:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
const learner:RequestContext={
 user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
const created:{projects:string[];templates:string[]}={projects:[],templates:[]};
async function cleanup(){
 for(const id of created.projects.reverse()){
  await pool.query("delete from project_submission_reviews where project_id=$1",[id]);
  await pool.query("delete from project_submissions where project_id=$1",[id]);
  for(const table of ["project_task_submissions","project_meetings","project_members",
   "project_resources","project_tasks","project_sprints","project_releases"]){
   await pool.query("delete from "+table+" where project_id=$1",[id]);
  }
  await pool.query("delete from project_instances where id=$1",[id]);
 }
 created.projects.length=0;
 for(const id of created.templates.reverse()){
  await pool.query("delete from project_template_college_assignments where template_id=$1",[id]);
  // DB070 immutable revisions and DB071 header pointers must remain intact.
  const retention=await pool.query<{retainHistory:boolean}>("select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"");
  if(!retention.rows[0]?.retainHistory){
    await pool.query("delete from project_template_versions where template_id=  ",[id]);
    await pool.query("delete from project_templates where id=  ",[id]);
  }
 }
 created.templates.length=0;
 // Activity events are append-only; do not delete or alter audit history.
}
async function fixture(){
 const suffix=randomUUID().slice(0,12);
 const blueprint={
  overview:{goal:"Chat4 review completeness",deliverables:["Reviewed submission"]},
  releases:[{key:"release-1",title:"Fixture Release",sequence:0}],
  sprints:[{key:"sprint-1",releaseKey:"release-1",title:"Fixture Sprint",sequence:0}],
  tasks:[{key:"task-1",sprintKey:"sprint-1",title:"Fixture Task",priority:"HIGH" as const,sequence:0}],
  resources:[],
 };
 const template=await createProjectTemplate(root,{
  slug:"chat4-review-"+suffix,title:"Chat4 Review "+suffix,blueprint,
 });
 created.templates.push(template.template.id);
 await publishProjectTemplate(root,template.template.id);
 await assignProjectTemplateToCollege(scopedRoot,template.template.id,SEED_IDS.collegeA);
 const project=await createProjectInstance(admin,{
  collegeId:SEED_IDS.collegeA,templateId:template.template.id,
  slug:"chat4-review-project-"+suffix,title:"Chat4 Project "+suffix,
 });
 created.projects.push(project.id);
 await addProjectMember(admin,project.id,{
  membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
 });
 await addProjectMember(admin,project.id,{
  membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
 });
 return project.id;
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});
describe("Mentor exact-project delivery review overview PostgreSQL",()=>{
 it("shows no delivery honestly, then a persisted decision with recorded feedback",async()=>{
  const projectId=await fixture();
  const empty=await getMentorDeliveryReviewOverview(mentor,{projectId});
  expect(empty).toMatchObject({total:0,items:[],counts:{reviewed:0,withFeedback:0}});
  const inserted=await pool.query<{id:string}>(`
    insert into project_submissions(
      project_id,version,status,summary,created_by_membership_id,
      submitted_by_membership_id,submitted_at)
    values($1::uuid,1,'CHANGES_REQUESTED','Test submitted work',$2::uuid,$2::uuid,now())
    returning id`,[projectId,SEED_IDS.learnerCollegeAMembership]);
  const submissionId=inserted.rows[0]!.id;
  await pool.query(`insert into project_submission_reviews(
   project_id,submission_id,decision,feedback,reviewed_by_user_id,reviewed_by_membership_id)
   values($1::uuid,$2::uuid,'CHANGES_REQUESTED','Please improve evidence',
     $3::uuid,$4::uuid)`,[projectId,submissionId,SEED_IDS.facultyUser,SEED_IDS.facultyCollegeAMembership]);
  const data=await getMentorDeliveryReviewOverview(mentor,{projectId});
  expect(data.counts).toEqual({reviewed:1,withFeedback:1});
  expect(data.items).toEqual([expect.objectContaining({
   version:1,decision:"CHANGES_REQUESTED",feedbackPresent:true,
   reviewLabel:"Changes requested — feedback recorded",
  })]);
  expect(JSON.stringify(data)).not.toContain("Please improve evidence");
  await expect(getMentorDeliveryReviewOverview(learner,{projectId})).rejects.toBeDefined();
  await expect(getMentorDeliveryReviewOverview(mentor,{
   projectId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
  await expect(getMentorDeliveryReviewOverview(mentor,{
   projectId,collegeId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
  const suspended:RequestContext={...mentor,user:{...mentor.user,platformStatus:"DISABLED"}};
  await expect(getMentorDeliveryReviewOverview(suspended,{projectId})).rejects.toBeDefined();
 });
});
