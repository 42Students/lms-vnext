import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {SEED_IDS} from "../../scripts/db-seed-data";
import type {RequestContext} from "@/modules/identity/context";
import {addProjectMember} from "@/modules/projects/member-service";
import {createProjectInstance,getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {createProjectTemplate,publishProjectTemplate,assignProjectTemplateToCollege}
  from "@/modules/projects/template-service";
import {startProjectSprint} from "@/modules/projects/lifecycle-service";
import {autoAssignMentorNextSprint}
  from "@/modules/projects/mentor-auto-assign-service";

if(!process.env.TEST_DATABASE_URL)
  throw new Error("Requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const root:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"next-root",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
const scopedRoot:RequestContext={...root,adminScope:{
  organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
}};
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"next-admin",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{
    id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const mentor:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"next-mentor",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{
    id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["MENTOR","FACULTY"]}};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"next-learner",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{
    id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]}};
const tracked={projects:[] as string[],templates:[] as string[]};
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
  for(const table of ["project_template_college_assignments","project_template_versions"])
    await pool.query("delete from "+table+" where template_id=any($1::uuid[])",[tracked.templates]);
  await pool.query("delete from project_templates where id=any($1::uuid[])",[tracked.templates]);
  tracked.templates=[];
 }
 // Do not delete append-only activity or notification delivery records.
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});
async function fixture(){
 const suffix=randomUUID().replaceAll("-","").slice(0,12);
 const template=await createProjectTemplate(root,{
  slug:"mentor-next-r-t-"+suffix,title:"Next release target "+suffix,
  blueprint:{
   overview:{goal:"Next release auto-assignment",deliverables:["Reviewed plan"]},
   releases:[{key:"r1",title:"First release",sequence:0},
     {key:"r2",title:"Second release",sequence:1}],
   sprints:[{key:"s1",releaseKey:"r1",title:"Sprint in first release",sequence:0},
     {key:"s2",releaseKey:"r2",title:"Sprint in second release",sequence:0}],
   tasks:[{key:"current",sprintKey:"s1",title:"Current task",
     priority:"MEDIUM" as const,sequence:0},
    {key:"future",sprintKey:"s2",title:"Future task",
     priority:"HIGH" as const,sequence:0}],
   resources:[],
  },
 });
 tracked.templates.push(template.template.id);
 await publishProjectTemplate(root,template.template.id);
 await assignProjectTemplateToCollege(scopedRoot,template.template.id,SEED_IDS.collegeA);
 const project=await createProjectInstance(admin,{
  collegeId:SEED_IDS.collegeA,templateId:template.template.id,
  slug:"mentor-next-r-p-"+suffix,title:"Next release assignment "+suffix,
 });
 tracked.projects.push(project.id);
 await addProjectMember(admin,project.id,{
  membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
 });
 await addProjectMember(admin,project.id,{
  membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
 });
 let ws=await getProjectInstanceWorkspace(mentor,project.id);
 const first=ws.sprints.find(item=>item.title==="Sprint in first release")!;
 await startProjectSprint(mentor,project.id,first.id);
 await pool.query("update project_instances set status='ACTIVE' where id=$1",[project.id]);
 ws=await getProjectInstanceWorkspace(mentor,project.id);
 const next=ws.sprints.find(item=>item.title==="Sprint in second release")!;
 const current=ws.tasks.find(item=>item.sprintId===first.id)!;
 const future=ws.tasks.find(item=>item.sprintId===next.id)!;
 expect(first.sequence).toBe(next.sequence);
 return {projectId:project.id,current,future,next,
   input:{sprintId:next.id,expectedSprintUpdatedAt:next.updatedAt.toISOString()}};
}
describe("Mentor next-sprint auto-assign crossing release numbering",()=>{
 it("assigns only the first planned sprint in the next release and records an audited notification",async()=>{
  const f=await fixture();
  const result=await autoAssignMentorNextSprint(mentor,f.projectId,f.input);
  expect(result).toMatchObject({sprintId:f.next.id,assigned:1,unassignedRemaining:0});
  const rows=await pool.query<{id:string;assignee_membership_id:string|null}>(
    "select id,assignee_membership_id from project_tasks where project_id=$1",[f.projectId]);
  expect(rows.rows.find(row=>row.id===f.future.id)?.assignee_membership_id)
    .toBe(learner.membership!.id);
  expect(rows.rows.find(row=>row.id===f.current.id)?.assignee_membership_id).toBeNull();
  const audit=await pool.query<{id:string}>(`
    select id from activity_events where subject_id=$1
      and event_type='projects.task.details_updated'
      and metadata->>'autoAssigned'='true'
      and metadata->>'sprintId'=$2`,[f.future.id,f.next.id]);
  expect(audit.rows).toHaveLength(1);
  await expect(autoAssignMentorNextSprint(mentor,f.projectId,f.input))
    .rejects.toBeDefined();
 });
 it("rejects stale sprint tokens and forged or cross-college Mentors without changes",async()=>{
  const f=await fixture();
  const foreign:RequestContext={...mentor,membership:{
    ...mentor.membership!,id:SEED_IDS.facultyCollegeBMembership,
    collegeId:SEED_IDS.collegeB,
  }};
  await expect(autoAssignMentorNextSprint(learner,f.projectId,f.input)).rejects.toBeDefined();
  await expect(autoAssignMentorNextSprint(foreign,f.projectId,f.input)).rejects.toBeDefined();
  await expect(autoAssignMentorNextSprint(mentor,f.projectId,{
    ...f.input,expectedSprintUpdatedAt:"2000-01-01T00:00:00.000Z",
  })).rejects.toBeDefined();
  const saved=await pool.query<{assignee_membership_id:string|null}>(
    "select assignee_membership_id from project_tasks where id=$1",[f.future.id]);
  expect(saved.rows[0]?.assignee_membership_id).toBeNull();
 });
 it("rejects shipped next release instead of allocating into an invalid target",async()=>{
  const f=await fixture();
  await pool.query(`update project_releases set status='SHIPPED'
    where id=(select release_id from project_sprints where id=$1)`,[f.next.id]);
  await expect(autoAssignMentorNextSprint(mentor,f.projectId,f.input))
    .rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
  const rows=await pool.query<{assignee_membership_id:string|null}>(
    "select assignee_membership_id from project_tasks where id=$1",[f.future.id]);
  expect(rows.rows[0]?.assignee_membership_id).toBeNull();
 });
});
